package com.skillbridge.model.money;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Where a worker's money goes.
 *
 * Only the last four digits of an account number are stored. The full number is needed once,
 * to register the fund account with the gateway, and keeping it afterwards buys nothing
 * except a breach to disclose. The last four is what the worker needs to recognise their own
 * account on screen.
 */
@Entity
@Table(name = "payout_destinations", indexes = @Index(name = "idx_dest_worker", columnList = "worker_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PayoutDestination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "worker_id", nullable = false) private Long workerId;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "dest_kind", nullable = false, length = 10)
    private DestinationKind kind = DestinationKind.BANK;

    @Column(name = "account_holder_name", length = 160) private String accountHolderName;
    @Column(name = "account_number_last4", length = 4)  private String accountNumberLast4;
    @Column(length = 15) private String ifsc;
    @Column(length = 120) private String vpa;

    @Column(name = "provider_contact_id", length = 120)      private String providerContactId;
    @Column(name = "provider_fund_account_id", length = 120) private String providerFundAccountId;

    @Builder.Default @Column(nullable = false) private boolean verified = false;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 24)
    private DestinationVerification verificationStatus = DestinationVerification.UNVERIFIED;

    /** The name the bank holds, as the penny-drop reported it. Stored so it can be shown. */
    @Column(name = "verified_name", length = 160) private String verifiedName;
    @Column(name = "verification_note", length = 400) private String verificationNote;

    @Builder.Default @Column(name = "is_default", nullable = false) private boolean isDefault = false;
    @Builder.Default @Column(name = "created_at", nullable = false) private LocalDateTime createdAt = LocalDateTime.now();
}
