package com.skillbridge.dto;

import java.time.LocalDateTime;

/** One of the five fixed stages of an application. {@code state} is DONE | CURRENT | PENDING. */
public record TimelineEntryDto(
        String key,
        String label,
        LocalDateTime at,
        String note,
        String state
) {}
