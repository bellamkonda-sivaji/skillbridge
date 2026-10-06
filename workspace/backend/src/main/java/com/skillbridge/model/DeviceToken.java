package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * One phone we can reach.
 *
 * The token is the primary business key, not the account: a shared or resold
 * handset can hand the same token to a different person, and whoever logged in
 * last is the one who should get the notifications. So registering a token that
 * already exists moves it rather than duplicating it.
 */
@Entity
@Table(name = "device_tokens",
        uniqueConstraints = @UniqueConstraint(columnNames = "token"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The FCM registration token for this install. */
    @Column(nullable = false, length = 512)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(name = "owner_type", nullable = false)
    private AccountType ownerType;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(length = 16)
    private String platform;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /** Bumped on every launch, so dead installs can be swept up later. */
    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;
}
