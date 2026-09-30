package com.skillbridge.model.money;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Money held against one job.
 *
 * Veyora enforces {@code reserved + released + refunded <= funded} with a Postgres CHECK
 * named funding_conservation. H2 CHECK constraints are awkward to carry through
 * {@code ddl-auto: update}, so the same invariant is asserted in EscrowService inside the
 * transaction, under the optimistic lock below. @Version is what makes two concurrent
 * reservations against the same job impossible to interleave.
 */
@Entity
@Table(name = "job_escrows", uniqueConstraints = @UniqueConstraint(columnNames = "job_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobEscrow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Builder.Default @Column(name = "funded_minor", nullable = false)   private long fundedMinor = 0;
    @Builder.Default @Column(name = "reserved_minor", nullable = false) private long reservedMinor = 0;
    @Builder.Default @Column(name = "released_minor", nullable = false) private long releasedMinor = 0;
    @Builder.Default @Column(name = "refunded_minor", nullable = false) private long refundedMinor = 0;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private EscrowStatus status = EscrowStatus.UNFUNDED;

    /** RAZORPAY, MANUAL, WALLET. How this job's money got here. */
    @Column(length = 30)
    private String provider;

    @Column(name = "provider_ref", length = 120)
    private String providerRef;

    @Column(name = "funded_at")
    private LocalDateTime fundedAt;

    @Builder.Default
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Version
    @Column(name = "row_version")
    private Long version;

    /** What is left to ring-fence. The figure every "not enough escrow" message quotes. */
    public long unreservedMinor() {
        return fundedMinor - reservedMinor - releasedMinor - refundedMinor;
    }
}
