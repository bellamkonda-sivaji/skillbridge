package com.skillbridge.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.skillbridge.model.ApplicationStatus;
import com.skillbridge.model.Gender;
import com.skillbridge.model.SalaryUnit;

import java.time.LocalDateTime;
import java.util.List;

/**
 * The one applicant shape every employer screen renders: applicants list, shortlist,
 * recommended workers and the dashboard's recent applications.
 * {@code applicationId} is null for a recommended worker who has not applied yet.
 */
public record ApplicantCardDto(
        Long applicationId,
        Long workerId,
        String name,
        Gender gender,
        Integer age,
        int experienceYears,
        String jobTitle,
        Double distanceKm,
        Integer matchScore,
        boolean verified,
        String availability,
        ApplicationStatus status,
        LocalDateTime appliedAt,
        @JsonProperty("isNew") boolean isNew,
        List<String> skills,
        double expectedSalary,
        SalaryUnit salaryUnit,
        String photoUrl
) {}
