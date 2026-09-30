package com.skillbridge.repository;

import com.skillbridge.model.money.PaymentOrder;
import com.skillbridge.model.money.PaymentOrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {

    Optional<PaymentOrder> findByProviderOrderId(String providerOrderId);

    /** Locked and re-read inside the transaction: two deliveries racing must not both fund. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from PaymentOrder o where o.id = :id")
    Optional<PaymentOrder> lockById(@Param("id") Long id);

    List<PaymentOrder> findAllByOrderByIdDesc();
    List<PaymentOrder> findByStatus(PaymentOrderStatus status);
    List<PaymentOrder> findByJobIdOrderByIdDesc(Long jobId);

    @Query("select o from PaymentOrder o where o.status in :statuses and o.providerOrderId is not null "
            + "and o.createdAt < :before order by o.createdAt")
    List<PaymentOrder> findOpenBefore(@Param("statuses") List<PaymentOrderStatus> statuses,
                                      @Param("before") LocalDateTime before);
}
