package com.skillbridge.dto;

import com.skillbridge.model.EngagementModel;
import com.skillbridge.model.JobDuration;
import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.ShiftArrangement;

import java.time.LocalDate;
import java.util.List;

/** Body of POST /api/employer/jobs/estimate. Pure input - nothing here is persisted. */
public record ScheduleEstimateRequest(
        EngagementModel engagementModel,
        LocalDate workDate,
        LocalDate startDate,
        LocalDate endDate,
        JobDuration durationType,
        List<String> workingDays,
        List<JobShiftDto> shifts,
        ShiftArrangement shiftArrangement,
        Boolean breakPaid,
        Double salary,
        SalaryUnit salaryUnit
) {}
