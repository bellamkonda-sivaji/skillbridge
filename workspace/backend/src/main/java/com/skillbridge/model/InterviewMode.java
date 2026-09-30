package com.skillbridge.model;

import java.util.List;
import java.util.Locale;

/**
 * How the employer and the worker actually meet before the work starts.
 *
 * <p>This platform hires supermarket helpers, drivers, cleaners and mestri - nobody here
 * "schedules an interview", they ring the person or tell them to come to the shop. The three
 * values at the top are the words real employers use. {@link #IN_PERSON}, {@link #VIDEO} and
 * {@link #PHONE} are the original vocabulary and are kept so old rows keep loading;
 * {@link #canonical()} folds them onto the new names for everything user-facing.
 */
public enum InterviewMode {

    PHONE_CALL("Phone call"),
    VISIT_SHOP("Come to the shop"),
    MEET_AT_SITE("Meet at the site"),
    VIDEO("Video call"),

    /** Legacy: reads as VISIT_SHOP. */
    IN_PERSON("Come to the shop"),
    /** Legacy: reads as PHONE_CALL. */
    PHONE("Phone call");

    private final String label;

    InterviewMode(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    /** The value the UI should show. Old rows are folded onto the new words. */
    public InterviewMode canonical() {
        return switch (this) {
            case PHONE -> PHONE_CALL;
            case IN_PERSON -> VISIT_SHOP;
            default -> this;
        };
    }

    /** The modes offered to a user, newest vocabulary only. */
    public static List<InterviewMode> offered() {
        return List.of(PHONE_CALL, VISIT_SHOP, MEET_AT_SITE, VIDEO);
    }

    /** The label for a possibly-null mode, so DTOs never have to branch. */
    public static String labelOf(InterviewMode mode) {
        return mode == null ? null : mode.canonical().label();
    }

    /** Accepts either vocabulary (and null) and answers a canonical mode. */
    public static InterviewMode normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return valueOf(raw.trim().toUpperCase(Locale.ENGLISH)).canonical();
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
