package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "interviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employer_account_id")
    private EmployerAccount employer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "worker_account_id")
    private WorkerAccount worker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private JobPost job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    /** How long the employer has blocked out for the slot. */
    @Builder.Default
    @Column(nullable = false)
    private int durationMinutes = 30;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewMode mode;

    private String location;

    private String notes;

    // ------------------------------------------------------------------ interview-detail fields

    /** Who the worker will actually meet, shown on the interview detail screen. */
    private String interviewerName;

    private String interviewerRole;

    private String interviewerPhone;

    @Column(length = 500)
    private String addressLine;

    private Double latitude;

    private Double longitude;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewStatus status = InterviewStatus.PENDING;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
