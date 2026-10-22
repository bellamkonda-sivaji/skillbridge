package com.skillbridge.service.payment;

import com.skillbridge.model.SalaryUnit;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** Completion pays what was worked, not what was reserved. */
class ProRataPayTest {

    // A Thursday.
    private static final LocalDate THU = LocalDate.of(2026, 10, 22);

    @Test
    void aMonthlyHireCompletedTheMinuteAfterJoiningIsPaidOneDay() {
        // Joined 11:05, completed 11:06, no attendance: one working day of Rs 14,000 / 26.
        ProRataPay.Result r = ProRataPay.compute(1_400_000L, 14000, SalaryUnit.MONTHLY,
                List.of(), THU, THU, List.of());
        assertEquals(1, r.daysWorked());
        assertEquals("WORKING_DAYS", r.daysBasis());
        assertEquals(53_800L, r.grossMinor());           // Rs 538
        assertTrue(r.prorated());
        assertEquals(1_400_000L - 53_800L, r.returnedMinor());
    }

    @Test
    void attendanceDaysWinOverTheCalendarAndCountEachDateOnce() {
        ProRataPay.Result r = ProRataPay.compute(1_400_000L, 14000, SalaryUnit.MONTHLY,
                List.of(THU, THU, THU.plusDays(1), THU.plusDays(2)), THU, THU.plusDays(20), List.of());
        assertEquals(3, r.daysWorked());
        assertEquals("ATTENDANCE", r.daysBasis());
        assertEquals(Math.round(14000 / 26d * 3) * 100L, r.grossMinor());
    }

    @Test
    void withoutAttendanceTheJobsWorkingDaysAreCounted() {
        // Thu 22 to Wed 28 Oct, Mon-Sat: Thu Fri Sat Mon Tue Wed = 6.
        assertEquals(6, ProRataPay.workingDaysBetween(THU, THU.plusDays(6), List.of()));
        // Only weekends.
        assertEquals(2, ProRataPay.workingDaysBetween(THU, THU.plusDays(6), List.of("SAT", "SUN")));
        assertEquals(0, ProRataPay.workingDaysBetween(null, THU, List.of()));
    }

    @Test
    void neverMoreThanWasReserved() {
        // 40 days of attendance on a one-month reservation pays the month, not more.
        List<LocalDate> forty = java.util.stream.IntStream.range(0, 40).mapToObj(THU::plusDays).toList();
        ProRataPay.Result r = ProRataPay.compute(1_400_000L, 14000, SalaryUnit.MONTHLY,
                forty, THU, THU.plusDays(45), List.of());
        assertEquals(1_400_000L, r.grossMinor());
        assertFalse(r.prorated());
    }

    @Test
    void aFiveDayJobCompletedAfterOneDayPaysOneDay() {
        ProRataPay.Result r = ProRataPay.compute(350_000L, 700, SalaryUnit.DAILY,
                List.of(THU), THU, THU, List.of());
        assertEquals(70_000L, r.grossMinor());
        // ...and the full five days pays all five.
        ProRataPay.Result full = ProRataPay.compute(350_000L, 700, SalaryUnit.DAILY,
                List.of(THU, THU.plusDays(1), THU.plusDays(2), THU.plusDays(4), THU.plusDays(5)),
                THU, THU.plusDays(5), List.of());
        assertEquals(350_000L, full.grossMinor());
        assertFalse(full.prorated());
    }

    @Test
    void hourlyWorkIsLeftAsReserved() {
        ProRataPay.Result r = ProRataPay.compute(64_000L, 80, SalaryUnit.HOURLY,
                List.of(THU), THU, THU, List.of());
        assertEquals(64_000L, r.grossMinor());
        assertFalse(r.prorated());
    }
}
