package com.skillbridge.service;

import com.skillbridge.dto.ConversationDto;
import com.skillbridge.dto.MessageDto;
import com.skillbridge.dto.SendMessageRequest;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final JobPostRepository jobRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatService(ConversationRepository conversationRepository, MessageRepository messageRepository,
                       UserRepository userRepository, JobPostRepository jobRepository,
                       SimpMessagingTemplate messagingTemplate) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public List<ConversationDto> listConversations(User user) {
        return conversationRepository.findByWorkerOrEmployerOrderByLastMessageAtDesc(user, user).stream()
                .map(c -> {
                    Message last = messageRepository.findByConversationOrderByCreatedAtDesc(c, org.springframework.data.domain.PageRequest.of(0, 1))
                            .stream().findFirst().orElse(null);
                    long unread = messageRepository.countByConversationIdAndReadFalseAndSenderIdNot(c.getId(), user.getId());
                    return ConversationDto.from(c,
                            last != null ? last.getContent() : "",
                            last != null ? last.getSender().getId() : null, unread);
                }).toList();
    }

    @Transactional
    public Conversation getOrCreateConversation(User initiator, User other, JobPost job) {
        if (initiator.getRole() == other.getRole()) {
            throw ApiException.badRequest("Conversations are only allowed between workers and employers");
        }
        User worker;
        User employer;
        if (initiator.getRole() == Role.WORKER) {
            worker = initiator;
            employer = other;
        } else {
            employer = initiator;
            worker = other;
        }
        if (job != null && job.getEmployer().getId().equals(employer.getId())) {
            return conversationRepository.findByWorkerAndEmployerAndJobId(worker, employer, job.getId())
                    .orElseGet(() -> conversationRepository.save(
                            Conversation.builder().worker(worker).employer(employer).job(job).build()));
        }
        return conversationRepository.findByWorkerAndEmployer(worker, employer)
                .orElseGet(() -> conversationRepository.save(
                        Conversation.builder().worker(worker).employer(employer).job(job).build()));
    }

    @Transactional
    public MessageDto sendMessage(User sender, SendMessageRequest request) {
        Conversation conversation;
        if (request.conversationId() != null) {
            conversation = conversationRepository.findById(request.conversationId())
                    .orElseThrow(() -> ApiException.notFound("Conversation not found"));
        } else {
            User recipient = userRepository.findById(request.recipientId())
                    .orElseThrow(() -> ApiException.notFound("Recipient not found"));
            JobPost job = request.jobId() != null
                    ? jobRepository.findById(request.jobId()).orElse(null) : null;
            conversation = getOrCreateConversation(sender, recipient, job);
        }
        if (!isParticipant(conversation, sender)) {
            throw ApiException.forbidden("You are not part of this conversation");
        }

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.content())
                .type(MessageType.TEXT)
                .read(false)
                .build();
        message = messageRepository.save(message);
        conversation.setLastMessageAt(LocalDateTime.now());
        conversation.setLastMessageId(message.getId());
        conversationRepository.save(conversation);

        User other = conversation.getWorker().getId().equals(sender.getId())
                ? conversation.getEmployer() : conversation.getWorker();
        MessageDto dto = MessageDto.from(message);
        messagingTemplate.convertAndSend("/topic/chat/" + conversation.getId(), dto);
        messagingTemplate.convertAndSend("/topic/conversations/" + other.getId(), dto);
        return dto;
    }

    public List<MessageDto> getMessages(User user, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> ApiException.notFound("Conversation not found"));
        if (!isParticipant(conversation, user)) {
            throw ApiException.forbidden("You are not part of this conversation");
        }
        return messageRepository.findByConversationOrderByCreatedAtAsc(conversation).stream()
                .map(MessageDto::from).toList();
    }

    @Transactional
    public void markRead(User user, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> ApiException.notFound("Conversation not found"));
        if (!isParticipant(conversation, user)) {
            throw ApiException.forbidden("You are not part of this conversation");
        }
        messageRepository.findByConversationIdAndReadFalseAndSenderIdNot(conversationId, user.getId())
                .forEach(m -> {
                    m.setRead(true);
                    messageRepository.save(m);
                });
    }

    public ConversationDto conversationDto(Conversation c, User viewer) {
        Message last = messageRepository.findByConversationOrderByCreatedAtDesc(c, org.springframework.data.domain.PageRequest.of(0, 1))
                .stream().findFirst().orElse(null);
        long unread = messageRepository.countByConversationIdAndReadFalseAndSenderIdNot(c.getId(), viewer.getId());
        return ConversationDto.from(c,
                last != null ? last.getContent() : "",
                last != null ? last.getSender().getId() : null, unread);
    }

    private boolean isParticipant(Conversation c, User u) {
        return c.getWorker().getId().equals(u.getId()) || c.getEmployer().getId().equals(u.getId());
    }
}
