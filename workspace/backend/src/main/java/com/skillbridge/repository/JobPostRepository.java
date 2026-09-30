package com.skillbridge.repository;

import com.skillbridge.model.EmployerAccount;
import com.skillbridge.model.JobPost;
import com.skillbridge.model.JobStatus;
import com.skillbridge.model.WorkType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface JobPostRepository extends JpaRepository<JobPost, Long>, JpaSpecificationExecutor<JobPost> {
    List<JobPost> findByEmployerOrderByPostedAtDesc(EmployerAccount employer);
    List<JobPost> findByStatusOrderByPostedAtDesc(JobStatus status);
    List<JobPost> findByEmployerAndStatus(EmployerAccount employer, JobStatus status);

    long countByStatus(JobStatus status);
    long countByWorkType(WorkType type);
    long countByUrgentTrueAndStatus(JobStatus status);
    long countByStatusAndPostedAtAfter(JobStatus status, java.time.LocalDateTime time);
    long countByEmployerIdAndStatus(Long employerAccountId, JobStatus status);
    long countByEmployerAndStatus(EmployerAccount employer, JobStatus status);
    List<JobPost> findByEmployerAndStatusOrderByPostedAtDesc(EmployerAccount employer, JobStatus status);

    @Query("select j from JobPost j where j.status = :status and lower(j.title) like lower(concat('%', :q, '%')) " +
           "or (j.status = :status and lower(j.city) like lower(concat('%', :q, '%')))")
    List<JobPost> search(@Param("status") JobStatus status, @Param("q") String q);

    @Query("select distinct j from JobPost j join j.requiredSkills s " +
           "where lower(s) like lower(concat('%', :skill, '%'))")
    List<JobPost> findByRequiredSkillContaining(@Param("skill") String skill);

    /** Comparable local postings, for reading what this kind of work actually pays nearby. */
    @Query("select j from JobPost j where j.id <> :excludeId and j.salary > 0 " +
           "and lower(j.city) = lower(:city) and j.workerCategory = :category " +
           "and j.salaryUnit = :unit and j.postedAt > :since")
    List<JobPost> findComparables(@Param("excludeId") Long excludeId,
                                  @Param("city") String city,
                                  @Param("category") com.skillbridge.model.WorkerCategory category,
                                  @Param("unit") com.skillbridge.model.SalaryUnit unit,
                                  @Param("since") java.time.LocalDateTime since);
}
