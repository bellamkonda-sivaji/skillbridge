package com.skillbridge.dto;

import java.util.List;

public record EmployerProfileRequest(
        String businessName,
        String businessType,
        String description,
        String city,
        String area,
        double latitude,
        double longitude,
        boolean locationEnabled,
        String website,
        Integer founded,
        String teamSize,
        List<String> photos
) {}
