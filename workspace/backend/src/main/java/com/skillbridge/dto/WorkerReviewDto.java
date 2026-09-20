package com.skillbridge.dto;

import java.time.LocalDateTime;

/** One review shown on the employer-facing worker profile. */
public record WorkerReviewDto(String author, int rating, String comment, LocalDateTime createdAt) {}
