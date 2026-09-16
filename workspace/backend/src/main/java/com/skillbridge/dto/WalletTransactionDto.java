package com.skillbridge.dto;

import com.skillbridge.model.WalletTransaction;

import java.time.LocalDateTime;

public record WalletTransactionDto(
        Long id,
        String type,
        double amount,
        String description,
        Long jobId,
        String reference,
        LocalDateTime createdAt
) {
    public static WalletTransactionDto from(WalletTransaction t) {
        return new WalletTransactionDto(t.getId(), t.getType().name(), t.getAmount(),
                t.getDescription(), t.getJobId(), t.getReference().name(), t.getCreatedAt());
    }
}
