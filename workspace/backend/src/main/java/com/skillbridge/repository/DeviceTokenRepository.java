package com.skillbridge.repository;

import com.skillbridge.model.AccountType;
import com.skillbridge.model.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {
    Optional<DeviceToken> findByToken(String token);
    List<DeviceToken> findByOwnerTypeAndOwnerId(AccountType ownerType, Long ownerId);
    void deleteByToken(String token);
}
