package com.skillbridge.config;

import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Attendance for the demo.
 *
 * Runs after the call-queue seeder so the employments it needs already exist.
 * The shape it creates matters more than the volume: one short job whose days
 * are waiting on the shop owner, one long job whose days count automatically,
 * and a handful of corrections in every state — including one a worker raised
 * for a day that was never marked at all, which is the case the whole
 * regularisation flow exists for.
 */
@Component
@Order(4)
public class AttendanceSeeder implements CommandLineRunner {

    private final EmploymentRepository employments;
    private final AttendanceRepository attendances;
    private final AttendanceRequestRepository requests;

    public AttendanceSeeder(EmploymentRepository employments, AttendanceRepository attendances,
                            AttendanceRequestRepository requests) {
        this.employments = employments;
        this.attendances = attendances;
        this.requests = requests;
    }

    /** Transactional so the lazy job/worker/employer associations can be read. */
    @Override
    @Transactional
    public void run(String... args) {
        // Earlier seeders already write a few attendance rows, so the guard is on
        // the corrections — those are ours alone and are what says we have run.
        if (requests.count() > 0) return;

        List<Employment> all = employments.findAll();
        if (all.isEmpty()) return;

        LocalDate today = LocalDate.now();

        for (Employment e : all) {
            // A hire nobody has started cannot have attendance, so put the demo
            // employments into the state where the punch button appears.
            if (e.getStatus() == EmploymentStatus.OFFER_ACCEPTED
                    || e.getStatus() == EmploymentStatus.JOINING_CONFIRMED) {
                e.setStatus(EmploymentStatus.ACTIVE);
                if (e.getJoiningDate() == null || e.getJoiningDate().isAfter(today)) {
                    e.setJoiningDate(today.minusDays(6));
                }
                if (e.getStartedAt() == null) e.setStartedAt(today.minusDays(6).atTime(9, 0));
                employments.save(e);
            }
        }

        List<Employment> active = employments.findAll().stream()
                .filter(e -> e.getStatus() == EmploymentStatus.ACTIVE)
                .toList();
        if (active.isEmpty()) return;

        for (Employment e : active) {
            EngagementModel model = e.getJob() == null ? null : e.getJob().getEngagementModel();
            boolean needsApproval = model == EngagementModel.ONE_DAY || model == EngagementModel.FEW_DAYS;

            // Six days behind us, leaving today free so the punch button is live.
            for (int back = 6; back >= 1; back--) {
                LocalDate d = today.minusDays(back);
                if (d.getDayOfWeek().getValue() == 7) continue;          // no Sunday
                if (attendances.findByEmploymentAndWorkDate(e, d).isPresent()) continue;

                // One day left unmarked on purpose: that is the day the worker
                // raises a MISSED_DAY correction for.
                if (back == 3) continue;

                LocalDateTime in = d.atTime(9, back % 2 == 0 ? 2 : 11);
                LocalDateTime out = d.atTime(18, back % 2 == 0 ? 5 : 0);
                int minutes = (int) java.time.Duration.between(in, out).toMinutes() - 60;

                Attendance a = Attendance.builder()
                        .employment(e)
                        .workDate(d)
                        .checkInAt(in)
                        .checkOutAt(out)
                        .status(AttendanceStatus.CHECKED_OUT)
                        .minutesWorked(minutes)
                        .build();

                if (needsApproval) {
                    // The two most recent still need the shop owner to confirm.
                    if (back <= 2) {
                        a.setApprovalStatus(AttendanceApproval.PENDING);
                    } else {
                        a.setApprovalStatus(AttendanceApproval.APPROVED);
                        a.setApprovedByType(AttendanceActor.EMPLOYER);
                        a.setApprovedById(e.getEmployer().getId());
                        a.setApprovedByName(e.getEmployer().getName());
                        a.setApprovedAt(out.plusHours(2));
                    }
                } else {
                    a.setApprovalStatus(AttendanceApproval.AUTO_APPROVED);
                    a.setApprovedByType(AttendanceActor.SYSTEM);
                    a.setApprovedByName("JobOn");
                    a.setApprovedAt(out);
                }
                attendances.save(a);
            }
        }

        seedRequests(active, today);
    }

    /** Corrections across the types, so every state is visible on all three screens. */
    private void seedRequests(List<Employment> active, LocalDate today) {
        Employment first = active.get(0);
        Employment second = active.size() > 1 ? active.get(1) : first;

        // Waiting on the employer — the day was never marked at all.
        requests.save(request(first, today.minusDays(3), AttendanceRequestType.MISSED_DAY,
                LocalTime.of(9, 0), LocalTime.of(18, 0),
                "I worked the whole day but it is not showing",
                AttendanceRequestStatus.PENDING, null, null));

        // Waiting on the employer — forgot to tap at the end.
        requests.save(request(second, today.minusDays(2), AttendanceRequestType.FORGOT_PUNCH_OUT,
                null, LocalTime.of(18, 30),
                "Phone battery died before I could tap",
                AttendanceRequestStatus.PENDING, null, null));

        // Already settled by the shop owner.
        requests.save(request(first, today.minusDays(5), AttendanceRequestType.WRONG_TIME,
                LocalTime.of(8, 30), LocalTime.of(18, 0),
                "I started at 8:30, not 9",
                AttendanceRequestStatus.APPROVED, AttendanceActor.EMPLOYER, first.getEmployer().getName()));

        // Settled by SkillBridge when the shop owner did not answer.
        requests.save(request(second, today.minusDays(6), AttendanceRequestType.FORGOT_PUNCH_IN,
                LocalTime.of(9, 0), null,
                "I forgot to tap in the morning",
                AttendanceRequestStatus.APPROVED, AttendanceActor.ADMIN, "Operations Admin"));
    }

    private AttendanceRequest request(Employment e, LocalDate date, AttendanceRequestType type,
                                      LocalTime in, LocalTime out, String reason,
                                      AttendanceRequestStatus status,
                                      AttendanceActor actor, String actorName) {
        AttendanceRequest r = AttendanceRequest.builder()
                .employmentId(e.getId())
                .workerId(e.getWorker().getId())
                .workerName(e.getWorker().getName())
                .employerId(e.getEmployer().getId())
                .businessName(e.getEmployer().getName())
                .jobId(e.getJob() == null ? null : e.getJob().getId())
                .jobTitle(e.getJob() == null ? null : e.getJob().getTitle())
                .workDate(date)
                .type(type)
                .requestedCheckIn(in)
                .requestedCheckOut(out)
                .reason(reason)
                .status(status)
                .createdAt(date.atTime(19, 30))
                .build();
        if (actor != null) {
            r.setDecidedByType(actor);
            r.setDecidedByName(actorName);
            r.setDecidedAt(date.atTime(21, 0));
            r.setDecisionNote(actor == AttendanceActor.ADMIN
                    ? "Rang the shop, they confirmed he was there"
                    : "Agreed");
        }
        attendances.findByEmploymentAndWorkDate(e, date).ifPresent(a -> r.setAttendanceId(a.getId()));
        return r;
    }
}
