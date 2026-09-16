package com.skillbridge.service;

import com.skillbridge.dto.ReviewDto;
import com.skillbridge.dto.ReviewRequest;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.InterviewStatus;
import com.skillbridge.model.Review;
import com.skillbridge.model.User;
import com.skillbridge.repository.InterviewRepository;
import com.skillbridge.repository.JobPostRepository;
import com.skillbridge.repository.ReviewRepository;
import com.skillbridge.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final JobPostRepository jobRepository;
    private final InterviewRepository interviewRepository;
    private final NotificationService notificationService;

    public ReviewService(ReviewRepository reviewRepository, UserRepository userRepository,
                         JobPostRepository jobRepository, InterviewRepository interviewRepository,
                         NotificationService notificationService) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.interviewRepository = interviewRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public ReviewDto createReview(User author, ReviewRequest request) {
        if (request.rating() < 1 || request.rating() > 5) {
            throw ApiException.badRequest("Rating must be between 1 and 5");
        }
        if (author.getId().equals(request.targetId())) {
            throw ApiException.badRequest("You cannot review yourself");
        }
        User target = userRepository.findById(request.targetId())
                .orElseThrow(() -> ApiException.notFound("User not found"));

        boolean interacted = reviewRepository.findByAuthorOrderByCreatedAtDesc(author).stream()
                .anyMatch(r -> r.getTarget().getId().equals(target.getId()));
        boolean haveInterview = false;
        if (author.getRole() == com.skillbridge.model.Role.EMPLOYER) {
            haveInterview = interviewRepository.findByEmployerOrderByScheduledAtDesc(author).stream()
                    .anyMatch(i -> i.getWorker().getId().equals(target.getId())
                            && i.getStatus() == InterviewStatus.COMPLETED);
        } else {
            haveInterview = interviewRepository.findByWorkerOrderByScheduledAtDesc(author).stream()
                    .anyMatch(i -> i.getEmployer().getId().equals(target.getId())
                            && i.getStatus() == InterviewStatus.COMPLETED);
        }
        if (!interacted && !haveInterview) {
            throw ApiException.badRequest("You can only review users you have worked with");
        }

        Review review = Review.builder()
                .author(author)
                .target(target)
                .job(request.jobId() != null ? jobRepository.findById(request.jobId()).orElse(null) : null)
                .rating(request.rating())
                .comment(request.comment())
                .build();
        review = reviewRepository.save(review);

        double avg = reviewRepository.averageRatingFor(target);
        long count = reviewRepository.countByTarget(target);
        target.setAvgRating(Math.round(avg * 100.0) / 100.0);
        target.setRatingCount((int) count);
        userRepository.save(target);

        notificationService.notify(target, "New " + request.rating() + "-star review",
                author.getName() + " reviewed you: \"" + (request.comment() != null && !request.comment().isBlank()
                        ? request.comment() : "No comment") + "\"",
                com.skillbridge.model.NotificationType.REVIEW, null);
        return ReviewDto.from(review);
    }

    public List<ReviewDto> reviewsFor(User target) {
        return reviewRepository.findByTargetOrderByCreatedAtDesc(target).stream().map(ReviewDto::from).toList();
    }

    public List<ReviewDto> reviewsBy(User author) {
        return reviewRepository.findByAuthorOrderByCreatedAtDesc(author).stream().map(ReviewDto::from).toList();
    }
}
