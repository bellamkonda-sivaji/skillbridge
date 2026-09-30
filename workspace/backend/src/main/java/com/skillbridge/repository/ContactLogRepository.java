package com.skillbridge.repository;

import com.skillbridge.model.ContactLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ContactLogRepository extends JpaRepository<ContactLog, Long> {
    List<ContactLog> findByApplicationIdOrderByContactedAtAsc(Long applicationId);
    List<ContactLog> findAllByOrderByContactedAtDesc();
    long countByApplicationId(Long applicationId);
    long countByContactedAtBetween(LocalDateTime from, LocalDateTime to);
    List<ContactLog> findByContactedAtBetween(LocalDateTime from, LocalDateTime to);
    List<ContactLog> findByWorkerIdOrderByContactedAtDesc(Long workerId);
    List<ContactLog> findByEmployerIdOrderByContactedAtDesc(Long employerId);
    List<ContactLog> findByJobIdOrderByContactedAtDesc(Long jobId);
}
