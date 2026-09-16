package com.skillbridge.dto;

public record ReviewRequest(Long targetId, Long jobId, int rating, String comment) {}
