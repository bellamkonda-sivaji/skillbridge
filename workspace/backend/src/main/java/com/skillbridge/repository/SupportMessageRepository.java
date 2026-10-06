package com.skillbridge.repository;

import com.skillbridge.model.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {
    List<SupportMessage> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
