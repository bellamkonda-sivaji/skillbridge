package com.skillbridge.dto;

import com.skillbridge.model.AccountType;

import java.util.List;

/**
 * The existing shape, plus the minor-unit truth.
 *
 * {@code balance} stays present and stays in RUPEES, equal to available funds, so every
 * screen written against the old contract keeps working. Everything ending in Minor is a
 * long of paise and is what new screens should read.
 */
public record WalletDto(
        Long id,
        AccountType ownerType,
        Long ownerId,
        String name,
        double balance,
        long availableMinor,
        long pendingMinor,
        long reservedMinor,
        long lifetimeEarnedMinor,
        List<WalletTransactionDto> transactions
) {
}
