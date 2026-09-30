package com.skillbridge.dto;

import com.skillbridge.model.AttendanceApproval;
import com.skillbridge.model.AttendanceActor;
import com.skillbridge.model.AttendanceNextAction;
import com.skillbridge.model.AttendanceRequestStatus;
import com.skillbridge.model.AttendanceRequestType;
import com.skillbridge.model.AttendanceStatus;
import com.skillbridge.model.EngagementModel;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/** Every payload the attendance mechanism speaks, in one place. */
public final class AttendanceDtos {

    private AttendanceDtos() {
    }

    // ================================================================ worker: today

    /**
     * One card per active employment. The worker sees one button; {@code nextActionLabel} is the
     * entire instruction, written the way a person would say it.
     */
    public record TodayDto(
            Long employmentId,
            Long jobId,
            String jobTitle,
            String businessName,
            String employerPhone,
            LocalDate workDate,
            EngagementModel engagementModel,
            LocalTime shiftStart,
            LocalTime shiftEnd,
            String location,
            Long attendanceId,
            AttendanceStatus status,
            LocalDateTime checkInAt,
            LocalDateTime checkOutAt,
            Integer minutesWorked,
            String workedLabel,
            AttendanceApproval approvalStatus,
            String approvalLabel,
            boolean canCheckIn,
            boolean canCheckOut,
            AttendanceNextAction nextAction,
            String nextActionLabel) {
    }

    // ================================================================ regularisation

    public record AttendanceRequestDto(
            Long id,
            Long employmentId,
            Long attendanceId,
            Long workerId,
            String workerName,
            Long employerId,
            String businessName,
            Long jobId,
            String jobTitle,
            LocalDate workDate,
            AttendanceRequestType type,
            String typeLabel,
            LocalTime requestedCheckIn,
            LocalTime requestedCheckOut,
            String reason,
            AttendanceRequestStatus status,
            String statusLabel,
            AttendanceActor decidedByType,
            Long decidedById,
            String decidedByName,
            String decisionNote,
            LocalDateTime createdAt,
            LocalDateTime decidedAt) {
    }

    /** Body of POST /api/worker/attendance/requests. */
    public record CreateRequestBody(
            Long employmentId,
            LocalDate workDate,
            AttendanceRequestType type,
            LocalTime requestedCheckIn,
            LocalTime requestedCheckOut,
            String reason) {
    }

    /**
     * Body of every approve / reject call. {@code checkIn} / {@code checkOut} let an employer or
     * an admin adjust the times before approving; left out, the worker's own times are used.
     */
    public record DecisionBody(String note, LocalTime checkIn, LocalTime checkOut) {
    }

    public record ApproveAllBody(List<Long> ids) {
    }

    public record ApproveAllResultDto(int approved, int skipped) {
    }

    /** Body of the admin override: any field left null is left alone. */
    public record OverrideBody(LocalTime checkIn, LocalTime checkOut, AttendanceStatus status,
                               AttendanceApproval approvalStatus, String note) {
    }

    // ================================================================ employer views

    public record DayTotalsDto(long present, long absent, long pending, long approved,
                               long notMarked) {
    }

    public record DayJobDto(Long jobId, String jobTitle, List<AttendanceDto> workers) {
    }

    public record EmployerDayDto(LocalDate date, DayTotalsDto totals, List<DayJobDto> jobs) {
    }

    public record CalendarDayDto(LocalDate date, long present, long pending, long absent,
                                 long totalMinutes) {
    }

    // ================================================================ admin

    public record AdminAttendanceSummaryDto(long totalDays, long present, long absent,
                                            long pendingApproval, long approved, long rejected,
                                            long openRequests, long totalMinutes,
                                            long unpaidApprovedDays) {
    }
}
