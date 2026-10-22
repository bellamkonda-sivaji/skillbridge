package com.skillbridge.service.payment;

import com.skillbridge.model.SalaryUnit;
import com.skillbridge.service.PricingService;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * What a hire actually earned when the shop owner marks it complete - pure arithmetic, no
 * database, so it can be read and tested on its own.
 *
 * At acceptance the whole engagement is reserved (a month's salary, five days' wages). When the
 * owner ends it early - joined at 11:05, "complete" at 11:06 - paying out the full reservation
 * would hand the worker a month for a minute. So completion pays by days worked:
 *
 * <ul>
 *   <li>the day rate is the posted rate's daily equivalent - the same factors the commission
 *       slab uses ({@link PricingService#DAYS_PER_UNIT}: a month is 26 days, a week 6, a day or a
 *       shift is a day);</li>
 *   <li>days worked are the distinct days the worker checked in on this hire; with no attendance
 *       at all, the working days (the job's own days, Mon-Sat if it never said) from the day they
 *       joined up to and including the day it was completed;</li>
 *   <li>a worker who actually joined is paid at least one day;</li>
 *   <li>never more than the full period, never more than was reserved.</li>
 * </ul>
 *
 * Hourly work is left as it was reserved: an hour rate times "days" is not a figure anyone
 * agreed to, and hours worked are not reliably recorded.
 */
public final class ProRataPay {

    /** Used when the job never said which days it works. */
    public static final List<String> DEFAULT_WORKING_DAYS =
            List.of("MON", "TUE", "WED", "THU", "FRI", "SAT");

    private static final List<String> DAY_KEYS =
            List.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");

    private ProRataPay() {
    }

    /**
     * The outcome. {@code grossMinor} is what the worker's earning becomes (fee included, as
     * reserved); {@code prorated} is false when nothing changed.
     */
    public record Result(int daysWorked, String daysBasis, long reservedMinor, long grossMinor,
                         boolean prorated) {
        public long returnedMinor() {
            return Math.max(0, reservedMinor - grossMinor);
        }
    }

    /**
     * @param reservedMinor  what was ring-fenced for the whole engagement
     * @param rate           the agreed rate, in rupees, per {@code unit}
     * @param unit           what the rate is per
     * @param checkInDays    the distinct dates the worker checked in on this hire
     * @param joined         the day they actually joined (null if they never did)
     * @param completed      the day the owner marked it complete
     * @param workingDays    the job's working days as MON..SUN keys (empty = Mon-Sat)
     */
    public static Result compute(long reservedMinor, double rate, SalaryUnit unit,
                                 Collection<LocalDate> checkInDays, LocalDate joined, LocalDate completed,
                                 List<String> workingDays) {
        int attended = checkInDays == null ? 0 : (int) checkInDays.stream().distinct().count();
        String basis;
        int days;
        if (attended > 0) {
            days = attended;
            basis = "ATTENDANCE";
        } else {
            days = workingDaysBetween(joined, completed, workingDays);
            basis = "WORKING_DAYS";
        }
        if (joined != null || attended > 0) {
            days = Math.max(1, days);
        }

        if (reservedMinor <= 0 || rate <= 0 || unit == null || unit == SalaryUnit.HOURLY) {
            return new Result(days, basis, reservedMinor, reservedMinor, false);
        }
        double dailyRupees = PricingService.dailyEquivalent(rate, unit);
        // Whole rupees, as every other figure the worker sees.
        long earnedMinor = Math.round(dailyRupees * days) * 100L;
        long gross = Math.min(reservedMinor, Math.max(0, earnedMinor));
        return new Result(days, basis, reservedMinor, gross, gross < reservedMinor);
    }

    /** Working days from {@code from} to {@code to}, both inclusive; 0 when either is unknown. */
    public static int workingDaysBetween(LocalDate from, LocalDate to, List<String> workingDays) {
        if (from == null || to == null || to.isBefore(from)) {
            return 0;
        }
        Set<String> keys = (workingDays == null || workingDays.isEmpty() ? DEFAULT_WORKING_DAYS : workingDays)
                .stream().map(k -> k == null ? "" : k.trim().toUpperCase(java.util.Locale.ROOT))
                .collect(Collectors.toSet());
        int count = 0;
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            if (keys.contains(keyOf(d.getDayOfWeek()))) {
                count++;
            }
        }
        return count;
    }

    private static String keyOf(DayOfWeek day) {
        return DAY_KEYS.get(day.getValue() - 1);
    }
}
