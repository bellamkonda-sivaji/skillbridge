package com.skillbridge.repository;

import com.skillbridge.model.AttendanceRequest;
import com.skillbridge.model.AttendanceRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRequestRepository extends JpaRepository<AttendanceRequest, Long> {

    List<AttendanceRequest> findByWorkerIdOrderByCreatedAtDesc(Long workerId);

    List<AttendanceRequest> findByEmployerIdOrderByCreatedAtDesc(Long employerId);

    List<AttendanceRequest> findByStatusOrderByCreatedAtAsc(AttendanceRequestStatus status);

    Optional<AttendanceRequest> findFirstByEmploymentIdAndWorkDateAndStatus(
            Long employmentId, LocalDate workDate, AttendanceRequestStatus status);

    List<AttendanceRequest> findByEmploymentIdAndStatus(Long employmentId, AttendanceRequestStatus status);

    List<AttendanceRequest> findAllByOrderByCreatedAtDesc();
}
