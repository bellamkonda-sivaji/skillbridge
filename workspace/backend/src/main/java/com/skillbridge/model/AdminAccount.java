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

    @Override
    public AccountType accountType() {
        return AccountType.ADMIN;
    }
}
