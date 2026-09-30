package com.skillbridge.repository;

import com.skillbridge.model.JobPriceChange;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface JobPriceChangeRepository extends JpaRepository<JobPriceChange, Long> {

    List<JobPriceChange> findByJobIdOrderByChangedAtDesc(Long jobId);

    long countByJobId(Long jobId);

    List<JobPriceChange> findByChangedAtAfterOrderByChangedAtDesc(LocalDateTime since);
}
