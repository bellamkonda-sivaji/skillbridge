package com.skillbridge.dto;

public record SendMessageRequest(Long conversationId, Long recipientId, Long jobId, String content) {}
