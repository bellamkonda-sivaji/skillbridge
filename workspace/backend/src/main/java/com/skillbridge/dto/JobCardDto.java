package com.skillbridge.dto;

import com.skillbridge.model.EmploymentType;
import com.skillbridge.model.EngagementModel;
import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.WorkPattern;
import com.skillbridge.model.WorkType;

import java.time.LocalDateTime;
import java.util.List;

/**
 * The one job shape every worker-facing screen renders: dashboard, search, saved jobs, map.
 * {@code distanceKm} is null - never a sentinel - when either side has no coordinates.
 */
public record JobCardDto(
        Long id,
        String title,
        String businessName,
        Long employerId,
        double salary,
        SalaryUnit salaryUnit,
        WorkType workType,
        EmploymentType employmentType,
        String city,
        String area,
        Double distanceKm,
        double latitude,
        double longitude,
        boolean urgent,
        boolean saved,
        Double matchScore,
        boolean applied,
        List<String> requiredSkills,
        LocalDateTime postedAt,
        int workersNeeded,
        EngagementModel engagementModel,
        WorkPattern workPattern
) {}
