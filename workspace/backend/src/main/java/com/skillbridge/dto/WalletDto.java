package com.skillbridge.dto;

import com.skillbridge.model.AccountType;
import com.skillbridge.model.Wallet;

import java.util.List;

public record WalletDto(
        Long id,
        AccountType ownerType,
        Long ownerId,
        String name,
        double balance,
        List<WalletTransactionDto> transactions
) {
    public static WalletDto from(Wallet w, String ownerName, List<WalletTransactionDto> transactions) {
        return new WalletDto(w.getId(), w.getOwnerType(), w.getOwnerId(), ownerName,
                w.getBalance(), transactions);
    }
}
