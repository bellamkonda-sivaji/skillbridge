package com.skillbridge.dto;

import com.skillbridge.model.Message;
import com.skillbridge.model.MessageType;

import java.time.LocalDateTime;

public record MessageDto(
        Long id,
        Long conversationId,
        Long senderId,
        String senderName,
        String content,
        MessageType type,
        boolean read,
        LocalDateTime createdAt
) {
    public static MessageDto from(Message m) {
        return new MessageDto(m.getId(), m.getConversation().getId(), m.getSender().getId(),
                m.getSender().getName(), m.getContent(), m.getType(), m.isRead(), m.getCreatedAt());
    }
}
