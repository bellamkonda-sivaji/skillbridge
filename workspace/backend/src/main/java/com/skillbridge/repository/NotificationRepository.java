package com.skillbridge.repository;

import com.skillbridge.model.AccountType;
import com.skillbridge.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByOwnerTypeAndOwnerIdOrderByCreatedAtDesc(AccountType ownerType, Long ownerId);
    long countByOwnerTypeAndOwnerIdAndReadFalse(AccountType ownerType, Long ownerId);
}
