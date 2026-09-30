package com.skillbridge.service.payment;

import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.model.money.*;
import com.skillbridge.repository.*;
import com.skillbridge.service.WalletService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Fund, reserve, release, refund.
 *
 * Ported from Veyora's payment.service.js, with campaigns becoming jobs and collaborations
 * becoming employments. The reasoning carried over rather than the shapes:
 *
 *  - The DB CHECK Veyora calls {@code funding_conservation} -
 *    {@code reserved + released + refunded <= funded} - is asserted here in code, inside the
 *    transaction, after taking a row lock. H2 CHECKs do not survive {@code ddl-auto: update}
 *    comfortably, but the invariant is not optional, so it moved rather than disappeared.
 *
 *  - Every step is idempotent by construction, not by hope. Funding carries an idempotency
 *    key derived from the provider reference; reserve and release are keyed on the employment
 *    and additionally guarded by the unique Earning row. Releasing twice must be impossible,
 *    and the second call finds the earning already PAYABLE and does nothing.
 *
 *  - The fee is a slab on the posted price, owned by {@link com.skillbridge.service.PricingService}.
 *    It is taken OUT of the agreed amount, not added on top: the employer funds exactly the
 *    price they posted, and the worker is paid that price minus the commission - which is the
 *    figure the worker was shown on the job card. Net is computed as {@code gross - fee} so
 *    the rounding drift is absorbed on one leg and the two reconcile to the paisa.
 */
@Service
public class EscrowService {

    /**
     * Retained only as an override for tests and for the legacy flat-fee configuration. When
     * it is zero - the normal case - the slab table in PricingService decides the fee.
     */
    @Value("${skillbridge.pricing.platform-fee-percent:0}")
    private double platformFeePercent;

    private final com.skillbridge.service.PricingService pricing;
    private final JobEscrowRepository escrows;
    private final EarningRepository earnings;
    private final LedgerService ledger;
    private final WalletService wallets;
    private final JobPostRepository jobs;
    private final EmploymentRepository employments;

    public EscrowService(JobEscrowRepository escrows, EarningRepository earnings, LedgerService ledger,
                         WalletService wallets, JobPostRepository jobs, EmploymentRepository employments,
                         com.skillbridge.service.PricingService pricing) {
        this.pricing = pricing;
        this.escrows = escrows;
        this.earnings = earnings;
        this.ledger = ledger;
        this.wallets = wallets;
        this.jobs = jobs;
        this.employments = employments;
    }

    /** Test seam - the same one ScheduleCalculator exposes. */
    public void setPlatformFeePercent(double percent) {
        this.platformFeePercent = percent;
    }

    public double platformFeePercent() {
        return platformFeePercent;
    }

    /**
     * The commission on an agreed wage. Rounded once, here, so nothing downstream rounds again.
     * An explicitly configured flat percentage wins, so existing tests and any legacy contract
     * keep their behaviour; otherwise the slab table applies.
     */
    public long feeOn(long agreedMinor) {
        if (agreedMinor <= 0) {
            return 0L;
        }
        if (platformFeePercent > 0) {
            return Math.round(agreedMinor * platformFeePercent / 100.0);
        }
        return pricing.feeMinor(agreedMinor);
    }

    // ================================================================= 1. FUND

    @Transactional
    public JobEscrow escrowOf(Long jobId) {
        return escrows.findByJobId(jobId).orElseGet(() -> escrows.save(
                JobEscrow.builder().jobId(jobId).status(EscrowStatus.UNFUNDED).build()));
    }

    public JobEscrow escrowOrEmpty(Long jobId) {
        return escrows.findByJobId(jobId)
                .orElseGet(() -> JobEscrow.builder().jobId(jobId).status(EscrowStatus.UNFUNDED).build());
    }

