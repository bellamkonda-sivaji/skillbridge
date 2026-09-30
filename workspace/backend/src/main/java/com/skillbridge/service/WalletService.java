package com.skillbridge.service;

import com.skillbridge.dto.WalletDto;
import com.skillbridge.dto.WalletTransactionDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.model.money.EarningStatus;
import com.skillbridge.model.money.LedgerAccountType;
import com.skillbridge.repository.EarningRepository;
import com.skillbridge.repository.WalletRepository;
import com.skillbridge.repository.WalletTransactionRepository;
import com.skillbridge.service.payment.LedgerService;
import com.skillbridge.service.payment.Money;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * The wallet, after the ledger.
 *
 * The {@code wallets.balance} double is no longer a source of truth. It is kept as a cache so
 * the legacy back-office screens that read it keep rendering, but every number this service
 * hands to a user is derived from ledger entries - credits minus debits - and the cache is
 * refreshed from that derivation, never the other way round.
 *
 * {@code WalletTransaction} rows are likewise kept as a MIRROR. The ledger is the record; the
 * mirror exists so the existing payments list, daily report and analytics screens still have
 * content to show without being rewritten. Nothing reads a balance off it.
 */
@Service
public class WalletService {

    /** Money that is ring-fenced for a worker but not yet released. */
    private static final List<EarningStatus> PENDING = List.of(EarningStatus.ACCRUED, EarningStatus.HELD);
    /** Money that has been released, whether or not it has left for a bank yet. */
    private static final List<EarningStatus> EARNED =
            List.of(EarningStatus.PAYABLE, EarningStatus.IN_BATCH, EarningStatus.PAID);

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final NotificationService notificationService;
    private final AccountDirectory accountDirectory;
    private final LedgerService ledger;
    private final EarningRepository earnings;

