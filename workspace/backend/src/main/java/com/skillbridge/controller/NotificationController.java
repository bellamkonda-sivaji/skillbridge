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
        return notificationService.listFor(AuthenticationUtils.currentType(), AuthenticationUtils.currentId());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unread() {
        return Map.of("count", notificationService.unreadCount(
                AuthenticationUtils.currentType(), AuthenticationUtils.currentId()));
    }

    @PatchMapping("/{id}/read")
    public void markRead(@PathVariable Long id) {
        notificationService.markRead(id, AuthenticationUtils.currentType(), AuthenticationUtils.currentId());
    }

    @PatchMapping("/read-all")
    public void markAllRead() {
        notificationService.markAllRead(AuthenticationUtils.currentType(), AuthenticationUtils.currentId());
    }
}
