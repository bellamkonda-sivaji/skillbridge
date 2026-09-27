package com.skillbridge.service;

import com.skillbridge.dto.ScheduleEstimateDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.DayTime;
import com.skillbridge.model.EngagementModel;
import com.skillbridge.model.JobDuration;
import com.skillbridge.model.PayrollCycle;
import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.ShiftArrangement;
import com.skillbridge.model.WorkPattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * The employment rules engine: duration -> schedule -> salary. Pure arithmetic and pure rule
 * checks, shared by the estimate endpoint and by job creation so the two can never drift.
 */
@Service
public class ScheduleCalculator {

    /** An ongoing month is this many weeks - the figure the whole engine rounds on. */
    public static final double WEEKS_PER_MONTH = 4.345;

    /** Weekday the synthetic ongoing calendar starts on when a job has no start date. */
    private static final LocalDate SYNTHETIC_ANCHOR = LocalDate.of(2024, 1, 1);   // a Monday

    private static final List<String> DAY_KEYS =
            List.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");

    private static final DateTimeFormatter DAY_MONTH =
            DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH);
    private static final DateTimeFormatter DAY_MONTH_YEAR =
            DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);

    /** Platform fee on worker earnings, configured in application.yml; 0 disables the fee. */
    @Value("${skillbridge.pricing.platform-fee-percent:0}")
    private double platformFeePercent;

    /** Tests construct the calculator with new and set the fee directly. */
    public void setPlatformFeePercent(double platformFeePercent) {
        this.platformFeePercent = platformFeePercent;
    }

    /** One working window. Times only - the date comes from the schedule. */
    public record ShiftWindow(LocalTime startTime, LocalTime endTime,
                              LocalTime breakStart, LocalTime breakEnd, Integer breakMinutes) {}

    /** Everything the engine needs, whether it came from a request body or a saved job. */
    public record ScheduleInput(
            EngagementModel engagementModel,
            LocalDate workDate,
            LocalDate startDate,
            LocalDate endDate,
            JobDuration durationType,
            List<String> workingDays,
            List<ShiftWindow> shifts,
            ShiftArrangement shiftArrangement,
            boolean breakPaid,
            double salary,
            SalaryUnit salaryUnit,
            PayrollCycle payrollCycle,
            WorkPattern workPattern,
            Integer durationMonths,
            List<DayTime> dayTimes) {

        public EngagementModel modelOrDefault() {
            return engagementModel != null ? engagementModel : EngagementModel.FEW_WEEKS;
        }

        public WorkPattern patternOrDefault() {
            return workPattern != null ? workPattern : WorkPattern.FULL_DAY;
        }

        public ShiftArrangement arrangementOrDefault() {
            return shiftArrangement != null ? shiftArrangement : ShiftArrangement.ALL_SHIFTS;
        }

        public List<String> daysOrEmpty() {
            return workingDays == null ? List.of() : workingDays;
        }

        public List<ShiftWindow> shiftsOrEmpty() {
            return shifts == null ? List.of() : shifts;
        }

        public List<DayTime> dayTimesOrEmpty() {
            return dayTimes == null ? List.of() : dayTimes;
        }
    }

    // ------------------------------------------------------------------ primitives

    /** Minutes between two times, treating end <= start as crossing midnight. */
    public static int minutesBetween(LocalTime start, LocalTime end) {
        if (start == null || end == null) {
            return 0;
        }
        long minutes = Duration.between(start, end).toMinutes();
        if (minutes <= 0) {
            minutes += 24 * 60;
        }
        return (int) minutes;
    }

    /** Break minutes of one shift: breakMinutes wins, the legacy window is the fallback. */
    public static int breakMinutesOf(ShiftWindow shift) {
        if (shift.breakMinutes() != null) {
            return shift.breakMinutes();
        }
        if (shift.breakStart() == null || shift.breakEnd() == null) {
            return 0;
        }
        return minutesBetween(shift.breakStart(), shift.breakEnd());
    }

    /** Paid minutes of one shift: its span, less the break when the break is unpaid. */
    public static int paidMinutes(ShiftWindow shift, boolean breakPaid) {
        int span = minutesBetween(shift.startTime(), shift.endTime());
        if (breakPaid) {
            return span;
        }
        return Math.max(0, span - breakMinutesOf(shift));
    }

    /**
     * ALL_SHIFTS sums every shift; ONE_OF_SHIFTS takes the longest single shift, because that is
     * the planning figure the employer has to budget for.
     */
    public double paidMinutesPerDay(ScheduleInput in) {
        List<ShiftWindow> shifts = in.shiftsOrEmpty();
        if (shifts.isEmpty()) {
            return 0;
        }
        if (in.arrangementOrDefault() == ShiftArrangement.ONE_OF_SHIFTS) {
            int longest = 0;
            for (ShiftWindow s : shifts) {
                longest = Math.max(longest, paidMinutes(s, in.breakPaid()));
            }
            return longest;
        }
        int total = 0;
        for (ShiftWindow s : shifts) {
            total += paidMinutes(s, in.breakPaid());
        }
        return total;
    }

    /** The day-specific entry covering one date, or null when there is none. */
    public DayTime dayTimeFor(ScheduleInput in, LocalDate date) {
        List<DayTime> dayTimes = in.dayTimesOrEmpty();
        if (dayTimes.isEmpty()) {
            return null;
        }
        String key = DAY_KEYS.get(date.getDayOfWeek().getValue() - 1);
        for (DayTime d : dayTimes) {
            if (d != null && key.equals(d.getDayCode())) {
                return d;
            }
        }
        return null;
    }

    /** Paid minutes on one scheduled date: its dayTimes entry, else the plain shifts. */
    public int paidMinutesOn(ScheduleInput in, LocalDate date) {
        DayTime day = dayTimeFor(in, date);
        if (day != null) {
            return minutesBetween(day.getStartTime(), day.getEndTime());
        }
        return (int) paidMinutesPerDay(in);
    }

    /** true when the posting runs indefinitely rather than between two fixed dates. */
    public boolean isOngoing(ScheduleInput in) {
        EngagementModel model = in.modelOrDefault();
        if (model == EngagementModel.ONE_DAY) {
            return false;
        }
        if (model == EngagementModel.FEW_DAYS || model == EngagementModel.FEW_WEEKS) {
            return false;
        }
        if (model == EngagementModel.PERMANENT) {
            return true;
        }
        if (in.durationType() == JobDuration.SPECIFIC) {
            return false;
        }
        if (in.durationType() == JobDuration.ONGOING) {
            return true;
        }
        return in.startDate() == null || in.endDate() == null;
    }

    /** Working days per week: the size of the selected day list, 6 when nothing was selected. */
    public int workingDaysPerWeek(ScheduleInput in) {
        int size = in.daysOrEmpty().size();
        return size > 0 ? size : 6;
    }

    /**
     * The dates the schedule actually runs on. Fixed ranges enumerate their days; ongoing jobs
     * synthesise a representative month so per-day math still has dates to hang on.
     */
    public List<LocalDate> scheduledDates(ScheduleInput in) {
        EngagementModel model = in.modelOrDefault();
        if (model == EngagementModel.ONE_DAY) {
            return in.workDate() != null ? List.of(in.workDate()) : List.of();
        }
        if (!isOngoing(in) && in.startDate() != null && in.endDate() != null
                && !in.endDate().isBefore(in.startDate())) {
            List<String> days = in.daysOrEmpty();
            List<LocalDate> dates = new ArrayList<>();
            for (LocalDate d = in.startDate(); !d.isAfter(in.endDate()); d = d.plusDays(1)) {
                if (days.isEmpty() || days.contains(DAY_KEYS.get(d.getDayOfWeek().getValue() - 1))) {
                    dates.add(d);
                }
            }
            return dates;
        }
        int count = (int) Math.round(workingDaysPerWeek(in) * WEEKS_PER_MONTH);
        List<String> days = in.daysOrEmpty();
        List<LocalDate> dates = new ArrayList<>();
        LocalDate anchor = in.startDate() != null ? in.startDate() : SYNTHETIC_ANCHOR;
        for (LocalDate d = anchor; dates.size() < count; d = d.plusDays(1)) {
            if (days.isEmpty() || days.contains(DAY_KEYS.get(d.getDayOfWeek().getValue() - 1))) {
                dates.add(d);
            }
        }
        return dates;
    }

    public int scheduledDays(ScheduleInput in) {
        return scheduledDates(in).size();
    }

    // ------------------------------------------------------------------ validation

    /** Throws a 400 with a plain-language message when the duration's rules are broken. */
    public void validate(ScheduleInput in) {
        EngagementModel model = in.modelOrDefault();

        switch (model) {
            case ONE_DAY -> {
                if (in.workDate() == null) {
                    throw ApiException.badRequest("Choose a work date.");
                }
                if (in.shiftsOrEmpty().isEmpty() && in.dayTimesOrEmpty().isEmpty()) {
                    throw ApiException.badRequest("Add a start time and end time.");
                }
            }
            case FEW_DAYS -> {
                requireRange(in, 2, 7, "End date must be 2\u20137 days after start date.");
                requireDays(in);
                requireShifts(in);
                requireWorkingDayInRange(in);
            }
            case FEW_WEEKS -> {
                requireRange(in, 8, 31, "End date must be 8\u201331 days after start date.");
                requireDays(in);
                requireShifts(in);
                requireWorkingDayInRange(in);
            }
            case MONTHS -> {
                if (in.startDate() == null) {
                    throw ApiException.badRequest("Choose a start date.");
                }
                boolean fixedMonths = in.durationMonths() != null;
                if (fixedMonths && (in.durationMonths() < 1 || in.durationMonths() > 12)) {
                    throw ApiException.badRequest("Choose between 1 and 12 months.");
                }
                boolean fixedRange = in.endDate() != null || in.durationType() == JobDuration.SPECIFIC;
                boolean ongoing = in.durationType() == JobDuration.ONGOING
                        && in.endDate() == null && !fixedMonths;
                int bounds = (fixedMonths ? 1 : 0) + (fixedRange ? 1 : 0) + (ongoing ? 1 : 0);
                if (bounds == 0) {
                    throw ApiException.badRequest(
                            "Choose how long the job runs: a number of months, an end date, or ongoing.");
                }
                if (bounds > 1) {
                    throw ApiException.badRequest("Choose either a number of months or an end date.");
                }
                requireDays(in);
                requireShifts(in);
            }
            case PERMANENT -> {
                requireDays(in);
                requireShifts(in);
                if (in.startDate() == null) {
                    throw ApiException.badRequest("Choose a start date.");
                }
                if (in.durationType() == JobDuration.SPECIFIC || in.endDate() != null) {
                    throw ApiException.badRequest("A permanent job cannot have an end date.");
                }
            }
        }

        if (in.startDate() != null && in.endDate() != null && in.endDate().isBefore(in.startDate())) {
            throw ApiException.badRequest("The end date cannot be before the start date.");
        }

        WorkPattern pattern = in.patternOrDefault();
        if (in.salaryUnit() != null && !model.allowedSalaryUnits(pattern).contains(in.salaryUnit())) {
            throw ApiException.badRequest("A " + label(model) + " job cannot be paid "
                    + label(in.salaryUnit()) + ". Allowed: "
                    + String.join(", ", model.allowedSalaryUnits(pattern).stream().map(u -> u.name()).toList()));
        }

        validateWindows(in);
    }

    private void requireRange(ScheduleInput in, int minDays, int maxDays, String message) {
        if (in.startDate() == null || in.endDate() == null) {
            throw ApiException.badRequest("Choose a start date and an end date.");
        }
        long apart = ChronoUnit.DAYS.between(in.startDate(), in.endDate());
        if (apart < minDays || apart > maxDays) {
            throw ApiException.badRequest(message);
        }
    }

    private void requireDays(ScheduleInput in) {
        if (in.daysOrEmpty().isEmpty()) {
            throw ApiException.badRequest("Choose at least one working day.");
        }
    }

    private void requireShifts(ScheduleInput in) {
        if (in.shiftsOrEmpty().isEmpty() && in.dayTimesOrEmpty().isEmpty()) {
            throw ApiException.badRequest("Add a start time and end time.");
        }
    }

    private void requireWorkingDayInRange(ScheduleInput in) {
        if (scheduledDates(in).isEmpty()) {
            throw ApiException.badRequest("No working day falls in this date range.");
        }
    }

    /** End times run after start times and no break swallows its own shift. */
    private void validateWindows(ScheduleInput in) {
        for (ShiftWindow s : in.shiftsOrEmpty()) {
            if (s.startTime() == null || s.endTime() == null) {
                throw ApiException.badRequest("Add a start time and end time.");
            }
            if (s.endTime().equals(s.startTime())) {
                throw ApiException.badRequest("End time must be after start time.");
            }
            int span = minutesBetween(s.startTime(), s.endTime());
            if (breakMinutesOf(s) > span) {
                throw ApiException.badRequest("The break cannot be longer than the shift.");
            }
        }
        for (DayTime d : in.dayTimesOrEmpty()) {
            if (d.getStartTime() == null || d.getEndTime() == null) {
                throw ApiException.badRequest("Add a start time and end time.");
            }
            if (d.getEndTime().equals(d.getStartTime())) {
                throw ApiException.badRequest("End time must be after start time.");
            }
        }
    }

    // ------------------------------------------------------------------ the estimate

    public ScheduleEstimateDto estimate(ScheduleInput in) {
        EngagementModel model = in.modelOrDefault();
        WorkPattern pattern = in.patternOrDefault();
        boolean ongoing = isOngoing(in);
        List<String> warnings = new ArrayList<>();

        List<LocalDate> dates = scheduledDates(in);
        int scheduledDays = dates.size();
        boolean perDate = !in.dayTimesOrEmpty().isEmpty() && scheduledDays > 0;

        double paidMinutesPerDay;
        double expectedPaidHours;
        if (perDate) {
            long total = 0;
            for (LocalDate d : dates) {
                total += paidMinutesOn(in, d);
            }
            paidMinutesPerDay = total / (double) scheduledDays;
            expectedPaidHours = round2(total / 60.0);
        } else {
            paidMinutesPerDay = paidMinutesPerDay(in);
            expectedPaidHours = round2(scheduledDays * paidMinutesPerDay / 60.0);
        }
        double paidHoursPerDay = round2(paidMinutesPerDay / 60.0);
        int shiftsPerDay = !in.shiftsOrEmpty().isEmpty()
                ? (in.arrangementOrDefault() == ShiftArrangement.ALL_SHIFTS
                        ? in.shiftsOrEmpty().size() : Math.min(1, in.shiftsOrEmpty().size()))
                : (in.dayTimesOrEmpty().isEmpty() ? 0 : 1);
        int daysPerWeek = workingDaysPerWeek(in);
        double paidHoursPerWeek = round2(paidHoursPerDay
                * (model == EngagementModel.ONE_DAY ? 1 : daysPerWeek));

        for (ShiftWindow s : in.shiftsOrEmpty()) {
            if (s.startTime() == null || s.endTime() == null) {
                warnings.add("A shift is missing its start or end time");
                continue;
            }
            int span = minutesBetween(s.startTime(), s.endTime());
            if (breakMinutesOf(s) >= span) {
                warnings.add("A shift is shorter than the break inside it ("
                        + s.startTime() + "-" + s.endTime() + ")");
            }
        }
        if (in.startDate() != null && in.endDate() != null && in.endDate().isBefore(in.startDate())) {
            warnings.add("The end date is before the start date");
        }
        if (in.shiftsOrEmpty().isEmpty()) {
            warnings.add("No shift has been added yet, so the hours cannot be worked out");
        }
        if (model != EngagementModel.ONE_DAY && in.daysOrEmpty().isEmpty()) {
            warnings.add("No working days have been picked yet - assuming a six-day week");
        }
        if (scheduledDays == 0) {
            warnings.add("No working day falls inside this date range");
        }
        if (in.salaryUnit() != null && !model.allowedSalaryUnits(pattern).contains(in.salaryUnit())) {
            warnings.add("A " + label(model) + " job cannot be paid " + label(in.salaryUnit()));
        }

        Double earnings = null;
        String basisLabel = null;
        double rate = in.salary();
        SalaryUnit unit = in.salaryUnit();
        if (unit != null && rate > 0) {
            switch (unit) {
                case HOURLY -> {
                    earnings = rate * expectedPaidHours;
                    basisLabel = money(rate) + "/hour x " + trim(expectedPaidHours) + " hours";
                }
                case PER_SHIFT -> {
                    int totalShifts = in.arrangementOrDefault() == ShiftArrangement.ALL_SHIFTS
                            ? scheduledDays * Math.max(1, shiftsPerDay)
                            : scheduledDays;
                    earnings = rate * totalShifts;
                    basisLabel = money(rate) + "/shift x " + totalShifts + " shifts";
                }
                case DAILY -> {
                    earnings = rate * scheduledDays;
                    basisLabel = money(rate) + "/day x " + scheduledDays + " days";
                }
                case PER_WEEK -> {
                    double weeks = scheduledDays / (double) daysPerWeek;
                    earnings = rate * weeks;
                    basisLabel = money(rate) + "/week x " + trim(round2(weeks)) + " weeks";
                }
                case MONTHLY -> {
                    if (ongoing) {
                        earnings = rate;
                        basisLabel = money(rate) + "/month";
                    } else {
                        double daysInMonth = daysPerWeek * WEEKS_PER_MONTH;
                        earnings = rate * (scheduledDays / daysInMonth);
                        basisLabel = money(rate) + "/month pro-rated over " + scheduledDays
                                + " of " + trim(round2(daysInMonth)) + " working days";
                    }
                }
            }
        }
        if (earnings != null) {
            earnings = round2(earnings);
        }

        // The platform fee comes from configuration; with no percentage the total is just earnings.
        Double platformFee = null;
        Double employerTotal = earnings;
        if (earnings != null && platformFeePercent > 0) {
            platformFee = Math.round(earnings * platformFeePercent) / 100.0;
            employerTotal = earnings + platformFee;
        }

        PayrollCycle cycle = in.payrollCycle() != null ? in.payrollCycle() : model.defaultPayrollCycle();
        String fundingWhen = cycle == PayrollCycle.ON_COMPLETION ? "BEFORE_WORK" : "PAYROLL_CYCLE";

        return new ScheduleEstimateDto(
                paidHoursPerDay,
                paidHoursPerWeek,
                shiftsPerDay,
                scheduledDays,
                expectedPaidHours,
                periodLabel(in, ongoing),
                ongoing,
                model.allowedSalaryUnits(pattern),
                model.recommendedSalaryUnit(pattern),
                earnings,
                basisLabel,
                platformFee,
                employerTotal,
                cycle,
                fundingWhen,
                warnings);
    }

    // ------------------------------------------------------------------ labels

    private String periodLabel(ScheduleInput in, boolean ongoing) {
        EngagementModel model = in.modelOrDefault();
        if (model == EngagementModel.ONE_DAY) {
            return in.workDate() != null ? in.workDate().format(DAY_MONTH_YEAR) : "One shift";
        }
        if (ongoing) {
            return in.startDate() != null
                    ? "Ongoing from " + in.startDate().format(DAY_MONTH_YEAR) + " (per month)"
                    : "Ongoing (per month)";
        }
        if (in.startDate() == null || in.endDate() == null) {
            return "Dates not set";
        }
        String from = in.startDate().getYear() == in.endDate().getYear()
                ? in.startDate().format(DAY_MONTH)
                : in.startDate().format(DAY_MONTH_YEAR);
        return from + " \u2013 " + in.endDate().format(DAY_MONTH_YEAR);
    }

    private static String label(Enum<?> value) {
        return value.name().toLowerCase(Locale.ENGLISH).replace('_', ' ');
    }

    private static String money(double amount) {
        return "\u20B9" + trim(amount);
    }

    private static String trim(double value) {
        if (value == Math.rint(value)) {
            return String.valueOf((long) value);
        }
        return String.valueOf(round2(value));
    }

    public static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
