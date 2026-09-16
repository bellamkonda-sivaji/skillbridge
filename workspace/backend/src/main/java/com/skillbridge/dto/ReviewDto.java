package com.skillbridge.dto;

import com.skillbridge.model.Review;

import java.time.LocalDateTime;

public record ReviewDto(
        Long id,
        Long authorId,
        String authorName,
        String authorRole,
        Long targetId,
        String targetName,
        Long jobId,
        String jobTitle,
        int rating,
        String comment,
        LocalDateTime createdAt
) {
    public static ReviewDto from(Review r) {
        return new ReviewDto(r.getId(), r.getAuthor().getId(), r.getAuthor().getName(),
                r.getAuthor().getRole().name(), r.getTarget().getId(), r.getTarget().getName(),
                r.getJob() != null ? r.getJob().getId() : null,
                r.getJob() != null ? r.getJob().getTitle() : null,
                r.getRating(), r.getComment(), r.getCreatedAt());
    }
}
