package com.skillbridge.dto;

import com.skillbridge.model.EmploymentType;
import com.skillbridge.model.SalaryUnit;

import java.time.LocalDate;

/** Everything is optional - anything omitted is taken from the job post. */
public record OfferRequest(
        Double salary,
        SalaryUnit salaryUnit,
        EmploymentType employmentType,
        LocalDate joiningDate,
        String workLocation
) {}
