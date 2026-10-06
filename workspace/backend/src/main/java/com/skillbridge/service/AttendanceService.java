package com.skillbridge.service;

import com.skillbridge.dto.AttendanceDto;
import com.skillbridge.dto.AttendanceDtos.*;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.AttendanceRepository;
import com.skillbridge.repository.AttendanceRequestRepository;
import com.skillbridge.repository.EmployerProfileRepository;
import com.skillbridge.repository.EmploymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * The attendance mechanism: one button to start, one to stop, and one way to say "I was there but
 * it did not get marked".
 *
 * <p>Three audiences read exactly the same two tables. A worker's request is the employer's inbox
 * item and the admin's queue item - the same row, never a copy - so whoever answers it, the answer
 * is immediately what all three sides see. That is the entire design: no shift rosters, no
 * geofencing, no approval chain.
 */
@Service
public class AttendanceService {

    /** Older than this and we stop taking corrections: memory and payroll have both moved on. */
    private static final int MAX_REQUEST_AGE_DAYS = 30;

    private static final List<String> DAY_KEYS =
            List.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");

    private final EmploymentRepository employments;
    private final AttendanceRepository attendances;
    private final AttendanceRequestRepository requests;
    private final EmployerProfileRepository employerProfiles;
    private final NotificationService notifications;
    private final AdminGuard guard;
    private final AdminAuditService audit;

    public AttendanceService(EmploymentRepository employments,
                             AttendanceRepository attendances,
                             AttendanceRequestRepository requests,
                             EmployerProfileRepository employerProfiles,
                             NotificationService notifications,
                             AdminGuard guard,
                             AdminAuditService audit) {
        this.employments = employments;
        this.attendances = attendances;
        this.requests = requests;
        this.employerProfiles = employerProfiles;
        this.notifications = notifications;
        this.guard = guard;
        this.audit = audit;
    }

    // ================================================================== worker: today

    /**
     * One card per active employment, so a worker holding two jobs sees two buttons and picks.
     * Never throws: a worker with nothing on today gets an empty list.
     */
    public List<TodayDto> today(WorkerAccount worker) {
        LocalDate today = LocalDate.now();
        String todayKey = DAY_KEYS.get(today.getDayOfWeek().getValue() - 1);
        List<TodayDto> cards = new ArrayList<>();
        for (Employment e : employments.findByWorkerOrderByJoiningDateDesc(worker)) {
            if (e.getStatus() != EmploymentStatus.JOINING_CONFIRMED
                    && e.getStatus() != EmploymentStatus.ACTIVE) {
                continue;
            }
            Attendance a = attendances.findByEmploymentAndWorkDate(e, today).orElse(null);
            cards.add(todayCard(e, a, today, todayKey));
        }
        cards.sort(Comparator.comparing(TodayDto::employmentId));
        return cards;
    }

    private TodayDto todayCard(Employment e, Attendance a, LocalDate today, String todayKey) {
        JobPost job = e.getJob();
        JobShift shift = job.getShifts() == null || job.getShifts().isEmpty()
                ? null : job.getShifts().get(0);
        EmployerProfile profile = employerProfiles.findByAccountId(e.getEmployer().getId()).orElse(null);

        // A rostered day beats the weekly pattern: if a row already exists for today, today is a
        // work day whatever the pattern says.
        boolean worksToday = a != null || job.getWorkingDays() == null
                || job.getWorkingDays().isEmpty() || job.getWorkingDays().contains(todayKey);

        boolean canCheckIn = worksToday && (a == null || a.getCheckInAt() == null);
        boolean canCheckOut = a != null && a.getCheckInAt() != null && a.getCheckOutAt() == null;

        AttendanceNextAction next;
        String nextLabel;
        if (!worksToday) {
            next = AttendanceNextAction.NONE;
            nextLabel = "Today is not a work day";
        } else if (canCheckIn) {
            next = AttendanceNextAction.CHECK_IN;
            nextLabel = "Tap when you start work";
        } else if (canCheckOut) {
            next = AttendanceNextAction.CHECK_OUT;
            nextLabel = "Tap when you finish work";
        } else {
            next = AttendanceNextAction.DONE;
            nextLabel = "Done for today";
        }

        Integer minutes = a == null ? null : a.getMinutesWorked();
        String workedLabel;
        if (a != null && a.getCheckInAt() != null && a.getCheckOutAt() == null) {
            int soFar = (int) Math.max(0,
                    Duration.between(a.getCheckInAt(), LocalDateTime.now()).toMinutes());
            workedLabel = AttendanceRules.workedLabel(soFar, "so far");
        } else {
            workedLabel = AttendanceRules.workedLabel(minutes);
        }

        AttendanceApproval approval = a == null ? null : AttendanceRules.approvalOf(a);
        return new TodayDto(
                e.getId(), job.getId(), job.getTitle(),
                businessName(e.getEmployer(), profile), e.getEmployer().getPhone(),
                today, job.getEngagementModel(),
                shift != null ? shift.getStartTime() : e.getReportingTime(),
                shift != null ? shift.getEndTime() : null,
                e.getWorkLocation(),
                a == null ? null : a.getId(),
                a == null ? AttendanceStatus.NOT_CHECKED_IN : a.getStatus(),
                a == null ? null : a.getCheckInAt(),
                a == null ? null : a.getCheckOutAt(),
                minutes, workedLabel,
                approval, approval == null ? null : approval.label(),
                canCheckIn, canCheckOut, next, nextLabel);
    }

