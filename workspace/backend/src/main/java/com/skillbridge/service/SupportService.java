package com.skillbridge.service;

import com.skillbridge.dto.SupportDtos.*;
import com.skillbridge.model.*;
import com.skillbridge.repository.SupportMessageRepository;
import com.skillbridge.repository.SupportTicketRepository;
import com.skillbridge.exception.ApiException;
import com.skillbridge.security.AuthenticationUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * The help desk.
 *
 * Both sides of the product raise tickets here and the back office answers
 * them. Two rules hold the thing together: a person may only ever see their
 * own tickets, and every reply moves the ticket's clock so the inbox can sort
 * by who has been waiting longest.
 */
@Service
public class SupportService {

    private final SupportTicketRepository tickets;
    private final SupportMessageRepository messages;

    public SupportService(SupportTicketRepository tickets, SupportMessageRepository messages) {
        this.tickets = tickets;
        this.messages = messages;
    }

    /* ------------------------------------------------------------ raising -- */

    @Transactional
    public TicketView raise(RaiseRequest request) {
        Account me = AuthenticationUtils.currentAccount();
        AccountType type = AuthenticationUtils.currentType();

        if (type == AccountType.ADMIN) {
            throw ApiException.forbidden("Admins answer tickets, they do not raise them.");
        }
        String body = request.getMessage() == null ? "" : request.getMessage().trim();
        if (body.isEmpty()) {
            throw ApiException.badRequest("Please tell us what the problem is.");
        }

        SupportTicket ticket = SupportTicket.builder()
                .raiserType(type)
                .raiserId(AuthenticationUtils.currentId())
                .raiserName(me.getName())
                .raiserPhone(me.getPhone())
                .topic(request.getTopic() == null ? SupportTopic.OTHER : request.getTopic())
                .message(body)
                .languageCode(request.getLanguageCode())
                .status(SupportTicketStatus.OPEN)
                .callBack(request.isCallBack())
                .aboutType(request.getAboutType())
                .aboutId(request.getAboutId())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return view(tickets.save(ticket));
    }

    /** Their own requests, so they can see somebody picked it up. */
    @Transactional(readOnly = true)
    public List<TicketView> mine() {
        return tickets
                .findByRaiserTypeAndRaiserIdOrderByCreatedAtDesc(
                        AuthenticationUtils.currentType(), AuthenticationUtils.currentId())
                .stream()
                .map(this::view)
                .toList();
    }

    @Transactional(readOnly = true)
    public TicketView mineById(Long id) {
        return view(ownedByMe(id));
    }

    @Transactional
    public TicketView replyAsRaiser(Long id, ReplyRequest request) {
        SupportTicket ticket = ownedByMe(id);
        Account me = AuthenticationUtils.currentAccount();
        append(ticket, AuthenticationUtils.currentType(), AuthenticationUtils.currentId(),
                me.getName(), request.getBody(), false);

        // Their reply means it was not actually finished.
        if (ticket.getStatus() == SupportTicketStatus.RESOLVED
                || ticket.getStatus() == SupportTicketStatus.CLOSED) {
            ticket.setStatus(SupportTicketStatus.OPEN);
            ticket.setResolvedAt(null);
        }
        return view(tickets.save(ticket));
    }

    /* ------------------------------------------------------- the back office -- */

    @Transactional(readOnly = true)
    public List<TicketView> inbox(SupportTicketStatus status) {
        List<SupportTicket> rows = status == null
                ? tickets.findAllByOrderByCreatedAtDesc()
                : tickets.findByStatusOrderByCreatedAtDesc(status);
        return rows.stream().map(this::view).toList();
    }

    @Transactional(readOnly = true)
    public TicketView byId(Long id) {
        return view(found(id));
    }

