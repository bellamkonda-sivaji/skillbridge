package com.skillbridge.model;

/** Where a "something is wrong" request has got to. */
public enum AttendanceRequestStatus {

    PENDING("Waiting for an answer"),
    APPROVED("Fixed"),
    REJECTED("Not accepted"),
    CANCELLED("You took this back");

    private final String label;

    AttendanceRequestStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    public boolean isOpen() {
        return this == PENDING;
    }
}
