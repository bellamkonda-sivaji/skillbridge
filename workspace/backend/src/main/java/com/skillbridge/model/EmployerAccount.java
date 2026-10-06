package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** An employer login. Same columns as {@link WorkerAccount}, separate table and separate uniqueness. */
@Entity
@Table(name = "employer_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployerAccount implements Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String phone;

    @Builder.Default
    @Column(nullable = false)
    private boolean phoneVerified = false;

    @Lob
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
    private EmployerProfile profile;

    @Override
    public AccountType accountType() {
        return AccountType.EMPLOYER;
    }
}
