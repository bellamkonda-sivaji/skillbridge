package com.skillbridge.repository;

import com.skillbridge.model.Attendance;
import com.skillbridge.model.Employment;
import com.skillbridge.model.WorkerAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByEmploymentAndWorkDate(Employment employment, LocalDate workDate);
    List<Attendance> findByEmploymentOrderByWorkDateDesc(Employment employment);
    List<Attendance> findByEmploymentAndWorkDateBetweenOrderByWorkDateDesc(
            Employment employment, LocalDate from, LocalDate to);
    List<Attendance> findByEmploymentInAndWorkDateBetweenOrderByWorkDateDesc(
            List<Employment> employments, LocalDate from, LocalDate to);

    /**
     * Every day this worker has actually finished, across all their jobs.
     *
     * Checked out, not merely checked in: a day only counts once they have
     * stopped work. This is what the worker app turns into a milestone stamp.
     */
    long countByEmployment_WorkerAndCheckOutAtIsNotNull(WorkerAccount worker);
}
