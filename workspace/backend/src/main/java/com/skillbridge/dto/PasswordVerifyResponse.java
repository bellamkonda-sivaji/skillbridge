package com.skillbridge.dto;

/** Carries the single-use, ten-minute reset token. */
public record PasswordVerifyResponse(boolean verified, String resetToken) {}
