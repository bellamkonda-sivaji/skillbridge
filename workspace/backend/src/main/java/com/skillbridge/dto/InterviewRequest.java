package com.skillbridge.dto;

import com.skillbridge.model.InterviewMode;

import java.time.LocalDateTime;

public record InterviewRequest(
        Long workerId,
        Long jobId,
        Long conversationId,
        LocalDateTime scheduledAt,
        InterviewMode mode,
        String location,
        String notes
) {}
