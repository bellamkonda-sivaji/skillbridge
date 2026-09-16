package com.skillbridge.service;

import com.skillbridge.dto.NotificationDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.Notification;
import com.skillbridge.model.NotificationType;
import com.skillbridge.model.User;
import com.skillbridge.repository.NotificationRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository, SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public NotificationDto notify(User user, String title, String body, NotificationType type, String link) {
        Notification n = Notification.builder()
                .user(user)
                .title(title)
                .body(body)
                .type(type)
                .link(link)
                .read(false)
                .build();
        notificationRepository.save(n);
        messagingTemplate.convertAndSend("/topic/notifications/" + user.getId(), NotificationDto.from(n));
        return NotificationDto.from(n);
    }

    public List<NotificationDto> listForUser(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(NotificationDto::from).toList();
    }

    public long unreadCount(User user) {
        return notificationRepository.countByUserAndReadFalse(user);
    }

    @Transactional
    public void markRead(Long notificationId, User user) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> ApiException.notFound("Notification not found"));
        if (!n.getUser().getId().equals(user.getId())) {
            throw ApiException.forbidden("Not your notification");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead(User user) {
        notificationRepository.findByUserOrderByCreatedAtDesc(user)
                .forEach(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                });
    }
}
