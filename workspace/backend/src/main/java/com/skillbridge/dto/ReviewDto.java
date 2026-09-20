package com.skillbridge.dto;

import com.skillbridge.model.AccountType;
import com.skillbridge.model.Review;

import java.time.LocalDateTime;

public record ReviewDto(
        Long id,
        AccountType authorType,
        Long authorId,
        String authorName,
        AccountType targetType,
        Long targetId,
        String targetName,
        Long jobId,
        String jobTitle,
        int rating,
        String comment,
        LocalDateTime createdAt
) {
    public static ReviewDto from(Review r, String authorName, String targetName) {
        return new ReviewDto(r.getId(), r.getAuthorType(), r.getAuthorId(), authorName,
                r.getTargetType(), r.getTargetId(), targetName,
                r.getJob() != null ? r.getJob().getId() : null,
                r.getJob() != null ? r.getJob().getTitle() : null,
                r.getRating(), r.getComment(), r.getCreatedAt());
    }
}
