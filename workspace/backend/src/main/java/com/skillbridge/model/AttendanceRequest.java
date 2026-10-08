package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * "Something is wrong with my attendance."
 *
 * <p>One flat row, denormalised on purpose. The same row is the employer's inbox item and the
 * admin's queue item - there is no second table and no copy, so an answer given on either side is
 * the answer everybody sees. Ids are plain columns rather than associations because a request may
 * be raised for a day that has no attendance row at all, which is the commonest case of all: the
 * worker came, nobody tapped anything, and the day simply is not there.
 */
@Entity
@Table(name = "attendance_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employment_id", nullable = false)
    private Long employmentId;

    /** Null when the day was never marked. Filled in once approval creates the row. */
    @Column(name = "attendance_id")
    private Long attendanceId;

    @Column(name = "worker_id", nullable = false)
    private Long workerId;

    @Column(name = "worker_name")
    private String workerName;

    @Column(name = "employer_id", nullable = false)
    private Long employerId;

    @Column(name = "business_name")
    private String businessName;

    @Column(name = "job_id")
    private Long jobId;

    @Column(name = "job_title")
    private String jobTitle;

    /** work_date, never "date": "date" is reserved on H2. */
    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 30)
    private AttendanceRequestType type;

    @Column(name = "requested_check_in")
    private LocalTime requestedCheckIn;

    @Column(name = "requested_check_out")
    private LocalTime requestedCheckOut;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "request_status", nullable = false, length = 20)
    private AttendanceRequestStatus status = AttendanceRequestStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "decided_by_type", length = 20)
    private AttendanceActor decidedByType;

    @Column(name = "decided_by_id")
    private Long decidedById;

    @Column(name = "decided_by_name")
    private String decidedByName;

    @Column(name = "decision_note", columnDefinition = "TEXT")
    private String decisionNote;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;
}
