package com.skillbridge.dto;

import java.util.List;

/** Body of POST /api/employer/applications/bulk. */
public record BulkDecisionRequest(List<Long> applicationIds, String status, String message) {}
