package com.skillbridge.repository;

import com.skillbridge.model.Lead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findAllByOrderByCreatedAtDesc();
    Optional<Lead> findFirstByPhoneOrderByCreatedAtDesc(String phone);
}
