package com.skillbridge.dto;

import com.skillbridge.model.EmployerKind;
import com.skillbridge.model.EmployerPlan;
import com.skillbridge.model.EmployerProfile;

import java.time.LocalDateTime;
import java.util.List;

/** The employer's own view of their business profile (includes contact and onboarding details). */
public record EmployerProfileDto(
        Long id,
        Long employerId,
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
        Integer founded,
        String teamSize,
        boolean verified,
        List<String> photos,
        double avgRating,
        int ratingCount,
        LocalDateTime createdAt,
        // ---------------- onboarding wizard ----------------
        EmployerKind employerKind,
        String businessSize,
        String address,
        String pincode,
        String registrationDocUrl,
        String logoUrl,
        boolean authorizedConfirmed,
        EmployerPlan plan,
        String paymentMethod,
        boolean onboardingCompleted
) {
    public static EmployerProfileDto from(EmployerProfile e) {
        return new EmployerProfileDto(
                e.getId(), e.getAccount().getId(), e.getAccount().getName(), e.getAccount().getEmail(),
                e.getAccount().getPhone(), e.getBusinessName(), e.getBusinessType(), e.getDescription(),
                e.getCity(), e.getArea(), e.getLatitude(), e.getLongitude(), e.isLocationEnabled(),
                e.getWebsite(), e.getFounded(), e.getTeamSize(), e.isVerified(), List.copyOf(e.getPhotos()),
                e.getAccount().getAvgRating(), e.getAccount().getRatingCount(), e.getCreatedAt(),
                e.getEmployerKind(), e.getBusinessSize(), e.getAddress(), e.getPincode(),
                e.getRegistrationDocUrl(), e.getLogoUrl(), e.isAuthorizedConfirmed(),
                e.getPlan(), e.getPaymentMethod(), e.isOnboardingCompleted());
    }
}
