package com.skillbridge.dto;

import com.skillbridge.model.AccountType;
import com.skillbridge.model.SupportTicket;
import com.skillbridge.model.SupportMessage;
import com.skillbridge.model.SupportTicketStatus;
import com.skillbridge.model.SupportTopic;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/** Wire shapes for the help desk. */
public class SupportDtos {

    /** What the app sends when someone asks for help. */
    @Getter @Setter @NoArgsConstructor
    public static class RaiseRequest {
        private SupportTopic topic;
        private String message;
        private boolean callBack;
        private String languageCode;
        private String aboutType;
        private Long aboutId;
    }

    /** A reply, from either side. */
    @Getter @Setter @NoArgsConstructor
    public static class ReplyRequest {
        private String body;
        private boolean phoneCall;
    }

    @Getter @Setter @NoArgsConstructor
    public static class StatusRequest {
        private SupportTicketStatus status;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MessageView {
        private Long id;
        private AccountType authorType;
        private String authorName;
        private String body;
        private boolean phoneCall;
        private LocalDateTime createdAt;

        public static MessageView of(SupportMessage m) {
            return MessageView.builder()
                    .id(m.getId())
                    .authorType(m.getAuthorType())
                    .authorName(m.getAuthorName())
                    .body(m.getBody())
                    .phoneCall(m.isPhoneCall())
                    .createdAt(m.getCreatedAt())
                    .build();
        }
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TicketView {
        private Long id;
        private AccountType raiserType;
        private Long raiserId;
        private String raiserName;
        private String raiserPhone;
        private SupportTopic topic;
        private String message;
        private String languageCode;
        private SupportTicketStatus status;
        private boolean callBack;
        private Long assignedAdminId;
        private String assignedAdminName;
        private String aboutType;
        private Long aboutId;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime resolvedAt;
        private List<MessageView> messages;

        public static TicketView of(SupportTicket ticket, List<MessageView> messages) {
            return TicketView.builder()
                    .id(ticket.getId())
                    .raiserType(ticket.getRaiserType())
                    .raiserId(ticket.getRaiserId())
                    .raiserName(ticket.getRaiserName())
                    .raiserPhone(ticket.getRaiserPhone())
                    .topic(ticket.getTopic())
                    .message(ticket.getMessage())
                    .languageCode(ticket.getLanguageCode())
                    .status(ticket.getStatus())
                    .callBack(ticket.isCallBack())
                    .assignedAdminId(ticket.getAssignedAdminId())
                    .assignedAdminName(ticket.getAssignedAdminName())
                    .aboutType(ticket.getAboutType())
                    .aboutId(ticket.getAboutId())
                    .createdAt(ticket.getCreatedAt())
                    .updatedAt(ticket.getUpdatedAt())
                    .resolvedAt(ticket.getResolvedAt())
                    .messages(messages)
                    .build();
        }
    }

    /** The counts the admin inbox shows above the list. */
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SupportSummary {
        private long open;
        private long inProgress;
        private long resolved;
        private long closed;
        private long waitingCallBack;
    }
}
