package com.skillbridge.dto;

import com.skillbridge.model.Availability;
import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.VerificationStatus;
import com.skillbridge.model.WorkerProfile;

import java.util.List;

public record WorkerProfileDto(
        Long id,
        Long userId,
        String name,
        String email,
        String phone,
        double avgRating,
        int ratingCount,
        List<String> skills,
        int experienceYears,
        String jobTitle,
        String bio,
        String city,
        String area,
        double latitude,
        double longitude,
        boolean locationEnabled,
        Availability availability,
        double expectedSalary,
        SalaryUnit salaryUnit,
        VerificationStatus verificationStatus,
        boolean profileCompleted
) {
    public static WorkerProfileDto from(WorkerProfile w) {
        return new WorkerProfileDto(
                w.getId(), w.getUser().getId(), w.getUser().getName(), w.getUser().getEmail(),
                w.getUser().getPhone(), w.getUser().getAvgRating(), w.getUser().getRatingCount(),
                w.getSkills(), w.getExperienceYears(), w.getJobTitle(), w.getBio(),
                w.getCity(), w.getArea(), w.getLatitude(), w.getLongitude(), w.isLocationEnabled(),
                w.getAvailability(), w.getExpectedSalary(), w.getSalaryUnit(),
                w.getVerificationStatus(), w.isProfileCompleted());
    }
}
