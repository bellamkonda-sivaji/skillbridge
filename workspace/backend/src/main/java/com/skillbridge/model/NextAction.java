package com.skillbridge.model;

/** The one thing the back office should do about a call-queue row. */
public enum NextAction {
    CALL_WORKER, CALL_EMPLOYER, CALL_BOTH, FIND_WORKERS, RELEASE_PAYMENT
}
