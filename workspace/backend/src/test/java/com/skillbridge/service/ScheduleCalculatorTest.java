package com.skillbridge.service;

import com.skillbridge.dto.ScheduleEstimateDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.DayTime;
import com.skillbridge.model.EngagementModel;
import com.skillbridge.model.HiringMethod;
import com.skillbridge.model.JobDuration;
import com.skillbridge.model.OfferType;
import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.ShiftArrangement;
import com.skillbridge.model.WorkPattern;
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

    private static final List<String> WEEKDAYS =
            List.of("MON", "TUE", "WED", "THU", "FRI");

    private static ScheduleCalculator.ShiftWindow shift(String start, String end,
                                                        String breakStart, String breakEnd) {
        return new ScheduleCalculator.ShiftWindow(LocalTime.parse(start), LocalTime.parse(end),
                breakStart == null ? null : LocalTime.parse(breakStart),
                breakEnd == null ? null : LocalTime.parse(breakEnd), null);
    }

    private static ScheduleCalculator.ShiftWindow shift(String start, String end,
                                                        String breakStart, String breakEnd,
                                                        Integer breakMinutes) {
        return new ScheduleCalculator.ShiftWindow(LocalTime.parse(start), LocalTime.parse(end),
                breakStart == null ? null : LocalTime.parse(breakStart),
                breakEnd == null ? null : LocalTime.parse(breakEnd), breakMinutes);
    }

    private ScheduleCalculator.ScheduleInput input(EngagementModel model, LocalDate workDate,
                                                   LocalDate start, LocalDate end, JobDuration duration,
                                                   List<String> days,
                                                   List<ScheduleCalculator.ShiftWindow> shifts,
                                                   ShiftArrangement arrangement, boolean breakPaid,
                                                   double salary, SalaryUnit unit) {
        return new ScheduleCalculator.ScheduleInput(model, workDate, start, end, duration, days,
                shifts, arrangement, breakPaid, salary, unit, model.defaultPayrollCycle(),
                WorkPattern.FULL_DAY, null, List.of());
    }

    @Test
    void unpaidBreakIsDeductedAndAPaidBreakIsNot() {
        var shifts = List.of(shift("09:00", "18:00", "13:00", "13:30"));
        var unpaid = input(EngagementModel.MONTHS, null, null, null, JobDuration.ONGOING,
                SIX_DAYS, shifts, ShiftArrangement.ALL_SHIFTS, false, 0, null);
        var paid = input(EngagementModel.MONTHS, null, null, null, JobDuration.ONGOING,
                SIX_DAYS, shifts, ShiftArrangement.ALL_SHIFTS, true, 0, null);
        assertEquals(510, calculator.paidMinutesPerDay(unpaid));
        assertEquals(540, calculator.paidMinutesPerDay(paid));
    }

    @Test
    void breakMinutesTakePrecedenceOverTheLegacyBreakWindow() {
        var legacy = List.of(shift("09:00", "18:00", "13:00", "13:30"));
        var counted = List.of(shift("09:00", "18:00", null, null, 60));
        var ignored = List.of(shift("09:00", "18:00", "13:00", "13:30", 60));
        var legacyIn = input(EngagementModel.MONTHS, null, null, null, JobDuration.ONGOING,
                SIX_DAYS, legacy, ShiftArrangement.ALL_SHIFTS, false, 0, null);
        var countedIn = input(EngagementModel.MONTHS, null, null, null, JobDuration.ONGOING,
                SIX_DAYS, counted, ShiftArrangement.ALL_SHIFTS, false, 0, null);
        var ignoredIn = input(EngagementModel.MONTHS, null, null, null, JobDuration.ONGOING,
                SIX_DAYS, ignored, ShiftArrangement.ALL_SHIFTS, false, 0, null);
        assertEquals(510, calculator.paidMinutesPerDay(legacyIn));
        assertEquals(480, calculator.paidMinutesPerDay(countedIn));
        assertEquals(480, calculator.paidMinutesPerDay(ignoredIn));
    }

    @Test
    void aShiftCrossingMidnightIsNotNegative() {
        assertEquals(600, ScheduleCalculator.minutesBetween(LocalTime.of(20, 0), LocalTime.of(6, 0)));
    }

    @Test
    void oneOfShiftsTakesTheLongestShiftAndAllShiftsSumsThem() {
        var shifts = List.of(shift("07:00", "12:00", null, null), shift("13:00", "21:00", null, null));
        var oneOf = input(EngagementModel.MONTHS, null, null, null, JobDuration.ONGOING,
                SIX_DAYS, shifts, ShiftArrangement.ONE_OF_SHIFTS, false, 0, null);
        var all = input(EngagementModel.MONTHS, null, null, null, JobDuration.ONGOING,
                SIX_DAYS, shifts, ShiftArrangement.ALL_SHIFTS, false, 0, null);
        assertEquals(480, calculator.paidMinutesPerDay(oneOf));
        assertEquals(780, calculator.paidMinutesPerDay(all));
    }

    @Test
    void scheduledDaysCountsWeekdaysInARangeAndUsesWeeksPerMonthWhenOngoing() {
        var fixed = input(EngagementModel.FEW_WEEKS, null, LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 10, 31), JobDuration.SPECIFIC, SIX_DAYS,
                List.of(shift("09:00", "18:00", null, null)), ShiftArrangement.ALL_SHIFTS, false, 0, null);
        assertEquals(27, calculator.scheduledDays(fixed));

        var ongoing = input(EngagementModel.MONTHS, null, null, null, JobDuration.ONGOING,
                SIX_DAYS, List.of(shift("09:00", "18:00", null, null)),
                ShiftArrangement.ALL_SHIFTS, false, 0, null);
        assertEquals(26, calculator.scheduledDays(ongoing));   // 6 * 4.345 rounded
    }

    @Test
    void perDayEarningsMultiplyTheRateByTheScheduledDays() {
        ScheduleEstimateDto dto = calculator.estimate(input(EngagementModel.FEW_WEEKS, null,
                LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31), JobDuration.SPECIFIC, SIX_DAYS,
                List.of(shift("09:00", "18:00", "13:00", "13:30")), ShiftArrangement.ALL_SHIFTS,
                false, 700, SalaryUnit.DAILY));
        assertEquals(27, dto.scheduledDays());
        assertEquals(8.5, dto.paidHoursPerDay());
        assertEquals(229.5, dto.expectedPaidHours());
        assertEquals(18900.0, dto.estimatedWorkerEarnings());
        assertNull(dto.platformFee());
        assertEquals(18900.0, dto.estimatedEmployerTotal());
        assertEquals("BEFORE_WORK", dto.fundingWhen());
    }

    @Test
    void aFiveDayFewDaysJobEarnsRateTimesFive() {
        var in = input(EngagementModel.FEW_DAYS, null,
                LocalDate.of(2026, 10, 5), LocalDate.of(2026, 10, 9), JobDuration.SPECIFIC, WEEKDAYS,
                List.of(shift("09:00", "18:00", null, null)), ShiftArrangement.ALL_SHIFTS,
                false, 700, SalaryUnit.DAILY);
        calculator.validate(in);
        ScheduleEstimateDto dto = calculator.estimate(in);
        assertEquals(5, dto.scheduledDays());
        assertEquals(3500.0, dto.estimatedWorkerEarnings());
    }

    @Test
    void thePlatformFeeFollowsTheConfiguredPercent() {
        var in = input(EngagementModel.FEW_DAYS, null,
                LocalDate.of(2026, 10, 5), LocalDate.of(2026, 10, 9), JobDuration.SPECIFIC, WEEKDAYS,
                List.of(shift("09:00", "18:00", null, null)), ShiftArrangement.ALL_SHIFTS,
                false, 700, SalaryUnit.DAILY);

        calculator.setPlatformFeePercent(5);
        ScheduleEstimateDto withFee = calculator.estimate(in);
        assertEquals(3500.0, withFee.estimatedWorkerEarnings());
        assertEquals(175.0, withFee.platformFee());
        assertEquals(3675.0, withFee.estimatedEmployerTotal());

        calculator.setPlatformFeePercent(0);
        ScheduleEstimateDto withoutFee = calculator.estimate(in);
        assertNull(withoutFee.platformFee());
        assertEquals(3500.0, withoutFee.estimatedEmployerTotal());
    }

    @Test
    void aOneDayJobPaysOneDayPlusTheFee() {
        calculator.setPlatformFeePercent(5);
        var in = input(EngagementModel.ONE_DAY, LocalDate.of(2026, 10, 15),
                null, null, JobDuration.SPECIFIC, List.of(),
                List.of(shift("09:00", "18:00", null, null)), ShiftArrangement.ALL_SHIFTS,
                false, 900, SalaryUnit.DAILY);
        calculator.validate(in);
        ScheduleEstimateDto dto = calculator.estimate(in);
        assertEquals(900.0, dto.estimatedWorkerEarnings());
        assertEquals(45.0, dto.platformFee());
        assertEquals(945.0, dto.estimatedEmployerTotal());
        calculator.setPlatformFeePercent(0);
    }

    @Test
    void aMonthlyJobBillsOneMonthPlusTheFee() {
        calculator.setPlatformFeePercent(5);
        var in = input(EngagementModel.MONTHS, null, LocalDate.of(2026, 10, 1), null,
                JobDuration.ONGOING,
                SIX_DAYS, List.of(shift("09:00", "18:00", null, null)),
                ShiftArrangement.ALL_SHIFTS, false, 18000, SalaryUnit.MONTHLY);
        calculator.validate(in);
        ScheduleEstimateDto dto = calculator.estimate(in);
        assertEquals(18000.0, dto.estimatedWorkerEarnings());
        assertEquals(900.0, dto.platformFee());
        assertEquals(18900.0, dto.estimatedEmployerTotal());
        calculator.setPlatformFeePercent(0);
    }

    @Test
    void aFewDaysJobCalculatesEachDayFromItsOwnTiming() {
        List<DayTime> dayTimes = List.of(
                DayTime.builder().dayCode("MON").startTime(LocalTime.of(9, 0))
                        .endTime(LocalTime.of(13, 0)).build(),
                DayTime.builder().dayCode("WED").startTime(LocalTime.of(9, 0))
                        .endTime(LocalTime.of(18, 0)).build());
        var in = new ScheduleCalculator.ScheduleInput(EngagementModel.FEW_DAYS, null,
                LocalDate.of(2026, 10, 5), LocalDate.of(2026, 10, 9), JobDuration.SPECIFIC, WEEKDAYS,
                List.of(shift("10:00", "12:00", null, null)), ShiftArrangement.ALL_SHIFTS,
                false, 700, SalaryUnit.DAILY, EngagementModel.FEW_DAYS.defaultPayrollCycle(),
                WorkPattern.FULL_DAY, null, dayTimes);
        calculator.validate(in);
        ScheduleEstimateDto dto = calculator.estimate(in);
        assertEquals(5, dto.scheduledDays());
        // MON 4h, TUE/THU/FRI 2h on the fallback shift, WED 9h: 19 paid hours over five days.
        assertEquals(19.0, dto.expectedPaidHours());
        assertEquals(3.8, dto.paidHoursPerDay());
    }

    @Test
    void aPermanentJobCannotCarryAFixedRange() {
        var in = input(EngagementModel.PERMANENT, null, LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 12, 31), JobDuration.SPECIFIC, SIX_DAYS,
                List.of(shift("09:00", "18:00", null, null)), ShiftArrangement.ALL_SHIFTS,
                false, 20000, SalaryUnit.MONTHLY);
        ApiException thrown = assertThrows(ApiException.class, () -> calculator.validate(in));
        assertTrue(thrown.getMessage().contains("permanent"));
    }

    @Test
    void aFewDaysJobRejectsARangeLongerThanAWeek() {
        var in = input(EngagementModel.FEW_DAYS, null, LocalDate.of(2026, 10, 5),
                LocalDate.of(2026, 10, 13), JobDuration.SPECIFIC, WEEKDAYS,
                List.of(shift("09:00", "18:00", null, null)), ShiftArrangement.ALL_SHIFTS,
                false, 700, SalaryUnit.DAILY);
        ApiException thrown = assertThrows(ApiException.class, () -> calculator.validate(in));
        assertTrue(thrown.getMessage().contains("2\u20137 days"));
    }

    @Test
    void aMonthsJobNeedsExactlyOneEndCondition() {
        var noEndCondition = input(EngagementModel.MONTHS, null, LocalDate.of(2026, 10, 1),
                null, null, SIX_DAYS,
                List.of(shift("09:00", "18:00", null, null)), ShiftArrangement.ALL_SHIFTS,
                false, 18000, SalaryUnit.MONTHLY);
        assertThrows(ApiException.class, () -> calculator.validate(noEndCondition));

        var ongoing = input(EngagementModel.MONTHS, null, LocalDate.of(2026, 10, 1),
                null, JobDuration.ONGOING, SIX_DAYS,
                List.of(shift("09:00", "18:00", null, null)), ShiftArrangement.ALL_SHIFTS,
                false, 18000, SalaryUnit.MONTHLY);
        calculator.validate(ongoing);

        var withMonths = new ScheduleCalculator.ScheduleInput(EngagementModel.MONTHS, null,
                LocalDate.of(2026, 10, 1), null, JobDuration.ONGOING, SIX_DAYS,
                List.of(shift("09:00", "18:00", null, null)), ShiftArrangement.ALL_SHIFTS,
                false, 18000, SalaryUnit.MONTHLY, EngagementModel.MONTHS.defaultPayrollCycle(),
                WorkPattern.FULL_DAY, 3, List.of());
        calculator.validate(withMonths);

        var monthsAndEnd = new ScheduleCalculator.ScheduleInput(EngagementModel.MONTHS, null,
                LocalDate.of(2026, 10, 1), LocalDate.of(2026, 12, 31), JobDuration.ONGOING, SIX_DAYS,
                List.of(shift("09:00", "18:00", null, null)), ShiftArrangement.ALL_SHIFTS,
                false, 18000, SalaryUnit.MONTHLY, EngagementModel.MONTHS.defaultPayrollCycle(),
                WorkPattern.FULL_DAY, 3, List.of());
        assertThrows(ApiException.class, () -> calculator.validate(monthsAndEnd));
    }

    @Test
    void aPayBasisOutsideTheModelsSetIsRejected() {
        var in = input(EngagementModel.ONE_DAY, LocalDate.of(2026, 10, 15),
                null, null, JobDuration.SPECIFIC, List.of(),
                List.of(shift("09:00", "18:00", null, null)), ShiftArrangement.ALL_SHIFTS,
                false, 20000, SalaryUnit.MONTHLY);
        assertThrows(ApiException.class, () -> calculator.validate(in));
    }

    @Test
    void durationsDefaultTheirHiringMethodAndOfferType() {
        assertEquals(EngagementModel.ONE_DAY.defaultHiringMethod(), HiringMethod.DIRECT);
        assertEquals(EngagementModel.FEW_DAYS.defaultHiringMethod(), HiringMethod.DIRECT);
        assertEquals(EngagementModel.FEW_WEEKS.defaultHiringMethod(), HiringMethod.TALK_FIRST);
        assertEquals(EngagementModel.MONTHS.defaultHiringMethod(), HiringMethod.INTERVIEW);
        assertEquals(EngagementModel.PERMANENT.defaultHiringMethod(), HiringMethod.INTERVIEW);

        assertEquals(EngagementModel.ONE_DAY.offerType(), OfferType.NONE);
        assertEquals(EngagementModel.FEW_DAYS.offerType(), OfferType.WORK_CONFIRMATION);
        assertEquals(EngagementModel.FEW_WEEKS.offerType(), OfferType.SIMPLE_JOB_OFFER);
        assertEquals(EngagementModel.MONTHS.offerType(), OfferType.EMPLOYMENT_OFFER);
        assertEquals(EngagementModel.PERMANENT.offerType(), OfferType.FULL_EMPLOYMENT_OFFER);
    }

    @Test
    void legacyValuesNormalizeOntoTheNewDurations() {
        assertEquals(EngagementModel.ONE_DAY, EngagementModel.normalize("ONE_TIME"));
        assertEquals(EngagementModel.FEW_DAYS, EngagementModel.normalize("DAILY"));
        assertEquals(EngagementModel.FEW_DAYS, EngagementModel.normalize("SHORT_TERM"));
        assertEquals(EngagementModel.FEW_WEEKS, EngagementModel.normalize("TEMPORARY"));
        assertEquals(EngagementModel.MONTHS, EngagementModel.normalize("PART_TIME"));
        assertEquals(EngagementModel.MONTHS, EngagementModel.normalize("FULL_TIME"));
        assertEquals(EngagementModel.MONTHS, EngagementModel.normalize("MONTHLY"));
        assertEquals(EngagementModel.FEW_DAYS, EngagementModel.normalize("few_days"));
        assertNull(EngagementModel.normalize("CUSTOM"));
        assertNull(EngagementModel.normalize("NONSENSE"));
        assertNull(EngagementModel.normalize(null));
    }

    @Test
    void aShiftShorterThanItsBreakRaisesAWarning() {
        ScheduleEstimateDto dto = calculator.estimate(input(EngagementModel.MONTHS, null, null, null,
                JobDuration.ONGOING, SIX_DAYS, List.of(shift("09:00", "09:20", "09:00", "10:00")),
                ShiftArrangement.ALL_SHIFTS, false, 100, SalaryUnit.HOURLY));
        assertTrue(dto.warnings().stream().anyMatch(w -> w.contains("shorter than the break")));
    }
}
