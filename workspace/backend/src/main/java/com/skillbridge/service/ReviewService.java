package com.skillbridge.service;

import com.skillbridge.dto.ReviewDto;
import com.skillbridge.dto.ReviewRequest;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.EmployerAccountRepository;
import com.skillbridge.repository.InterviewRepository;
import com.skillbridge.repository.JobPostRepository;
import com.skillbridge.repository.ReviewRepository;
import com.skillbridge.repository.WorkerAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final WorkerAccountRepository workerRepository;
    private final EmployerAccountRepository employerRepository;
    private final JobPostRepository jobRepository;
    private final InterviewRepository interviewRepository;
    private final NotificationService notificationService;
    private final AccountDirectory accountDirectory;

    public ReviewService(ReviewRepository reviewRepository, WorkerAccountRepository workerRepository,
                         EmployerAccountRepository employerRepository, JobPostRepository jobRepository,
                         InterviewRepository interviewRepository, NotificationService notificationService,
                         AccountDirectory accountDirectory) {
        this.reviewRepository = reviewRepository;
        this.workerRepository = workerRepository;
        this.employerRepository = employerRepository;
        this.jobRepository = jobRepository;
        this.interviewRepository = interviewRepository;
        this.notificationService = notificationService;
        this.accountDirectory = accountDirectory;
    }

    @Transactional
    public ReviewDto createReview(Account author, ReviewRequest request) {
        if (request.rating() < 1 || request.rating() > 5) {
            throw ApiException.badRequest("Rating must be between 1 and 5");
        }
        if (request.targetType() == null || request.targetId() == null) {
            throw ApiException.badRequest("targetType and targetId are required");
        }
        if (request.targetType() == author.accountType() && request.targetId().equals(author.getId())) {
            throw ApiException.badRequest("You cannot review yourself");
        }
        Account target = accountDirectory.find(request.targetType(), request.targetId())
                .orElseThrow(() -> ApiException.notFound("Account not found"));

        if (!hasWorkedTogether(author, target)) {
            throw ApiException.badRequest("You can only review accounts you have worked with");
        }

        Review review = reviewRepository.save(Review.builder()
                .authorType(author.accountType())
                .authorId(author.getId())
                .targetType(target.accountType())
                .targetId(target.getId())
                .job(request.jobId() != null ? jobRepository.findById(request.jobId()).orElse(null) : null)
                .rating(request.rating())
                .comment(request.comment())
                .build());

        recomputeRating(target);

        notificationService.notify(target, "New " + request.rating() + "-star review",
                author.getName() + " reviewed you: \"" + (request.comment() != null && !request.comment().isBlank()
                        ? request.comment() : "No comment") + "\"",
                NotificationType.REVIEW, null);
        return toDto(review);
    }

    /** Refreshes the cached average that lives on the account row. */
    @Transactional
    public void recomputeRating(Account target) {
        double avg = reviewRepository.averageRatingFor(target.accountType(), target.getId());
        long count = reviewRepository.countByTargetTypeAndTargetId(target.accountType(), target.getId());
        double rounded = Math.round(avg * 100.0) / 100.0;
        switch (target.accountType()) {
            case WORKER -> workerRepository.findById(target.getId()).ifPresent(w -> {
                w.setAvgRating(rounded);
                w.setRatingCount((int) count);
                workerRepository.save(w);
            });
            case EMPLOYER -> employerRepository.findById(target.getId()).ifPresent(e -> {
                e.setAvgRating(rounded);
                e.setRatingCount((int) count);
                employerRepository.save(e);
            });
            case ADMIN -> { /* admins carry no public rating */ }
        }
    }

    private boolean hasWorkedTogether(Account author, Account target) {
        boolean interacted = reviewRepository
                .findByAuthorTypeAndAuthorIdOrderByCreatedAtDesc(author.accountType(), author.getId())
                .stream()
                .anyMatch(r -> r.getTargetType() == target.accountType()
                        && r.getTargetId().equals(target.getId()));
        if (interacted) {
            return true;
        }
        if (author instanceof EmployerAccount employer && target.accountType() == AccountType.WORKER) {
            return interviewRepository.findByEmployerOrderByScheduledAtDesc(employer).stream()
                    .anyMatch(i -> i.getWorker().getId().equals(target.getId())
                            && i.getStatus() == InterviewStatus.COMPLETED);
        }
        if (author instanceof WorkerAccount worker && target.accountType() == AccountType.EMPLOYER) {
            return interviewRepository.findByWorkerOrderByScheduledAtDesc(worker).stream()
                    .anyMatch(i -> i.getEmployer().getId().equals(target.getId())
                            && i.getStatus() == InterviewStatus.COMPLETED);
        }
        return author.accountType() == AccountType.ADMIN;
    }

    public List<ReviewDto> reviewsFor(AccountType targetType, Long targetId) {
        return reviewRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId)
                .stream().map(this::toDto).toList();
    }

    public List<ReviewDto> reviewsBy(Account author) {
        return reviewRepository
                .findByAuthorTypeAndAuthorIdOrderByCreatedAtDesc(author.accountType(), author.getId())
                .stream().map(this::toDto).toList();
    }

    public ReviewDto toDto(Review r) {
        return ReviewDto.from(r,
                accountDirectory.displayNameOf(r.getAuthorType(), r.getAuthorId()),
                accountDirectory.displayNameOf(r.getTargetType(), r.getTargetId()));
    }
}
