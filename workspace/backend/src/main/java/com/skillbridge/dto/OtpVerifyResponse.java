package com.skillbridge.dto;

/** {@code token} and {@code account} are null when no account exists yet for the verified number. */
public record OtpVerifyResponse(boolean verified, String token, AccountDto account) {}
