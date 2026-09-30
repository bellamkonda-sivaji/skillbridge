package com.skillbridge.model.money;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * The header of one balanced movement of money.
 *
 * Immutable once written. A correction is a new, reversing transaction - never an UPDATE -
 * so the books can always be replayed and never quietly rewritten.
 */
@Entity
@Table(name = "ledger_transactions", indexes = {
        @Index(name = "idx_ledger_txn_job", columnList = "job_id"),
        @Index(name = "idx_ledger_txn_created", columnList = "created_at")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LedgerTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human reference, e.g. "TXN-000123". Unique so it can be quoted in support. */
    @Column(name = "txn_reference", unique = true, length = 40)
    private String reference;

    /** ESCROW_FUNDED, FUNDS_RESERVED, EARNING_RELEASED, ESCROW_REFUNDED, PAYOUT_REQUESTED... */
    @Column(name = "txn_kind", nullable = false, length = 60)
    private String kind;

    @Column(name = "job_id")
    private Long jobId;

    @Column(name = "employment_id")
    private Long employmentId;

    @Column(length = 400)
    private String memo;

    /** WORKER / EMPLOYER / ADMIN / SYSTEM - who caused this. */
    @Column(name = "created_by_type", length = 20)
    private String createdByType;

    @Column(name = "created_by_id")
    private Long createdById;

    /**
     * The whole of the replay protection. A second post carrying a key we already hold
     * returns the original transaction instead of writing a second one.
     */
    @Column(name = "idempotency_key", unique = true, length = 160)
    private String idempotencyKey;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
