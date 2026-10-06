package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * One request for help, from a worker or an employer.
 *
 * The person who raises it may not read well, may be on a borrowed phone, and
 * may be worried about money. So the ticket keeps their phone number next to
 * the text: for most of these, the fastest resolution is someone ringing them
 * back, not a written reply they then have to read.
 */
@Entity
@Table(name = "support_tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Which namespace the raiser belongs to. Ids are only unique within one. */
    @Enumerated(EnumType.STRING)
    @Column(name = "raiser_type", nullable = false)
    private AccountType raiserType;

    @Column(name = "raiser_id", nullable = false)
    private Long raiserId;

    /** Copied at creation so the inbox needs no join, and survives a rename. */
    @Column(name = "raiser_name")
    private String raiserName;

    @Column(name = "raiser_phone")
    private String raiserPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SupportTopic topic;

    @Column(nullable = false, length = 2000)
    private String message;

    /** The language they were using, so whoever calls back opens in the right one. */
    @Column(name = "language_code", length = 8)
    private String languageCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SupportTicketStatus status;

    /** True when they asked to be phoned rather than written to. */
    @Column(name = "call_back")
    private boolean callBack;

    @Column(name = "assigned_admin_id")
    private Long assignedAdminId;

    @Column(name = "assigned_admin_name")
    private String assignedAdminName;

    /** What the ticket is about, when it came from a specific job or offer. */
    @Column(name = "about_type")
    private String aboutType;

    @Column(name = "about_id")
    private Long aboutId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<SupportMessage> messages = new ArrayList<>();
}
