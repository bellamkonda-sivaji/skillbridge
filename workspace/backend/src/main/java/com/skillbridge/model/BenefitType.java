package com.skillbridge.model;

/** The structured benefit catalogue that replaces the old free-text benefit strings. */
public enum BenefitType {
    MEALS, TRAVEL_ALLOWANCE, ACCOMMODATION, OVERTIME_PAY, PERFORMANCE_BONUS, WEEKLY_OFF, TIPS, OTHER;

    /** Maps the legacy strings ("TRAVEL", "BONUS", ...) onto the new catalogue. */
    public static BenefitType parse(String raw) {
        if (raw == null || raw.isBlank()) return OTHER;
        String key = raw.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        return switch (key) {
            case "TRAVEL", "TRANSPORT", "TRAVEL_ALLOWANCE" -> TRAVEL_ALLOWANCE;
            case "BONUS", "PERFORMANCE_BONUS", "INCENTIVE" -> PERFORMANCE_BONUS;
            case "FOOD", "MEALS", "MEAL" -> MEALS;
            case "STAY", "ACCOMMODATION", "HOUSING" -> ACCOMMODATION;
            case "OVERTIME", "OVERTIME_PAY", "OT" -> OVERTIME_PAY;
            case "WEEKLY_OFF", "WEEK_OFF" -> WEEKLY_OFF;
            case "TIPS" -> TIPS;
            default -> {
                try {
                    yield BenefitType.valueOf(key);
                } catch (IllegalArgumentException ex) {
                    yield OTHER;
                }
            }
        };
    }
}
