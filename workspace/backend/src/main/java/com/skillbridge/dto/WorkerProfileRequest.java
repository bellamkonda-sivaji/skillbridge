package com.skillbridge.dto;

import com.skillbridge.model.Availability;
import com.skillbridge.model.SalaryUnit;

import java.util.List;

public record WorkerProfileRequest(
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
        String verificationDoc
) {}
