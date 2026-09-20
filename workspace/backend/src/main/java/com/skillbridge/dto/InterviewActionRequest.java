package com.skillbridge.dto;

/** Body of the worker reschedule / cancel calls. The reason is optional. */
public record InterviewActionRequest(String reason) {
}
