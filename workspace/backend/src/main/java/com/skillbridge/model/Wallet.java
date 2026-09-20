package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "wallets", uniqueConstraints = @UniqueConstraint(columnNames = {"owner_type", "owner_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Polymorphic owner - one wallet per account, whichever namespace it lives in. */
    @Enumerated(EnumType.STRING)
    @Column(name = "owner_type", nullable = false)
    private AccountType ownerType;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    private double balance;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
