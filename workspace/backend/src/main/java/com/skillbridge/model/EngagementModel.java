package com.skillbridge.model;

import com.skillbridge.model.SalaryUnit;

import java.util.List;

/**
 * The top of the employment rules engine: the model the employer picks first, which then
 * constrains the schedule, the duration, the allowed pay bases and the payroll cycle.
 */
public enum EngagementModel {
    ONE_TIME, DAILY, TEMPORARY, PART_TIME, FULL_TIME, PERMANENT;

    /** The pay bases this model allows, most recommended first. */
    public List<SalaryUnit> allowedSalaryUnits() {
        return switch (this) {
            case ONE_TIME -> List.of(SalaryUnit.PER_HOUR, SalaryUnit.PER_SHIFT, SalaryUnit.PER_DAY);
            case DAILY -> List.of(SalaryUnit.PER_DAY, SalaryUnit.PER_HOUR, SalaryUnit.PER_SHIFT);
            case TEMPORARY -> List.of(SalaryUnit.PER_HOUR, SalaryUnit.PER_DAY, SalaryUnit.PER_MONTH);
            case PART_TIME -> List.of(SalaryUnit.PER_HOUR, SalaryUnit.PER_DAY, SalaryUnit.PER_MONTH);
            case FULL_TIME -> List.of(SalaryUnit.PER_MONTH, SalaryUnit.PER_DAY, SalaryUnit.PER_HOUR);
            case PERMANENT -> List.of(SalaryUnit.PER_MONTH);
        };
    }

    /** The first allowed unit doubles as the recommendation. */
    public SalaryUnit recommendedSalaryUnit() {
        return allowedSalaryUnits().get(0);
    }

    public PayrollCycle defaultPayrollCycle() {
        return switch (this) {
            case ONE_TIME, DAILY, TEMPORARY -> PayrollCycle.ON_COMPLETION;
            case PART_TIME, FULL_TIME, PERMANENT -> PayrollCycle.MONTHLY;
        };
    }

    /** Keeps the legacy employmentType column meaningful for everything already built. */
    public EmploymentType legacyEmploymentType() {
        return switch (this) {
            case ONE_TIME, DAILY -> EmploymentType.DAILY;
            case TEMPORARY -> EmploymentType.TEMPORARY;
            case PART_TIME -> EmploymentType.PART_TIME;
            case FULL_TIME -> EmploymentType.FULL_TIME;
            case PERMANENT -> EmploymentType.PERMANENT;
        };
    }
}
