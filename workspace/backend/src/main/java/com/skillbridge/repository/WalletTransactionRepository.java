package com.skillbridge.repository;

import com.skillbridge.model.Wallet;
import com.skillbridge.model.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findByWalletOrderByCreatedAtDesc(Wallet wallet);
    List<WalletTransaction> findAllByOrderByCreatedAtDesc();
}