    // ================================================================== worker: requests

    @Transactional
    public AttendanceRequestDto createRequest(WorkerAccount worker, CreateRequestBody body) {
        if (body == null || body.employmentId() == null) {
            throw ApiException.badRequest("Tell us which job this is about");
        }
        if (body.workDate() == null) {
            throw ApiException.badRequest("Tell us which day this is about");
        }
        if (body.type() == null) {
            throw ApiException.badRequest("Tell us what went wrong");
        }
        Employment e = workerEmployment(worker, body.employmentId());
        LocalDate date = body.workDate();
        EmployerProfile profile = employerProfiles.findByAccountId(e.getEmployer().getId()).orElse(null);
        String business = businessName(e.getEmployer(), profile);

        if (date.isAfter(LocalDate.now())) {
            throw ApiException.badRequest("That day has not happened yet.");
        }
        if (date.isBefore(LocalDate.now().minusDays(MAX_REQUEST_AGE_DAYS))) {
            throw ApiException.badRequest(
                    "That day is more than 30 days old. Please call " + business + " directly.");
        }
        LocalDate startedOn = firstNonNull(e.getActualJoiningDate(), e.getJoiningDate());
        if (startedOn != null && date.isBefore(startedOn)) {
            throw ApiException.badRequest(
                    "You had not started at " + business + " on that day.");
        }
        LocalDate endedOn = e.getEndedAt() == null ? null : e.getEndedAt().toLocalDate();
        if (endedOn != null && date.isAfter(endedOn)) {
            throw ApiException.badRequest("Your work at " + business + " had already finished by then.");
        }
        if (requests.findFirstByEmploymentIdAndWorkDateAndStatus(
                e.getId(), date, AttendanceRequestStatus.PENDING).isPresent()) {
            throw ApiException.badRequest("You already asked about this day. We are waiting for "
                    + business + " to answer.");
        }

        Attendance existing = attendances.findByEmploymentAndWorkDate(e, date).orElse(null);
        AttendanceRequest req = requests.save(AttendanceRequest.builder()
                .employmentId(e.getId())
                .attendanceId(existing == null ? null : existing.getId())
                .workerId(worker.getId())
                .workerName(worker.getName())
                .employerId(e.getEmployer().getId())
                .businessName(business)
                .jobId(e.getJob().getId())
                .jobTitle(e.getJob().getTitle())
                .workDate(date)
                .type(body.type())
                .requestedCheckIn(body.requestedCheckIn())
                .requestedCheckOut(body.requestedCheckOut())
                .reason(body.reason())
                .status(AttendanceRequestStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build());

        notifications.notify(e.getEmployer(), "Attendance question from " + worker.getName(),
                worker.getName() + " says: \"" + req.getType().label() + "\" for " + date
                        + " on \"" + e.getJob().getTitle() + "\"",
                NotificationType.SYSTEM, "/employer/attendance/requests");
        return toDto(req);
    }

    public List<AttendanceRequestDto> requestsForWorker(WorkerAccount worker) {
        return requests.findByWorkerIdOrderByCreatedAtDesc(worker.getId()).stream()
                .map(this::toDto).toList();
    }

    @Transactional
    public AttendanceRequestDto cancelRequest(WorkerAccount worker, Long id) {
        AttendanceRequest req = requests.findById(id)
                .orElseThrow(() -> ApiException.notFound("We cannot find that question"));
        if (!req.getWorkerId().equals(worker.getId())) {
            throw ApiException.forbidden("This is not your request");
        }
        if (req.getStatus() != AttendanceRequestStatus.PENDING) {
            throw ApiException.badRequest("This one has already been answered.");
        }
        req.setStatus(AttendanceRequestStatus.CANCELLED);
        req.setDecidedAt(LocalDateTime.now());
        return toDto(requests.save(req));
    }

    // ================================================================== employer: reads

    /**
     * The employer's attendance list. Every filter is optional and independent; {@code status}
     * accepts either an attendance status (CHECKED_OUT) or an approval status (PENDING), because
     * from behind the counter they are the same question.
     */
    public List<AttendanceDto> forEmployer(EmployerAccount employer, LocalDate date, LocalDate from,
                                           LocalDate to, Long jobId, Long workerId, String status,
                                           String q, Long employmentId) {
        List<Employment> scope = employments.findByEmployerOrderByJoiningDateDesc(employer);
        if (employmentId != null) {
            scope = scope.stream().filter(e -> e.getId().equals(employmentId)).toList();
        }
        return filter(scope, date, from, to, jobId, workerId, status, q);
    }

    public EmployerDayDto day(EmployerAccount employer, LocalDate date) {
        LocalDate on = date != null ? date : LocalDate.now();
        List<Employment> scope = employments.findByEmployerOrderByJoiningDateDesc(employer);
        Set<Long> open = openRequestAttendanceKeys();

        long present = 0, absent = 0, pending = 0, approved = 0, notMarked = 0;
        Map<Long, DayJobDto> byJob = new LinkedHashMap<>();
        for (Employment e : scope) {
            if (!isLive(e, on)) {
                continue;
            }
            Attendance a = attendances.findByEmploymentAndWorkDate(e, on).orElse(null);
            List<AttendanceDto> bucket = byJob
                    .computeIfAbsent(e.getJob().getId(),
                            k -> new DayJobDto(e.getJob().getId(), e.getJob().getTitle(),
                                    new ArrayList<>()))
                    .workers();
            if (a == null) {
                notMarked++;
                bucket.add(notMarkedRow(e, on, open.contains(key(e.getId(), on))));
                continue;
            }
            AttendanceApproval approval = AttendanceRules.approvalOf(a);
            if (a.getStatus() == AttendanceStatus.ABSENT) {
                absent++;
            } else if (a.getStatus() == AttendanceStatus.NOT_CHECKED_IN) {
                notMarked++;
            } else {
                present++;
            }
            if (approval == AttendanceApproval.PENDING
                    && a.getStatus() == AttendanceStatus.CHECKED_OUT) {
                pending++;
            }
            if (approval.counts()) {
                approved++;
            }
            bucket.add(AttendanceDto.from(a, open.contains(key(e.getId(), on))));
        }
        return new EmployerDayDto(on,
                new DayTotalsDto(present, absent, pending, approved, notMarked),
                new ArrayList<>(byJob.values()));
    }

    /** Feeds the employer's date picker: one dot per day, nothing more. */
    public List<CalendarDayDto> calendar(EmployerAccount employer, LocalDate from, LocalDate to) {
        LocalDate start = from != null ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate end = to != null ? to : start.plusMonths(1).minusDays(1);
        if (end.isBefore(start)) {
            throw ApiException.badRequest("The end of the period cannot be before its start");
        }
        List<Employment> scope = employments.findByEmployerOrderByJoiningDateDesc(employer);
        if (scope.isEmpty()) {
            return List.of();
        }
        Map<LocalDate, long[]> byDate = new HashMap<>();
        for (Attendance a : attendances
                .findByEmploymentInAndWorkDateBetweenOrderByWorkDateDesc(scope, start, end)) {
            long[] cell = byDate.computeIfAbsent(a.getWorkDate(), k -> new long[4]);
            if (a.getStatus() == AttendanceStatus.ABSENT) {
                cell[2]++;
            } else if (a.getStatus() != AttendanceStatus.NOT_CHECKED_IN) {
                cell[0]++;
            }
            if (AttendanceRules.needsApproval(a)) {
                cell[1]++;
            }
            cell[3] += a.getMinutesWorked() == null ? 0 : a.getMinutesWorked();
        }
        List<CalendarDayDto> out = new ArrayList<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            long[] cell = byDate.getOrDefault(d, new long[4]);
            out.add(new CalendarDayDto(d, cell[0], cell[1], cell[2], cell[3]));
        }
        return out;
    }

