package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "worker_account_id")
    private WorkerAccount worker;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id")
    private JobPost job;

    @Column(nullable = false)
    private double score;

    private double skillScore;

    private double distanceKm;

    private double experienceScore;

    private double availabilityScore;

    private double salaryScore;

    private double ratingScore;

    private boolean notified;

    private boolean viewed;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
