package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A worker login. Completely independent of {@link EmployerAccount}: the same human may hold
 * both, which is why phone uniqueness is per table rather than global.
 */
@Entity
@Table(name = "worker_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerAccount implements Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /** Optional - sign-up is mobile first. Unique when present (H2 allows many NULLs). */
    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    /** The primary identity: every worker signs up and logs in with a mobile number. */
    @Column(nullable = false, unique = true)
    private String phone;

    @Builder.Default
    @Column(nullable = false)
    private boolean phoneVerified = false;

    /** Holds a base64 data URL, so it needs CLOB rather than a capped varchar. */
    @Column(columnDefinition = "TEXT")
    private String photoUrl;

    @Builder.Default
    private String locale = "en";

    @Builder.Default
    @Column(nullable = false)
    private boolean enabled = true;

    @Builder.Default
    private double avgRating = 0.0;

    @Builder.Default
    private int ratingCount = 0;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToOne(mappedBy = "account", fetch = FetchType.LAZY)
    private WorkerProfile profile;

    @Override
    public AccountType accountType() {
        return AccountType.WORKER;
    }
}
