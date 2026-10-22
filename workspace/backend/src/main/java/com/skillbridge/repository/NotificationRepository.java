package com.skillbridge.repository;

import com.skillbridge.model.AccountType;
import com.skillbridge.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import com.skillbridge.model.NotificationType;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByOwnerTypeAndOwnerIdOrderByCreatedAtDesc(AccountType ownerType, Long ownerId);
    long countByOwnerTypeAndOwnerIdAndReadFalse(AccountType ownerType, Long ownerId);

    /** The latest notification of a type pointing at a link - e.g. the last pricing nudge for a job. */
    Optional<Notification> findFirstByOwnerTypeAndOwnerIdAndTypeAndLinkOrderByCreatedAtDesc(
            AccountType ownerType, Long ownerId, NotificationType type, String link);
}
