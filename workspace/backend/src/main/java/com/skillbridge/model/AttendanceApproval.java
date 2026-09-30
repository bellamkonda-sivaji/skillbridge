package com.skillbridge.model;

/**
 * Whether a day of attendance actually counts.
 *
 * <p>Deliberately four values and no workflow. A month-long hire's day is AUTO_APPROVED the
 * moment the worker taps "finished" - nobody signs anything. A one-off day sits at PENDING until
 * the shop owner says yes, because on a one-day job that single day is the entire engagement.
 */
public enum AttendanceApproval {

    AUTO_APPROVED("Counted"),
    PENDING("Waiting for the shop owner"),
    APPROVED("Counted"),
    REJECTED("Not counted");

    private final String label;

    AttendanceApproval(String label) {
        this.label = label;
    }

    /** Plain language, for a worker who may not read much. */
    public String label() {
        return label;
    }

    /** Only these two days are payable. */
    public boolean counts() {
        return this == AUTO_APPROVED || this == APPROVED;
    }
}
