package com.skillbridge.service;

import com.skillbridge.dto.WalletDto;
import com.skillbridge.dto.WalletTransactionDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.WalletRepository;
import com.skillbridge.repository.WalletTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final NotificationService notificationService;
    private final AccountDirectory accountDirectory;

    public WalletService(WalletRepository walletRepository, WalletTransactionRepository transactionRepository,
                         NotificationService notificationService, AccountDirectory accountDirectory) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
        this.accountDirectory = accountDirectory;
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

    public WalletDto myWallet(Account account) {
        Wallet wallet = getOrCreate(account);
        return WalletDto.from(wallet, account.getName(), transactions(wallet));
    }

    @Transactional
    public WalletDto fund(Account account, double amount) {
        if (amount <= 0) {
            throw ApiException.badRequest("Amount must be positive");
        }
        Wallet wallet = getOrCreate(account);
        wallet.setBalance(Math.round((wallet.getBalance() + amount) * 100.0) / 100.0);
        walletRepository.save(wallet);
        addTransaction(wallet, WalletTransaction.Type.CREDIT, amount,
                "Wallet top-up", null, WalletTransaction.Reference.FUND);
        return myWallet(account);
    }

    @Transactional
    public WalletDto withdraw(Account account, double amount) {
        if (amount <= 0) {
            throw ApiException.badRequest("Amount must be positive");
        }
        Wallet wallet = getOrCreate(account);
        if (wallet.getBalance() < amount) {
            throw ApiException.badRequest("Insufficient wallet balance");
        }
        wallet.setBalance(Math.round((wallet.getBalance() - amount) * 100.0) / 100.0);
        walletRepository.save(wallet);
        addTransaction(wallet, WalletTransaction.Type.DEBIT, amount,
                "Withdrawal", null, WalletTransaction.Reference.WITHDRAW);
        return myWallet(account);
    }

    /**
     * Moves one unit of the job salary from the employer's wallet to the worker's. Callers are
     * responsible for firing this exactly once per application - see JobApplication#paymentSettled.
     */
    @Transactional
    public void payForJob(EmployerAccount employer, WorkerAccount worker, JobPost job, double amount) {
        Wallet employerWallet = getOrCreate(employer);
        Wallet workerWallet = getOrCreate(worker);
        if (employerWallet.getBalance() < amount) {
            throw ApiException.badRequest(
                    "Insufficient wallet balance to settle this job. Add funds to your wallet first.");
        }
        employerWallet.setBalance(Math.round((employerWallet.getBalance() - amount) * 100.0) / 100.0);
        workerWallet.setBalance(Math.round((workerWallet.getBalance() + amount) * 100.0) / 100.0);
        walletRepository.save(employerWallet);
        walletRepository.save(workerWallet);

        String desc = "Payment for \"" + job.getTitle() + "\"";
        addTransaction(employerWallet, WalletTransaction.Type.DEBIT, amount, desc, job.getId(),
                WalletTransaction.Reference.JOB_PAYMENT);
        addTransaction(workerWallet, WalletTransaction.Type.CREDIT, amount, desc, job.getId(),
                WalletTransaction.Reference.JOB_PAYMENT);

        notificationService.notify(worker, "Payment received",
                "You received " + format(amount) + " for \"" + job.getTitle() + "\"",
                NotificationType.SYSTEM, "/worker/wallet");
        notificationService.notify(employer, "Payment sent",
                format(amount) + " paid to " + worker.getName() + " for \"" + job.getTitle() + "\"",
                NotificationType.SYSTEM, "/employer/wallet");
    }

    /** Total the worker has ever been credited for completed work. */
    public double earningsFor(AccountType ownerType, Long ownerId) {
        return walletRepository.findByOwnerTypeAndOwnerId(ownerType, ownerId)
                .map(w -> transactionRepository.findByWalletOrderByCreatedAtDesc(w).stream()
                        .filter(t -> t.getType() == WalletTransaction.Type.CREDIT
                                && t.getReference() == WalletTransaction.Reference.JOB_PAYMENT)
                        .mapToDouble(WalletTransaction::getAmount).sum())
                .orElse(0.0);
    }

    private void addTransaction(Wallet wallet, WalletTransaction.Type type, double amount,
                                String description, Long jobId, WalletTransaction.Reference reference) {
        transactionRepository.save(WalletTransaction.builder()
                .wallet(wallet).type(type).amount(Math.round(amount * 100.0) / 100.0)
                .description(description).jobId(jobId).reference(reference).build());
    }

    private List<WalletTransactionDto> transactions(Wallet wallet) {
        return transactionRepository.findByWalletOrderByCreatedAtDesc(wallet).stream()
                .map(WalletTransactionDto::from).toList();
    }

    public List<WalletDto> allWallets() {
        return walletRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(w -> WalletDto.from(w, accountDirectory.displayNameOf(w.getOwnerType(), w.getOwnerId()),
                        transactions(w))).toList();
    }

    public List<WalletTransactionDto> allTransactions() {
        return transactionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(WalletTransactionDto::from).toList();
    }

    public static String format(double v) {
        return String.format("%.0f", v);
    }
}
