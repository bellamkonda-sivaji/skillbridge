package com.skillbridge.dto;

import com.skillbridge.model.AccountType;
import com.skillbridge.model.Message;
import com.skillbridge.model.MessageType;

import java.time.LocalDateTime;

public record MessageDto(
        Long id,
        Long conversationId,
        AccountType senderType,
        Long senderId,
        String senderName,
        String content,
        MessageType type,
        boolean read,
        LocalDateTime createdAt
) {
    public static MessageDto from(Message m, String senderName) {
        return new MessageDto(m.getId(), m.getConversation().getId(), m.getSenderType(), m.getSenderId(),
                senderName, m.getContent(), m.getType(), m.isRead(), m.getCreatedAt());
    }
}
