package com.skillbridge.repository;

import com.skillbridge.model.Employment;
import com.skillbridge.model.EmployerAccount;
import com.skillbridge.model.WorkerAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmploymentRepository extends JpaRepository<Employment, Long> {
    List<Employment> findByWorkerOrderByJoiningDateDesc(WorkerAccount worker);
    List<Employment> findByEmployerOrderByJoiningDateDesc(EmployerAccount employer);
    Optional<Employment> findByOfferId(Long offerId);
    Optional<Employment> findByApplicationId(Long applicationId);
}