    // ================================================================== employer: decisions

    @Transactional
    public AttendanceDto approveDay(EmployerAccount employer, Long attendanceId, String note) {
        return decideDay(employerAttendance(employer, attendanceId), true, note,
                AttendanceActor.EMPLOYER, employer.getId(), employer.getName(), false);
    }

    @Transactional
    public AttendanceDto rejectDay(EmployerAccount employer, Long attendanceId, String note) {
        return decideDay(employerAttendance(employer, attendanceId), false, note,
                AttendanceActor.EMPLOYER, employer.getId(), employer.getName(), false);
    }

    /** Bulk approve, skipping anything not actually waiting rather than failing the whole call. */
    @Transactional
    public ApproveAllResultDto approveAll(EmployerAccount employer, List<Long> ids) {
        int approved = 0;
        int skipped = 0;
        for (Long id : ids == null ? List.<Long>of() : ids) {
            Attendance a = attendances.findById(id).orElse(null);
            if (a == null || !a.getEmployment().getEmployer().getId().equals(employer.getId())
                    || !AttendanceRules.needsApproval(a)) {
                skipped++;
                continue;
            }
            decideDay(a, true, null, AttendanceActor.EMPLOYER, employer.getId(),
                    employer.getName(), false);
            approved++;
        }
        return new ApproveAllResultDto(approved, skipped);
    }

