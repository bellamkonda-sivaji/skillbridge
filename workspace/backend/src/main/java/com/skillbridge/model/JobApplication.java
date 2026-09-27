package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_applications",
        uniqueConstraints = @UniqueConstraint(columnNames = {"worker_account_id", "job_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "worker_account_id")
    private WorkerAccount worker;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id")
    private JobPost job;

    private String coverMessage;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime appliedAt = LocalDateTime.now();

    /** Stage timestamps that drive the worker-facing timeline. */
    private LocalDateTime viewedAt;

    private LocalDateTime shortlistedAt;

    private LocalDateTime interviewAt;

    /** Set when the application reaches a final decision (accepted / rejected / withdrawn). */
    private LocalDateTime decisionAt;

    /** Latch that guarantees the wallet transfer happens exactly once per application. */
    @Builder.Default
    @Column(nullable = false)
    private boolean paymentSettled = false;

    // ------------------------------------------------------------------ interview outcome

    /** What the employer recorded after the interview. null until a result is entered. */
    @Enumerated(EnumType.STRING)
    @Column(name = "interview_result")
    private InterviewResult interviewResult;

    @Column(name = "interview_feedback", length = 2000)
    private String interviewFeedback;

    private java.time.LocalDateTime interviewResultAt;

}
