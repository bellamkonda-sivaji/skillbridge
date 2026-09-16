package com.skillbridge.dto;

import com.skillbridge.model.Notification;
import com.skillbridge.model.NotificationType;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        String title,
        String body,
        NotificationType type,
        String link,
        boolean read,
        LocalDateTime createdAt
) {
    public static NotificationDto from(Notification n) {
        return new NotificationDto(n.getId(), n.getTitle(), n.getBody(), n.getType(), n.getLink(),
                n.isRead(), n.getCreatedAt());
    }
}