    private AttendanceDto decideDay(Attendance a, boolean approve, String note,
                                    AttendanceActor actor, Long actorId, String actorName,
                                    boolean byAdmin) {
        a.setApprovalStatus(approve ? AttendanceApproval.APPROVED : AttendanceApproval.REJECTED);
        a.setApprovedByType(actor);
        a.setApprovedById(actorId);
        a.setApprovedByName(actorName);
        a.setApprovedAt(LocalDateTime.now());
        a.setDecisionNote(note);
        if (byAdmin) {
            a.setEditedByAdmin(true);
        }
        attendances.save(a);
        Employment e = a.getEmployment();
        notifications.notify(e.getWorker(),
                approve ? "Your work on " + a.getWorkDate() + " is counted"
                        : "Your work on " + a.getWorkDate() + " was not counted",
                (approve ? actorName + " confirmed your day at " : actorName + " did not accept ")
                        + e.getJob().getTitle() + (note == null || note.isBlank() ? "" : " - " + note),
                NotificationType.SYSTEM, "/worker/attendance");
        return AttendanceDto.from(a, hasOpenRequest(e.getId(), a.getWorkDate()));
    }

    public List<AttendanceRequestDto> requestsForEmployer(EmployerAccount employer, String status) {
        return requests.findByEmployerIdOrderByCreatedAtDesc(employer.getId()).stream()
                .filter(r -> matchesStatus(r, status))
                .map(this::toDto).toList();
    }

    @Transactional
    public AttendanceRequestDto employerDecideRequest(EmployerAccount employer, Long id,
                                                      boolean approve, DecisionBody body) {
        AttendanceRequest req = requests.findById(id)
                .orElseThrow(() -> ApiException.notFound("We cannot find that request"));
        if (!req.getEmployerId().equals(employer.getId())) {
            throw ApiException.forbidden("This request is not yours to answer");
        }
        return decideRequest(req, approve, body, AttendanceActor.EMPLOYER, employer.getId(),
                employer.getName(), false);
    }

    // ================================================================== admin

