package com.skillbridge.service;

import com.skillbridge.dto.ConversationDto;
import com.skillbridge.dto.MessageDto;
import com.skillbridge.dto.SendMessageRequest;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final WorkerAccountRepository workerRepository;
    private final EmployerAccountRepository employerRepository;
    private final JobPostRepository jobRepository;
    private final AccountDirectory accountDirectory;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatService(ConversationRepository conversationRepository, MessageRepository messageRepository,
                       WorkerAccountRepository workerRepository, EmployerAccountRepository employerRepository,
                       JobPostRepository jobRepository, AccountDirectory accountDirectory,
                       SimpMessagingTemplate messagingTemplate) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.workerRepository = workerRepository;
        this.employerRepository = employerRepository;
        this.jobRepository = jobRepository;
        this.accountDirectory = accountDirectory;
        this.messagingTemplate = messagingTemplate;
    }

    public List<ConversationDto> listConversations(Account account) {
        List<Conversation> conversations = switch (account.accountType()) {
            case WORKER -> conversationRepository
                    .findByWorkerOrderByLastMessageAtDesc((WorkerAccount) account);
            case EMPLOYER -> conversationRepository
                    .findByEmployerOrderByLastMessageAtDesc((EmployerAccount) account);
            case ADMIN -> conversationRepository.findAll();
        };
        return conversations.stream().map(c -> conversationDto(c, account)).toList();
    }

    @Transactional
    public Conversation getOrCreateConversation(WorkerAccount worker, EmployerAccount employer, JobPost job) {
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
    public MessageDto sendMessage(Account sender, SendMessageRequest request) {
        Conversation conversation;
        if (request.conversationId() != null) {
            conversation = conversationRepository.findById(request.conversationId())
                    .orElseThrow(() -> ApiException.notFound("Conversation not found"));
        } else {
            JobPost job = request.jobId() != null
                    ? jobRepository.findById(request.jobId()).orElse(null) : null;
            conversation = openWith(sender, request.recipientId(), job);
        }
        if (!isParticipant(conversation, sender)) {
            throw ApiException.forbidden("You are not part of this conversation");
        }

        Message message = messageRepository.save(Message.builder()
                .conversation(conversation)
                .senderType(sender.accountType())
                .senderId(sender.getId())
                .content(request.content())
                .type(MessageType.TEXT)
                .read(false)
                .build());
        conversation.setLastMessageAt(LocalDateTime.now());
        conversation.setLastMessageId(message.getId());
        conversationRepository.save(conversation);

        MessageDto dto = MessageDto.from(message, sender.getName());
        messagingTemplate.convertAndSend("/topic/chat/" + conversation.getId(), dto);
        AccountType otherType = sender.accountType() == AccountType.WORKER
                ? AccountType.EMPLOYER : AccountType.WORKER;
        Long otherId = otherType == AccountType.WORKER
                ? conversation.getWorker().getId() : conversation.getEmployer().getId();
        messagingTemplate.convertAndSend("/topic/conversations/" + otherType.name() + "/" + otherId, dto);
        return dto;
    }

    /** The counterparty always lives in the opposite namespace, so the id is unambiguous. */
    private Conversation openWith(Account sender, Long recipientId, JobPost job) {
        if (recipientId == null) {
            throw ApiException.badRequest("A conversation id or a recipient id is required");
        }
        if (sender instanceof WorkerAccount worker) {
            EmployerAccount employer = employerRepository.findById(recipientId)
                    .orElseThrow(() -> ApiException.notFound("Employer not found"));
            return getOrCreateConversation(worker, employer, job);
        }
        if (sender instanceof EmployerAccount employer) {
            WorkerAccount worker = workerRepository.findById(recipientId)
                    .orElseThrow(() -> ApiException.notFound("Worker not found"));
            return getOrCreateConversation(worker, employer, job);
        }
        throw ApiException.forbidden("Conversations are only between workers and employers");
    }

    public List<MessageDto> getMessages(Account account, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> ApiException.notFound("Conversation not found"));
        if (!isParticipant(conversation, account)) {
            throw ApiException.forbidden("You are not part of this conversation");
        }
        return messageRepository.findByConversationOrderByCreatedAtAsc(conversation).stream()
                .map(m -> MessageDto.from(m, accountDirectory.nameOf(m.getSenderType(), m.getSenderId())))
                .toList();
    }

    @Transactional
    public void markRead(Account account, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> ApiException.notFound("Conversation not found"));
        if (!isParticipant(conversation, account)) {
            throw ApiException.forbidden("You are not part of this conversation");
        }
        messageRepository.findUnreadNotSentBy(conversationId, account.accountType(), account.getId())
                .forEach(m -> {
                    m.setRead(true);
                    messageRepository.save(m);
                });
    }

    public ConversationDto conversationDto(Conversation c, Account viewer) {
        Message last = messageRepository
                .findByConversationOrderByCreatedAtDesc(c, PageRequest.of(0, 1))
                .stream().findFirst().orElse(null);
        long unread = messageRepository.countUnreadNotSentBy(c.getId(), viewer.accountType(), viewer.getId());
        return ConversationDto.from(c,
                last != null ? last.getContent() : "",
                last != null ? last.getSenderType() : null,
                last != null ? last.getSenderId() : null, unread);
    }

    private boolean isParticipant(Conversation c, Account account) {
        return switch (account.accountType()) {
            case WORKER -> c.getWorker().getId().equals(account.getId());
            case EMPLOYER -> c.getEmployer().getId().equals(account.getId());
            case ADMIN -> true;
        };
    }
}
