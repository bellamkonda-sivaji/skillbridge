package com.skillbridge.model;

/**
 * Where an offer stands. PENDING/ACCEPTED/DECLINED are the original three; VIEWED, EXPIRED and
 * CANCELLED were added for the employer-side offer tracking screen.
 */
public enum OfferStatus {
    PENDING, VIEWED, ACCEPTED, DECLINED, EXPIRED, CANCELLED;

    /** true while the worker can still act on it. */
    public boolean isOpen() {
        return this == PENDING || this == VIEWED;
    }
}
