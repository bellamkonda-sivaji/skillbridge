package com.skillbridge.config;

import com.skillbridge.dto.payment.PaymentDtos.DestinationRequest;
import com.skillbridge.model.*;
import com.skillbridge.model.money.*;
import com.skillbridge.repository.*;
import com.skillbridge.service.WalletService;
import com.skillbridge.service.payment.EscrowService;
import com.skillbridge.service.payment.LedgerService;
import com.skillbridge.service.payment.Money;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Migrating the old rupee balances onto the ledger, and giving the money screens something
 * real to show.
 *
 * Two jobs, in this order:
 *
 * 1. THE MIGRATION. Every wallet that already carries a {@code double} of rupees gets an
 *    opening-balance transaction posted for it - EXTERNAL_SETTLEMENT debited, the owner's
 *    account credited - so the derived balance reproduces exactly the number that was there
 *    before, and every rupee in the system has an entry behind it. This is what a Flyway
 *    migration would do against a real database; with an in-memory H2 that is reseeded on
 *    every boot, it belongs here.
 *
 * 2. THE DEMO. The back-office seeder hand-wrote one completed engagement's payment straight
 *    onto the wallet balances. That pair of rows is unwound and the same money is put back
 *    through the real path - fund, reserve, release - so it lands on identical figures while
 *    also producing an escrow, an earning with the configured fee, and platform revenue. Then
 *    a second job is funded and left unreserved, a live engagement is reserved, and one worker
 *    gets a verified destination and a completed payout.
 */
@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
        name = "skillbridge.seed.enabled", havingValue = "true", matchIfMissing = true)
@Order(3)
public class MoneySeeder implements CommandLineRunner {

    private final WalletRepository wallets;
    private final WalletTransactionRepository walletTransactions;
    private final LedgerService ledger;
    private final EscrowService escrow;
    private final EmploymentRepository employments;
    private final EarningRepository earnings;
    private final JobPostRepository jobs;
    private final PayoutDestinationRepository destinations;
    private final PayoutRepository payouts;
    private final LedgerTransactionRepository ledgerTransactions;

    public MoneySeeder(WalletRepository wallets, WalletTransactionRepository walletTransactions,
                       LedgerService ledger, EscrowService escrow, EmploymentRepository employments,
                       EarningRepository earnings, JobPostRepository jobs,
                       PayoutDestinationRepository destinations, PayoutRepository payouts,
                       LedgerTransactionRepository ledgerTransactions) {
        this.wallets = wallets;
        this.walletTransactions = walletTransactions;
        this.ledger = ledger;
        this.escrow = escrow;
        this.employments = employments;
        this.earnings = earnings;
        this.jobs = jobs;
        this.destinations = destinations;
        this.payouts = payouts;
        this.ledgerTransactions = ledgerTransactions;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (ledgerTransactions.count() > 0) {
            return;
        }

        // ---------------------------------------------------- 2a. unwind the hand-written pay
        // Those two rows described money moving without an entry behind it. They are removed
        // and the balances put back, so the opening position below is the pre-payment float
        // and the real release can post it properly.
        List<WalletTransaction> handWritten = walletTransactions.findAllByOrderByCreatedAtDesc().stream()
                .filter(t -> t.getReference() == WalletTransaction.Reference.JOB_PAYMENT).toList();
        for (WalletTransaction t : handWritten) {
            Wallet w = t.getWallet();
            double delta = t.getType() == WalletTransaction.Type.CREDIT ? -t.getAmount() : t.getAmount();
            w.setBalance(Math.round((w.getBalance() + delta) * 100.0) / 100.0);
            wallets.save(w);
            walletTransactions.delete(t);
        }

        // ----------------------------------------------------------- 1. the opening balances
        for (Wallet w : wallets.findAllByOrderByCreatedAtDesc()) {
            if (w.getOwnerType() == AccountType.ADMIN) {
                continue; // no ledger account of its own - see WalletService.availableMinor
            }
            long minor = Money.fromRupees(w.getBalance());
            if (minor <= 0) {
                continue;
            }
            ledger.post(new LedgerService.Post("OPENING_BALANCE")
                    .memo("Opening balance carried over from the pre-ledger wallet")
                    .by("SYSTEM", null)
                    .idempotent("OPENING-" + w.getOwnerType() + "-" + w.getOwnerId())
                    .leg(LedgerService.Leg.debit(LedgerAccountType.EXTERNAL_SETTLEMENT, null, minor))
                    .leg(LedgerService.Leg.credit(WalletService.accountFor(w.getOwnerType()),
                            w.getOwnerId(), minor)));
        }

        // ------------------------------------------- 2b. the completed engagement, done properly
        Employment completed = employments.findAll().stream()
                .filter(e -> e.getStatus() == EmploymentStatus.COMPLETED)
                .findFirst().orElse(null);
        if (completed != null) {
            fundFor(completed);
            escrow.reserve(completed, "SYSTEM", null);
            escrow.release(completed, "SYSTEM", null);
        }

        // ------------------------------------------- 2c. a live reservation, not yet released
        Employment live = employments.findAll().stream()
                .filter(e -> e.getStatus() != EmploymentStatus.COMPLETED)
                .filter(e -> earnings.findByEmploymentId(e.getId()).isEmpty())
                .findFirst().orElse(null);
        if (live != null) {
            fundFor(live);
            escrow.reserve(live, "SYSTEM", null);
        }

        // ---------------------------------- 2d. a funded job with nothing reserved against it
        jobs.findAll().stream()
                .filter(j -> escrow.escrowOrEmpty(j.getId()).getFundedMinor() == 0)
                .findFirst()
                .ifPresent(j -> escrow.fund(j.getId(), j.getEmployer().getId(), 5_000_00L,
                        LedgerAccountType.EXTERNAL_SETTLEMENT, "MANUAL", "seed-manual",
                        "SYSTEM", null, "SEED-FUND-" + j.getId()));

        // ------------------------------- 2e. a verified destination and a completed payout
        if (completed != null) {
            seedPayout(completed.getWorker());
        }
    }

