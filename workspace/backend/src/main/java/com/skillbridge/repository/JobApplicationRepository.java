package com.skillbridge.repository;

import com.skillbridge.model.ApplicationStatus;
import com.skillbridge.model.EmployerAccount;
import com.skillbridge.model.JobApplication;
import com.skillbridge.model.JobPost;
import com.skillbridge.model.WorkerAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    Optional<JobApplication> findByWorkerIdAndJobId(Long workerId, Long jobId);
    List<JobApplication> findByWorkerOrderByAppliedAtDesc(WorkerAccount worker);
    List<JobApplication> findByJobOrderByAppliedAtDesc(JobPost job);
    List<JobApplication> findByJobEmployerOrderByAppliedAtDesc(EmployerAccount employer);
    long countByJobId(Long jobId);
    long countByWorker(WorkerAccount worker);
    long countByWorkerAndStatus(WorkerAccount worker, ApplicationStatus status);

    List<JobApplication> findByJobIdOrderByAppliedAtDesc(Long jobId);
    long countByJobIdAndStatus(Long jobId, ApplicationStatus status);
    long countByJobEmployer(EmployerAccount employer);
    long countByJobEmployerAndStatus(EmployerAccount employer, ApplicationStatus status);
    List<JobApplication> findByJobEmployerAndStatusIn(EmployerAccount employer, List<ApplicationStatus> statuses);
}
