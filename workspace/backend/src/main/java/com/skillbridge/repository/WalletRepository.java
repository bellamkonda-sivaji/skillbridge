package com.skillbridge.repository;

import com.skillbridge.model.Wallet;
import com.skillbridge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, Long> {
    Optional<Wallet> findByUserId(Long userId);
    List<Wallet> findAllByOrderByCreatedAtDesc();
}
