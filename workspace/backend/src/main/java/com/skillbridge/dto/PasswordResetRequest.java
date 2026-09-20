package com.skillbridge.dto;

/** Body of POST /api/{type}/auth/password/reset. */
public record PasswordResetRequest(String identifier, String resetToken, String newPassword) {}
