package com.skillbridge.dto;

import com.skillbridge.model.AccountType;

/** {@code targetType} says which table {@code targetId} lives in - ids are only unique per table. */
public record ReviewRequest(AccountType targetType, Long targetId, Long jobId, int rating, String comment) {}
