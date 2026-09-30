package com.skillbridge.repository;

import com.skillbridge.model.money.WebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WebhookEventRepository extends JpaRepository<WebhookEvent, Long> {
    Optional<WebhookEvent> findByProviderAndEventId(String provider, String eventId);
    List<WebhookEvent> findAllByOrderByIdDesc();
}
