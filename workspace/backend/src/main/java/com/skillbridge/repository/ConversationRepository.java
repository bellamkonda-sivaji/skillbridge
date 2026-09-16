package com.skillbridge.repository;

import com.skillbridge.model.Conversation;
import com.skillbridge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByWorkerOrEmployerOrderByLastMessageAtDesc(User worker, User employer);
    Optional<Conversation> findByWorkerAndEmployer(User worker, User employer);
    Optional<Conversation> findByWorkerAndEmployerAndJobId(User worker, User employer, Long jobId);
}
