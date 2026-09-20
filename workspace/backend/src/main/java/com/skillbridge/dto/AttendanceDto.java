package com.skillbridge.dto;

import com.skillbridge.model.Attendance;
import com.skillbridge.model.AttendanceStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AttendanceDto(
        Long id,
        Long employmentId,
        LocalDate workDate,
        LocalDateTime checkInAt,
        LocalDateTime checkOutAt,
        AttendanceStatus status,
        Integer minutesWorked
) {
    public static AttendanceDto from(Attendance a) {
        return new AttendanceDto(a.getId(), a.getEmployment().getId(), a.getWorkDate(),
                a.getCheckInAt(), a.getCheckOutAt(), a.getStatus(), a.getMinutesWorked());
    }
}