    /**
     * The ONE way a job becomes funded, whichever path noticed first.
     *
     * The signed webhook calls it, the manual path calls it, reconciliation calls it, and the
     * wallet auto-fund on offer acceptance calls it. One definition of "funded", reached four
     * ways, is what stops the four drifting apart.
     *
     * {@code sourceAccount} is where the money came FROM: EXTERNAL_SETTLEMENT for real money
     * arriving through a gateway, EMPLOYER_WALLET when an employer's existing float is being
     * moved against a job. Everything else about the posting is identical.
     */
    @Transactional
    public JobEscrow fund(Long jobId, Long employerId, long amountMinor, LedgerAccountType sourceAccount,
                          String provider, String providerRef, String byType, Long byId,
                          String idempotencyKey) {
        if (amountMinor <= 0) {
            throw ApiException.badRequest("Amount must be positive");
        }
        JobEscrow escrow = escrows.lockByJobId(jobId).orElseGet(() -> escrowOf(jobId));

        if (sourceAccount == LedgerAccountType.EMPLOYER_WALLET) {
            long available = ledger.balanceMinor(LedgerAccountType.EMPLOYER_WALLET, employerId);
            if (available < amountMinor) {
                throw ApiException.badRequest("Your wallet holds " + Money.inr(available)
                        + " and this needs " + Money.inr(amountMinor)
                        + ". Fund this job before accepting, or top up your wallet.");
            }
        }

        // Post first. If the ledger refuses, nothing above it has been claimed.
        ledger.post(new LedgerService.Post("ESCROW_FUNDED")
                .job(jobId)
                .memo("Escrow funded for job #" + jobId + " via " + provider)
                .by(byType, byId)
                .idempotent(idempotencyKey)
                .leg(LedgerService.Leg.debit(sourceAccount,
                        sourceAccount == LedgerAccountType.EMPLOYER_WALLET ? employerId : null, amountMinor))
                .leg(LedgerService.Leg.credit(LedgerAccountType.JOB_ESCROW, jobId, amountMinor)));

        escrow.setFundedMinor(escrow.getFundedMinor() + amountMinor);
        escrow.setProvider(provider);
        escrow.setProviderRef(providerRef);
        escrow.setFundedAt(LocalDateTime.now());
        escrow.setStatus(escrow.getReleasedMinor() > 0 ? EscrowStatus.PARTIALLY_RELEASED : EscrowStatus.FUNDED);
        escrow.setUpdatedAt(LocalDateTime.now());
        assertConservation(escrow);
        return escrows.save(escrow);
    }

    // ============================================================== 2. RESERVE

    /**
     * Ring-fence one worker's money when their offer is accepted.
     *
     * THIS IS THE BEHAVIOUR CHANGE. Accepting an offer used to move the whole wage from the
     * employer's wallet to the worker's, instantly, with nothing held in between. It now
     * reserves: the money leaves the job's escrow and sits in WORKER_PAYABLE, earmarked but
     * not withdrawable, until the engagement completes.
     *
     * Idempotent per employment - the unique Earning row is the guard, so a retried accept
     * cannot reserve twice.
     */
    @Transactional
    public Earning reserve(Employment employment, String byType, Long byId) {
        Long employmentId = employment.getId();
        var already = earnings.lockByEmploymentId(employmentId);
        if (already.isPresent()) {
            return already.get();
        }

        Long jobId = employment.getJob().getId();
        Long employerId = employment.getEmployer().getId();
        Long workerId = employment.getWorker().getId();

        long agreedMinor = Money.fromRupees(employment.getSalary() > 0
                ? employment.getSalary() : employment.getJob().getSalary());
        if (agreedMinor <= 0) {
            throw ApiException.badRequest("This engagement has no agreed amount to reserve.");
        }
        long feeMinor = feeOn(agreedMinor);
        // The employer funds the price they posted. The commission comes out of that, so the
        // gross reserved IS the agreed amount and the worker's net is what is left.
        long grossMinor = agreedMinor;

        JobEscrow escrow = escrows.lockByJobId(jobId).orElseGet(() -> escrowOf(jobId));

        // A job with no escrow behind it must still be acceptable, or every seeded demo flow
        // and every employer who never saw a checkout is stuck. Auto-fund the shortfall from
        // the employer's own wallet if it covers it - same funding call, provider WALLET, so
        // the escrow row and the ledger tell the same story as a gateway payment would.
        if (escrow.unreservedMinor() < grossMinor) {
            long shortfall = grossMinor - escrow.unreservedMinor();
            long walletMinor = ledger.balanceMinor(LedgerAccountType.EMPLOYER_WALLET, employerId);
            if (walletMinor < shortfall) {
                throw ApiException.badRequest("This job does not have enough money behind it. "
                        + "Available in escrow " + Money.inr(escrow.unreservedMinor())
                        + ", this engagement needs " + Money.inr(grossMinor)
                        + ". Fund the job (or top up your wallet) and try again.");
            }
            escrow = fund(jobId, employerId, shortfall, LedgerAccountType.EMPLOYER_WALLET,
                    "WALLET", "auto-fund-employment-" + employmentId, byType, byId,
                    "AUTOFUND-EMP-" + employmentId);
            escrow = escrows.lockByJobId(jobId).orElse(escrow);
        }

        // Named in both directions, exactly as Veyora's reserveFunds does, so the employer is
        // told what they have as well as what is missing.
        if (escrow.unreservedMinor() < grossMinor) {
            throw ApiException.badRequest("Not enough funded escrow left on this job. Available "
                    + Money.inr(escrow.unreservedMinor()) + ", this engagement needs "
                    + Money.inr(grossMinor) + ".");
        }

        ledger.post(new LedgerService.Post("FUNDS_RESERVED")
                .job(jobId).employment(employmentId)
                .memo("Reserved for employment #" + employmentId)
                .by(byType, byId)
                .idempotent("RESERVE-EMP-" + employmentId)
                .leg(LedgerService.Leg.debit(LedgerAccountType.JOB_ESCROW, jobId, grossMinor))
                .leg(LedgerService.Leg.credit(LedgerAccountType.WORKER_PAYABLE, workerId, grossMinor)));

        escrow.setReservedMinor(escrow.getReservedMinor() + grossMinor);
        escrow.setUpdatedAt(LocalDateTime.now());
        assertConservation(escrow);
        escrows.save(escrow);

        // The earning exists from reservation, but it is ACCRUED - not payable, not spendable.
        return earnings.save(Earning.builder()
                .employmentId(employmentId).workerId(workerId).jobId(jobId).employerId(employerId)
                .grossMinor(grossMinor).feeMinor(feeMinor).netMinor(grossMinor - feeMinor)
                .status(EarningStatus.ACCRUED)
                .build());
    }

