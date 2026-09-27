package com.skillbridge.dto;

/** The body of PATCH /api/employer/applications/{id}/interview-result. */
public record InterviewResultRequest(String result, String feedback) {}
