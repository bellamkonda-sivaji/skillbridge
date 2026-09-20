package com.skillbridge.dto;

import com.skillbridge.model.EmploymentStatus;
import com.skillbridge.model.EmploymentType;
import com.skillbridge.model.SalaryUnit;

import java.time.LocalDate;
import java.util.List;

/** The employment card the worker and employer lists render. */
public record EmploymentDto(
        Long id,
        Long jobId,
        String jobTitle,
        String businessName,
        Long employerId,
        EmploymentStatus status,
        LocalDate joiningDate,
        EmploymentType employmentType,
        double salary,
        SalaryUnit salaryUnit,
        List<String> workingDays,
        String shiftLabel,
        String workLocation,
        boolean isCurrent
) {
}