    // ============================================================== 3. RELEASE

    /**
     * The engagement is done: the worker's money becomes withdrawable and the platform takes
     * its fee.
     *
     * Releasing twice must be impossible. The earning row is locked, and anything past
     * ACCRUED/HELD returns untouched - so a completion marked twice, a replay, or two
     * requests racing all settle on one release. The ledger post additionally carries an
     * idempotency key, which is belt and braces on purpose: this is the leg where a mistake
     * costs real money.
     */
    @Transactional
    public Earning release(Employment employment, String byType, Long byId) {
        Long employmentId = employment.getId();
        Earning earning = earnings.lockByEmploymentId(employmentId).orElse(null);
        if (earning == null) {
            // Nothing was ever reserved. Silently doing nothing is right here - this is called
            // from the joining-step flow, which must keep working for engagements created
            // before escrow existed.
            return null;
        }
        if (earning.getStatus() != EarningStatus.ACCRUED && earning.getStatus() != EarningStatus.HELD) {
            return earning;
        }

        Long jobId = earning.getJobId();
        long gross = earning.getGrossMinor();
        long fee = earning.getFeeMinor();
        // Net is gross minus fee, always - so the rounding drift from the percentage is
        // absorbed on this final leg and the two reconcile exactly against the agreed amount.
        long net = gross - fee;

        ledger.post(new LedgerService.Post("EARNING_RELEASED")
                .job(jobId).employment(employmentId)
                .memo("Released for employment #" + employmentId)
                .by(byType, byId)
                .idempotent("RELEASE-EMP-" + employmentId)
                .leg(LedgerService.Leg.debit(LedgerAccountType.WORKER_PAYABLE, earning.getWorkerId(), gross))
                .leg(LedgerService.Leg.credit(LedgerAccountType.WORKER_PAYABLE, earning.getWorkerId(), net))
                .leg(LedgerService.Leg.credit(LedgerAccountType.PLATFORM_REVENUE, null, fee)));

        JobEscrow escrow = escrows.lockByJobId(jobId).orElseGet(() -> escrowOf(jobId));
        escrow.setReservedMinor(Math.max(0, escrow.getReservedMinor() - gross));
        escrow.setReleasedMinor(escrow.getReleasedMinor() + gross);
        escrow.setStatus(escrow.unreservedMinor() == 0 && escrow.getReservedMinor() == 0
                ? EscrowStatus.RELEASED : EscrowStatus.PARTIALLY_RELEASED);
        escrow.setUpdatedAt(LocalDateTime.now());
        assertConservation(escrow);
        escrows.save(escrow);

        earning.setStatus(EarningStatus.PAYABLE);
        earning.setPayableAt(LocalDateTime.now());
        earnings.save(earning);

        mirrorLegacyPayment(employment, gross, net);
        return earning;
    }

