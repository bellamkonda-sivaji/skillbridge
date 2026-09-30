package com.skillbridge.dto;

/** An employer raising or lowering what they pay on a live job. */
public record PriceChangeRequest(
        double salary,
        String reason
) {}
