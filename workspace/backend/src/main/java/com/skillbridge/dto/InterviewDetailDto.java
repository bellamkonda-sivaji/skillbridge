package com.skillbridge.dto;

import com.skillbridge.model.InterviewMode;
import com.skillbridge.model.InterviewStatus;

import java.time.LocalDateTime;
import java.util.List;

/** {@link InterviewDto} flattened out with the interviewer, the address and the prep tips. */
public record InterviewDetailDto(
        Long id,
        Long jobId,
        String jobTitle,
        String businessName,
        Long employerId,
        InterviewMode mode,
        LocalDateTime scheduledAt,
        LocalDateTime endsAt,
        int durationMinutes,
        String location,
        InterviewStatus status,
        boolean isUpcoming,
        String interviewerName,
        String interviewerRole,
        String interviewerPhone,
        String addressLine,
        Double latitude,
        Double longitude,
        String notes,
        List<String> preparationTips
) {
}
