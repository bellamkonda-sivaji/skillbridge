package com.skillbridge.repository;

import com.skillbridge.model.AdminAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminAccountRepository extends JpaRepository<AdminAccount, Long> {
    Optional<AdminAccount> findByEmail(String email);
    Optional<AdminAccount> findByPhone(String phone);
    boolean existsByEmail(String email);
}
