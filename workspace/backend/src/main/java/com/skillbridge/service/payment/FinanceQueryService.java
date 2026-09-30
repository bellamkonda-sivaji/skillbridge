package com.skillbridge.service.payment;

import com.skillbridge.dto.payment.PaymentDtos.*;
import com.skillbridge.model.JobPost;
import com.skillbridge.model.money.*;
import com.skillbridge.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/** Everything the finance screens read. Reads only - nothing here writes an entry. */
@Service
public class FinanceQueryService {

    private final LedgerService ledger;
    private final LedgerTransactionRepository transactions;
    private final JobEscrowRepository escrows;
    private final PayoutRepository payouts;
    private final PaymentOrderRepository orders;
    private final WebhookEventRepository webhooks;
    private final EarningRepository earnings;
    private final JobPostRepository jobs;
    private final EmploymentRepository employments;
    private final PayoutService payoutService;

    public FinanceQueryService(LedgerService ledger, LedgerTransactionRepository transactions,
                               JobEscrowRepository escrows, PayoutRepository payouts,
                               PaymentOrderRepository orders, WebhookEventRepository webhooks,
                               EarningRepository earnings, JobPostRepository jobs,
                               EmploymentRepository employments, PayoutService payoutService) {
        this.ledger = ledger;
        this.transactions = transactions;
        this.escrows = escrows;
        this.payouts = payouts;
        this.orders = orders;
        this.webhooks = webhooks;
        this.earnings = earnings;
        this.jobs = jobs;
        this.employments = employments;
        this.payoutService = payoutService;
    }

    public String jobTitle(Long jobId) {
        return jobId == null ? null : jobs.findById(jobId).map(JobPost::getTitle).orElse(null);
    }

    /**
     * The whole chart of accounts.
     *
     * {@code unbalanced} is the honest self-check: because every transaction balances, the
     * signed sum across every account type must be exactly zero. If it is not, something
     * wrote entries without going through LedgerService, and an operator needs to know that
     * before they trust any other number on the page.
     */
    public FinanceSummaryDto summary() {
        return new FinanceSummaryDto(
                new EscrowTotalsDto(nz(escrows.totalFunded()), nz(escrows.totalReserved()),
                        nz(escrows.totalReleased()), nz(escrows.totalRefunded())),
                ledger.totalMinor(LedgerAccountType.PLATFORM_REVENUE),
                ledger.totalMinor(LedgerAccountType.WORKER_PAYABLE),
                ledger.totalMinor(LedgerAccountType.TAX_LIABILITY),
                ledger.totalMinor(LedgerAccountType.EXTERNAL_SETTLEMENT),
                ledger.grandTotalMinor() != 0);
    }

    public PageDto<LedgerTransactionDto> ledgerPage(String accountType, Long ownerId, String kind,
                                                    LocalDate from, LocalDate to, String q,
                                                    int page, int size) {
        List<LedgerTransaction> all = transactions.findAllByOrderByIdDesc();
        Map<Long, List<LedgerEntry>> byTxn = ledger.entriesOf(all.stream()
                        .map(LedgerTransaction::getId).toList()).stream()
                .collect(Collectors.groupingBy(LedgerEntry::getTransactionId));

        LedgerAccountType type = parse(accountType);
        String needle = q == null || q.isBlank() ? null : q.toLowerCase(Locale.ENGLISH);

        List<LedgerTransactionDto> rows = all.stream()
                .filter(t -> kind == null || kind.isBlank() || kind.equalsIgnoreCase(t.getKind()))
                .filter(t -> from == null || !t.getCreatedAt().toLocalDate().isBefore(from))
                .filter(t -> to == null || !t.getCreatedAt().toLocalDate().isAfter(to))
                .filter(t -> needle == null
                        || (t.getReference() != null && t.getReference().toLowerCase(Locale.ENGLISH).contains(needle))
                        || (t.getMemo() != null && t.getMemo().toLowerCase(Locale.ENGLISH).contains(needle))
                        || t.getKind().toLowerCase(Locale.ENGLISH).contains(needle))
                .filter(t -> {
                    if (type == null && ownerId == null) {
                        return true;
                    }
                    List<LedgerEntry> es = byTxn.getOrDefault(t.getId(), List.of());
                    return es.stream().anyMatch(e -> (type == null || e.getAccountType() == type)
                            && (ownerId == null || ownerId.equals(e.getOwnerId())));
                })
                .map(t -> {
                    List<LedgerEntry> es = byTxn.getOrDefault(t.getId(), List.of());
                    long amount = es.stream().filter(e -> e.getDirection() == LedgerDirection.DEBIT)
                            .mapToLong(LedgerEntry::getAmountMinor).sum();
                    return new LedgerTransactionDto(t.getId(), t.getReference(), t.getKind(),
                            t.getJobId(), t.getEmploymentId(), t.getMemo(), t.getCreatedByType(),
                            t.getCreatedById(), t.getIdempotencyKey(), t.getCreatedAt(), amount,
                            es.stream().map(LedgerEntryDto::from).toList());
                })
                .toList();
        return PageDto.of(rows, page, size);
    }

