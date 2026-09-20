package com.skillbridge.dto;

import com.skillbridge.model.ApplicationStatus;

import java.time.LocalDateTime;

public record ApplicationCardDto(
        Long id,
        ApplicationStatus status,
        LocalDateTime appliedAt,
        JobCardDto job,
        boolean canWithdraw,
        boolean hasOffer
) {}
