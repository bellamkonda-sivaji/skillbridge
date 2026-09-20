package com.skillbridge.dto;

/** {@code message} is the older field name and is still accepted. */
public record ApplyRequest(String coverMessage, String message) {
    public String text() {
        return coverMessage != null && !coverMessage.isBlank() ? coverMessage : message;
    }
}
