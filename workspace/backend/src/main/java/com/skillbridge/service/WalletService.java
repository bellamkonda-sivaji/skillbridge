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

    public WalletService(WalletRepository walletRepository, WalletTransactionRepository transactionRepository,
                         NotificationService notificationService) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public Wallet getOrCreate(User user) {
        return walletRepository.findByUserId(user.getId())
                .orElseGet(() -> walletRepository.save(Wallet.builder().user(user).balance(0).build()));
    }

    public WalletDto myWallet(User user) {
        Wallet wallet = getOrCreate(user);
        return WalletDto.from(wallet, transactions(wallet));
    }

    @Transactional
    public WalletDto fund(User user, double amount) {
        if (amount <= 0) {
            throw ApiException.badRequest("Amount must be positive");
        }
        Wallet wallet = getOrCreate(user);
        wallet.setBalance(Math.round((wallet.getBalance() + amount) * 100.0) / 100.0);
        walletRepository.save(wallet);
        addTransaction(wallet, WalletTransaction.Type.CREDIT, amount,
                "Wallet top-up", null, WalletTransaction.Reference.FUND);
        return myWallet(user);
    }

    @Transactional
    public WalletDto withdraw(User user, double amount) {
        if (amount <= 0) {
            throw ApiException.badRequest("Amount must be positive");
        }
        Wallet wallet = getOrCreate(user);
        if (wallet.getBalance() < amount) {
            throw ApiException.badRequest("Insufficient wallet balance");
        }
        wallet.setBalance(Math.round((wallet.getBalance() - amount) * 100.0) / 100.0);
        walletRepository.save(wallet);
        addTransaction(wallet, WalletTransaction.Type.DEBIT, amount,
                "Withdrawal", null, WalletTransaction.Reference.WITHDRAW);
        return myWallet(user);
    }

    /**
     * Pays one unit of the job salary from the employer's wallet to the worker's wallet.
     */
    @Transactional
    public void payForJob(User employer, User worker, JobPost job) {
        Wallet employerWallet = getOrCreate(employer);
        Wallet workerWallet = getOrCreate(worker);
        double amount = job.getSalary();
        if (employerWallet.getBalance() < amount) {
            throw ApiException.badRequest("Insufficient wallet balance to accept this job. Add funds to your wallet first.");
        }
        employerWallet.setBalance(Math.round((employerWallet.getBalance() - amount) * 100.0) / 100.0);
        workerWallet.setBalance(Math.round((workerWallet.getBalance() + amount) * 100.0) / 100.0);
        walletRepository.save(employerWallet);
        walletRepository.save(workerWallet);

        String desc = "Payment for \"" + job.getTitle() + "\"";
        addTransaction(employerWallet, WalletTransaction.Type.DEBIT, amount, desc, job.getId(), WalletTransaction.Reference.JOB_PAYMENT);
        addTransaction(workerWallet, WalletTransaction.Type.CREDIT, amount, desc, job.getId(), WalletTransaction.Reference.JOB_PAYMENT);

        notificationService.notify(worker, "Payment received",
                "You received " + format(amount) + " for \"" + job.getTitle() + "\"",
                NotificationType.SYSTEM, "/worker/wallet");
        notificationService.notify(employer, "Payment sent",
                format(amount) + " paid to " + worker.getName() + " for \"" + job.getTitle() + "\"",
                NotificationType.SYSTEM, "/employer/wallet");
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
                .map(w -> WalletDto.from(w, transactions(w))).toList();
    }

    public List<WalletTransactionDto> allTransactions() {
        return transactionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(WalletTransactionDto::from).toList();
    }

    public static String format(double v) {
        return String.format("%.0f", v);
    }
}