    /**
     * The legacy WalletTransaction pair the back office, daily report and analytics read.
     *
     * Written at RELEASE, which is the moment the old code would have called payForJob. Those
     * screens keep working; they simply now show the money at the point it actually became
     * the worker's rather than at the point the offer was accepted.
     */
    private void mirrorLegacyPayment(Employment employment, long grossMinor, long netMinor) {
        JobPost job = employment.getJob();
        String desc = "Payment for \"" + job.getTitle() + "\"";
        wallets.mirror(wallets.getOrCreate(employment.getEmployer()), WalletTransaction.Type.DEBIT,
                grossMinor, desc, job.getId(), WalletTransaction.Reference.JOB_PAYMENT);
        wallets.mirror(wallets.getOrCreate(employment.getWorker()), WalletTransaction.Type.CREDIT,
                netMinor, desc, job.getId(), WalletTransaction.Reference.JOB_PAYMENT);
        wallets.notifyPaid(employment.getWorker(), employment.getEmployer(), job, netMinor);
    }

    /** Convenience for callers holding only an id. */
    @Transactional
    public Earning releaseByEmploymentId(Long employmentId, String byType, Long byId) {
        Employment employment = employments.findById(employmentId).orElse(null);
        return employment == null ? null : release(employment, byType, byId);
    }

    // =============================================================== 4. REFUND

    /**
     * Unreserved escrow goes back to the employer when a job closes.
     *
     * Back to their EMPLOYER_WALLET rather than out to a bank: the money is already inside
     * the platform, and pushing it out only to pull it in again for the next job is a
     * gateway fee and a reconciliation problem in exchange for nothing.
     */
    @Transactional
    public JobEscrow refundUnreserved(Long jobId, Long employerId, String byType, Long byId) {
        JobEscrow escrow = escrows.lockByJobId(jobId).orElse(null);
        if (escrow == null) {
            return null;
        }
        long refundable = escrow.unreservedMinor();
        if (refundable <= 0) {
            return escrow;
        }
        ledger.post(new LedgerService.Post("ESCROW_REFUNDED")
                .job(jobId)
                .memo("Unreserved escrow returned for job #" + jobId)
                .by(byType, byId)
                .leg(LedgerService.Leg.debit(LedgerAccountType.JOB_ESCROW, jobId, refundable))
                .leg(LedgerService.Leg.credit(LedgerAccountType.EMPLOYER_WALLET, employerId, refundable)));

        escrow.setRefundedMinor(escrow.getRefundedMinor() + refundable);
        escrow.setStatus(escrow.getReleasedMinor() > 0 ? EscrowStatus.PARTIALLY_RELEASED : EscrowStatus.REFUNDED);
        escrow.setUpdatedAt(LocalDateTime.now());
        assertConservation(escrow);
        return escrows.save(escrow);
    }

    // ================================================================ invariant

    /**
     * Veyora's funding_conservation, in Java.
     *
     * Thrown, not returned: over-reserving is a bug, and the transaction must die before it
     * reaches the database. The message carries the four figures because when this fires the
     * first question is always which of them is wrong.
     */
    private void assertConservation(JobEscrow e) {
        long committed = e.getReservedMinor() + e.getReleasedMinor() + e.getRefundedMinor();
        if (committed > e.getFundedMinor()) {
            throw new IllegalStateException("funding_conservation violated on job #" + e.getJobId()
                    + ": reserved " + e.getReservedMinor() + " + released " + e.getReleasedMinor()
                    + " + refunded " + e.getRefundedMinor() + " > funded " + e.getFundedMinor());
        }
    }

    // ------------------------------------------------------------------ reads

    /** Platform fee actually taken on one job - the sum of its released earnings' fees. */
    public long jobFeesReleasedMinor(Long jobId) {
        return earnings.findByJobId(jobId).stream()
                .filter(e -> e.getStatus() != EarningStatus.ACCRUED && e.getStatus() != EarningStatus.HELD)
                .mapToLong(Earning::getFeeMinor).sum();
    }

    public JobPost jobOrThrow(Long jobId) {
        return jobs.findById(jobId).orElseThrow(() -> ApiException.notFound("Job not found"));
    }
}
