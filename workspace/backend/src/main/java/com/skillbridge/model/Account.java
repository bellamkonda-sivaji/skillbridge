package com.skillbridge.model;

import java.time.LocalDateTime;

/**
 * The read view shared by {@link WorkerAccount}, {@link EmployerAccount} and {@link AdminAccount}.
 * There is no shared table - this interface exists only so that code which does not care which
 * namespace an account lives in (JWT issuing, notifications, wallets, reviews) can stay generic.
 */
public interface Account {

    Long getId();

    String getName();

    String getEmail();

    String getPhone();

    String getPassword();

    boolean isEnabled();

    LocalDateTime getCreatedAt();

    AccountType accountType();

    /** Admin accounts do not carry these, so they answer with sensible fixed values. */
    default String getLocale() {
        return "en";
    }

    default boolean isPhoneVerified() {
        return true;
    }

    default String getPhotoUrl() {
        return null;
    }

    default double getAvgRating() {
        return 0.0;
    }

    default int getRatingCount() {
        return 0;
    }
}
