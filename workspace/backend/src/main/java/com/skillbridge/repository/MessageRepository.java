package com.skillbridge.repository;

import com.skillbridge.model.AccountType;
import com.skillbridge.model.Conversation;
import com.skillbridge.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationOrderByCreatedAtAsc(Conversation conversation);
    List<Message> findByConversationOrderByCreatedAtDesc(Conversation conversation, Pageable pageable);

    @Query("select m from Message m where m.conversation.id = :conversationId and m.read = false "
            + "and not (m.senderType = :type and m.senderId = :id)")
    List<Message> findUnreadNotSentBy(@Param("conversationId") Long conversationId,
                                      @Param("type") AccountType type, @Param("id") Long id);

    @Query("select count(m) from Message m where m.conversation.id = :conversationId and m.read = false "
            + "and not (m.senderType = :type and m.senderId = :id)")
    long countUnreadNotSentBy(@Param("conversationId") Long conversationId,
                              @Param("type") AccountType type, @Param("id") Long id);
}
