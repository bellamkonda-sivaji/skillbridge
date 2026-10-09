package com.skillbridge.dto;

import com.skillbridge.model.Availability;
import com.skillbridge.model.EmploymentType;
import com.skillbridge.model.Gender;
import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.VerificationStatus;
import com.skillbridge.model.WorkerProfile;
import com.skillbridge.model.AccountType;
import com.skillbridge.security.Privacy;

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
    /** Their own record, which they may of course see in full. */
    private static boolean isSelf(WorkerProfile w) {
        return Privacy.contactFor("x", AccountType.WORKER, w.getAccount().getId()) != null;
    }

    public static WorkerProfileDto from(WorkerProfile w) {
        return new WorkerProfileDto(
                w.getId(), w.getAccount().getId(), w.getAccount().getName(),
                // Contact details reach the worker themselves and the office,
                // nobody else. An employer browsing workers was being handed
                // a phone number, an email and a date of birth per row.
                Privacy.contactFor(w.getAccount().getEmail(), AccountType.WORKER, w.getAccount().getId()),
                Privacy.contactFor(w.getAccount().getPhone(), AccountType.WORKER, w.getAccount().getId()),
                w.getAccount().getPhotoUrl(),
                w.getAccount().getAvgRating(), w.getAccount().getRatingCount(),
                Privacy.isStaff() || isSelf(w) ? w.getDateOfBirth() : null,
                w.getGender(),
                Privacy.contactFor(w.getAlternatePhone(), AccountType.WORKER, w.getAccount().getId()),
                w.getJobCategories(), w.getEmploymentTypes(),
                w.getSkills(), w.getExperienceYears(), w.isFresher(), w.getJobTitle(), w.getBio(),
                w.getCity(), w.getArea(), w.getLatitude(), w.getLongitude(), w.isLocationEnabled(),
                w.getPreferredRadiusKm(), w.getAvailability(), w.getExpectedSalary(), w.getSalaryUnit(),
                w.getVerificationStatus(), w.isProfileCompleted());
    }
}
