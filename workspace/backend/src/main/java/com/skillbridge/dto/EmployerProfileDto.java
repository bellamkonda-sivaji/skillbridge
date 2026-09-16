package com.skillbridge.dto;

import com.skillbridge.model.EmployerProfile;

import java.time.LocalDateTime;

public record EmployerProfileDto(
        Long id,
        Long userId,
        String name,
        String email,
        String phone,
        String businessName,
        String businessType,
        String description,
        String city,
        String area,
        double latitude,
        double longitude,
        boolean locationEnabled,
        String website,
        double avgRating,
        int ratingCount,
        LocalDateTime createdAt
) {
    public static EmployerProfileDto from(EmployerProfile e) {
        return new EmployerProfileDto(
                e.getId(), e.getUser().getId(), e.getUser().getName(), e.getUser().getEmail(),
                e.getUser().getPhone(), e.getBusinessName(), e.getBusinessType(), e.getDescription(),
                e.getCity(), e.getArea(), e.getLatitude(), e.getLongitude(), e.isLocationEnabled(),
                e.getWebsite(), e.getUser().getAvgRating(), e.getUser().getRatingCount(), e.getCreatedAt());
    }
}
