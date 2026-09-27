package com.skillbridge.model;

/**
 * How the working hours are spread across a day - a separate property from the duration. The
 * calculator infers it from the schedule when the employer does not pick it explicitly.
 */
public enum WorkPattern {
    FULL_DAY, PART_TIME, SHIFT_BASED;

    /**
     * Reads the built schedule: short days are part-time, several windows a day is shift-based,
     * a single long window is a full day.
     */
    public static WorkPattern infer(double paidHoursPerDay, int distinctWindows) {
        if (paidHoursPerDay < 6) {
            return PART_TIME;
        }
        if (distinctWindows > 1) {
            return SHIFT_BASED;
        }
        return FULL_DAY;
    }
}
