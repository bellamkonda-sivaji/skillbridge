package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * One worker having opened one job's details. At most one row per (job, worker), so the
 * employer's "Views" counts people, not refreshes.
 */
@Entity
@Table(name = "job_views",
        uniqueConstraints = @UniqueConstraint(name = "uk_job_views_job_worker",
                columnNames = {"job_id", "worker_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "worker_id", nullable = false)
    private Long workerId;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime viewedAt = LocalDateTime.now();
}