    public List<AttendanceDto> adminSearch(LocalDate date, LocalDate from, LocalDate to,
                                           Long employerId, Long workerId, Long jobId,
                                           String approvalStatus, String q) {
        guard.require(AdminPermission.VIEW_REPORTS);
        List<Employment> scope = employments.findAll().stream()
                .filter(e -> employerId == null || e.getEmployer().getId().equals(employerId))
                .toList();
        return filter(scope, date, from, to, jobId, workerId, approvalStatus, q);
    }

    public AdminAttendanceSummaryDto adminSummary(LocalDate from, LocalDate to) {
        guard.require(AdminPermission.VIEW_REPORTS);
        LocalDate start = from != null ? from : LocalDate.now().minusDays(30);
        LocalDate end = to != null ? to : LocalDate.now();
        long totalDays = 0, present = 0, absent = 0, pendingApproval = 0, approved = 0,
                rejected = 0, totalMinutes = 0, unpaidApprovedDays = 0;
        for (Attendance a : attendances.findAll()) {
            if (a.getWorkDate().isBefore(start) || a.getWorkDate().isAfter(end)) {
                continue;
            }
            totalDays++;
            if (a.getStatus() == AttendanceStatus.ABSENT) {
                absent++;
            } else if (a.getStatus() != AttendanceStatus.NOT_CHECKED_IN) {
                present++;
            }
            AttendanceApproval approval = AttendanceRules.approvalOf(a);
            if (AttendanceRules.needsApproval(a)) {
                pendingApproval++;
            }
            if (approval == AttendanceApproval.REJECTED) {
                rejected++;
            }
            if (AttendanceRules.counts(a)) {
                approved++;
                totalMinutes += a.getMinutesWorked() == null ? 0 : a.getMinutesWorked();
                if (a.getEmployment().getSettledAt() == null) {
                    unpaidApprovedDays++;
                }
            }
        }
        long openRequests = requests
                .findByStatusOrderByCreatedAtAsc(AttendanceRequestStatus.PENDING).size();
        return new AdminAttendanceSummaryDto(totalDays, present, absent, pendingApproval, approved,
                rejected, openRequests, totalMinutes, unpaidApprovedDays);
    }

    public List<AttendanceRequestDto> adminRequests(String status, Long employerId, String q) {
        guard.require(AdminPermission.VIEW_REPORTS);
        String needle = q == null ? null : q.trim().toLowerCase(Locale.ENGLISH);
        return requests.findAllByOrderByCreatedAtDesc().stream()
                .filter(r -> matchesStatus(r, status))
                .filter(r -> employerId == null || employerId.equals(r.getEmployerId()))
                .filter(r -> needle == null || needle.isBlank()
                        || contains(r.getWorkerName(), needle)
                        || contains(r.getBusinessName(), needle)
                        || contains(r.getJobTitle(), needle))
                .map(this::toDto).toList();
    }

    @Transactional
    public AttendanceRequestDto adminDecideRequest(Long id, boolean approve, DecisionBody body) {
        AdminAccount admin = guard.require(AdminPermission.MANAGE_APPLICATIONS);
        AttendanceRequest req = requests.findById(id)
                .orElseThrow(() -> ApiException.notFound("We cannot find that request"));
        AttendanceRequestDto dto = decideRequest(req, approve, body, AttendanceActor.ADMIN,
                admin.getId(), admin.getName(), true);
        audit.record(admin, approve ? "ATTENDANCE_REQUEST_APPROVE" : "ATTENDANCE_REQUEST_REJECT",
                "ATTENDANCE_REQUEST", id,
                req.getWorkerName() + " · " + req.getWorkDate() + " · " + req.getType()
                        + (body == null || body.note() == null ? "" : " · " + body.note()));
        return dto;
    }

