package com.skillbridge.repository;

import com.skillbridge.model.money.Payout;
import com.skillbridge.model.money.PayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PayoutRepository extends JpaRepository<Payout, Long> {
    Optional<Payout> findByIdempotencyKey(String idempotencyKey);
    List<Payout> findByWorkerIdOrderByIdDesc(Long workerId);
    List<Payout> findAllByOrderByIdDesc();
    List<Payout> findByStatus(PayoutStatus status);
}
