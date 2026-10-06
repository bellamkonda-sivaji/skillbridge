package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** One day of attendance against an {@link Employment}. At most one row per employment per date. */
@Entity
@Table(name = "attendance_records",
        uniqueConstraints = @UniqueConstraint(name = "uk_attendance_employment_date",
                columnNames = {"employment_id", "work_date"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employment_id", nullable = false)
    private Employment employment;

    /** Named work_date because "day" and "date" are reserved words on H2. */
    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    private LocalDateTime checkInAt;

    private LocalDateTime checkOutAt;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceStatus status = AttendanceStatus.NOT_CHECKED_IN;

    private Integer minutesWorked;

    private String note;

    // ------------------------------------------------------------------ approval

    /**
     * Whether this day counts towards pay. Set on punch-out from the job's duration
     * (see {@code AttendanceRules.needsEmployerApproval}), and only ever moved afterwards by an
     * employer decision, an admin override, or an approved "something is wrong" request.
     */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    private AttendanceApproval approvalStatus = AttendanceApproval.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "approved_by_type", length = 20)
    private AttendanceActor approvedByType;

    @Column(name = "approved_by_id")
    private Long approvedById;

    @Column(name = "approved_by_name")
    private String approvedByName;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    /** Why it was approved or rejected, in the decider's own words. */
    @Lob
    @Column(name = "decision_note", columnDefinition = "TEXT")
    private String decisionNote;

    /** True once the back office has touched the row, so both sides can see it was corrected. */
    @Builder.Default
    @Column(name = "edited_by_admin", nullable = false)
    private boolean editedByAdmin = false;
}
