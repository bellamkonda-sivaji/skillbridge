package com.skillbridge.dto;

import com.skillbridge.model.ApplicationStatus;

import java.time.LocalDateTime;
import java.util.List;

public record ApplicationDetailDto(
        Long id,
        ApplicationStatus status,
        LocalDateTime appliedAt,
        JobCardDto job,
        List<TimelineEntryDto> timeline,
        boolean canWithdraw,
        OfferDto offer
) {}
