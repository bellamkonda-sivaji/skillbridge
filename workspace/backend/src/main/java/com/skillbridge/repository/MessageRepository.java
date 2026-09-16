package com.skillbridge.repository;

import com.skillbridge.model.Conversation;
import com.skillbridge.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationOrderByCreatedAtAsc(Conversation conversation);
    List<Message> findByConversationOrderByCreatedAtDesc(Conversation conversation, Pageable pageable);
    List<Message> findByConversationIdAndReadFalseAndSenderIdNot(Long conversationId, Long senderId);
    long countByConversationIdAndReadFalseAndSenderIdNot(Long conversationId, Long senderId);
}
