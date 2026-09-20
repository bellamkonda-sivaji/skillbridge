package com.skillbridge.dto;

/** Body of POST /api/{type}/auth/password/verify. */
public record PasswordVerifyRequest(String identifier, String code) {}
