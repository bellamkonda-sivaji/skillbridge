package com.skillbridge.model;

import java.util.List;

/**
 * The joining timeline. Short engagements (one day / a few days / a few weeks) run a simple
 * hire-to-payment track; monthly and permanent hires run the employment track, which also
 * carries an employee id, a department and the verified document list.
 */
public enum JoiningStep {
    HIRED, OFFER_ACCEPTED, JOINED, WORK_DONE, WORK_IN_PROGRESS, PAYMENT, COMPLETE;

    public static List<JoiningStep> stepsFor(boolean shortJob) {
        return shortJob
                ? List.of(HIRED, JOINED, WORK_DONE, PAYMENT)
                : List.of(OFFER_ACCEPTED, JOINED, WORK_IN_PROGRESS, COMPLETE);
    }

    public String label() {
        return switch (this) {
            case HIRED -> "Hired";
            case OFFER_ACCEPTED -> "Offer Accepted";
            case JOINED -> "Worker Joined";
            case WORK_DONE -> "Work Completed";
            case WORK_IN_PROGRESS -> "Work In Progress";
            case PAYMENT -> "Payment";
            case COMPLETE -> "Complete";
        };
    }

    public String note() {
        return switch (this) {
            case HIRED -> "Offer accepted";
            case OFFER_ACCEPTED -> "Offer accepted";
            case JOINED -> "Mark when the worker arrives";
            case WORK_DONE -> "Mark when the work is completed";
            case WORK_IN_PROGRESS -> "Mark once the worker has settled in";
            case PAYMENT -> "Released after completion";
            case COMPLETE -> "Marked when the engagement ends";
        };
    }
}
