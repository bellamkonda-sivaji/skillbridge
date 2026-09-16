package com.skillbridge.dto;

import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.WorkType;

import java.util.List;

public record JobRequest(
        String title,
        String description,
        List<String> requiredSkills,
        WorkType workType,
        double salary,
        SalaryUnit salaryUnit,
        String city,
        String area,
        double latitude,
        double longitude,
        int workersNeeded,
        boolean urgent
) {}
