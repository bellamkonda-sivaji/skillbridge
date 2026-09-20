package com.skillbridge.repository;

import com.skillbridge.model.AccountType;
import com.skillbridge.model.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, Long> {
    Optional<Wallet> findByOwnerTypeAndOwnerId(AccountType ownerType, Long ownerId);
    List<Wallet> findAllByOrderByCreatedAtDesc();
}
