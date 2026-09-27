package com.skillbridge.dto;

import com.skillbridge.model.JobDuration;
import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.ShiftArrangement;
import com.skillbridge.model.WorkPattern;

import java.time.LocalDate;
import java.util.List;

/**
 * Body of POST /api/employer/jobs/estimate. Pure input - nothing here is persisted.
 * {@code engagementModel} arrives as a raw string so old duration values can be normalised
 * instead of failing deserialization.
 */
public record ScheduleEstimateRequest(
        String engagementModel,
        LocalDate workDate,
        LocalDate startDate,
        LocalDate endDate,
        JobDuration durationType,
        List<String> workingDays,
        List<JobShiftDto> shifts,
        ShiftArrangement shiftArrangement,
        Boolean breakPaid,
        Double salary,
        SalaryUnit salaryUnit,
        WorkPattern workPattern,
        List<DayTimeDto> dayTimes
) {}
