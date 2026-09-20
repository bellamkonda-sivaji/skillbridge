package com.skillbridge.repository;

import com.skillbridge.model.SavedJob;
import com.skillbridge.model.WorkerAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {
    List<SavedJob> findByWorkerOrderByCreatedAtDesc(WorkerAccount worker);
    Optional<SavedJob> findByWorkerIdAndJobId(Long workerId, Long jobId);
    boolean existsByWorkerIdAndJobId(Long workerId, Long jobId);
    void deleteByWorkerIdAndJobId(Long workerId, Long jobId);
}
