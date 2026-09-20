package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Polymorphic owner - notifications go to workers, employers and admins alike. */
    @Enumerated(EnumType.STRING)
    @Column(name = "owner_type", nullable = false)
    private AccountType ownerType;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    private String title;

    @Column(length = 1000)
    private String body;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    private String link;

    private boolean read;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
