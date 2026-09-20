package com.skillbridge.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    /** Polymorphic sender: either side of the conversation, and system messages from an admin. */
    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false)
    private AccountType senderType;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(length = 4000)
    private String content;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private MessageType type = MessageType.TEXT;

    private boolean read;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public boolean isFrom(AccountType type, Long id) {
        return senderType == type && senderId != null && senderId.equals(id);
    }
}