    @Transactional(readOnly = true)
    public SupportSummary summary() {
        return SupportSummary.builder()
                .open(tickets.countByStatus(SupportTicketStatus.OPEN))
                .inProgress(tickets.countByStatus(SupportTicketStatus.IN_PROGRESS))
                .resolved(tickets.countByStatus(SupportTicketStatus.RESOLVED))
                .closed(tickets.countByStatus(SupportTicketStatus.CLOSED))
                .waitingCallBack(tickets
                        .findByStatusInOrderByCreatedAtDesc(
                                List.of(SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS))
                        .stream().filter(SupportTicket::isCallBack).count())
                .build();
    }

    /** Taking a ticket also puts the admin's name on it, so two people do not both ring. */
    @Transactional
    public TicketView assignToMe(Long id) {
        AdminAccount admin = AuthenticationUtils.currentAdmin();
        SupportTicket ticket = found(id);
        ticket.setAssignedAdminId(admin.getId());
        ticket.setAssignedAdminName(admin.getName());
        if (ticket.getStatus() == SupportTicketStatus.OPEN) {
            ticket.setStatus(SupportTicketStatus.IN_PROGRESS);
        }
        ticket.setUpdatedAt(LocalDateTime.now());
        return view(tickets.save(ticket));
    }

    @Transactional
    public TicketView replyAsAdmin(Long id, ReplyRequest request) {
        AdminAccount admin = AuthenticationUtils.currentAdmin();
        SupportTicket ticket = found(id);
        append(ticket, AccountType.ADMIN, admin.getId(), admin.getName(),
                request.getBody(), request.isPhoneCall());

        if (ticket.getAssignedAdminId() == null) {
            ticket.setAssignedAdminId(admin.getId());
            ticket.setAssignedAdminName(admin.getName());
        }
        if (ticket.getStatus() == SupportTicketStatus.OPEN) {
            ticket.setStatus(SupportTicketStatus.IN_PROGRESS);
        }
        return view(tickets.save(ticket));
    }

    @Transactional
    public TicketView setStatus(Long id, SupportTicketStatus status) {
        if (status == null) {
            throw ApiException.badRequest("A status is required.");
        }
        SupportTicket ticket = found(id);
        ticket.setStatus(status);
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket.setResolvedAt(
                status == SupportTicketStatus.RESOLVED || status == SupportTicketStatus.CLOSED
                        ? LocalDateTime.now() : null);
        return view(tickets.save(ticket));
    }

    /* ----------------------------------------------------------------- bits -- */

    private void append(SupportTicket ticket, AccountType type, Long authorId,
                        String authorName, String rawBody, boolean phoneCall) {
        String body = rawBody == null ? "" : rawBody.trim();
        // A logged phone call is allowed to carry no text: the call was the reply.
        if (body.isEmpty() && !phoneCall) {
            throw ApiException.badRequest("Write something before sending.");
        }
        messages.save(SupportMessage.builder()
                .ticket(ticket)
                .authorType(type)
                .authorId(authorId)
                .authorName(authorName)
                .body(body)
                .phoneCall(phoneCall)
                .createdAt(LocalDateTime.now())
                .build());
        ticket.setUpdatedAt(LocalDateTime.now());
    }

    private SupportTicket found(Long id) {
        return tickets.findById(id).orElseThrow(
                () -> ApiException.notFound("No such help request."));
    }

    /**
     * Ids are only unique inside one account namespace, so a worker and an
     * employer can share a raiserId. Both halves have to match or a worker
     * could read an employer's ticket by guessing a number.
     */
    private SupportTicket ownedByMe(Long id) {
        SupportTicket ticket = found(id);
        if (ticket.getRaiserType() != AuthenticationUtils.currentType()
                || !ticket.getRaiserId().equals(AuthenticationUtils.currentId())) {
            throw ApiException.notFound("No such help request.");
        }
        return ticket;
    }

    private TicketView view(SupportTicket ticket) {
        List<MessageView> thread = messages.findByTicketIdOrderByCreatedAtAsc(ticket.getId())
                .stream().map(MessageView::of).toList();
        return TicketView.of(ticket, thread);
    }
}
