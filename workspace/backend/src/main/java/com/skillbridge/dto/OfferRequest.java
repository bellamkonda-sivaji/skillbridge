package com.skillbridge.dto;

import com.skillbridge.model.EmploymentType;
import com.skillbridge.model.SalaryUnit;

import java.time.LocalDate;
import java.util.List;

/**
 * Everything is optional - anything omitted is taken from the job post. Fields that do not apply
 * to the job's duration are rejected with a 400 rather than quietly ignored.
 */
public record OfferRequest(
        Double salary,
        SalaryUnit salaryUnit,
        LocalDate joiningDate,
        LocalDate workDate,
        EmploymentType employmentType,
        Integer probationMonths,
        List<String> benefits,
        String message,
        Boolean notifyWorker,
        String workLocation
) {}
