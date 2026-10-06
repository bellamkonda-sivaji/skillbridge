package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** One turn in a help conversation, from either side. */
@Entity
@Table(name = "support_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id")
    private SupportTicket ticket;

    /** WORKER or EMPLOYER means the person; ADMIN means the support team. */
    @Enumerated(EnumType.STRING)
    @Column(name = "author_type", nullable = false)
    private AccountType authorType;

    @Column(name = "author_id")
    private Long authorId;

    @Column(name = "author_name")
    private String authorName;

    @Column(nullable = false, length = 2000)
    private String body;

    /** Set when the team logged a phone call rather than typing a reply. */
    @Column(name = "phone_call")
    private boolean phoneCall;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
