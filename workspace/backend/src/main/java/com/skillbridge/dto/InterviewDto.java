package com.skillbridge.dto;

import com.skillbridge.model.Interview;
import com.skillbridge.model.InterviewMode;
import com.skillbridge.model.InterviewStatus;

import java.time.LocalDateTime;

public record InterviewDto(
        Long id,
        Long employerId,
        String employerName,
        Long workerId,
        String workerName,
        Long jobId,
        String jobTitle,
        Long conversationId,
        LocalDateTime scheduledAt,
        InterviewMode mode,
        String location,
        String notes,
        InterviewStatus status,
        LocalDateTime createdAt
) {
    public static InterviewDto from(Interview i) {
        return new InterviewDto(
                i.getId(), i.getEmployer().getId(), i.getEmployer().getName(),
                i.getWorker().getId(), i.getWorker().getName(),
                i.getJob() != null ? i.getJob().getId() : null,
                i.getJob() != null ? i.getJob().getTitle() : null,
                i.getConversation() != null ? i.getConversation().getId() : null,
                i.getScheduledAt(), i.getMode(), i.getLocation(), i.getNotes(),
                i.getStatus(), i.getCreatedAt());
    }
}