    /** The back office settling a day by hand. Any field left null is left alone. */
    @Transactional
    public AttendanceDto adminOverride(Long attendanceId, OverrideBody body) {
        AdminAccount admin = guard.require(AdminPermission.MANAGE_APPLICATIONS);
        Attendance a = attendances.findById(attendanceId)
                .orElseThrow(() -> ApiException.notFound("We cannot find that attendance day"));
        OverrideBody in = body == null
                ? new OverrideBody(null, null, null, null, null) : body;

        if (in.checkIn() != null) {
            a.setCheckInAt(a.getWorkDate().atTime(in.checkIn()));
        }
        if (in.checkOut() != null) {
            a.setCheckOutAt(a.getWorkDate().atTime(in.checkOut()));
        }
        if (in.checkIn() != null || in.checkOut() != null) {
            recomputeMinutes(a);
        }
        if (in.status() != null) {
            a.setStatus(in.status());
        } else if (a.getCheckOutAt() != null) {
            a.setStatus(AttendanceStatus.CHECKED_OUT);
        }
        if (in.approvalStatus() != null) {
            a.setApprovalStatus(in.approvalStatus());
        }
        a.setEditedByAdmin(true);
        a.setApprovedByType(AttendanceActor.ADMIN);
        a.setApprovedById(admin.getId());
        a.setApprovedByName(admin.getName());
        a.setApprovedAt(LocalDateTime.now());
        a.setDecisionNote(in.note());
        attendances.save(a);

        Employment e = a.getEmployment();
        audit.record(admin, "ATTENDANCE_OVERRIDE", "ATTENDANCE", a.getId(),
                e.getWorker().getName() + " · " + a.getWorkDate() + " · " + a.getStatus()
                        + "/" + AttendanceRules.approvalOf(a)
                        + (in.note() == null ? "" : " · " + in.note()));
        String body2 = "JobOn corrected " + a.getWorkDate() + " on \""
                + e.getJob().getTitle() + "\": " + AttendanceRules.approvalOf(a).label()
                + (in.note() == null || in.note().isBlank() ? "" : " - " + in.note());
        notifications.notify(e.getWorker(), "Your attendance was corrected", body2,
                NotificationType.SYSTEM, "/worker/attendance");
        notifications.notify(e.getEmployer(), "Attendance corrected by JobOn",
                e.getWorker().getName() + " · " + body2,
                NotificationType.SYSTEM, "/employer/attendance");
        return AttendanceDto.from(a, hasOpenRequest(e.getId(), a.getWorkDate()));
    }

    // ================================================================== the shared decision

    /**
     * Approving a request must actually change the attendance. That is the whole point of the
     * feature: the row is created when it was missing, the times are written, the minutes are
     * recomputed and the day is marked APPROVED - so the worker, the employer and the back office
     * all read the corrected day from their own endpoint the moment this returns.
     */
    private AttendanceRequestDto decideRequest(AttendanceRequest req, boolean approve,
                                               DecisionBody body, AttendanceActor actor,
                                               Long actorId, String actorName, boolean byAdmin) {
        if (req.getStatus() != AttendanceRequestStatus.PENDING) {
            throw ApiException.badRequest("This request has already been answered");
        }
        DecisionBody in = body == null ? new DecisionBody(null, null, null) : body;
        Employment e = employments.findById(req.getEmploymentId())
                .orElseThrow(() -> ApiException.notFound("Employment not found"));

        req.setStatus(approve ? AttendanceRequestStatus.APPROVED : AttendanceRequestStatus.REJECTED);
        req.setDecidedByType(actor);
        req.setDecidedById(actorId);
        req.setDecidedByName(actorName);
        req.setDecisionNote(in.note());
        req.setDecidedAt(LocalDateTime.now());

        if (approve) {
            Attendance a = attendances.findByEmploymentAndWorkDate(e, req.getWorkDate())
                    .orElseGet(() -> Attendance.builder()
                            .employment(e)
                            .workDate(req.getWorkDate())
                            .status(AttendanceStatus.NOT_CHECKED_IN)
                            .approvalStatus(AttendanceApproval.PENDING)
                            .build());

            LocalTime in1 = firstNonNull(in.checkIn(), req.getRequestedCheckIn());
            LocalTime out1 = firstNonNull(in.checkOut(), req.getRequestedCheckOut());
            if (in1 != null) {
                a.setCheckInAt(req.getWorkDate().atTime(in1));
            }
            if (out1 != null) {
                a.setCheckOutAt(req.getWorkDate().atTime(out1));
            }
            recomputeMinutes(a);
            if (a.getCheckInAt() != null && a.getCheckOutAt() != null) {
                a.setStatus(AttendanceStatus.CHECKED_OUT);
            } else if (a.getCheckInAt() != null) {
                a.setStatus(AttendanceStatus.CHECKED_IN);
            }
            a.setApprovalStatus(AttendanceApproval.APPROVED);
            a.setApprovedByType(actor);
            a.setApprovedById(actorId);
            a.setApprovedByName(actorName);
            a.setApprovedAt(LocalDateTime.now());
            a.setDecisionNote(in.note());
            a.setNote(req.getType().label());
            if (byAdmin) {
                a.setEditedByAdmin(true);
            }
            attendances.save(a);
            req.setAttendanceId(a.getId());
        }
        requests.save(req);

        String headline = approve ? "Your attendance was fixed" : "Your attendance question was answered";
        notifications.notify(e.getWorker(), headline,
                actorName + (approve ? " fixed " : " did not accept your question about ")
                        + req.getWorkDate() + " on \"" + req.getJobTitle() + "\""
                        + (in.note() == null || in.note().isBlank() ? "" : " - " + in.note()),
                NotificationType.SYSTEM, "/worker/attendance");
        if (byAdmin) {
            notifications.notify(e.getEmployer(), "JobOn answered an attendance question",
                    req.getWorkerName() + " · " + req.getWorkDate() + " · "
                            + (approve ? "fixed" : "not accepted"),
                    NotificationType.SYSTEM, "/employer/attendance/requests");
        }
        return toDto(req);
    }

