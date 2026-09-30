package com.skillbridge.model.money;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * What we asked for, written down BEFORE the employer is sent anywhere.
 *
 * Without a row created here, a payment that succeeds while the browser dies is money we
 * took and cannot account for. Reconciliation has nothing to match the gateway's answer to.
 */
@Entity
@Table(name = "payment_orders", indexes = {
        @Index(name = "idx_order_job", columnList = "job_id"),
        @Index(name = "idx_order_status", columnList = "order_status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false)      private Long jobId;
    @Column(name = "employer_id", nullable = false) private Long employerId;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String provider = "RAZORPAY";

    /** The gateway's own order id. Unique, so a retry of our create cannot make two rows. */
    @Column(name = "provider_order_id", unique = true, length = 120)
    private String providerOrderId;

    @Column(name = "provider_payment_id", length = 120)
    private String providerPaymentId;

    @Column(name = "amount_minor", nullable = false) private long amountMinor;

    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "INR";

    /** Our own id, echoed back on every webhook. */
    @Column(length = 80) private String receipt;

    /** The rail the money came down - card, upi, netbanking. Reported by the gateway, never chosen. */
    @Column(name = "pay_method", length = 40) private String method;

    @Column(name = "failure_reason", length = 400) private String failureReason;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false, length = 20)
    private PaymentOrderStatus status = PaymentOrderStatus.CREATED;

    @Builder.Default @Column(name = "created_at", nullable = false) private LocalDateTime createdAt = LocalDateTime.now();
    @Builder.Default @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt = LocalDateTime.now();
    @Column(name = "paid_at") private LocalDateTime paidAt;
}
