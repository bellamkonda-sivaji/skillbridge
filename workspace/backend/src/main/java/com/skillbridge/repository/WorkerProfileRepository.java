package com.skillbridge.repository;

import com.skillbridge.model.User;
import com.skillbridge.model.WorkerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, Long> {
    Optional<WorkerProfile> findByUserId(Long userId);

    @Query("select w from WorkerProfile w where lower(w.jobTitle) like lower(concat('%', :q, '%')) " +
           "or lower(w.city) like lower(concat('%', :q, '%')) " +
           "or lower(w.area) like lower(concat('%', :q, '%'))")
    List<WorkerProfile> search(@Param("q") String q);

    @Query("select w from WorkerProfile w join w.skills s where lower(s) like lower(concat('%', :skill, '%'))")
    List<WorkerProfile> findBySkillContaining(@Param("skill") String skill);

    long countByVerificationStatus(com.skillbridge.model.VerificationStatus status);
}
