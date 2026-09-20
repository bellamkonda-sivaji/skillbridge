package com.skillbridge.repository;

import com.skillbridge.model.Conversation;
import com.skillbridge.model.EmployerAccount;
import com.skillbridge.model.WorkerAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByWorkerOrderByLastMessageAtDesc(WorkerAccount worker);
    List<Conversation> findByEmployerOrderByLastMessageAtDesc(EmployerAccount employer);
    Optional<Conversation> findByWorkerAndEmployer(WorkerAccount worker, EmployerAccount employer);
    Optional<Conversation> findByWorkerAndEmployerAndJobId(WorkerAccount worker, EmployerAccount employer, Long jobId);
}
