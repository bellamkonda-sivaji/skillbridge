package com.skillbridge.model.money;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Money leaving for a worker.
 *
 * Paying a worker twice is the most expensive bug available here, so the idempotency key is
 * UNIQUE in our own table as well as being sent to RazorpayX as X-Payout-Idempotency. Both
 * halves matter: ours stops a duplicate request ever reaching the gateway, theirs stops a
 * retry after a timeout creating a second transfer.
 */
@Entity
@Table(name = "payouts", indexes = @Index(name = "idx_payout_worker", columnList = "worker_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Payout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "worker_id", nullable = false)      private Long workerId;
    @Column(name = "destination_id")                   private Long destinationId;
    @Column(name = "amount_minor", nullable = false)   private long amountMinor;

    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "payout_status", nullable = false, length = 20)
    private PayoutStatus status = PayoutStatus.REQUESTED;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String provider = "RAZORPAYX";

    @Column(name = "provider_payout_id", length = 120) private String providerPayoutId;

    @Column(name = "idempotency_key", unique = true, nullable = false, length = 160)
    private String idempotencyKey;

    @Column(name = "failure_reason", length = 400) private String failureReason;

    @Builder.Default @Column(name = "requested_at", nullable = false) private LocalDateTime requestedAt = LocalDateTime.now();
    @Column(name = "processed_at") private LocalDateTime processedAt;
}
