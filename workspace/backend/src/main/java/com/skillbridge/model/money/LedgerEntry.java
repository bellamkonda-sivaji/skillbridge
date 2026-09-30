package com.skillbridge.model.money;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** One immutable double-entry line. Always strictly positive; direction carries the sign. */
@Entity
@Table(name = "ledger_entries", indexes = {
        @Index(name = "idx_ledger_entry_txn", columnList = "transaction_id"),
        @Index(name = "idx_ledger_entry_account", columnList = "account_type,owner_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_id", nullable = false)
    private Long transactionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, length = 40)
    private LedgerAccountType accountType;

    /** Job id, worker id or employer id depending on the account type; null for platform accounts. */
    @Column(name = "owner_id")
    private Long ownerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_direction", nullable = false, length = 10)
    private LedgerDirection direction;

    /** Paise. Always > 0 - LedgerService skips zero-value legs rather than posting them. */
    @Column(name = "amount_minor", nullable = false)
    private long amountMinor;

    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