    // ================================================================== helpers

    private List<AttendanceDto> filter(List<Employment> scope, LocalDate date, LocalDate from,
                                       LocalDate to, Long jobId, Long workerId, String status,
                                       String q) {
        if (scope.isEmpty()) {
            return List.of();
        }
        LocalDate start = date != null ? date : (from != null ? from : LocalDate.now().minusMonths(3));
        LocalDate end = date != null ? date : (to != null ? to : LocalDate.now().plusDays(1));
        if (end.isBefore(start)) {
            throw ApiException.badRequest("The end of the period cannot be before its start");
        }
        AttendanceStatus wantedStatus = parse(status, AttendanceStatus.class);
        AttendanceApproval wantedApproval = parse(status, AttendanceApproval.class);
        if (status != null && !status.isBlank() && wantedStatus == null && wantedApproval == null) {
            throw ApiException.badRequest("We do not know the status \"" + status + "\"");
        }
        String needle = q == null ? null : q.trim().toLowerCase(Locale.ENGLISH);
        Set<Long> open = openRequestAttendanceKeys();

        return attendances.findByEmploymentInAndWorkDateBetweenOrderByWorkDateDesc(scope, start, end)
                .stream()
                .filter(a -> jobId == null || a.getEmployment().getJob().getId().equals(jobId))
                .filter(a -> workerId == null || a.getEmployment().getWorker().getId().equals(workerId))
                .filter(a -> wantedStatus == null || a.getStatus() == wantedStatus)
                .filter(a -> wantedApproval == null || AttendanceRules.approvalOf(a) == wantedApproval)
                .filter(a -> needle == null || needle.isBlank()
                        || contains(a.getEmployment().getWorker().getName(), needle)
                        || contains(a.getEmployment().getWorker().getPhone(), needle)
                        || contains(a.getEmployment().getJob().getTitle(), needle))
                .map(a -> AttendanceDto.from(a,
                        open.contains(key(a.getEmployment().getId(), a.getWorkDate()))))
                .toList();
    }

    /** A synthetic row for a scheduled worker with nothing marked, so the day view has no gaps. */
    private AttendanceDto notMarkedRow(Employment e, LocalDate on, boolean hasOpenRequest) {
        return new AttendanceDto(null, e.getId(), e.getWorker().getId(), e.getWorker().getName(),
                e.getWorker().getPhone(), e.getJob().getId(), e.getJob().getTitle(), on,
                null, null, AttendanceStatus.NOT_CHECKED_IN, "Not marked", null, null,
                null, null, false, hasOpenRequest, false, null);
    }

