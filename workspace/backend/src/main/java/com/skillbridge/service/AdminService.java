package com.skillbridge.service;

import com.skillbridge.dto.AdminAnalyticsDto;
import com.skillbridge.dto.EmployerProfileDto;
import com.skillbridge.dto.InterviewDto;
import com.skillbridge.dto.JobDto;
import com.skillbridge.dto.MatchDto;
import com.skillbridge.dto.ReviewDto;
import com.skillbridge.dto.UserDto;
import com.skillbridge.dto.WorkerProfileDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final JobPostRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final MatchRepository matchRepository;
    private final InterviewRepository interviewRepository;
    private final ReviewRepository reviewRepository;
    private final EmployerProfileRepository employerProfileRepository;

    public AdminService(UserRepository userRepository, WorkerProfileRepository workerProfileRepository,
                        JobPostRepository jobRepository, JobApplicationRepository applicationRepository,
                        MatchRepository matchRepository, InterviewRepository interviewRepository,
                        ReviewRepository reviewRepository, EmployerProfileRepository employerProfileRepository) {
        this.userRepository = userRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.matchRepository = matchRepository;
        this.interviewRepository = interviewRepository;
        this.reviewRepository = reviewRepository;
        this.employerProfileRepository = employerProfileRepository;
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

        return new AdminAnalyticsDto(
                userRepository.count(),
                userRepository.countByRole(Role.WORKER),
                userRepository.countByRole(Role.EMPLOYER),
                jobRepository.count(),
                jobRepository.countByStatus(JobStatus.OPEN),
                applicationRepository.count(),
                workerProfileRepository.countByVerificationStatus(VerificationStatus.PENDING),
                matchRepository.count(),
                interviewRepository.countByStatus(InterviewStatus.PENDING),
                interviewRepository.countByScheduledAtAfter(LocalDateTime.now()),
                reviewRepository.count(),
                userRepository.countByCreatedAtAfter(weekAgo),
                jobRepository.countByStatusAndPostedAtAfter(JobStatus.OPEN, weekAgo),
                byWorkType,
                byCity,
                topSkills,
                topCategories);
    }

    public List<UserDto> allUsers(String role, String q) {
        List<User> users;
        if (role != null && !role.isBlank()) {
            try {
                users = userRepository.findByRole(Role.valueOf(role.toUpperCase()));
            } catch (Exception ex) {
                throw ApiException.badRequest("Invalid role");
            }
        } else {
            users = userRepository.findAll();
        }
        if (q != null && !q.isBlank()) {
            users = users.stream()
                    .filter(u -> u.getName().toLowerCase().contains(q.toLowerCase())
                            || u.getEmail().toLowerCase().contains(q.toLowerCase()))
                    .collect(Collectors.toList());
        }
        return users.stream().map(UserDto::from).toList();
    }

    @Transactional
    public UserDto setUserEnabled(Long userId, boolean enabled) {
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        if (user.getRole() == Role.ADMIN) {
            throw ApiException.badRequest("Cannot disable an admin account");
        }
        user.setEnabled(enabled);
        userRepository.save(user);
        return UserDto.from(user);
    }

    @Transactional
    public WorkerProfileDto verifyWorker(Long userId, boolean approved, String note) {
        WorkerProfile profile = workerProfileRepository.findByUserId(userId)
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

    public List<ReviewDto> reviewsForRole(Role role) {
        return reviewRepository.findByTargetRole(role).stream().map(ReviewDto::from).toList();
    }

    public List<EmployerProfileDto> allEmployers() {
        return employerProfileRepository.findAll().stream().map(EmployerProfileDto::from).toList();
    }
}
