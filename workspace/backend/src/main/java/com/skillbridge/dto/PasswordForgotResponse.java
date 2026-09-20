package com.skillbridge.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Always 200, even for an identifier that matches nothing - account existence must not leak.
 * {@code devCode} is only populated when {@code skillbridge.otp.expose-code} is true.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PasswordForgotResponse(
        boolean sent,
        String maskedTarget,
        int expiresInSeconds,
        int resendAfterSeconds,
        String devCode
) {}
