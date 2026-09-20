package com.skillbridge.dto;

/** Body of POST /api/employer/jobs/{id}/invite. */
public record InviteRequest(Long workerId, String message) {}
