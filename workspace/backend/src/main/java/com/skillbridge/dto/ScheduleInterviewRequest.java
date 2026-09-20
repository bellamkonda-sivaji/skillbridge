package com.skillbridge.dto;

import com.skillbridge.model.InterviewMode;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Body of POST /api/employer/interviews. The date and the time arrive separately because the
 * scheduling screen collects them on two different controls.
 */
public record ScheduleInterviewRequest(
        Long workerId,
        Long jobId,
        InterviewMode mode,
        LocalDate date,
        LocalTime time,
        Integer durationMinutes,
        String location,
        String notes,
        Boolean sendDetails
) {}
