package com.skillbridge.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.skillbridge.model.AttendanceStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Today's shift for the signed-in worker. Never 404s: when there is nothing on today it comes
 * back as {@code {"hasShift": false, ...}} with every other field null.
 */
public record TodayShiftDto(
        boolean hasShift,
        Long employmentId,
        String jobTitle,
        String businessName,
        LocalDate workDate,
        @JsonFormat(pattern = "HH:mm") LocalTime shiftStart,
        @JsonFormat(pattern = "HH:mm") LocalTime shiftEnd,
        @JsonFormat(pattern = "HH:mm") LocalTime breakStart,
        @JsonFormat(pattern = "HH:mm") LocalTime breakEnd,
        String workLocation,
        String contactPersonName,
        String contactPersonPhone,
        Double latitude,
        Double longitude,
        AttendanceStatus attendanceStatus,
        LocalDateTime checkInAt,
        LocalDateTime checkOutAt,
        boolean canCheckIn,
        boolean canCheckOut
) {
    public static TodayShiftDto none() {
        return new TodayShiftDto(false, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, false, false);
    }
}