    private static LedgerAccountType parse(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return LedgerAccountType.valueOf(s.trim().toUpperCase(Locale.ENGLISH));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public PageDto<EscrowDto> escrowPage(String status, String q, int page, int size) {
        String needle = q == null || q.isBlank() ? null : q.toLowerCase(Locale.ENGLISH);
        List<EscrowDto> rows = escrows.findAllByOrderByIdDesc().stream()
                .filter(e -> status == null || status.isBlank() || e.getStatus().name().equalsIgnoreCase(status))
                .map(e -> EscrowDto.from(e, jobTitle(e.getJobId())))
                .filter(d -> needle == null
                        || (d.jobTitle() != null && d.jobTitle().toLowerCase(Locale.ENGLISH).contains(needle))
                        || String.valueOf(d.jobId()).contains(needle))
                .toList();
        return PageDto.of(rows, page, size);
    }

    public PageDto<PayoutDto> payoutPage(String status, String q, int page, int size) {
        String needle = q == null || q.isBlank() ? null : q.toLowerCase(Locale.ENGLISH);
        List<PayoutDto> rows = payouts.findAllByOrderByIdDesc().stream()
                .filter(p -> status == null || status.isBlank() || p.getStatus().name().equalsIgnoreCase(status))
                .map(payoutService::toDto)
                .filter(d -> needle == null
                        || (d.destinationLabel() != null
                            && d.destinationLabel().toLowerCase(Locale.ENGLISH).contains(needle))
                        || String.valueOf(d.workerId()).contains(needle))
                .toList();
        return PageDto.of(rows, page, size);
    }

    public PageDto<PaymentOrderDto> orderPage(String status, int page, int size) {
        List<PaymentOrderDto> rows = orders.findAllByOrderByIdDesc().stream()
                .filter(o -> status == null || status.isBlank() || o.getStatus().name().equalsIgnoreCase(status))
                .map(PaymentOrderDto::from).toList();
        return PageDto.of(rows, page, size);
    }

    public PageDto<WebhookEventDto> webhookPage(int page, int size) {
        return PageDto.of(webhooks.findAllByOrderByIdDesc().stream()
                .map(WebhookEventDto::from).toList(), page, size);
    }

    // ------------------------------------------------------------------ earnings

    public EarningDto toDto(Earning e) {
        return new EarningDto(e.getId(), e.getEmploymentId(), e.getJobId(), jobTitle(e.getJobId()),
                e.getEmployerId(), employerName(e), e.getCurrency(), e.getGrossMinor(), e.getFeeMinor(),
                e.getNetMinor(), e.getStatus(), e.getPayableAt(), e.getPaidAt(), e.getCreatedAt());
    }

    private String employerName(Earning e) {
        return employments.findById(e.getEmploymentId())
                .map(emp -> emp.getEmployer().getName()).orElse(null);
    }

    public List<EarningDto> earningsOf(Long workerId) {
        return earnings.findByWorkerIdOrderByIdDesc(workerId).stream().map(this::toDto).toList();
    }

    public List<Earning> rawEarningsOfJob(Long jobId) {
        return earnings.findByJobId(jobId);
    }

    public LocalDateTime now() {
        return LocalDateTime.now();
    }

    private static long nz(Long v) { return v == null ? 0L : v; }
}
