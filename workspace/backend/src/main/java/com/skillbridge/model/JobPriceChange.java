package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * One row per time a job's price moved. Kept because the admin desk needs to see whether an
 * employer already acted on our advice before ringing them again, and because a worker who
 * applied at the old price is entitled to an accurate record of what changed.
 */
@Entity
@Table(name = "job_price_changes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobPriceChange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "old_salary")
    private double oldSalary;

    @Column(name = "new_salary")
    private double newSalary;

    @Enumerated(EnumType.STRING)
    @Column(name = "salary_unit")
    private SalaryUnit salaryUnit;

    @Column(name = "old_worker_salary")
    private double oldWorkerSalary;

    @Column(name = "new_worker_salary")
    private double newWorkerSalary;

    /** The price we had advised at the time, if the change followed a nudge from us. */
    @Column(name = "suggested_salary")
    private Double suggestedSalary;

    /** Free text from the employer, or the reason we recorded on their behalf. */
    @Column(length = 500)
    private String reason;

    /** EMPLOYER or ADMIN - who moved it. */
    @Column(name = "changed_by", length = 40)
    private String changedBy;

    @Column(name = "changed_by_id")
    private Long changedById;

    /** How many workers had applied when the price moved, for measuring whether it worked. */
    @Column(name = "applicants_at_change")
    private int applicantsAtChange;

    @Builder.Default
    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt = LocalDateTime.now();
}
