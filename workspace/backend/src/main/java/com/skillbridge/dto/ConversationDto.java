package com.skillbridge.dto;

import com.skillbridge.model.Conversation;
import com.skillbridge.model.JobPost;

import java.time.LocalDateTime;

public record ConversationDto(
        Long id,
        Long workerId,
        String workerName,
        String workerPhoto,
        Long employerId,
        String employerName,
        String businessName,
        Long jobId,
        String jobTitle,
        LocalDateTime lastMessageAt,
        String lastMessage,
        Long lastSenderId,
        long unreadCount
) {
    public static ConversationDto from(Conversation c, String lastMessage, Long lastSenderId, long unreadCount) {
        JobPost job = c.getJob();
        return new ConversationDto(
                c.getId(),
                c.getWorker().getId(), c.getWorker().getName(), c.getWorker().getPhotoUrl(),
                c.getEmployer().getId(), c.getEmployer().getName(),
                c.getEmployer().getEmployerProfile() != null
                        ? c.getEmployer().getEmployerProfile().getBusinessName() : c.getEmployer().getName(),
                job != null ? job.getId() : null,
                job != null ? job.getTitle() : null,
                c.getLastMessageAt(), lastMessage, lastSenderId, unreadCount);
    }
}