    private boolean isLive(Employment e, LocalDate on) {
        if (e.getStatus() == EmploymentStatus.OFFER_ACCEPTED) {
            return false;
        }
        LocalDate started = firstNonNull(e.getActualJoiningDate(), e.getJoiningDate());
        if (started != null && on.isBefore(started)) {
            return false;
        }
        LocalDate ended = e.getEndedAt() == null ? null : e.getEndedAt().toLocalDate();
        return ended == null || !on.isAfter(ended);
    }

    private static void recomputeMinutes(Attendance a) {
        if (a.getCheckInAt() != null && a.getCheckOutAt() != null) {
            a.setMinutesWorked((int) Math.max(0,
                    Duration.between(a.getCheckInAt(), a.getCheckOutAt()).toMinutes()));
        }
    }

    /** Employment id + date, so an open request can be flagged on a day that has no row yet. */
    private static long key(Long employmentId, LocalDate date) {
        return employmentId * 100_000L + date.toEpochDay();
    }

    private Set<Long> openRequestAttendanceKeys() {
        Set<Long> keys = new HashSet<>();
        for (AttendanceRequest r : requests
                .findByStatusOrderByCreatedAtAsc(AttendanceRequestStatus.PENDING)) {
            keys.add(key(r.getEmploymentId(), r.getWorkDate()));
        }
        return keys;
    }

    private boolean hasOpenRequest(Long employmentId, LocalDate date) {
        return requests.findFirstByEmploymentIdAndWorkDateAndStatus(
                employmentId, date, AttendanceRequestStatus.PENDING).isPresent();
    }

    private boolean matchesStatus(AttendanceRequest r, String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return true;
        }
        AttendanceRequestStatus wanted = parse(status, AttendanceRequestStatus.class);
        if (wanted == null) {
            throw ApiException.badRequest("We do not know the status \"" + status + "\"");
        }
        return r.getStatus() == wanted;
    }

    private Attendance employerAttendance(EmployerAccount employer, Long id) {
        Attendance a = attendances.findById(id)
                .orElseThrow(() -> ApiException.notFound("We cannot find that attendance day"));
        if (!a.getEmployment().getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("This is not your worker's day");
        }
        return a;
    }

    private Employment workerEmployment(WorkerAccount worker, Long id) {
        Employment e = employments.findById(id)
                .orElseThrow(() -> ApiException.notFound("Employment not found"));
        if (!e.getWorker().getId().equals(worker.getId())) {
            throw ApiException.forbidden("This is not your job");
        }
        return e;
    }

    private AttendanceRequestDto toDto(AttendanceRequest r) {
        return new AttendanceRequestDto(r.getId(), r.getEmploymentId(), r.getAttendanceId(),
                r.getWorkerId(), r.getWorkerName(), r.getEmployerId(), r.getBusinessName(),
                r.getJobId(), r.getJobTitle(), r.getWorkDate(), r.getType(), r.getType().label(),
                r.getRequestedCheckIn(), r.getRequestedCheckOut(), r.getReason(),
                r.getStatus(), r.getStatus().label(), r.getDecidedByType(), r.getDecidedById(),
                r.getDecidedByName(), r.getDecisionNote(), r.getCreatedAt(), r.getDecidedAt());
    }

    private String businessName(EmployerAccount employer, EmployerProfile profile) {
        return profile != null && profile.getBusinessName() != null
                && !profile.getBusinessName().isBlank()
                ? profile.getBusinessName() : employer.getName();
    }

    private static boolean contains(String haystack, String needle) {
        return haystack != null && haystack.toLowerCase(Locale.ENGLISH).contains(needle);
    }

    private static <T extends Enum<T>> T parse(String raw, Class<T> type) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Enum.valueOf(type, raw.trim().toUpperCase(Locale.ENGLISH));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    @SafeVarargs
    private static <T> T firstNonNull(T... values) {
        for (T v : values) {
            if (v != null) {
                return v;
            }
        }
        return null;
    }

    /** Used by the call queue and the daily report. */
    public List<AttendanceRequest> openRequests() {
        return requests.findByStatusOrderByCreatedAtAsc(AttendanceRequestStatus.PENDING);
    }

    /** Used by tests and the seeder to look a day up without going through a controller. */
    public Optional<Attendance> find(Employment employment, LocalDate date) {
        return attendances.findByEmploymentAndWorkDate(employment, date);
    }
}
