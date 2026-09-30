package com.skillbridge.dto;

import com.skillbridge.model.SalaryUnit;

/**
 * The money split on a job, shown to the employer in full and to nobody in half.
 * {@code postedSalary} is what the employer pays; {@code workerSalary} is what the worker
 * is shown and receives; the two differ by exactly {@code platformFee}.
 */
public record JobPricingDto(
        double postedSalary,
        double platformFee,
        double feePercent,
        double workerSalary,
        SalaryUnit salaryUnit,
        /** The band label, e.g. "Rs 1,000 - 4,000", so the employer can check it themselves. */
        String slabLabel,
        /** The price the job first went live at, null when it has never moved. */
        Double originalSalary,
        int priceChangeCount
) {}
