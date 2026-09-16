package com.skillbridge.dto;

import com.skillbridge.model.Wallet;

import java.util.List;

public record WalletDto(
        Long id,
        Long userId,
        String name,
        String role,
        double balance,
        List<WalletTransactionDto> transactions
) {
    public static WalletDto from(Wallet w, List<WalletTransactionDto> transactions) {
        return new WalletDto(w.getId(), w.getUser().getId(), w.getUser().getName(),
                w.getUser().getRole().name(), w.getBalance(), transactions);
    }
}
