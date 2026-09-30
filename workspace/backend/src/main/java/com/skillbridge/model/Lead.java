package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Somebody who arrived without an app - a missed call, a WhatsApp message, a walk-in at the
 * office. Most of our workers start here, so the only field that must be present is the phone
 * number: a bare missed call is a valid lead.
 *
 * <p>The account links are flat ids rather than associations, like {@link ContactLog}, because a
 * lead must survive whatever it eventually points at.
 */
@Entity
@Table(name = "leads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "lead_source", nullable = false)
    private LeadSource source;

    @Column(nullable = false)
    private String phone;

    private String name;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String message;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeadIntent intent = LeadIntent.UNKNOWN;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "lead_status", nullable = false)
    private LeadStatus status = LeadStatus.NEW;

    @Column(name = "worker_id")
    private Long workerId;

    @Column(name = "employer_id")
    private Long employerId;

    @Column(name = "assigned_admin_id")
    private Long assignedAdminId;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String note;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
