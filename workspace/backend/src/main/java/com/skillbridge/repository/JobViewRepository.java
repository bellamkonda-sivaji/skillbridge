package com.skillbridge.repository;

import com.skillbridge.model.JobView;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobViewRepository extends JpaRepository<JobView, Long> {
    boolean existsByJobIdAndWorkerId(Long jobId, Long workerId);
}
