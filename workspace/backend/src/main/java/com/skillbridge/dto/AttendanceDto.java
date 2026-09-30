package com.skillbridge.dto;

import com.skillbridge.model.Attendance;
import com.skillbridge.model.AttendanceApproval;
import com.skillbridge.model.AttendanceStatus;
import com.skillbridge.model.Employment;
import com.skillbridge.service.AttendanceRules;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * One day of attendance, as every screen sees it. The labels are part of the payload on purpose:
 * the worker app has no business deciding what "PENDING" means in Telugu-speaking plain English,
 * and the employer app and the back office must never word it differently.
 */
public record AttendanceDto(
        Long id,
        Long employmentId,
        Long workerId,
        String workerName,
        String workerPhone,
        Long jobId,
        String jobTitle,
        LocalDate workDate,
        LocalDateTime checkInAt,
        LocalDateTime checkOutAt,
        AttendanceStatus status,
        String statusLabel,
        Integer minutesWorked,
        String workedLabel,
        AttendanceApproval approvalStatus,
        String approvalLabel,
        boolean needsApproval,
        boolean hasOpenRequest,
        boolean editedByAdmin
) {

    public static AttendanceDto from(Attendance a) {
        return from(a, false);
    }

    public static AttendanceDto from(Attendance a, boolean hasOpenRequest) {
        Employment e = a.getEmployment();
        AttendanceApproval approval = AttendanceRules.approvalOf(a);
        return new AttendanceDto(
                a.getId(),
                e == null ? null : e.getId(),
                e == null ? null : e.getWorker().getId(),
                e == null ? null : e.getWorker().getName(),
                e == null ? null : e.getWorker().getPhone(),
                e == null ? null : e.getJob().getId(),
                e == null ? null : e.getJob().getTitle(),
                a.getWorkDate(),
                a.getCheckInAt(),
                a.getCheckOutAt(),
                a.getStatus(),
                AttendanceRules.statusLabel(a.getStatus()),
                a.getMinutesWorked(),
                AttendanceRules.workedLabel(a.getMinutesWorked()),
                approval,
                approval.label(),
                AttendanceRules.needsApproval(a),
                hasOpenRequest,
                a.isEditedByAdmin());
    }
}
