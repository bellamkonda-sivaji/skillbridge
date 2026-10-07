package com.skillbridge.service;

import com.skillbridge.dto.*;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.EmployerProfileRepository;
import com.skillbridge.repository.JobPostRepository;
import com.skillbridge.repository.WorkerAccountRepository;
import com.skillbridge.repository.WorkerProfileRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/** Profile reads and writes for both sides, plus the public worker / employer listings. */
@Service
public class UserService {

    private final WorkerAccountRepository workerAccountRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final JobPostRepository jobRepository;
    private final GeoService geoService;
    private final SkillLexicon lexicon;
    private final MatchingService matchingService;

    public UserService(WorkerAccountRepository workerAccountRepository,
                       WorkerProfileRepository workerProfileRepository,
                       EmployerProfileRepository employerProfileRepository,
                       JobPostRepository jobRepository, GeoService geoService,
                       SkillLexicon lexicon, MatchingService matchingService) {
        this.workerAccountRepository = workerAccountRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.jobRepository = jobRepository;
        this.geoService = geoService;
        this.lexicon = lexicon;
        this.matchingService = matchingService;
    }

    public WorkerProfileDto getWorkerProfile(Long workerAccountId) {
        return WorkerProfileDto.from(workerProfileRepository.findByAccountId(workerAccountId)
                .orElseThrow(() -> ApiException.notFound("Worker profile not found")));
    }

    public EmployerProfileDto getEmployerProfile(Long employerAccountId) {
        return EmployerProfileDto.from(employerProfileRepository.findByAccountId(employerAccountId)
                .orElseThrow(() -> ApiException.notFound("Employer profile not found")));
    }

    /** The public view of a business, keyed on the employer ACCOUNT id a JobCard carries. */
    public EmployerPublicProfileDto getPublicEmployerProfile(Long employerAccountId) {
        EmployerProfile profile = employerProfileRepository.findByAccountId(employerAccountId)
                .orElseThrow(() -> ApiException.notFound("Employer profile not found"));
        long openJobs = jobRepository.countByEmployerIdAndStatus(employerAccountId, JobStatus.OPEN);
        return EmployerPublicProfileDto.from(profile, openJobs);
    }

    @Transactional
    public WorkerProfileDto updateWorkerProfile(WorkerAccount account, WorkerProfileRequest request) {
        WorkerProfile profile = workerProfileRepository.findByAccountId(account.getId())
                .orElseGet(() -> workerProfileRepository.save(WorkerProfile.builder().account(account).build()));

        profile.setSkills(request.skills() != null ? request.skills() : new ArrayList<>());
        profile.setExperienceYears(request.experienceYears());
        profile.setJobTitle(request.jobTitle());
        profile.setBio(request.bio());
        profile.setCity(request.city());
        profile.setArea(request.area());
        profile.setPincode(request.pincode());
        profile.setLatitude(request.latitude());
        profile.setLongitude(request.longitude());
        profile.setLocationEnabled(request.locationEnabled());
        if (request.availability() != null) profile.setAvailability(request.availability());
        profile.setExpectedSalary(request.expectedSalary());
        if (request.salaryUnit() != null) profile.setSalaryUnit(request.salaryUnit());
        if (request.verificationDoc() != null && !request.verificationDoc().isBlank()
                && profile.getVerificationStatus() == VerificationStatus.UNVERIFIED) {
            profile.setVerificationDoc(request.verificationDoc());
            profile.setVerificationStatus(VerificationStatus.PENDING);
        }
        profile.setProfileCompleted(computeProfileCompleted(profile));
        workerProfileRepository.save(profile);

        matchingService.generateMatchesForWorker(profile);
        return WorkerProfileDto.from(profile);
    }

