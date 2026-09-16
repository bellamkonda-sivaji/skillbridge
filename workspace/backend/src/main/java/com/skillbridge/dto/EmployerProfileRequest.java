package com.skillbridge.dto;

public record EmployerProfileRequest(
        String businessName,
        String businessType,
        String description,
        String city,
        String area,
        double latitude,
        double longitude,
        boolean locationEnabled,
        String website
) {}
