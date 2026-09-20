package com.skillbridge.service;

import com.skillbridge.dto.ScheduleEstimateDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.EngagementModel;
import com.skillbridge.model.JobDuration;
import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.ShiftArrangement;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** The rules engine on its own - no Spring context, no database. */
class ScheduleCalculatorTest {

    private final ScheduleCalculator calculator = new ScheduleCalculator();

    private static final List<String> SIX_DAYS =
            List.of("MON", "TUE", "WED", "THU", "FRI", "SAT");

    private static ScheduleCalculator.ShiftWindow shift(String start, String end,
                                                        String breakStart, String breakEnd) {
        return new ScheduleCalculator.ShiftWindow(LocalTime.parse(start), LocalTime.parse(end),
                breakStart == null ? null : LocalTime.parse(breakStart),
                breakEnd == null ? null : LocalTime.parse(breakEnd));
    }

    private ScheduleCalculator.ScheduleInput input(EngagementModel model, LocalDate workDate,
                                                   LocalDate start, LocalDate end, JobDuration duration,
                                                   List<String> days,
                                                   List<ScheduleCalculator.ShiftWindow> shifts,
                                                   ShiftArrangement arrangement, boolean breakPaid,
                                                   double salary, SalaryUnit unit) {
        return new ScheduleCalculator.ScheduleInput(model, workDate, start, end, duration, days,
                shifts, arrangement, breakPaid, salary, unit, model.defaultPayrollCycle());
    }

    @Test
    void unpaidBreakIsDeductedAndAPaidBreakIsNot() {
        var shifts = List.of(shift("09:00", "18:00", "13:00", "13:30"));
        var unpaid = input(EngagementModel.FULL_TIME, null, null, null, JobDuration.ONGOING,
                SIX_DAYS, shifts, ShiftArrangement.ALL_SHIFTS, false, 0, null);
        var paid = input(EngagementModel.FULL_TIME, null, null, null, JobDuration.ONGOING,
                SIX_DAYS, shifts, ShiftArrangement.ALL_SHIFTS, true, 0, null);
        assertEquals(510, calculator.paidMinutesPerDay(unpaid));
        assertEquals(540, calculator.paidMinutesPerDay(paid));
    }

    @Test
    void aShiftCrossingMidnightIsNotNegative() {
        assertEquals(600, ScheduleCalculator.minutesBetween(LocalTime.of(20, 0), LocalTime.of(6, 0)));
    }

    @Test
    void oneOfShiftsTakesTheLongestShiftAndAllShiftsSumsThem() {
        var shifts = List.of(shift("07:00", "12:00", null, null), shift("13:00", "21:00", null, null));
        var oneOf = input(EngagementModel.PART_TIME, null, null, null, JobDuration.ONGOING,
                SIX_DAYS, shifts, ShiftArrangement.ONE_OF_SHIFTS, false, 0, null);
        var all = input(EngagementModel.PART_TIME, null, null, null, JobDuration.ONGOING,
                SIX_DAYS, shifts, ShiftArrangement.ALL_SHIFTS, false, 0, null);
        assertEquals(480, calculator.paidMinutesPerDay(oneOf));
        assertEquals(780, calculator.paidMinutesPerDay(all));
    }

    @Test
    void scheduledDaysCountsWeekdaysInARangeAndUsesWeeksPerMonthWhenOngoing() {
        var fixed = input(EngagementModel.DAILY, null, LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 10, 31), JobDuration.SPECIFIC, SIX_DAYS,
                List.of(shift("09:00", "18:00", null, null)), ShiftArrangement.ALL_SHIFTS, false, 0, null);
        assertEquals(27, calculator.scheduledDays(fixed));

        var ongoing = input(EngagementModel.FULL_TIME, null, null, null, JobDuration.ONGOING,
                SIX_DAYS, List.of(shift("09:00", "18:00", null, null)),
                ShiftArrangement.ALL_SHIFTS, false, 0, null);
        assertEquals(26, calculator.scheduledDays(ongoing));   // 6 * 4.345 rounded
    }

    @Test
    void perDayEarningsMultiplyTheRateByTheScheduledDays() {
        ScheduleEstimateDto dto = calculator.estimate(input(EngagementModel.DAILY, null,
                LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31), JobDuration.SPECIFIC, SIX_DAYS,
                List.of(shift("09:00", "18:00", "13:00", "13:30")), ShiftArrangement.ALL_SHIFTS,
                false, 700, SalaryUnit.PER_DAY));
        assertEquals(27, dto.scheduledDays());
        assertEquals(8.5, dto.paidHoursPerDay());
        assertEquals(229.5, dto.expectedPaidHours());
        assertEquals(18900.0, dto.estimatedWorkerEarnings());
        assertNull(dto.platformFee());
        assertEquals("BEFORE_WORK", dto.fundingWhen());
    }

    @Test
    void aPermanentJobCannotCarryAFixedRange() {
        var in = input(EngagementModel.PERMANENT, null, LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 12, 31), JobDuration.SPECIFIC, SIX_DAYS,
                List.of(shift("09:00", "18:00", null, null)), ShiftArrangement.ALL_SHIFTS,
                false, 20000, SalaryUnit.PER_MONTH);
        assertThrows(ApiException.class, () -> calculator.validate(in));
    }

    @Test
    void aTemporaryJobCannotBeOngoing() {
        var in = input(EngagementModel.TEMPORARY, null, LocalDate.of(2026, 10, 1), null,
                JobDuration.ONGOING, SIX_DAYS, List.of(shift("09:00", "18:00", null, null)),
                ShiftArrangement.ALL_SHIFTS, false, 700, SalaryUnit.PER_DAY);
        assertThrows(ApiException.class, () -> calculator.validate(in));
    }

    @Test
    void aPayBasisOutsideTheModelsSetIsRejected() {
        var in = input(EngagementModel.ONE_TIME, LocalDate.of(2026, 10, 15),
                LocalDate.of(2026, 10, 15), LocalDate.of(2026, 10, 15), JobDuration.SPECIFIC, List.of(),
                List.of(shift("09:00", "18:00", null, null)), ShiftArrangement.ALL_SHIFTS,
                false, 20000, SalaryUnit.PER_MONTH);
        assertThrows(ApiException.class, () -> calculator.validate(in));
    }

    @Test
    void aShiftShorterThanItsBreakRaisesAWarning() {
        ScheduleEstimateDto dto = calculator.estimate(input(EngagementModel.PART_TIME, null, null, null,
                JobDuration.ONGOING, SIX_DAYS, List.of(shift("09:00", "09:20", "09:00", "10:00")),
                ShiftArrangement.ALL_SHIFTS, false, 100, SalaryUnit.PER_HOUR));
        assertTrue(dto.warnings().stream().anyMatch(w -> w.contains("shorter than the break")));
    }
}