    /**
     * Merge update used by the mobile onboarding flow: every field is optional and a field
     * that is absent from the request is left exactly as it was.
     */
    @Transactional
    public WorkerProfileDto updateWorkerOnboarding(WorkerAccount account, WorkerOnboardingRequest request) {
        WorkerProfile profile = workerProfileRepository.findByAccountId(account.getId())
                .orElseGet(() -> workerProfileRepository.save(WorkerProfile.builder().account(account).build()));

        if (request.getPhotoUrl() != null) {
            account.setPhotoUrl(request.getPhotoUrl());
            workerAccountRepository.save(account);
        }

        if (request.getDateOfBirth() != null) profile.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) profile.setGender(request.getGender());
        if (request.getAlternatePhone() != null) profile.setAlternatePhone(request.getAlternatePhone());
        if (request.getJobCategories() != null) {
            profile.getJobCategories().clear();
            profile.getJobCategories().addAll(request.getJobCategories());
        }
        if (request.getEmploymentTypes() != null) {
            profile.getEmploymentTypes().clear();
            profile.getEmploymentTypes().addAll(request.getEmploymentTypes());
        }
        if (request.getSkills() != null) {
            profile.getSkills().clear();
            profile.getSkills().addAll(request.getSkills());
        }
        if (request.getExperienceYears() != null) profile.setExperienceYears(request.getExperienceYears());
        if (request.getFresher() != null) profile.setFresher(request.getFresher());
        if (request.getJobTitle() != null) profile.setJobTitle(request.getJobTitle());
        if (request.getBio() != null) profile.setBio(request.getBio());
        if (request.getCity() != null) profile.setCity(request.getCity());
        if (request.getArea() != null) profile.setArea(request.getArea());
        if (request.getPincode() != null) profile.setPincode(request.getPincode());
        if (request.getLatitude() != null) profile.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) profile.setLongitude(request.getLongitude());
        if (profile.getLatitude() != 0.0 && profile.getLongitude() != 0.0) {
            profile.setLocationEnabled(true);
        }
        // null is meaningful here ("anywhere"), so only apply it when the key was actually sent.
        if (request.isPreferredRadiusKmPresent()) profile.setPreferredRadiusKm(request.getPreferredRadiusKm());
        if (request.getAvailability() != null) profile.setAvailability(request.getAvailability());
        if (request.getExpectedSalary() != null) profile.setExpectedSalary(request.getExpectedSalary());
        if (request.getSalaryUnit() != null) profile.setSalaryUnit(request.getSalaryUnit());

        profile.setProfileCompleted(computeProfileCompleted(profile));
        workerProfileRepository.save(profile);

        matchingService.generateMatchesForWorker(profile);
        return WorkerProfileDto.from(profile);
    }

    /** A worker profile counts as complete once it has a skill, a city and a location pin. */
    private boolean computeProfileCompleted(WorkerProfile profile) {
        return profile.getSkills() != null && !profile.getSkills().isEmpty()
                && profile.getCity() != null && !profile.getCity().isBlank()
                && profile.getLatitude() != 0.0 && profile.getLongitude() != 0.0;
    }

    @Transactional
    public EmployerProfileDto updateEmployerProfile(EmployerAccount account, EmployerProfileRequest request) {
        EmployerProfile profile = employerProfileRepository.findByAccountId(account.getId())
                .orElseGet(() -> employerProfileRepository.save(EmployerProfile.builder()
                        .account(account).businessName(account.getName()).build()));
        if (request.businessName() != null && !request.businessName().isBlank()) {
            profile.setBusinessName(request.businessName());
        }
        profile.setBusinessType(request.businessType());
        profile.setDescription(request.description());
        profile.setCity(request.city());
        profile.setArea(request.area());
        profile.setLatitude(request.latitude());
        profile.setLongitude(request.longitude());
        profile.setLocationEnabled(request.locationEnabled());
        profile.setWebsite(request.website());
        profile.setFounded(request.founded());
        profile.setTeamSize(request.teamSize());
        if (request.photos() != null) {
            profile.getPhotos().clear();
            profile.getPhotos().addAll(request.photos());
        }
        employerProfileRepository.save(profile);
        return EmployerProfileDto.from(profile);
    }

    public List<WorkerProfileDto> searchWorkers(String q, List<String> skills, String city,
                                                Double maxDistanceKm, Double lat, Double lng,
                                                Integer minRating, Availability availability,
                                                boolean verifiedOnly, Integer minExperience) {
        List<WorkerProfile> candidates;
        if (q != null && !q.isBlank()) {
            candidates = new ArrayList<>(workerProfileRepository.search(q));
            for (String skill : q.split("[,\\s]+")) {
                if (skill.length() > 1) {
                    for (WorkerProfile w : workerProfileRepository.findBySkillContaining(skill)) {
                        if (!candidates.contains(w)) candidates.add(w);
                    }
                }
            }
        } else {
            candidates = workerProfileRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
        }

        List<WorkerProfile> result = new ArrayList<>();
        for (WorkerProfile w : candidates) {
            boolean ok = true;
            if (skills != null && !skills.isEmpty()) {
                List<String> workerExpanded = new ArrayList<>();
                for (String s : w.getSkills()) {
                    for (String v : lexicon.expand(s)) workerExpanded.add(lexicon.normalize(v));
                }
                boolean hasAll = skills.stream().allMatch(s -> {
                    for (String v : lexicon.expand(s)) {
                        if (workerExpanded.contains(lexicon.normalize(v))) return true;
                    }
                    return false;
                });
                if (!hasAll) ok = false;
            }
            if (ok && city != null && !city.isBlank()
                    && (w.getCity() == null || !w.getCity().equalsIgnoreCase(city))) ok = false;
            if (ok && minRating != null && w.getAccount().getAvgRating() < minRating) ok = false;
            if (ok && availability != null && w.getAvailability() != availability) ok = false;
            if (ok && verifiedOnly && w.getVerificationStatus() != VerificationStatus.VERIFIED) ok = false;
            if (ok && minExperience != null && w.getExperienceYears() < minExperience) ok = false;
            if (ok && maxDistanceKm != null && lat != null && lng != null) {
                Double dist = geoService.distanceKmOrNull(lat, lng, w.getLatitude(), w.getLongitude());
                if (dist == null || dist > maxDistanceKm) ok = false;
            }
            if (ok) result.add(w);
        }
        return result.stream().map(WorkerProfileDto::from).collect(Collectors.toList());
    }
}
