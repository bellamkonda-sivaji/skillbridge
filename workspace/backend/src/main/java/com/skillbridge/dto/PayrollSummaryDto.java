package com.skillbridge.dto;

import com.skillbridge.model.SalaryUnit;

import java.time.LocalDate;
import java.util.List;

/** Actual pay, computed from approved attendance rather than from the schedule. */
public record PayrollSummaryDto(
        Long employmentId,
        LocalDate periodStart,
        LocalDate periodEnd,
        SalaryUnit payBasis,
        double rate,
        int scheduledDays,
        int payableDays,
        double payableHours,
        double overtimeHours,
        double grossAmount,
        String breakdownLabel,
        List<AttendanceDto> attendance
) {}
