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
        int durationMinutes,
        InterviewMode mode,
        String location,
        String notes,
        InterviewStatus status,
        LocalDateTime createdAt,
        String businessName,
        LocalDateTime endsAt,
        boolean isUpcoming
) {
    /** The business name falls back to the employer account name when there is no profile. */
    public static InterviewDto from(Interview i) {
        return from(i, i.getEmployer().getName());
    }

    public static InterviewDto from(Interview i, String businessName) {
        return new InterviewDto(
                i.getId(), i.getEmployer().getId(), i.getEmployer().getName(),
                i.getWorker().getId(), i.getWorker().getName(),
                i.getJob() != null ? i.getJob().getId() : null,
                i.getJob() != null ? i.getJob().getTitle() : null,
                i.getConversation() != null ? i.getConversation().getId() : null,
                i.getScheduledAt(), i.getDurationMinutes(), i.getMode(), i.getLocation(), i.getNotes(),
                i.getStatus(), i.getCreatedAt(),
                businessName,
                endsAt(i),
                upcoming(i));
    }

    public static LocalDateTime endsAt(Interview i) {
        return i.getScheduledAt() == null ? null
                : i.getScheduledAt().plusMinutes(Math.max(i.getDurationMinutes(), 0));
    }

    /** Still to happen and neither cancelled nor already marked complete. */
    public static boolean upcoming(Interview i) {
        return i.getScheduledAt() != null
                && i.getScheduledAt().isAfter(LocalDateTime.now())
                && i.getStatus() != InterviewStatus.CANCELLED
                && i.getStatus() != InterviewStatus.COMPLETED;
    }
}
