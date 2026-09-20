package com.skillbridge.dto;

import com.skillbridge.model.Availability;
import com.skillbridge.model.EmploymentType;
import com.skillbridge.model.Gender;
import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.VerificationStatus;
import com.skillbridge.model.WorkerProfile;

import java.time.LocalDate;
import java.util.List;

public record WorkerProfileDto(
        Long id,
        Long workerId,
        String name,
        String email,
        String phone,
        String photoUrl,
        double avgRating,
        int ratingCount,
        LocalDate dateOfBirth,
        Gender gender,
        String alternatePhone,
        List<String> jobCategories,
        List<EmploymentType> employmentTypes,
        List<String> skills,
        int experienceYears,
        boolean fresher,
        String jobTitle,
        String bio,
        String city,
        String area,
        double latitude,
        double longitude,
        boolean locationEnabled,
        Integer preferredRadiusKm,
        Availability availability,
        double expectedSalary,
        SalaryUnit salaryUnit,
        VerificationStatus verificationStatus,
        boolean profileCompleted
) {
    public static WorkerProfileDto from(WorkerProfile w) {
        return new WorkerProfileDto(
                w.getId(), w.getAccount().getId(), w.getAccount().getName(), w.getAccount().getEmail(),
                w.getAccount().getPhone(), w.getAccount().getPhotoUrl(),
                w.getAccount().getAvgRating(), w.getAccount().getRatingCount(),
                w.getDateOfBirth(), w.getGender(), w.getAlternatePhone(),
                w.getJobCategories(), w.getEmploymentTypes(),
                w.getSkills(), w.getExperienceYears(), w.isFresher(), w.getJobTitle(), w.getBio(),
                w.getCity(), w.getArea(), w.getLatitude(), w.getLongitude(), w.isLocationEnabled(),
                w.getPreferredRadiusKm(), w.getAvailability(), w.getExpectedSalary(), w.getSalaryUnit(),
                w.getVerificationStatus(), w.isProfileCompleted());
    }
}
