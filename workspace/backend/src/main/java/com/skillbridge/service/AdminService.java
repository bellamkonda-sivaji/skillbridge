package com.skillbridge.service;

import com.skillbridge.dto.AccountDto;
import com.skillbridge.dto.AdminAnalyticsDto;
import com.skillbridge.dto.EmployerProfileDto;
import com.skillbridge.dto.InterviewDto;
import com.skillbridge.dto.JobDto;
import com.skillbridge.dto.MatchDto;
import com.skillbridge.dto.ReviewDto;
import com.skillbridge.dto.WorkerProfileDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final WorkerAccountRepository workerAccountRepository;
    private final EmployerAccountRepository employerAccountRepository;
    private final AdminAccountRepository adminAccountRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final JobPostRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final MatchRepository matchRepository;
    private final InterviewRepository interviewRepository;
    private final ReviewRepository reviewRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final ReviewService reviewService;

    public AdminService(WorkerAccountRepository workerAccountRepository,
                        EmployerAccountRepository employerAccountRepository,
                        AdminAccountRepository adminAccountRepository,
                        WorkerProfileRepository workerProfileRepository,
                        JobPostRepository jobRepository, JobApplicationRepository applicationRepository,
                        MatchRepository matchRepository, InterviewRepository interviewRepository,
                        ReviewRepository reviewRepository, EmployerProfileRepository employerProfileRepository,
                        ReviewService reviewService) {
        this.workerAccountRepository = workerAccountRepository;
        this.employerAccountRepository = employerAccountRepository;
        this.adminAccountRepository = adminAccountRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.matchRepository = matchRepository;
        this.interviewRepository = interviewRepository;
        this.reviewRepository = reviewRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.reviewService = reviewService;
    }

    public AdminAnalyticsDto analytics() {
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        Map<Object, Long> byWorkType = new LinkedHashMap<>();
        for (WorkType wt : WorkType.values()) {
            byWorkType.put(wt.name(), jobRepository.countByWorkType(wt));
        }
        Map<Object, Long> byCity = jobRepository.findByStatusOrderByPostedAtDesc(JobStatus.OPEN).stream()
                .collect(Collectors.groupingBy(JobPost::getCity, LinkedHashMap::new, Collectors.counting()));

        Map<String, Long> topSkills = jobRepository.findAll().stream()
                .flatMap(j -> j.getRequiredSkills().stream())
                .collect(Collectors.groupingBy(s -> s, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));

        Map<String, Long> topCategories = jobRepository.findAll().stream()
                .flatMap(j -> j.getRequiredSkills().stream().limit(1))
                .collect(Collectors.groupingBy(s -> s, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));

        long workers = workerAccountRepository.count();
        long employers = employerAccountRepository.count();
        return new AdminAnalyticsDto(
                workers + employers + adminAccountRepository.count(),
                workers,
                employers,
                jobRepository.count(),
                jobRepository.countByStatus(JobStatus.OPEN),
                applicationRepository.count(),
                workerProfileRepository.countByVerificationStatus(VerificationStatus.PENDING),
                matchRepository.count(),
                interviewRepository.countByStatus(InterviewStatus.PENDING),
                interviewRepository.countByScheduledAtAfter(LocalDateTime.now()),
                reviewRepository.count(),
                workerAccountRepository.countByCreatedAtAfter(weekAgo)
                        + employerAccountRepository.countByCreatedAtAfter(weekAgo),
                jobRepository.countByStatusAndPostedAtAfter(JobStatus.OPEN, weekAgo),
                byWorkType,
                byCity,
                topSkills,
                topCategories);
    }

    /** Accounts across all three tables. Ids repeat between tables, so every row carries its type. */
    public List<AccountDto> allAccounts(String type, String q) {
        List<Account> accounts = new ArrayList<>();
        AccountType filter = null;
        if (type != null && !type.isBlank()) {
            try {
                filter = AccountType.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw ApiException.badRequest("Invalid account type");
            }
        }
        if (filter == null || filter == AccountType.WORKER) {
            accounts.addAll(workerAccountRepository.findAll());
        }
        if (filter == null || filter == AccountType.EMPLOYER) {
            accounts.addAll(employerAccountRepository.findAll());
        }
        if (filter == null || filter == AccountType.ADMIN) {
            accounts.addAll(adminAccountRepository.findAll());
        }
        if (q != null && !q.isBlank()) {
            String needle = q.toLowerCase().trim();
            accounts = accounts.stream()
                    .filter(a -> a.getName().toLowerCase().contains(needle)
                            || (a.getEmail() != null && a.getEmail().toLowerCase().contains(needle))
                            || (a.getPhone() != null && a.getPhone().contains(needle)))
                    .collect(Collectors.toList());
        }
        return accounts.stream().map(AccountDto::from).toList();
    }

    @Transactional
    public AccountDto setAccountEnabled(AccountType type, Long accountId, boolean enabled) {
        if (type == null) {
            throw ApiException.badRequest("accountType is required - ids are only unique per table");
        }
        if (type == AccountType.ADMIN) {
            throw ApiException.badRequest("Cannot disable an admin account");
        }
        if (type == AccountType.WORKER) {
            WorkerAccount account = workerAccountRepository.findById(accountId)
                    .orElseThrow(() -> ApiException.notFound("Worker account not found"));
            account.setEnabled(enabled);
            return AccountDto.from(workerAccountRepository.save(account));
        }
        EmployerAccount account = employerAccountRepository.findById(accountId)
                .orElseThrow(() -> ApiException.notFound("Employer account not found"));
        account.setEnabled(enabled);
        return AccountDto.from(employerAccountRepository.save(account));
    }

    @Transactional
    public WorkerProfileDto verifyWorker(Long workerAccountId, boolean approved, String note) {
        WorkerProfile profile = workerProfileRepository.findByAccountId(workerAccountId)
                .orElseThrow(() -> ApiException.notFound("Worker profile not found"));
        if (profile.getVerificationStatus() != VerificationStatus.PENDING) {
            throw ApiException.badRequest("No pending verification request for this worker");
        }
        profile.setVerificationStatus(approved ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED);
        profile.setVerifiedBy(note);
        profile.setVerifiedAt(LocalDateTime.now());
        workerProfileRepository.save(profile);
        return WorkerProfileDto.from(profile);
    }

    @Transactional
    public EmployerProfileDto verifyEmployer(Long employerAccountId, boolean verified) {
        EmployerProfile profile = employerProfileRepository.findByAccountId(employerAccountId)
                .orElseThrow(() -> ApiException.notFound("Employer profile not found"));
        profile.setVerified(verified);
        employerProfileRepository.save(profile);
        return EmployerProfileDto.from(profile);
    }

    public List<WorkerProfileDto> pendingVerifications() {
        return workerProfileRepository.findAll().stream()
                .filter(w -> w.getVerificationStatus() == VerificationStatus.PENDING)
                .map(WorkerProfileDto::from).toList();
    }

    public List<JobDto> allJobs() {
        return jobRepository.findAll(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "postedAt")).stream()
                .map(j -> JobDto.from(j, null)).toList();
    }

    public List<MatchDto> allMatches() {
        return matchRepository.findAllByOrderByScoreDesc().stream().map(MatchDto::from).toList();
    }

    public List<InterviewDto> allInterviews() {
        return interviewRepository.findAllByOrderByScheduledAtDesc().stream().map(InterviewDto::from).toList();
    }

    public List<ReviewDto> reviewsForType(AccountType targetType) {
        return reviewRepository.findByTargetTypeOrderByCreatedAtDesc(targetType).stream()
                .map(reviewService::toDto).toList();
    }

    public List<EmployerProfileDto> allEmployers() {
        return employerProfileRepository.findAll().stream().map(EmployerProfileDto::from).toList();
    }
}
