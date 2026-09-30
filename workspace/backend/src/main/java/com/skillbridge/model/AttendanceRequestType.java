package com.skillbridge.model;

/**
 * The five things that actually go wrong, each phrased the way the worker would say it out loud.
 * There is no "other" and no free-form category: five buttons is a screen a person can use.
 */
public enum AttendanceRequestType {

    FORGOT_PUNCH_IN("I forgot to tap when I started"),
    FORGOT_PUNCH_OUT("I forgot to tap when I finished"),
    WRONG_TIME("The time is wrong"),
    MISSED_DAY("I worked but it is not showing"),
    WRONG_ABSENT("It says I was absent but I came");

    private final String label;

    AttendanceRequestType(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
