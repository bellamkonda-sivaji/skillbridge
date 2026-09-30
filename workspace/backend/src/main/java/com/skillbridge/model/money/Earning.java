package com.skillbridge.model.money;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * What one worker earned from one engagement.
 *
 * Unique on employmentId, and that uniqueness is the double-release guard: reserve writes
 * the ACCRUED row, release finds it and moves it to PAYABLE, and a second release finds it
 * already PAYABLE and does nothing.
 */
@Entity
@Table(name = "earnings", uniqueConstraints = @UniqueConstraint(columnNames = "employment_id"),
        indexes = @Index(name = "idx_earning_worker", columnList = "worker_id,earning_status"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Earning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employment_id", nullable = false)
    private Long employmentId;

    @Column(name = "worker_id", nullable = false)   private Long workerId;
    @Column(name = "job_id", nullable = false)      private Long jobId;
    @Column(name = "employer_id", nullable = false) private Long employerId;

    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "INR";

    /** gross = net + fee. The employer pays the fee on top of the agreed wage, exactly as
     *  ScheduleCalculator already quotes it in the posting wizard. */
    @Column(name = "gross_minor", nullable = false) private long grossMinor;
    @Column(name = "fee_minor", nullable = false)   private long feeMinor;
    @Column(name = "net_minor", nullable = false)   private long netMinor;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "earning_status", nullable = false, length = 20)
    private EarningStatus status = EarningStatus.ACCRUED;

    @Column(name = "payable_at") private LocalDateTime payableAt;
    @Column(name = "paid_at")    private LocalDateTime paidAt;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
