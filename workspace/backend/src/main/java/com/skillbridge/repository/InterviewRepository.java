package com.skillbridge.repository;

import com.skillbridge.model.Interview;
import com.skillbridge.model.InterviewStatus;
import com.skillbridge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByEmployerOrderByScheduledAtDesc(User employer);
    List<Interview> findByWorkerOrderByScheduledAtDesc(User worker);
    List<Interview> findAllByOrderByScheduledAtDesc();
    long countByStatus(InterviewStatus status);
    long countByScheduledAtAfter(LocalDateTime time);
}
