package com.skillbridge.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.skillbridge.model.JobShift;

import java.time.LocalTime;

/** One working window on a job post. Times are wire-formatted as "09:00". */
public record JobShiftDto(
        Long id,
        String label,
        @JsonFormat(pattern = "HH:mm") LocalTime startTime,
        @JsonFormat(pattern = "HH:mm") LocalTime endTime,
        Integer breakMinutes,
        @JsonFormat(pattern = "HH:mm") LocalTime breakStart,
        @JsonFormat(pattern = "HH:mm") LocalTime breakEnd
) {
    public static JobShiftDto from(JobShift s) {
        return new JobShiftDto(s.getId(), s.getLabel(), s.getStartTime(), s.getEndTime(),
                s.getBreakMinutes(), s.getBreakStart(), s.getBreakEnd());
    }
}
