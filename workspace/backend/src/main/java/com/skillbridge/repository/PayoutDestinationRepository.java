package com.skillbridge.repository;

import com.skillbridge.model.money.PayoutDestination;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PayoutDestinationRepository extends JpaRepository<PayoutDestination, Long> {
    List<PayoutDestination> findByWorkerIdOrderByIdDesc(Long workerId);
}
