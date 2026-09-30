package com.skillbridge.model;

import java.util.List;

/**
 * How the employer wants to meet the worker before hiring, in the words a shop owner would use.
 * For short work the honest default is a phone call, not a careers-portal interview.
 */
public enum HiringMethod {

    DIRECT("Hire directly", "No call \u2014 just send the work confirmation."),
    TALK_FIRST("Talk on the phone first", "Ring them, then decide."),
    INTERVIEW("Ask them to come and meet", "For longer jobs.");

    private final String label;
    private final String hint;

    HiringMethod(String label, String hint) {
        this.label = label;
        this.hint = hint;
    }

    public String label() {
        return label;
    }

    public String hint() {
        return hint;
    }

    public static List<HiringMethod> offered() {
        return List.of(DIRECT, TALK_FIRST, INTERVIEW);
    }
}