    /** Puts enough behind a job that the reservation below has somewhere to come from. */
    private void fundFor(Employment e) {
        long agreed = Money.fromRupees(e.getSalary() > 0 ? e.getSalary() : e.getJob().getSalary());
        long gross = agreed + escrow.feeOn(agreed);
        long have = escrow.escrowOrEmpty(e.getJob().getId()).unreservedMinor();
        if (have >= gross) {
            return;
        }
        escrow.fund(e.getJob().getId(), e.getEmployer().getId(), gross - have,
                LedgerAccountType.EMPLOYER_WALLET, "WALLET", "seed-employment-" + e.getId(),
                "SYSTEM", null, "SEED-FUND-EMP-" + e.getId());
    }

    /**
     * A destination that has been penny-dropped, and a payout that has landed.
     *
     * Marked VERIFIED here because the seed is asserting a fact about demo data, not claiming
     * a check ran: with no gateway configured the live verify endpoint deliberately answers
     * PENDING rather than pretending.
     */
    private void seedPayout(WorkerAccount worker) {
        long available = ledger.balanceMinor(LedgerAccountType.WORKER_PAYABLE, worker.getId());
        PayoutDestination d = destinations.save(PayoutDestination.builder()
                .workerId(worker.getId()).kind(DestinationKind.BANK)
                .accountHolderName(worker.getName())
                .accountNumberLast4("4471").ifsc("HDFC0001234")
                .verified(true).verificationStatus(DestinationVerification.VERIFIED)
                .verifiedName(worker.getName())
                .isDefault(true)
                .providerContactId("cont_seed").providerFundAccountId("fa_seed")
                .build());
        long amount = Math.min(available, 1_000_00L);
        if (amount <= 0) {
            return;
        }
        String key = "PAYOUT-SEED-" + worker.getId();
        Payout p = payouts.save(Payout.builder()
                .workerId(worker.getId()).destinationId(d.getId()).amountMinor(amount)
                .status(PayoutStatus.PAID).provider("RAZORPAYX")
                .providerPayoutId("pout_seed" + worker.getId())
                .idempotencyKey(key)
                .processedAt(LocalDateTime.now())
                .build());
        ledger.post(new LedgerService.Post("PAYOUT_REQUESTED")
                .memo("Payout #" + p.getId() + " to " + worker.getName())
                .by("WORKER", worker.getId())
                .idempotent(key)
                .leg(LedgerService.Leg.debit(LedgerAccountType.WORKER_PAYABLE, worker.getId(), amount))
                .leg(LedgerService.Leg.credit(LedgerAccountType.EXTERNAL_SETTLEMENT, null, amount)));
        walletTransactions.save(WalletTransaction.builder()
                .wallet(wallets.findByOwnerTypeAndOwnerId(AccountType.WORKER, worker.getId()).orElseThrow())
                .type(WalletTransaction.Type.DEBIT).amount(Money.toRupees(amount))
                .description("Withdrawal to ****4471")
                .reference(WalletTransaction.Reference.WITHDRAW).build());
    }
}
