package com.skillbridge.repository;

import com.skillbridge.model.money.LedgerTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LedgerTransactionRepository extends JpaRepository<LedgerTransaction, Long> {
    Optional<LedgerTransaction> findByIdempotencyKey(String idempotencyKey);
    List<LedgerTransaction> findAllByOrderByIdDesc();
    List<LedgerTransaction> findByJobIdOrderByIdDesc(Long jobId);
}
