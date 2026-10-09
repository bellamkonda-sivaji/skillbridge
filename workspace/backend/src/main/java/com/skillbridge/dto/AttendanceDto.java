package com.skillbridge.dto;

import com.skillbridge.security.Privacy;
import com.skillbridge.model.AccountType;
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
        boolean editedByAdmin,
        /**
         * How many days this worker has finished in total, all jobs counted.
         *
         * Only filled in on the check-out response, because that is the one
         * moment the number is worth a round trip - the worker app turns it
         * into a milestone stamp. Null everywhere else.
         */
        Long daysWorkedTotal
) {

    public static AttendanceDto from(Attendance a) {
        return from(a, false);
    }

    /** Check-out only: carries the running total so the app can mark a milestone. */
    public static AttendanceDto withDaysWorked(Attendance a, long daysWorkedTotal) {
        AttendanceDto base = from(a, false);
        return new AttendanceDto(
                base.id(), base.employmentId(), base.workerId(), base.workerName(),
                base.workerPhone(), base.jobId(), base.jobTitle(), base.workDate(),
                base.checkInAt(), base.checkOutAt(), base.status(), base.statusLabel(),
                base.minutesWorked(), base.workedLabel(), base.approvalStatus(),
                base.approvalLabel(), base.needsApproval(), base.hasOpenRequest(),
                base.editedByAdmin(), daysWorkedTotal);
    }

    public static AttendanceDto from(Attendance a, boolean hasOpenRequest) {
        Employment e = a.getEmployment();
        AttendanceApproval approval = AttendanceRules.approvalOf(a);
        return new AttendanceDto(
                a.getId(),
                e == null ? null : e.getId(),
                e == null ? null : e.getWorker().getId(),
                e == null ? null : e.getWorker().getName(),
                e == null ? null : Privacy.contactFor(e.getWorker().getPhone(),
                        AccountType.WORKER, e.getWorker().getId()),
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
                a.isEditedByAdmin(),
                null);
    }
}
