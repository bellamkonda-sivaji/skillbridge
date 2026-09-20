package com.skillbridge.dto;

import java.util.List;

/** Body of POST /api/employer/compare. */
public record CompareRequest(List<Long> workerIds, Long jobId) {}
