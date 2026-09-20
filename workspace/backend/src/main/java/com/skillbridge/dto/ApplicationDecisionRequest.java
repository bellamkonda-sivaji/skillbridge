package com.skillbridge.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Body of PATCH /api/employer/applications/{id}. The wire name of the third field is
 * {@code notify}; the component cannot be called that because {@code notify()} is already
 * taken by {@link Object}.
 */
public record ApplicationDecisionRequest(
        String status,
        String message,
        @JsonProperty("notify") Boolean notifyWorker
) {}
