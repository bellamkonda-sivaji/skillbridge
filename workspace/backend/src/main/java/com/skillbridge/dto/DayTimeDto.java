package com.skillbridge.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalTime;

/** Day-specific timings on a job post. Times are wire-formatted as "09:00". */
public record DayTimeDto(
        String dayCode,
        @JsonFormat(pattern = "HH:mm") LocalTime startTime,
        @JsonFormat(pattern = "HH:mm") LocalTime endTime
) {}
