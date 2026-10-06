package com.skillbridge.model;

/** Where a help request has got to. */
public enum SupportTicketStatus {
    /** Nobody from the team has picked it up yet. */
    OPEN,
    /** An admin has taken it and is working on it. */
    IN_PROGRESS,
    /** The team believes it is sorted. The person can still reply and reopen it. */
    RESOLVED,
    /** Finished, and no longer counted in the inbox. */
    CLOSED
}
