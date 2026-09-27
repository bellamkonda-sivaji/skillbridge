package com.skillbridge.service;

import com.skillbridge.dto.WorkHistoryEntryDto;
import com.skillbridge.dto.WorkerDocumentDto;
import com.skillbridge.model.AccountType;
import com.skillbridge.model.DocumentType;
import com.skillbridge.model.Employment;
import com.skillbridge.model.EmploymentStatus;
import com.skillbridge.model.EmployerProfile;
import com.skillbridge.model.Review;
import com.skillbridge.model.WorkerProfile;
import com.skillbridge.repository.EmployerProfileRepository;
import com.skillbridge.repository.EmploymentRepository;
import com.skillbridge.repository.ReviewRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Builds the worker's real work history and document panel for the employer-facing profile.
 *
 * <p>Every row comes from a finished {@link Employment}; the rating and feedback come from the
 * employer's {@link Review} of that same job, and stay null when no review was ever written.
 * Nothing here invents a rating, a review or a verified document.</p>
 */
@Component
public class WorkerHistoryAssembler {

    /** How many history rows the profile screen carries inline. */
    public static final int RECENT_HISTORY = 5;

    private final EmploymentRepository employmentRepository;
    private final ReviewRepository reviewRepository;
    private final EmployerProfileRepository employerProfileRepository;

    public WorkerHistoryAssembler(EmploymentRepository employmentRepository,
                                  ReviewRepository reviewRepository,
                                  EmployerProfileRepository employerProfileRepository) {
        this.employmentRepository = employmentRepository;
        this.reviewRepository = reviewRepository;
        this.employerProfileRepository = employerProfileRepository;
    }

    /** Every finished engagement, most recent first. */
    public List<WorkHistoryEntryDto> workHistory(Long workerId) {
        // key: employerId + "#" + jobId -> the employer's review of that job
        Map<String, Review> byJob = new HashMap<>();
        for (Review r : reviewRepository
                .findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AccountType.WORKER, workerId)) {
            if (r.getAuthorType() == AccountType.EMPLOYER && r.getJob() != null) {
                byJob.putIfAbsent(r.getAuthorId() + "#" + r.getJob().getId(), r);
            }
        }

        List<WorkHistoryEntryDto> rows = new ArrayList<>();
        for (Employment e : employmentRepository.findByWorkerIdOrderByJoiningDateDesc(workerId)) {
            if (e.getStatus() != EmploymentStatus.COMPLETED && e.getStatus() != EmploymentStatus.ENDED) {
                continue;
            }
            Long employerId = e.getEmployer().getId();
            Review review = byJob.get(employerId + "#" + e.getJob().getId());
            LocalDate start = startOf(e);
            LocalDate end = endOf(e);
            rows.add(new WorkHistoryEntryDto(
                    e.getId(),
                    businessName(e),
                    location(e),
                    e.getJob().getTitle(),
                    start,
                    end,
                    durationDays(start, end),
                    e.getSalary(),
                    e.getSalaryUnit(),
                    review == null ? null : (double) review.getRating(),
                    review == null ? null : review.getComment()));
        }
        return rows;
    }

    /** Counts the worker's real reviews by star, keyed "5" down to "1". */
    public Map<String, Integer> ratingBreakdown(Long workerId) {
        Map<String, Integer> breakdown = new LinkedHashMap<>();
        for (int star = 5; star >= 1; star--) {
            breakdown.put(String.valueOf(star), 0);
        }
        for (Review r : reviewRepository
                .findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AccountType.WORKER, workerId)) {
            String key = String.valueOf(Math.max(1, Math.min(5, r.getRating())));
            breakdown.merge(key, 1, Integer::sum);
        }
        return breakdown;
    }

    /** The five documents, each carrying whatever state the profile actually holds. */
    public List<WorkerDocumentDto> documents(WorkerProfile profile) {
        List<WorkerDocumentDto> rows = new ArrayList<>();
        for (DocumentType type : DocumentType.values()) {
            rows.add(new WorkerDocumentDto(type, type.label(), profile.documentStatus(type)));
        }
        return rows;
    }

    // ------------------------------------------------------------------ helpers

    private LocalDate startOf(Employment e) {
        if (e.getActualJoiningDate() != null) return e.getActualJoiningDate();
        if (e.getJoiningDate() != null) return e.getJoiningDate();
        return e.getStartedAt() == null ? null : e.getStartedAt().toLocalDate();
    }

    private LocalDate endOf(Employment e) {
        if (e.getEndedAt() != null) return e.getEndedAt().toLocalDate();
        if (e.getSettledAt() != null) return e.getSettledAt().toLocalDate();
        return e.getJob().getEndDate();
    }

    private Integer durationDays(LocalDate start, LocalDate end) {
        if (start == null || end == null || end.isBefore(start)) {
            return null;
        }
        return (int) ChronoUnit.DAYS.between(start, end) + 1;
    }

    private String businessName(Employment e) {
        EmployerProfile profile = employerProfileRepository
                .findByAccountId(e.getEmployer().getId()).orElse(null);
        if (profile != null && profile.getBusinessName() != null && !profile.getBusinessName().isBlank()) {
            return profile.getBusinessName();
        }
        return e.getEmployer().getName();
    }

    private String location(Employment e) {
        if (e.getWorkLocation() != null && !e.getWorkLocation().isBlank()) {
            return e.getWorkLocation();
        }
        String area = e.getJob().getArea();
        String city = e.getJob().getCity();
        if (area != null && !area.isBlank() && city != null && !city.isBlank()) {
            return area + ", " + city;
        }
        return city != null ? city : area;
    }
}
