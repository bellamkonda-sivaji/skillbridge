package com.skillbridge.dto.payment;

import com.skillbridge.model.money.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Every shape the money API answers with, in one file so the frontend has a single contract
 * to read. Every money field is a {@code long} of paise and ends in {@code Minor}; a plain
 * rupee mirror appears only where an existing screen needs one.
 */
public final class PaymentDtos {

    private PaymentDtos() {
    }

    /** The envelope every paged money endpoint returns - same shape as the back office uses. */
    public record PageDto<T>(List<T> content, int page, int size, long totalElements, int totalPages) {
        public static <T> PageDto<T> of(List<T> all, int page, int size) {
            int safeSize = size <= 0 ? 25 : size;
            int safePage = Math.max(page, 0);
            int total = all.size();
            int totalPages = (int) Math.ceil(total / (double) safeSize);
            int from = Math.min(safePage * safeSize, total);
            int to = Math.min(from + safeSize, total);
            return new PageDto<>(List.copyOf(all.subList(from, to)), safePage, safeSize, total, totalPages);
        }
    }

    public record EscrowDto(
            Long jobId,
            String jobTitle,
            String currency,
            long fundedMinor,
            long reservedMinor,
            long releasedMinor,
            long refundedMinor,
            long unreservedMinor,
            EscrowStatus status,
            String provider,
            String providerRef,
            LocalDateTime fundedAt,
            LocalDateTime updatedAt
    ) {
        public static EscrowDto from(JobEscrow e, String jobTitle) {
            return new EscrowDto(e.getJobId(), jobTitle, e.getCurrency(), e.getFundedMinor(),
                    e.getReservedMinor(), e.getReleasedMinor(), e.getRefundedMinor(),
                    e.unreservedMinor(), e.getStatus(), e.getProvider(), e.getProviderRef(),
                    e.getFundedAt(), e.getUpdatedAt());
        }
    }

    public record EarningDto(
            Long id, Long employmentId, Long jobId, String jobTitle, Long employerId, String employerName,
            String currency, long grossMinor, long feeMinor, long netMinor,
            EarningStatus status, LocalDateTime payableAt, LocalDateTime paidAt, LocalDateTime createdAt
    ) {
    }

    public record PayoutDto(
            Long id, Long workerId, Long destinationId, String destinationLabel,
            long amountMinor, String currency, PayoutStatus status, String provider,
            String providerPayoutId, String failureReason,
            LocalDateTime requestedAt, LocalDateTime processedAt
    ) {
    }

    public record PayoutDestinationDto(
            Long id, DestinationKind kind, String accountHolderName, String accountNumberLast4,
            String ifsc, String vpa, boolean verified, DestinationVerification verificationStatus,
            String verifiedName, String verificationNote, boolean isDefault, LocalDateTime createdAt
    ) {
        public static PayoutDestinationDto from(PayoutDestination d) {
            return new PayoutDestinationDto(d.getId(), d.getKind(), d.getAccountHolderName(),
                    d.getAccountNumberLast4(), d.getIfsc(), d.getVpa(), d.isVerified(),
                    d.getVerificationStatus(), d.getVerifiedName(), d.getVerificationNote(),
                    d.isDefault(), d.getCreatedAt());
        }
    }

    public record LedgerEntryDto(Long id, LedgerAccountType accountType, Long ownerId,
                                 LedgerDirection direction, long amountMinor, String currency) {
        public static LedgerEntryDto from(LedgerEntry e) {
            return new LedgerEntryDto(e.getId(), e.getAccountType(), e.getOwnerId(),
                    e.getDirection(), e.getAmountMinor(), e.getCurrency());
        }
    }

    public record LedgerTransactionDto(Long id, String reference, String kind, Long jobId,
                                       Long employmentId, String memo, String createdByType,
                                       Long createdById, String idempotencyKey, LocalDateTime createdAt,
                                       long amountMinor, List<LedgerEntryDto> entries) {
    }

    public record PaymentOrderDto(Long id, Long jobId, Long employerId, String provider,
                                  String providerOrderId, String providerPaymentId, long amountMinor,
                                  String currency, String receipt, String method,
                                  PaymentOrderStatus status, String failureReason,
                                  LocalDateTime createdAt, LocalDateTime paidAt) {
        public static PaymentOrderDto from(PaymentOrder o) {
            return new PaymentOrderDto(o.getId(), o.getJobId(), o.getEmployerId(), o.getProvider(),
                    o.getProviderOrderId(), o.getProviderPaymentId(), o.getAmountMinor(), o.getCurrency(),
                    o.getReceipt(), o.getMethod(), o.getStatus(), o.getFailureReason(),
                    o.getCreatedAt(), o.getPaidAt());
        }
    }

    public record WebhookEventDto(Long id, String provider, String eventId, String eventType,
                                  boolean signatureOk, LocalDateTime receivedAt,
                                  LocalDateTime processedAt, String processError) {
        public static WebhookEventDto from(WebhookEvent e) {
            return new WebhookEventDto(e.getId(), e.getProvider(), e.getEventId(), e.getEventType(),
                    e.isSignatureOk(), e.getReceivedAt(), e.getProcessedAt(), e.getProcessError());
        }
    }

    // ------------------------------------------------------------------ envelopes

    public record BillingDto(long walletBalanceMinor, long totalFundedMinor, long totalReservedMinor,
                             long totalReleasedMinor, long totalRefundedMinor, long platformFeesMinor,
                             List<EscrowDto> jobs) {
    }

    public record WorkerEarningsDto(long availableMinor, long pendingMinor, long lifetimeEarnedMinor,
                                    List<EarningDto> earnings, List<PayoutDto> payouts) {
    }

    public record EscrowTotalsDto(long funded, long reserved, long released, long refunded) {
    }

    public record FinanceSummaryDto(EscrowTotalsDto escrow, long platformRevenueMinor,
                                    long workerPayableMinor, long taxLiabilityMinor,
                                    long externalSettlementMinor, boolean unbalanced) {
    }

    public record OrderCreatedDto(Long orderId, String providerOrderId, long amountMinor,
                                  String currency, String keyId, String receipt) {
    }

    public record VerifyResultDto(boolean verified, PaymentOrderStatus status, String note) {
    }

    public record ReconcileResultDto(int checked, int updated, int abandoned, String skipped) {
    }

    // ------------------------------------------------------------------ requests

    public record AmountRequest(Long amountMinor) {
    }

    public record VerifyRequest(String providerOrderId, String providerPaymentId, String signature) {
    }

    public record DestinationRequest(String kind, String accountHolderName, String accountNumber,
                                     String ifsc, String vpa) {
    }

    public record PayoutRequest(Long amountMinor, Long destinationId) {
    }
}
