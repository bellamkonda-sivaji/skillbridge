package com.skillbridge.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response to POST /api/auth/otp/request. {@code devCode} is only ever populated when
 * {@code skillbridge.otp.expose-code} is true, and is omitted from the JSON otherwise.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OtpChallengeResponse(
        boolean sent,
        int expiresInSeconds,
        int resendAfterSeconds,
        String devCode
) {}
