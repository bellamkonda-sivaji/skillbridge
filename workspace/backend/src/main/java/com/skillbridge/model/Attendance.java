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
}
