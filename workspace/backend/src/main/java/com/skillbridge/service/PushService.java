package com.skillbridge.service;

import com.skillbridge.model.AccountType;
import com.skillbridge.model.DeviceToken;
import com.skillbridge.repository.DeviceTokenRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Registers phones, and rings the ones belonging to a given account. */
@Service
public class PushService {

    private final DeviceTokenRepository tokens;
    private final FcmSender fcm;

    public PushService(DeviceTokenRepository tokens, FcmSender fcm) {
        this.tokens = tokens;
        this.fcm = fcm;
    }

    /**
     * Upsert, keyed on the token rather than the account.
     *
     * A phone that changes hands keeps its FCM token, so the row has to move to
     * whoever is signed in now. Otherwise the previous owner keeps getting
     * somebody else's offers.
     */
    @Transactional
    public void register(AccountType ownerType, Long ownerId, String token, String platform) {
        if (token == null || token.isBlank()) return;
        DeviceToken row = tokens.findByToken(token).orElseGet(() -> DeviceToken.builder()
                .token(token)
                .createdAt(LocalDateTime.now())
                .build());
        row.setOwnerType(ownerType);
        row.setOwnerId(ownerId);
        row.setPlatform(platform);
        row.setLastSeenAt(LocalDateTime.now());
        tokens.save(row);
    }

    @Transactional
    public void forget(String token) {
        if (token != null && !token.isBlank()) tokens.deleteByToken(token);
    }

    /**
     * Rings every phone this account has signed in on.
     *
     * Async because a notification is a side effect: nothing that triggers one
     * should wait on Google to answer, and nothing should fail because it did
     * not.
     */
    @Async
    @Transactional
    public void push(AccountType ownerType, Long ownerId, String title, String body,
                     String channelId, Map<String, String> data) {
        if (!fcm.enabled()) return;
        List<DeviceToken> rows = tokens.findByOwnerTypeAndOwnerId(ownerType, ownerId);
        for (DeviceToken row : rows) {
            boolean ok = fcm.send(row.getToken(), title, body, channelId, data);
            // A token FCM will not accept belongs to an app that is gone.
            if (!ok) tokens.delete(row);
        }
    }
}
