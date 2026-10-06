package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * One recorded outreach against an application - the "contacted or not" the back office runs on.
 * Ids are stored flat rather than as associations because a log row must survive whatever it
 * points at and is only ever read by the admin screens.
 */
@Entity
@Table(name = "contact_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_id")
    private Long applicationId;

    @Column(name = "job_id")
    private Long jobId;

    @Column(name = "worker_id")
    private Long workerId;

    @Column(name = "employer_id")
    private Long employerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContactChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContactOutcome outcome;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "contacted_by_admin_id")
    private Long contactedByAdminId;

    @Column(name = "contacted_by_name")
    private String contactedByName;

    @Builder.Default
    @Column(name = "contacted_at", nullable = false)
    private LocalDateTime contactedAt = LocalDateTime.now();

    /**
     * When the back office promised to ring back. Set when the outcome is CALLBACK_REQUESTED,
     * which is what puts the row into the call queue as CALLBACK_DUE once it falls due.
     */
    @Column(name = "next_call_at")
    private LocalDateTime nextCallAt;
}
