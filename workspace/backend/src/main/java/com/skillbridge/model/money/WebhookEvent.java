package com.skillbridge.model.money;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * What the gateway told us, exactly once.
 *
 * The unique (provider, eventId) pair IS the idempotency: Razorpay retries, the second
 * delivery collides, the insert is refused and nothing downstream runs twice. The payload
 * is kept whole - when a payment is disputed months later the question is what the gateway
 * actually said, not what we recorded having understood.
 */
@Entity
@Table(name = "webhook_events",
        uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "event_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String provider = "RAZORPAY";

    @Column(name = "event_id", nullable = false, length = 160) private String eventId;
    @Column(name = "event_type", nullable = false, length = 80) private String eventType;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String payload;

    /**
     * Verified before anything is read out of the payload. A wrongly-signed delivery is
     * stored with FALSE and acted on by nothing: a webhook URL is public.
     */
    @Builder.Default
    @Column(name = "signature_ok", nullable = false)
    private boolean signatureOk = false;

    @Builder.Default @Column(name = "received_at", nullable = false) private LocalDateTime receivedAt = LocalDateTime.now();
    @Column(name = "processed_at") private LocalDateTime processedAt;
    @Column(name = "process_error", length = 500) private String processError;
}
