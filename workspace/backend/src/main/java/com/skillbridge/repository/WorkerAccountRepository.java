package com.skillbridge.repository;

import com.skillbridge.model.WorkerAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WorkerAccountRepository extends JpaRepository<WorkerAccount, Long> {
    Optional<WorkerAccount> findByPhone(String phone);
    Optional<WorkerAccount> findByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByEmail(String email);
    long countByCreatedAtAfter(LocalDateTime time);

    @Query("select w from WorkerAccount w where lower(w.name) like lower(concat('%', :q, '%'))")
    List<WorkerAccount> searchByName(@Param("q") String q);
}
