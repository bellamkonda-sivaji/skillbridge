package com.skillbridge.repository;

import com.skillbridge.model.EmployerAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EmployerAccountRepository extends JpaRepository<EmployerAccount, Long> {
    Optional<EmployerAccount> findByPhone(String phone);
    Optional<EmployerAccount> findByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByEmail(String email);
    long countByCreatedAtAfter(LocalDateTime time);

    @Query("select e from EmployerAccount e where lower(e.name) like lower(concat('%', :q, '%'))")
    List<EmployerAccount> searchByName(@Param("q") String q);
}
