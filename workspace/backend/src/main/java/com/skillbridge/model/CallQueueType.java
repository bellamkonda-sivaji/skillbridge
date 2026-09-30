package com.skillbridge.model;

/**
 * Why a row is in the call queue, in priority order. The order of the constants IS the order of
 * the queue, so adding a type in the right place is all it takes to rank it.
 */
public enum CallQueueType {

    UNCONTACTED_APPLICANT("Applied, nobody has called", CallPriority.HIGH, NextAction.CALL_WORKER),
    EMPLOYER_NOT_RESPONDING("Employer has not looked at the applicant", CallPriority.HIGH,
            NextAction.CALL_EMPLOYER),
    OFFER_NOT_ANSWERED("Offer sent, no answer yet", CallPriority.HIGH, NextAction.CALL_WORKER),
    CALLBACK_DUE("We promised to ring back", CallPriority.HIGH, NextAction.CALL_WORKER),
    /**
     * A worker said "I was there but it did not get marked" and nobody has answered. It is a day's
     * pay hanging on somebody tapping a button, so it is HIGH and it rings the employer.
     */
    ATTENDANCE_REQUEST_WAITING("Attendance question nobody has answered", CallPriority.HIGH,
            NextAction.CALL_EMPLOYER),
    NO_ANSWER_RETRY("Nobody picked up - try again", CallPriority.MEDIUM, NextAction.CALL_WORKER),
    WORK_TOMORROW("Work starts tomorrow - remind both sides", CallPriority.MEDIUM,
            NextAction.CALL_BOTH),
    JOB_NO_APPLICANTS("Job has been open with nobody applying", CallPriority.MEDIUM,
            NextAction.CALL_EMPLOYER),
    UNPAID_COMPLETED_WORK("Work is done but not paid", CallPriority.HIGH,
            NextAction.RELEASE_PAYMENT);

    private final String label;
    private final CallPriority priority;
    private final NextAction nextAction;

    CallQueueType(String label, CallPriority priority, NextAction nextAction) {
        this.label = label;
        this.priority = priority;
        this.nextAction = nextAction;
    }

    public String label() {
        return label;
    }

    public CallPriority priority() {
        return priority;
    }

    public NextAction defaultNextAction() {
        return nextAction;
    }
}