    public WalletService(WalletRepository walletRepository, WalletTransactionRepository transactionRepository,
                         NotificationService notificationService, AccountDirectory accountDirectory,
                         LedgerService ledger, EarningRepository earnings) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
        this.accountDirectory = accountDirectory;
        this.ledger = ledger;
        this.earnings = earnings;
    }

    @Transactional
    public Wallet getOrCreate(Account account) {
        return getOrCreate(account.accountType(), account.getId());
    }

    @Transactional
    public Wallet getOrCreate(AccountType ownerType, Long ownerId) {
        return walletRepository.findByOwnerTypeAndOwnerId(ownerType, ownerId)
                .orElseGet(() -> walletRepository.save(
                        Wallet.builder().ownerType(ownerType).ownerId(ownerId).balance(0).build()));
    }

    // ------------------------------------------------------------------ derived figures

    /** Which ledger account holds this kind of account's own money. */
    public static LedgerAccountType accountFor(AccountType type) {
        return type == AccountType.WORKER ? LedgerAccountType.WORKER_PAYABLE
                : LedgerAccountType.EMPLOYER_WALLET;
    }

    /**
     * What this account can spend or withdraw right now.
     *
     * For a worker that is their WORKER_PAYABLE balance less whatever is still only ACCRUED -
     * money reserved against a job they have not finished is theirs to expect, not to spend.
     */
    public long availableMinor(AccountType type, Long id) {
        if (type == AccountType.ADMIN) {
            // An admin account has a wallet row only because the demo data gives every account
            // one. It is not a party to any engagement and has no ledger account of its own -
            // the chart of accounts has no ADMIN_WALLET and inventing one would mean an admin
            // id colliding with an employer id inside EMPLOYER_WALLET. So the cached figure
            // stands, and no ledger claim is made about it.
            return walletRepository.findByOwnerTypeAndOwnerId(type, id)
                    .map(w -> Money.fromRupees(w.getBalance())).orElse(0L);
        }
        long balance = ledger.balanceMinor(accountFor(type), id);
        return type == AccountType.WORKER ? balance - pendingGrossMinor(id) : balance;
    }

    /** What a worker will be paid when their current engagements complete, net of the fee. */
    public long pendingMinor(AccountType type, Long id) {
        return type == AccountType.WORKER ? nz(earnings.sumNet(id, PENDING)) : 0L;
    }

    /** What is ring-fenced in WORKER_PAYABLE but not yet released - gross, fee included. */
    private long pendingGrossMinor(Long workerId) {
        return nz(earnings.sumGross(workerId, PENDING));
    }

    /** Escrow held against this account's jobs. Only meaningful for an employer. */
    public long reservedMinor(AccountType type, Long id) {
        return type == AccountType.WORKER ? pendingGrossMinor(id) : 0L;
    }

    public long lifetimeEarnedMinor(AccountType type, Long id) {
        return type == AccountType.WORKER ? nz(earnings.sumNet(id, EARNED)) : 0L;
    }

    public WalletDto myWallet(Account account) {
        return walletDtoFor(account.accountType(), account.getId(), account.getName());
    }

    private WalletDto walletDtoFor(AccountType type, Long id, String name) {
        Wallet wallet = getOrCreate(type, id);
        long available = availableMinor(type, id);
        // The cache, refreshed from the derivation. Written here rather than trusted.
        double rupees = Money.toRupees(available);
        if (type != AccountType.ADMIN && wallet.getBalance() != rupees) {
            wallet.setBalance(rupees);
            walletRepository.save(wallet);
        }
        return new WalletDto(wallet.getId(), type, id, name, rupees,
                available, pendingMinor(type, id), reservedMinor(type, id), lifetimeEarnedMinor(type, id),
                transactions(wallet));
    }

    // ------------------------------------------------------------------ movements

    /**
     * Money in from outside. Posts the ledger first; the mirror row is written afterwards so
     * a failed post never leaves a transaction row describing money that did not move.
     */
    @Transactional
    public WalletDto fund(Account account, double amount) {
        if (amount <= 0) {
            throw ApiException.badRequest("Amount must be positive");
        }
        long minor = Money.fromRupees(amount);
        AccountType type = account.accountType();
        ledger.post(new LedgerService.Post("WALLET_FUNDED")
                .memo("Wallet top-up")
                .by(type.name(), account.getId())
                .leg(LedgerService.Leg.debit(LedgerAccountType.EXTERNAL_SETTLEMENT, null, minor))
                .leg(LedgerService.Leg.credit(accountFor(type), account.getId(), minor)));
        mirror(getOrCreate(account), WalletTransaction.Type.CREDIT, minor, "Wallet top-up", null,
                WalletTransaction.Reference.FUND);
        return myWallet(account);
    }

    @Transactional
    public WalletDto withdraw(Account account, double amount) {
        if (amount <= 0) {
            throw ApiException.badRequest("Amount must be positive");
        }
        long minor = Money.fromRupees(amount);
        AccountType type = account.accountType();
        long available = availableMinor(type, account.getId());
        if (available < minor) {
            throw ApiException.badRequest("Insufficient wallet balance: you have "
                    + Money.inr(available) + " available and asked to withdraw " + Money.inr(minor) + ".");
        }
        ledger.post(new LedgerService.Post("WALLET_WITHDRAWN")
                .memo("Withdrawal")
                .by(type.name(), account.getId())
                .leg(LedgerService.Leg.debit(accountFor(type), account.getId(), minor))
                .leg(LedgerService.Leg.credit(LedgerAccountType.EXTERNAL_SETTLEMENT, null, minor)));
        mirror(getOrCreate(account), WalletTransaction.Type.DEBIT, minor, "Withdrawal", null,
                WalletTransaction.Reference.WITHDRAW);
        return myWallet(account);
    }

    /** Total the worker has ever been credited for completed work, in rupees (legacy shape). */
    public double earningsFor(AccountType ownerType, Long ownerId) {
        return Money.toRupees(lifetimeEarnedMinor(ownerType, ownerId));
    }

    /**
     * Writes the legacy WalletTransaction row that the back office, daily report and analytics
     * still read. Public because EscrowService calls it when an earning is released - that is
     * the moment the old code would have called payForJob.
     */
    @Transactional
    public void mirror(Wallet wallet, WalletTransaction.Type type, long amountMinor,
                       String description, Long jobId, WalletTransaction.Reference reference) {
        transactionRepository.save(WalletTransaction.builder()
                .wallet(wallet).type(type).amount(Money.toRupees(amountMinor))
                .description(description).jobId(jobId).reference(reference).build());
    }

    public void notifyPaid(WorkerAccount worker, EmployerAccount employer, JobPost job, long netMinor) {
        notificationService.notify(worker, "Payment released",
                Money.inr(netMinor) + " for \"" + job.getTitle() + "\" is now available to withdraw",
                NotificationType.SYSTEM, "/worker/wallet");
        notificationService.notify(employer, "Payment released",
                Money.inr(netMinor) + " released to " + worker.getName() + " for \"" + job.getTitle() + "\"",
                NotificationType.SYSTEM, "/employer/wallet");
    }

    private List<WalletTransactionDto> transactions(Wallet wallet) {
        return transactionRepository.findByWalletOrderByCreatedAtDesc(wallet).stream()
                .map(WalletTransactionDto::from).toList();
    }

    public List<WalletDto> allWallets() {
        return walletRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(w -> walletDtoFor(w.getOwnerType(), w.getOwnerId(),
                        accountDirectory.displayNameOf(w.getOwnerType(), w.getOwnerId()))).toList();
    }

    public List<WalletTransactionDto> allTransactions() {
        return transactionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(WalletTransactionDto::from).toList();
    }

    private static long nz(Long v) { return v == null ? 0L : v; }

    public static String format(double v) {
        return String.format("%.0f", v);
    }
}
