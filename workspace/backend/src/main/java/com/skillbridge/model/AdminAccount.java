package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** A back-office login. Admins never self-register - they are seeded. */
@Entity
@Table(name = "admin_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAccount implements Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /** Admins are identified by email first, but may also sign in with the phone. */
    @Column(nullable = false, unique = true)
    private String email;

    @Column(unique = true)
    private String phone;

    @Column(nullable = false)
    private String password;

    @Builder.Default
    @Column(nullable = false)
    private boolean enabled = true;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /** Which back-office role this login carries. "role" is reserved on H2. */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "admin_role", nullable = false)
    private AdminRole adminRole = AdminRole.ADMIN;

    /** The SUPER_ADMIN who created this login. null for the bootstrap / seeded accounts. */
    @Column(name = "created_by_id")
    private Long createdById;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Override
    public AccountType accountType() {
        return AccountType.ADMIN;
    }
}
