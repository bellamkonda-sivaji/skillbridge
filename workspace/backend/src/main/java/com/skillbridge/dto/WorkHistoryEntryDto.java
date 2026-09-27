package com.skillbridge.dto;

import com.skillbridge.model.SalaryUnit;

import java.time.LocalDate;

/**
 * One finished engagement on the worker's history, built from a completed Employment joined to
 * the employer's review of it. {@code rating} and {@code feedback} stay null when no review exists.
 */
public record WorkHistoryEntryDto(
        Long id,
        String businessName,
        String location,
        String role,
        LocalDate startDate,
        LocalDate endDate,
        Integer durationDays,
        double pay,
        SalaryUnit salaryUnit,
        Double rating,
        String feedback
) {}
