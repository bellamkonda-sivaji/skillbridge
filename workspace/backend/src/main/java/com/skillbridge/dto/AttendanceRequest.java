package com.skillbridge.dto;

/**
 * Body of the check-in / check-out calls. {@code latitude}, {@code longitude} and
 * {@code accuracyM} are the phone's position when the app could get one; all optional, and a
 * punch without them still succeeds.
 */
public record AttendanceRequest(Long employmentId, Double latitude, Double longitude, Double accuracyM) {

    /** The pre-location shape. */
    public AttendanceRequest(Long employmentId) {
        this(employmentId, null, null, null);
    }
}
