package com.skillbridge.dto;

import com.skillbridge.model.Account;
import com.skillbridge.model.AccountType;

/** The single account shape every auth route answers with, whichever namespace it came from. */
public record AccountDto(
        Long id,
        String name,
        String phone,
        String email,
        String locale,
        boolean enabled,
        boolean phoneVerified,
        String photoUrl,
        double avgRating,
        int ratingCount,
        AccountType accountType
) {
    public static AccountDto from(Account a) {
        return new AccountDto(a.getId(), a.getName(), a.getPhone(), a.getEmail(), a.getLocale(),
                a.isEnabled(), a.isPhoneVerified(), a.getPhotoUrl(), a.getAvgRating(),
                a.getRatingCount(), a.accountType());
    }
}
