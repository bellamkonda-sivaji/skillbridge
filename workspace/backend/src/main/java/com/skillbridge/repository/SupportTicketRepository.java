package com.skillbridge.repository;

import com.skillbridge.model.AccountType;
import com.skillbridge.model.SupportTicket;
import com.skillbridge.model.SupportTicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    /** Everything one person raised, newest first - their own "my requests" list. */
    List<SupportTicket> findByRaiserTypeAndRaiserIdOrderByCreatedAtDesc(AccountType raiserType, Long raiserId);

    /** The admin inbox, unfiltered. */
    List<SupportTicket> findAllByOrderByCreatedAtDesc();

    List<SupportTicket> findByStatusOrderByCreatedAtDesc(SupportTicketStatus status);

    List<SupportTicket> findByStatusInOrderByCreatedAtDesc(List<SupportTicketStatus> statuses);

    long countByStatus(SupportTicketStatus status);
}
