package com.skillbridge.service;

import com.skillbridge.dto.ApplicantCardDto;
import com.skillbridge.dto.WorkExperienceDto;
import com.skillbridge.dto.WorkerDetailDto;
import com.skillbridge.dto.WorkerReviewDto;
import com.skillbridge.model.AccountType;
import com.skillbridge.model.Availability;
import com.skillbridge.model.JobApplication;
import com.skillbridge.model.JobPost;
import com.skillbridge.model.Review;
import com.skillbridge.model.VerificationStatus;
import com.skillbridge.model.WorkerProfile;
import com.skillbridge.repository.ReviewRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;

/**
 * Builds the single {@link ApplicantCardDto} shape every employer screen renders - the applicants
 * list, the shortlist, the recommended-workers tabs and the dashboard's recent applications - plus
 * the richer {@link WorkerDetailDto} the profile and compare screens use.
 *
 * <p>The match score is computed live against the job rather than read from the matches table, so
 * a candidate below the notification threshold still carries a real number instead of a null.</p>
 */
@Component
public class ApplicantCardAssembler {

    /** An application counts as "new" while it is untouched and less than two days old. */
    private static final int NEW_FOR_HOURS = 48;

    private final MatchingService matchingService;
    private final GeoService geoService;
    private final ReviewRepository reviewRepository;
    private final AccountDirectory accountDirectory;

    public ApplicantCardAssembler(MatchingService matchingService, GeoService geoService,
                                  ReviewRepository reviewRepository, AccountDirectory accountDirectory) {
        this.matchingService = matchingService;
        this.geoService = geoService;
        this.reviewRepository = reviewRepository;
        this.accountDirectory = accountDirectory;
    }

    // ------------------------------------------------------------------ cards

    /** A card for somebody who has applied. */
    public ApplicantCardDto card(JobApplication application, WorkerProfile profile) {
        return card(profile, application.getJob(), application);
    }

    /**
     * A card for any worker against any job. {@code application} is null for a recommended
     * worker who has not applied, and that is exactly what the contract asks for.
     */
    public ApplicantCardDto card(WorkerProfile profile, JobPost job, JobApplication application) {
        return new ApplicantCardDto(
                application != null ? application.getId() : null,
                profile.getAccount().getId(),
                profile.getAccount().getName(),
                profile.getGender(),
                age(profile),
                profile.getExperienceYears(),
                profile.getJobTitle(),
                distanceKm(profile, job),
                matchScore(profile, job),
                profile.getVerificationStatus() == VerificationStatus.VERIFIED,
                availabilityLabel(profile.getAvailability()),
                application != null ? application.getStatus() : null,
                application != null ? application.getAppliedAt() : null,
                isNew(application),
                List.copyOf(profile.getSkills()),
                profile.getExpectedSalary(),
                profile.getSalaryUnit(),
                profile.getAccount().getPhotoUrl());
    }

    // ------------------------------------------------------------------ detail

    public WorkerDetailDto detail(WorkerProfile profile, JobPost job, JobApplication application) {
        ApplicantCardDto card = card(profile, job, application);
        boolean verified = profile.getVerificationStatus() == VerificationStatus.VERIFIED;

        List<WorkExperienceDto> history = new ArrayList<>(
                profile.getWorkExperience().stream().map(WorkExperienceDto::from).toList());
        if (history.isEmpty() && profile.getJobTitle() != null && !profile.getJobTitle().isBlank()) {
            // Nothing recorded yet: fall back to the headline role so the screen is never blank.
            history.add(new WorkExperienceDto(profile.getJobTitle(), null, profile.getExperienceYears()));
        }

        List<WorkerReviewDto> reviews = reviewRepository
                .findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AccountType.WORKER, profile.getAccount().getId())
                .stream().map(this::review).toList();

        return new WorkerDetailDto(
                card.applicationId(), card.workerId(), card.name(), card.gender(), card.age(),
                card.experienceYears(), card.jobTitle(), card.distanceKm(), card.matchScore(),
                card.verified(), card.availability(), card.status(), card.appliedAt(), card.isNew(),
                card.skills(), card.expectedSalary(), card.salaryUnit(), card.photoUrl(),
                profile.getBio(),
                languages(profile),
                history,
                profile.getExperienceYears(),
                verified,
                verificationLabel(profile.getVerificationStatus()),
                profile.getExpectedSalary(),
                profile.getExpectedSalary(),
                availabilityLabel(profile.getAvailability()),
                profile.getAccount().getAvgRating(),
                profile.getAccount().getRatingCount(),
                reviews);
    }

    // ------------------------------------------------------------------ helpers

    public Integer matchScore(WorkerProfile profile, JobPost job) {
        if (job == null) {
            return null;
        }
        return (int) Math.round(matchingService.evaluate(profile, job).score());
    }

    public Double distanceKm(WorkerProfile profile, JobPost job) {
        if (job == null) {
            return null;
        }
        Double d = geoService.distanceKmOrNull(profile.getLatitude(), profile.getLongitude(),
                job.getLatitude(), job.getLongitude());
        return d == null ? null : Math.round(d * 10.0) / 10.0;
    }

    private boolean isNew(JobApplication application) {
        return application != null
                && application.getStatus() == com.skillbridge.model.ApplicationStatus.APPLIED
                && application.getAppliedAt() != null
                && application.getAppliedAt().isAfter(LocalDateTime.now().minusHours(NEW_FOR_HOURS));
    }

    private Integer age(WorkerProfile profile) {
        LocalDate dob = profile.getDateOfBirth();
        return dob == null ? null : Period.between(dob, LocalDate.now()).getYears();
    }

    /** Falls back to the account locale so the profile screen is never blank. */
    private List<String> languages(WorkerProfile profile) {
        if (profile.getLanguages() != null && !profile.getLanguages().isEmpty()) {
            return List.copyOf(profile.getLanguages());
        }
        String locale = profile.getAccount().getLocale();
        return switch (locale == null ? "en" : locale) {
            case "te" -> List.of("Telugu");
            case "hi" -> List.of("Hindi");
            default -> List.of("English");
        };
    }

    public String availabilityLabel(Availability availability) {
        if (availability == null) {
            return "Not specified";
        }
        return switch (availability) {
            case IMMEDIATE -> "Available now";
            case FULL_TIME -> "Full-time";
            case PART_TIME -> "Part-time";
            case WEEKENDS_ONLY -> "Weekends only";
            case EVENINGS -> "Evenings only";
        };
    }

    private String verificationLabel(VerificationStatus status) {
        if (status == null) {
            return "Not verified";
        }
        return switch (status) {
            case VERIFIED -> "Verified (Aadhaar)";
            case PENDING -> "Verification pending";
            case REJECTED -> "Verification rejected";
            case UNVERIFIED -> "Not verified";
        };
    }

    private WorkerReviewDto review(Review r) {
        return new WorkerReviewDto(
                accountDirectory.displayNameOf(r.getAuthorType(), r.getAuthorId()),
                r.getRating(), r.getComment(), r.getCreatedAt());
    }
}
