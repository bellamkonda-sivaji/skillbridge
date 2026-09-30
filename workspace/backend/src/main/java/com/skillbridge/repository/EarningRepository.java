package com.skillbridge.repository;

import com.skillbridge.model.money.Earning;
import com.skillbridge.model.money.EarningStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EarningRepository extends JpaRepository<Earning, Long> {

    Optional<Earning> findByEmploymentId(Long employmentId);

    /** Release reads this under a lock, so two completions cannot both move ACCRUED -> PAYABLE. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Earning e where e.employmentId = :employmentId")
    Optional<Earning> lockByEmploymentId(@Param("employmentId") Long employmentId);

    List<Earning> findByWorkerIdOrderByIdDesc(Long workerId);
    List<Earning> findByJobId(Long jobId);
    List<Earning> findAllByOrderByIdDesc();

    @Query("select coalesce(sum(e.grossMinor),0) from Earning e where e.workerId = :workerId and e.status in :statuses")
    Long sumGross(@Param("workerId") Long workerId, @Param("statuses") List<EarningStatus> statuses);

    @Query("select coalesce(sum(e.netMinor),0) from Earning e where e.workerId = :workerId and e.status in :statuses")
    Long sumNet(@Param("workerId") Long workerId, @Param("statuses") List<EarningStatus> statuses);
}
