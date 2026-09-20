package com.skillbridge.repository;

import com.skillbridge.model.EmployerAccount;
import com.skillbridge.model.Interview;
import com.skillbridge.model.InterviewStatus;
import com.skillbridge.model.WorkerAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByEmployerOrderByScheduledAtDesc(EmployerAccount employer);
    List<Interview> findByWorkerOrderByScheduledAtDesc(WorkerAccount worker);
    List<Interview> findAllByOrderByScheduledAtDesc();
    long countByStatus(InterviewStatus status);
    long countByScheduledAtAfter(LocalDateTime time);
    long countByWorkerAndStatusNot(WorkerAccount worker, InterviewStatus status);

    List<Interview> findByEmployerAndScheduledAtBetweenOrderByScheduledAtAsc(
            EmployerAccount employer, LocalDateTime from, LocalDateTime to);
    long countByEmployerAndScheduledAtBetweenAndStatusNot(
            EmployerAccount employer, LocalDateTime from, LocalDateTime to, InterviewStatus status);
}
