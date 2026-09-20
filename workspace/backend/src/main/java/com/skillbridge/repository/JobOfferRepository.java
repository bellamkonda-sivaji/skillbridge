package com.skillbridge.repository;

import com.skillbridge.model.JobOffer;
import com.skillbridge.model.OfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface JobOfferRepository extends JpaRepository<JobOffer, Long> {
    Optional<JobOffer> findByApplicationId(Long applicationId);

    @Query("select o from JobOffer o where o.application.worker.id = :workerId order by o.sentAt desc")
    List<JobOffer> findByWorkerId(@Param("workerId") Long workerId);

    @Query("select count(o) from JobOffer o where o.application.worker.id = :workerId and o.status = :status")
    long countByWorkerIdAndStatus(@Param("workerId") Long workerId, @Param("status") OfferStatus status);
}
