package com.skillbridge.repository;

import com.skillbridge.model.JobPost;
import com.skillbridge.model.JobApplication;
import com.skillbridge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    Optional<JobApplication> findByWorkerIdAndJobId(Long workerId, Long jobId);
    List<JobApplication> findByWorkerOrderByAppliedAtDesc(User worker);
    List<JobApplication> findByJobOrderByAppliedAtDesc(JobPost job);
    List<JobApplication> findByJobEmployerOrderByAppliedAtDesc(User employer);
    long countByJobId(Long jobId);
}
