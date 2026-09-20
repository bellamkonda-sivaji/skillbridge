package com.skillbridge.dto;

/**
 * Login body. {@code identifier} is the mobile number or the email address.
 * {@code email} is kept for backwards compatibility with the legacy body
 * {@code { email, password }} and is used when {@code identifier} is absent.
 */
public record AuthRequest(String identifier, String email, String password) {

    /** The identifier to authenticate with, falling back to the legacy email field. */
    public String loginId() {
        if (identifier != null && !identifier.isBlank()) return identifier.trim();
        if (email != null && !email.isBlank()) return email.trim();
        return null;
    }
}
