package com.skillbridge.dto;

import java.time.LocalDateTime;

/** One step of the joining timeline. {@code state} is DONE / CURRENT / PENDING. */
public record JoiningStepDto(String key, String label, String note, LocalDateTime at, String state) {}
