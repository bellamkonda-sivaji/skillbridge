package com.skillbridge.service;

import com.skillbridge.dto.ScheduleEstimateDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.EngagementModel;
import com.skillbridge.model.JobDuration;
import com.skillbridge.model.PayrollCycle;
import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.ShiftArrangement;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * The employment rules engine: engagement model -> schedule -> salary. Pure arithmetic and pure
 * rule checks, shared by the estimate endpoint and by job creation so the two can never drift.
 */
@Service
public class ScheduleCalculator {

    /** An ongoing month is this many weeks - the figure the whole engine rounds on. */
    public static final double WEEKS_PER_MONTH = 4.345;

    private static final List<String> DAY_KEYS =
            List.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");

    private static final DateTimeFormatter DAY_MONTH =
            DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH);
    private static final DateTimeFormatter DAY_MONTH_YEAR =
            DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);

    /** One working window. Times only - the date comes from the schedule. */
    public record ShiftWindow(LocalTime startTime, LocalTime endTime,
                              LocalTime breakStart, LocalTime breakEnd) {}

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
            PayrollCycle payrollCycle) {

        public EngagementModel modelOrDefault() {
            return engagementModel != null ? engagementModel : EngagementModel.FULL_TIME;
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

    /** Paid minutes of one shift: its span, less the break when the break is unpaid. */
    public static int paidMinutes(ShiftWindow shift, boolean breakPaid) {
        int span = minutesBetween(shift.startTime(), shift.endTime());
        if (breakPaid || shift.breakStart() == null || shift.breakEnd() == null) {
            return span;
        }
        int breakMinutes = minutesBetween(shift.breakStart(), shift.breakEnd());
        return Math.max(0, span - breakMinutes);
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

    /** true when the posting runs indefinitely rather than between two fixed dates. */
    public boolean isOngoing(ScheduleInput in) {
        EngagementModel model = in.modelOrDefault();
        if (model == EngagementModel.ONE_TIME) {
            return false;
        }
        if (model == EngagementModel.DAILY || model == EngagementModel.TEMPORARY) {
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

    public int scheduledDays(ScheduleInput in) {
        EngagementModel model = in.modelOrDefault();
        if (model == EngagementModel.ONE_TIME) {
            return 1;
        }
        if (!isOngoing(in) && in.startDate() != null && in.endDate() != null
                && !in.endDate().isBefore(in.startDate())) {
            List<String> days = in.daysOrEmpty();
            int count = 0;
            for (LocalDate d = in.startDate(); !d.isAfter(in.endDate()); d = d.plusDays(1)) {
                if (days.isEmpty() || days.contains(DAY_KEYS.get(d.getDayOfWeek().getValue() - 1))) {
                    count++;
                }
            }
            return count;
        }
        // Ongoing: the month figure, so every model can be compared on the same footing.
        return (int) Math.round(workingDaysPerWeek(in) * WEEKS_PER_MONTH);
    }

    // ------------------------------------------------------------------ validation

    /** Throws a 400 with a plain-language message when the model's rules are broken. */
    public void validate(ScheduleInput in) {
        EngagementModel model = in.modelOrDefault();
        boolean ongoing = isOngoing(in);

        switch (model) {
            case ONE_TIME -> {
                if (in.workDate() == null) {
                    throw ApiException.badRequest("A one-time job needs a single work date");
                }
                if (in.shiftsOrEmpty().isEmpty()) {
                    throw ApiException.badRequest("A one-time job needs at least one shift");
                }
            }
            case DAILY -> {
                requireRange(in, "A daily job needs a start date and an end date");
                requireDays(in, "A daily job needs the working days it runs on");
            }
            case TEMPORARY -> {
                if (in.durationType() == JobDuration.ONGOING) {
                    throw ApiException.badRequest(
                            "A temporary job cannot be ongoing - give it a start and end date");
                }
                requireRange(in, "A temporary job needs a start date and an end date");
                requireDays(in, "A temporary job needs the working days it runs on");
            }
            case PART_TIME, FULL_TIME -> {
                requireDays(in, "This job needs the working days it runs on");
                requireShifts(in);
                if (!ongoing) {
                    requireRange(in, "A fixed-duration job needs a start date and an end date");
                }
            }
            case PERMANENT -> {
                requireDays(in, "A permanent job needs the working days it runs on");
                requireShifts(in);
                if (in.durationType() == JobDuration.SPECIFIC || in.endDate() != null) {
                    throw ApiException.badRequest(
                            "A permanent job is ongoing - it cannot have a fixed end date");
                }
            }
        }

        if (in.startDate() != null && in.endDate() != null && in.endDate().isBefore(in.startDate())) {
            throw ApiException.badRequest("The end date cannot be before the start date");
        }

        if (in.salaryUnit() != null && !model.allowedSalaryUnits().contains(in.salaryUnit())) {
            throw ApiException.badRequest("A " + label(model) + " job cannot be paid "
                    + label(in.salaryUnit()) + ". Allowed: "
                    + String.join(", ", model.allowedSalaryUnits().stream().map(u -> u.name()).toList()));
        }
    }

    private void requireRange(ScheduleInput in, String message) {
        if (in.startDate() == null || in.endDate() == null) {
            throw ApiException.badRequest(message);
        }
    }

    private void requireDays(ScheduleInput in, String message) {
        if (in.daysOrEmpty().isEmpty()) {
            throw ApiException.badRequest(message);
        }
    }

    private void requireShifts(ScheduleInput in) {
        if (in.shiftsOrEmpty().isEmpty()) {
            throw ApiException.badRequest("This job needs at least one shift");
        }
    }

    // ------------------------------------------------------------------ the estimate

    public ScheduleEstimateDto estimate(ScheduleInput in) {
        EngagementModel model = in.modelOrDefault();
        boolean ongoing = isOngoing(in);
        List<String> warnings = new ArrayList<>();

        double paidMinutesPerDay = paidMinutesPerDay(in);
        double paidHoursPerDay = round2(paidMinutesPerDay / 60.0);
        int shiftsPerDay = in.arrangementOrDefault() == ShiftArrangement.ALL_SHIFTS
                ? in.shiftsOrEmpty().size() : Math.min(1, in.shiftsOrEmpty().size());
        int daysPerWeek = workingDaysPerWeek(in);
        double paidHoursPerWeek = round2(paidHoursPerDay
                * (model == EngagementModel.ONE_TIME ? 1 : daysPerWeek));
        int scheduledDays = scheduledDays(in);
        double expectedPaidHours = round2(scheduledDays * paidHoursPerDay);

        for (ShiftWindow s : in.shiftsOrEmpty()) {
            if (s.startTime() == null || s.endTime() == null) {
                warnings.add("A shift is missing its start or end time");
                continue;
            }
            int span = minutesBetween(s.startTime(), s.endTime());
            int brk = minutesBetween(s.breakStart(), s.breakEnd());
            if (brk >= span) {
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
        if (model != EngagementModel.ONE_TIME && in.daysOrEmpty().isEmpty()) {
            warnings.add("No working days have been picked yet - assuming a six-day week");
        }
        if (scheduledDays == 0) {
            warnings.add("No working day falls inside this date range");
        }
        if (in.salaryUnit() != null && !model.allowedSalaryUnits().contains(in.salaryUnit())) {
            warnings.add("A " + label(model) + " job cannot be paid " + label(in.salaryUnit()));
        }

        Double earnings = null;
        String basisLabel = null;
        double rate = in.salary();
        SalaryUnit unit = in.salaryUnit();
        if (unit != null && rate > 0) {
            switch (unit) {
                case PER_HOUR -> {
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
                case PER_DAY -> {
                    earnings = rate * scheduledDays;
                    basisLabel = money(rate) + "/day x " + scheduledDays + " days";
                }
                case PER_WEEK -> {
                    double weeks = scheduledDays / (double) daysPerWeek;
                    earnings = rate * weeks;
                    basisLabel = money(rate) + "/week x " + trim(round2(weeks)) + " weeks";
                }
                case PER_MONTH -> {
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
                model.allowedSalaryUnits(),
                model.recommendedSalaryUnit(),
                earnings,
                basisLabel,
                null,           // no platform fee is configured - never invent one
                earnings,       // employer total == worker earnings while there is no fee
                cycle,
                fundingWhen,
                warnings);
    }

    // ------------------------------------------------------------------ labels

    private String periodLabel(ScheduleInput in, boolean ongoing) {
        EngagementModel model = in.modelOrDefault();
        if (model == EngagementModel.ONE_TIME) {
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
        return from + " – " + in.endDate().format(DAY_MONTH_YEAR);
    }

    private static String label(Enum<?> value) {
        return value.name().toLowerCase(Locale.ENGLISH).replace('_', ' ');
    }

    private static String money(double amount) {
        return "₹" + trim(amount);
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
