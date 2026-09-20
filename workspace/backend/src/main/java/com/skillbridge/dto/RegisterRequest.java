package com.skillbridge.dto;

/** The namespace the request was posted to decides the account type, so there is no role field. */
public record RegisterRequest(
        String name,
        String email,
        String password,
        String phone,
        String locale
) {}
