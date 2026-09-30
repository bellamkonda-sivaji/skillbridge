package com.skillbridge.model;

import java.util.List;
import java.util.Locale;

/**
 * The top of the employment rules engine: the duration the employer picks first ("How long do
 * you need this worker?"), which then constrains the schedule, the allowed pay bases, the
 * payroll cycle and the hiring method.
 */
public enum EngagementModel {
    ONE_DAY, FEW_DAYS, FEW_WEEKS, MONTHS, PERMANENT;

    /** The pay bases this duration allows, most recommended first. */
    public List<SalaryUnit> allowedSalaryUnits(WorkPattern pattern) {
        return switch (this) {
            case ONE_DAY, FEW_DAYS, FEW_WEEKS -> List.of(
                    SalaryUnit.DAILY, SalaryUnit.HOURLY, SalaryUnit.PER_SHIFT);
            case MONTHS -> List.of(SalaryUnit.MONTHLY, SalaryUnit.DAILY, SalaryUnit.HOURLY);
            case PERMANENT -> List.of(SalaryUnit.MONTHLY);
        };
    }

    /** The pay basis a new posting should default to for this duration and work pattern. */
    public SalaryUnit recommendedSalaryUnit(WorkPattern pattern) {
        if (pattern == WorkPattern.PART_TIME) {
            return SalaryUnit.HOURLY;
        }
        return switch (this) {
            case ONE_DAY, FEW_DAYS, FEW_WEEKS -> SalaryUnit.DAILY;
            case MONTHS, PERMANENT -> SalaryUnit.MONTHLY;
        };
    }

    public PayrollCycle defaultPayrollCycle() {
        return switch (this) {
            case ONE_DAY, FEW_DAYS, FEW_WEEKS -> PayrollCycle.ON_COMPLETION;
            case MONTHS, PERMANENT -> PayrollCycle.MONTHLY;
        };
    }

    /** The paperwork the offer carries, from a one-day confirmation to full employment terms. */
    public OfferType offerType() {
        return switch (this) {
            case ONE_DAY -> OfferType.NONE;
            case FEW_DAYS -> OfferType.WORK_CONFIRMATION;
            case FEW_WEEKS -> OfferType.SIMPLE_JOB_OFFER;
            case MONTHS -> OfferType.EMPLOYMENT_OFFER;
            case PERMANENT -> OfferType.FULL_EMPLOYMENT_OFFER;
        };
    }

    /**
     * How the employer meets the worker before hiring, unless they pick differently.
     *
     * <p>Short work defaults to TALK_FIRST: a shop owner filling a day's shift rings the person
     * and says come tomorrow. DIRECT stays selectable for the employer who wants no call at all,
     * but it is no longer what we choose on their behalf - an unheard-of worker turning up for a
     * day's work is how both sides get let down. Only MONTHS / PERMANENT default to INTERVIEW.
     */
    public HiringMethod defaultHiringMethod() {
        return switch (this) {
            case ONE_DAY, FEW_DAYS, FEW_WEEKS -> HiringMethod.TALK_FIRST;
            case MONTHS, PERMANENT -> HiringMethod.INTERVIEW;
        };
    }

    /** Keeps the legacy employmentType column meaningful for everything already built. */
    public EmploymentType legacyEmploymentType(WorkPattern pattern) {
        return switch (this) {
            case ONE_DAY, FEW_DAYS -> EmploymentType.DAILY;
            case FEW_WEEKS -> EmploymentType.TEMPORARY;
            case MONTHS -> {
                if (pattern == WorkPattern.FULL_DAY) {
                    yield EmploymentType.FULL_TIME;
                }
                if (pattern == WorkPattern.PART_TIME) {
                    yield EmploymentType.PART_TIME;
                }
                yield EmploymentType.MONTHLY;
            }
            case PERMANENT -> EmploymentType.PERMANENT;
        };
    }

    /**
     * Maps values from the old model (and any custom-date hints) onto the duration enum, so old
     * JSON keeps working. Returns null for anything unknown.
     */
    public static EngagementModel normalize(String raw) {
        if (raw == null) {
            return null;
        }
        String key = raw.trim().toUpperCase(Locale.ENGLISH);
        return switch (key) {
            case "ONE_DAY", "ONE_TIME" -> ONE_DAY;
            case "FEW_DAYS", "DAILY", "SHORT_TERM" -> FEW_DAYS;
            case "FEW_WEEKS", "TEMPORARY" -> FEW_WEEKS;
            case "MONTHS", "PART_TIME", "FULL_TIME", "MONTHLY" -> MONTHS;
            case "PERMANENT" -> PERMANENT;
            default -> null;
        };
    }
}
