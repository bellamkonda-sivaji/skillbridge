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
        boolean isCurrent,
        // What reaches the worker per unit; `salary` is the employer's posted rate.
        Double workerSalary,
        // Who was hired - the employer's team list showed "?" without it.
        Long workerId,
        String workerName,
        String workerPhotoUrl,
        // The day they actually started; null until the owner confirms joining.
        java.time.LocalDate joinedAt
) {
}
