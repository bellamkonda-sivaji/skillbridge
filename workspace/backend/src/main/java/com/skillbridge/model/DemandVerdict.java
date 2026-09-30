package com.skillbridge.model;

/**
 * How a live job is doing at attracting workers, read in plain language rather than a score.
 * The employer never sees the enum - they see the sentence the service builds from it.
 */
public enum DemandVerdict {

    /** Too new to judge. The urgency window has not run out yet. */
    TOO_EARLY,

    /** Enough people have applied for the number of workers needed. */
    HEALTHY,

    /** Some interest, but not enough to fill the job in the time left. */
    SLOW,

    /** Nobody at all, and the window has passed. This is the one worth a phone call. */
    STALLED,

    /** Filled or closed - nothing left to advise on. */
    DONE
}
