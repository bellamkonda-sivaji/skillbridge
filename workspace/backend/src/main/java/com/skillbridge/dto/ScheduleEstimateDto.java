package com.skillbridge.dto;

import com.skillbridge.model.PayrollCycle;
import com.skillbridge.model.SalaryUnit;

import java.util.List;

/** What the schedule/salary step of the posting wizard renders back to the employer. */
public record ScheduleEstimateDto(
        double paidHoursPerDay,
        double paidHoursPerWeek,
        int shiftsPerDay,
        int scheduledDays,
        double expectedPaidHours,
        String periodLabel,
        boolean isOngoing,
        List<SalaryUnit> allowedSalaryUnits,
        SalaryUnit recommendedSalaryUnit,
        Double estimatedWorkerEarnings,
        String earningsBasisLabel,
        /** null unless a real platform fee is configured - never an invented number. */
        Double platformFee,
        Double estimatedEmployerTotal,
        PayrollCycle payrollCycle,
        String fundingWhen,
        List<String> warnings
) {}
