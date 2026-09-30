package com.skillbridge.controller;

import com.skillbridge.dto.payment.PaymentDtos.*;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.EmployerAccount;
import com.skillbridge.model.JobPost;
import com.skillbridge.model.money.JobEscrow;
import com.skillbridge.model.money.LedgerAccountType;
import com.skillbridge.repository.JobEscrowRepository;
import com.skillbridge.repository.JobPostRepository;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.WalletService;
import com.skillbridge.service.payment.EscrowService;
import com.skillbridge.service.payment.RazorpayPaymentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * The employer's side of the money.
 *
 * Note what is NOT here: nothing an employer's browser can call marks a job funded with real
 * money. /order writes down what we asked for, /verify checks the redirect handshake and says
 * we are waiting. Only the signed webhook (or reconciliation asking the gateway directly)
 * funds - except the explicitly-named manual path, which is an operator action, not a
 * browser's claim about a payment.
 */
@RestController
@RequestMapping("/api/employer")
public class EmployerEscrowController {

    private final EscrowService escrow;
    private final RazorpayPaymentService payments;
    private final JobPostRepository jobs;
    private final JobEscrowRepository escrows;
    private final WalletService wallets;

    public EmployerEscrowController(EscrowService escrow, RazorpayPaymentService payments,
                                    JobPostRepository jobs, JobEscrowRepository escrows,
                                    WalletService wallets) {
        this.escrow = escrow;
        this.payments = payments;
        this.jobs = jobs;
        this.escrows = escrows;
        this.wallets = wallets;
    }

    private JobPost ownedJob(Long jobId) {
        EmployerAccount me = AuthenticationUtils.currentEmployer();
        JobPost job = jobs.findById(jobId).orElseThrow(() -> ApiException.notFound("Job not found"));
        if (!job.getEmployer().getId().equals(me.getId())) {
            throw ApiException.forbidden("This is not your job");
        }
        return job;
    }

    @GetMapping("/jobs/{id}/escrow")
    public EscrowDto escrow(@PathVariable Long id) {
        JobPost job = ownedJob(id);
        return EscrowDto.from(escrow.escrowOrEmpty(id), job.getTitle());
    }

    @PostMapping("/jobs/{id}/escrow/order")
    public OrderCreatedDto order(@PathVariable Long id, @RequestBody AmountRequest body) {
        JobPost job = ownedJob(id);
        return payments.createOrder(job.getId(), job.getEmployer().getId(),
                body.amountMinor() == null ? 0 : body.amountMinor());
    }

    @PostMapping("/jobs/{id}/escrow/verify")
    public VerifyResultDto verify(@PathVariable Long id, @RequestBody VerifyRequest body) {
        ownedJob(id);
        return payments.verify(id, body.providerOrderId(), body.providerPaymentId(), body.signature());
    }

    /**
     * The demonstrable path when there are no live gateway keys.
     *
     * Posts the IDENTICAL ledger entries the webhook would, with provider = MANUAL, through
     * the same EscrowService.fund call. One way a job becomes funded, whichever path noticed.
     */
    @PostMapping("/jobs/{id}/escrow/fund-manual")
    public EscrowDto fundManual(@PathVariable Long id, @RequestBody AmountRequest body) {
        JobPost job = ownedJob(id);
        long amount = body.amountMinor() == null ? 0 : body.amountMinor();
        JobEscrow e = escrow.fund(job.getId(), job.getEmployer().getId(), amount,
                LedgerAccountType.EXTERNAL_SETTLEMENT, "MANUAL",
                "manual-" + System.currentTimeMillis(), "EMPLOYER", job.getEmployer().getId(), null);
        return EscrowDto.from(e, job.getTitle());
    }

    @GetMapping("/billing")
    public BillingDto billing() {
        EmployerAccount me = AuthenticationUtils.currentEmployer();
        List<EscrowDto> rows = jobs.findByEmployerOrderByPostedAtDesc(me).stream()
                .map(j -> escrows.findByJobId(j.getId())
                        .map(e -> EscrowDto.from(e, j.getTitle())).orElse(null))
                .filter(java.util.Objects::nonNull)
                .toList();
        long funded = rows.stream().mapToLong(EscrowDto::fundedMinor).sum();
        long reserved = rows.stream().mapToLong(EscrowDto::reservedMinor).sum();
        long released = rows.stream().mapToLong(EscrowDto::releasedMinor).sum();
        long refunded = rows.stream().mapToLong(EscrowDto::refundedMinor).sum();
        // What this employer's jobs have actually paid the platform, not a global figure.
        long fees = rows.stream().mapToLong(r -> escrow.jobFeesReleasedMinor(r.jobId())).sum();
        return new BillingDto(
                wallets.availableMinor(com.skillbridge.model.AccountType.EMPLOYER, me.getId()),
                funded, reserved, released, refunded, fees, rows);
    }
}
