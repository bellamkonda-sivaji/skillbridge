package com.skillbridge.service;

import com.skillbridge.dto.NotificationDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.Account;
import com.skillbridge.model.AccountType;
import com.skillbridge.model.Notification;
import com.skillbridge.model.NotificationType;
import com.skillbridge.repository.NotificationRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final PushService pushService;

    public NotificationService(NotificationRepository notificationRepository,
                               SimpMessagingTemplate messagingTemplate,
                               PushService pushService) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
        this.pushService = pushService;
    }

    /**
     * Which channel a kind of notification belongs in.
     *
     * These ids have to match the ones the apps create on the phone, or Android
     * drops the message into its own default channel and the person's choice of
     * what to silence is quietly ignored.
     */
    private static String channelFor(NotificationType type) {
        if (type == null) return "office.v1";
        return switch (type) {
            case JOB_MATCH, APPLICATION -> "work.v1";
            case INTERVIEW -> "shifts.v1";
            case MESSAGE, REVIEW, SYSTEM, VERIFICATION, PRICING -> "office.v1";
        };
    }

    @Transactional
    public NotificationDto notify(Account owner, String title, String body, NotificationType type, String link) {
        return notify(owner.accountType(), owner.getId(), title, body, type, link);
    }

    @Transactional
    public NotificationDto notify(AccountType ownerType, Long ownerId, String title, String body,
                                  NotificationType type, String link) {
        Notification n = Notification.builder()
                .ownerType(ownerType)
                .ownerId(ownerId)
                .title(title)
                .body(body)
                .type(type)
                .link(link)
                .read(false)
                .build();
        notificationRepository.save(n);
        NotificationDto dto = NotificationDto.from(n);
        // Topic is namespaced because ids are only unique inside their own table.
        messagingTemplate.convertAndSend("/topic/notifications/" + ownerType.name() + "/" + ownerId, dto);
        // The websocket only reaches an app that is open. This reaches the phone
        // in someone's pocket, which is the whole point of a job alert.
        pushService.push(ownerType, ownerId, title, body, channelFor(type),
                link == null ? java.util.Map.of() : java.util.Map.of("link", link));
        return dto;
    }

    public List<NotificationDto> listFor(AccountType ownerType, Long ownerId) {
        return notificationRepository.findByOwnerTypeAndOwnerIdOrderByCreatedAtDesc(ownerType, ownerId)
                .stream().map(NotificationDto::from).toList();
    }

    public long unreadCount(AccountType ownerType, Long ownerId) {
        return notificationRepository.countByOwnerTypeAndOwnerIdAndReadFalse(ownerType, ownerId);
    }

    @Transactional
    public void markRead(Long notificationId, AccountType ownerType, Long ownerId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> ApiException.notFound("Notification not found"));
        if (n.getOwnerType() != ownerType || !n.getOwnerId().equals(ownerId)) {
            throw ApiException.forbidden("Not your notification");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead(AccountType ownerType, Long ownerId) {
        notificationRepository.findByOwnerTypeAndOwnerIdOrderByCreatedAtDesc(ownerType, ownerId)
                .forEach(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                });
    }
}
