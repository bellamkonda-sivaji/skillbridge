package com.skillbridge.dto;

import com.skillbridge.model.EmploymentType;
import com.skillbridge.model.JobStatus;
import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.WorkerCategory;

import java.time.LocalDateTime;

/** One row on the employer's "My Jobs" list. */
public record JobSummaryDto(
        Long id,
        String title,
        WorkerCategory workerCategory,
        String city,
        String area,
        JobStatus status,
        long applicantsCount,
        LocalDateTime postedAt,
        double salary,
        SalaryUnit salaryUnit,
        EmploymentType employmentType,
        int workersNeeded,
        long filledCount
) {}
