package com.skillbridge.repository;

import com.skillbridge.model.money.EscrowStatus;
import com.skillbridge.model.money.JobEscrow;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface JobEscrowRepository extends JpaRepository<JobEscrow, Long> {

    Optional<JobEscrow> findByJobId(Long jobId);

    /**
     * The row lock every money path takes before it reads a balance and writes a new one.
     * Without it, two accepted offers can both see the same unreserved remainder and both
     * reserve it - the exact failure funding_conservation exists to make impossible.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from JobEscrow e where e.jobId = :jobId")
    Optional<JobEscrow> lockByJobId(@Param("jobId") Long jobId);

    List<JobEscrow> findAllByOrderByIdDesc();
    List<JobEscrow> findByStatus(EscrowStatus status);

    @Query("select coalesce(sum(e.fundedMinor),0) from JobEscrow e")   Long totalFunded();
    @Query("select coalesce(sum(e.reservedMinor),0) from JobEscrow e") Long totalReserved();
    @Query("select coalesce(sum(e.releasedMinor),0) from JobEscrow e") Long totalReleased();
    @Query("select coalesce(sum(e.refundedMinor),0) from JobEscrow e") Long totalRefunded();
}
