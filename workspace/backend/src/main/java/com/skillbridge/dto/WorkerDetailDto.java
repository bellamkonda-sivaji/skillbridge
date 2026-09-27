package com.skillbridge.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.skillbridge.model.ApplicationStatus;
import com.skillbridge.model.Gender;
import com.skillbridge.model.SalaryUnit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;

/** ApplicantCard plus everything the worker profile and compare screens render. */
public record WorkerDetailDto(
        // ---- ApplicantCard ----
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
        String photoUrl,
        // ---- detail ----
        String about,
        List<String> languages,
        List<WorkExperienceDto> workExperience,
        int totalExperienceYears,
        boolean idVerified,
        String idVerificationLabel,
        double expectedSalaryMin,
        double expectedSalaryMax,
        String availabilityLabel,
        double rating,
        int ratingCount,
        List<WorkerReviewDto> reviews,
        // ---- richer employer-facing profile ----
        String livesIn,
        Integer canTravelKm,
        LocalDate availableFrom,
        boolean profileComplete,
        boolean reliable,
        List<String> preferredRoles,
        List<String> preferredWorkTypes,
        List<String> preferredHours,
        /** Star -> number of real reviews at that star, keyed "5".."1". */
        Map<String, Integer> ratingBreakdown,
        List<WorkerDocumentDto> documents,
        List<String> photos,
        /** The five most recent finished engagements. */
        List<WorkHistoryEntryDto> workHistory,
        int workHistoryCount
) {}
