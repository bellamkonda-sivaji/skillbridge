package com.skillbridge.model;

import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * The application lifecycle. The transition table is enforced by the service layer; anything
 * not listed here is rejected with 400. Re-issuing the current status is a no-op, which is
 * what stops ACCEPTED from paying the worker twice.
 */
public enum ApplicationStatus {
    APPLIED, VIEWED, SHORTLISTED, INTERVIEW_SCHEDULED, OFFERED, ACCEPTED, REJECTED, WITHDRAWN;

    private static final Map<ApplicationStatus, Set<ApplicationStatus>> ALLOWED =
            new EnumMap<>(ApplicationStatus.class);

    static {
        ALLOWED.put(APPLIED, EnumSet.of(VIEWED, SHORTLISTED, REJECTED, WITHDRAWN));
        ALLOWED.put(VIEWED, EnumSet.of(SHORTLISTED, REJECTED, WITHDRAWN));
        ALLOWED.put(SHORTLISTED, EnumSet.of(INTERVIEW_SCHEDULED, OFFERED, REJECTED, WITHDRAWN));
        ALLOWED.put(INTERVIEW_SCHEDULED, EnumSet.of(OFFERED, REJECTED, WITHDRAWN));
        ALLOWED.put(OFFERED, EnumSet.of(ACCEPTED, REJECTED, WITHDRAWN));
        ALLOWED.put(ACCEPTED, EnumSet.noneOf(ApplicationStatus.class));
        ALLOWED.put(REJECTED, EnumSet.noneOf(ApplicationStatus.class));
        ALLOWED.put(WITHDRAWN, EnumSet.noneOf(ApplicationStatus.class));
    }

    public boolean isTerminal() {
        return this == ACCEPTED || this == REJECTED || this == WITHDRAWN;
    }

    public Set<ApplicationStatus> allowedNext() {
        return Collections.unmodifiableSet(ALLOWED.getOrDefault(this, EnumSet.noneOf(ApplicationStatus.class)));
    }

    public boolean canTransitionTo(ApplicationStatus next) {
        return next != null && allowedNext().contains(next);
    }
}
