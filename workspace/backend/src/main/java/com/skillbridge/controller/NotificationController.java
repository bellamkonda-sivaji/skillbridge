package com.skillbridge.controller;

import com.skillbridge.dto.NotificationDto;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationDto> mine() {
        return notificationService.listForUser(AuthenticationUtils.currentUser());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unread() {
        return Map.of("count", notificationService.unreadCount(AuthenticationUtils.currentUser()));
    }

    @PatchMapping("/{id}/read")
    public void markRead(@PathVariable Long id) {
        notificationService.markRead(id, AuthenticationUtils.currentUser());
    }

    @PatchMapping("/read-all")
    public void markAllRead() {
        notificationService.markAllRead(AuthenticationUtils.currentUser());
    }
}
