package com.skillbridge.dto;

import com.skillbridge.model.ApplicationStatus;
import com.skillbridge.model.InterviewMode;
import com.skillbridge.model.InterviewResult;

import java.time.LocalDateTime;

/** One row of the employer's "interview results" screen for a job. */
public record InterviewResultDto(
        Long applicationId,
        Long workerId,
        String name,
        String photoUrl,
        double rating,
        int ratingCount,
        Double distanceKm,
        LocalDateTime appliedAt,
        LocalDateTime interviewAt,
        InterviewMode interviewMode,
        ApplicationStatus status,
        InterviewResult result,
        String feedback,
        /** The word the UI shows for {@code interviewMode}. */
        String modeLabel
) {}
