package com.skillbridge.dto;

/** Body of POST /api/{type}/auth/password/forgot. The identifier is an email or a phone. */
public record PasswordForgotRequest(String identifier) {}
