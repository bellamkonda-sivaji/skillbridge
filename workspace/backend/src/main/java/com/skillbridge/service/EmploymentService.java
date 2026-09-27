package com.skillbridge.service;

import com.skillbridge.dto.AttendanceDto;
import com.skillbridge.dto.EmploymentDetailDto;
import com.skillbridge.dto.EmploymentDto;
import com.skillbridge.dto.PayrollSummaryDto;
import com.skillbridge.dto.TodayShiftDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.AttendanceRepository;
import com.skillbridge.repository.EmployerProfileRepository;
import com.skillbridge.repository.EmploymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Owns the employment record that an accepted offer produces, the joining details that hang off
 * it, today's shift and the attendance ledger. The check-in rules live here and nowhere else.
 */
@Service
public class EmploymentService {

    private static final List<String> DAY_KEYS =
            List.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");

    private final EmploymentRepository employmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final NotificationService notificationService;
    private final ScheduleCalculator scheduleCalculator;

    public EmploymentService(EmploymentRepository employmentRepository,
                             AttendanceRepository attendanceRepository,
                             EmployerProfileRepository employerProfileRepository,
                             NotificationService notificationService,
                             ScheduleCalculator scheduleCalculator) {
        this.employmentRepository = employmentRepository;
        this.attendanceRepository = attendanceRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.notificationService = notificationService;
        this.scheduleCalculator = scheduleCalculator;
    }

    // ---------------------------------------------------------------- creation

    /**
     * Called from inside the accept-offer transaction. Idempotent: an offer that already has an
     * employment simply gets the existing row back, so a retry can never double up.
     */
    @Transactional
    public Employment createFromAcceptedOffer(JobOffer offer) {
        Optional<Employment> existing = employmentRepository.findByOfferId(offer.getId());
        if (existing.isPresent()) {
            return existing.get();
        }
        JobApplication application = offer.getApplication();
        JobPost job = application.getJob();
        EmployerAccount employer = job.getEmployer();
        EmployerProfile profile = employerProfileRepository.findByAccountId(employer.getId()).orElse(null);

        String location = offer.getWorkLocation();
        if (isBlank(location)) {
            location = profile != null && !isBlank(profile.getAddress())
                    ? profile.getAddress()
                    : joinNonBlank(job.getArea(), job.getCity());
        }

        Employment employment = Employment.builder()
                .worker(application.getWorker())
                .employer(employer)
                .job(job)
                .application(application)
                .offer(offer)
                .joiningDate(offer.getJoiningDate())
                .reportingTime(firstShift(job).map(JobShift::getStartTime).orElse(null))
                .status(EmploymentStatus.OFFER_ACCEPTED)
                .salary(offer.getSalary() > 0 ? offer.getSalary() : job.getSalary())
                .salaryUnit(offer.getSalaryUnit() != null ? offer.getSalaryUnit() : job.getSalaryUnit())
                .employmentType(offer.getEmploymentType() != null
                        ? offer.getEmploymentType() : job.getEmploymentType())
                .workLocation(location)
                .contactPersonName(employer.getName())
                .contactPersonPhone(employer.getPhone())
                .documentsToCarry(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .build();
        return employmentRepository.save(employment);
    }

    // ---------------------------------------------------------------- worker reads

    public List<EmploymentDto> listForWorker(WorkerAccount worker, String scope) {
        return employmentRepository.findByWorkerOrderByJoiningDateDesc(worker).stream()
                .filter(e -> matchesScope(e, scope))
                .map(this::toCard)
                .toList();
    }

    public List<EmploymentDto> listForEmployer(EmployerAccount employer, String scope) {
        return employmentRepository.findByEmployerOrderByJoiningDateDesc(employer).stream()
                .filter(e -> matchesScope(e, scope))
                .map(this::toCard)
                .toList();
    }

    public EmploymentDetailDto detailForWorker(WorkerAccount worker, Long id) {
        return toDetail(requireWorkerEmployment(worker, id));
    }

    @Transactional
    public EmploymentDetailDto acknowledgeJoining(WorkerAccount worker, Long id) {
        Employment employment = requireWorkerEmployment(worker, id);
        if (employment.getStatus() == EmploymentStatus.COMPLETED
                || employment.getStatus() == EmploymentStatus.ENDED) {
            throw ApiException.badRequest("This employment has already ended");
        }
        if (employment.getJoiningAcknowledgedAt() == null) {
            employment.setJoiningAcknowledgedAt(LocalDateTime.now());
            if (employment.getStatus() == EmploymentStatus.OFFER_ACCEPTED) {
                employment.setStatus(EmploymentStatus.JOINING_CONFIRMED);
            }
            employmentRepository.save(employment);
            notificationService.notify(employment.getEmployer(), "Joining confirmed",
                    employment.getWorker().getName() + " confirmed joining for \""
                            + employment.getJob().getTitle() + "\"",
                    NotificationType.APPLICATION, "/employer/employments");
        }
        return toDetail(employment);
    }

    // ---------------------------------------------------------------- today's shift

    /** Never throws: when the worker has nothing on today it answers {@code hasShift: false}. */
    public TodayShiftDto todayShift(WorkerAccount worker) {
        LocalDate today = LocalDate.now();
        List<Employment> current = employmentRepository.findByWorkerOrderByJoiningDateDesc(worker).stream()
                .filter(e -> e.getStatus() == EmploymentStatus.JOINING_CONFIRMED
                        || e.getStatus() == EmploymentStatus.ACTIVE)
                .toList();
        if (current.isEmpty()) {
            return TodayShiftDto.none();
        }
        String todayKey = DAY_KEYS.get(today.getDayOfWeek().getValue() - 1);
        // A day counts when the job runs on it, or when an attendance row for today already
        // exists - an explicitly rostered day beats the weekly pattern.
        Employment employment = current.stream()
                .filter(e -> worksOn(e, todayKey)
                        || attendanceRepository.findByEmploymentAndWorkDate(e, today).isPresent())
                .min(Comparator.comparing(Employment::getId))
                .orElse(null);
        if (employment == null) {
            return TodayShiftDto.none();
        }

        Attendance attendance = attendanceRepository
                .findByEmploymentAndWorkDate(employment, today).orElse(null);
        AttendanceStatus status = attendance != null ? attendance.getStatus()
                : AttendanceStatus.NOT_CHECKED_IN;
        boolean canCheckIn = attendance == null || attendance.getCheckInAt() == null;
        boolean canCheckOut = attendance != null && attendance.getCheckInAt() != null
                && attendance.getCheckOutAt() == null;

        JobShift shift = firstShift(employment.getJob()).orElse(null);
        EmployerProfile profile = employerProfileRepository
                .findByAccountId(employment.getEmployer().getId()).orElse(null);

        return new TodayShiftDto(
                true,
                employment.getId(),
                employment.getJob().getTitle(),
                businessName(employment.getEmployer(), profile),
                today,
                shift != null ? shift.getStartTime() : employment.getReportingTime(),
                shift != null ? shift.getEndTime() : null,
                shift != null ? shift.getBreakStart() : null,
                shift != null ? shift.getBreakEnd() : null,
                employment.getWorkLocation(),
                employment.getContactPersonName(),
                employment.getContactPersonPhone(),
                latitude(employment, profile),
                longitude(employment, profile),
                status,
                attendance != null ? attendance.getCheckInAt() : null,
                attendance != null ? attendance.getCheckOutAt() : null,
                canCheckIn,
                canCheckOut);
    }

    // ---------------------------------------------------------------- attendance

    @Transactional
    public AttendanceDto checkIn(WorkerAccount worker, Long employmentId) {
        if (employmentId == null) {
            throw ApiException.badRequest("employmentId is required");
        }
        Employment employment = requireWorkerEmployment(worker, employmentId);
        if (employment.getStatus() != EmploymentStatus.JOINING_CONFIRMED
                && employment.getStatus() != EmploymentStatus.ACTIVE) {
            throw ApiException.badRequest("You can only check in once the job has started");
        }
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByEmploymentAndWorkDate(employment, today)
                .orElseGet(() -> Attendance.builder()
                        .employment(employment)
                        .workDate(today)
                        .status(AttendanceStatus.NOT_CHECKED_IN)
                        .build());
        if (attendance.getCheckInAt() != null) {
            throw ApiException.badRequest("You have already checked in today");
        }
        attendance.setCheckInAt(LocalDateTime.now());
        attendance.setStatus(AttendanceStatus.CHECKED_IN);
        attendanceRepository.save(attendance);

        if (employment.getStatus() == EmploymentStatus.JOINING_CONFIRMED) {
            employment.setStatus(EmploymentStatus.ACTIVE);
            if (employment.getStartedAt() == null) {
                employment.setStartedAt(LocalDateTime.now());
            }
            employmentRepository.save(employment);
        }
        return AttendanceDto.from(attendance);
    }

    @Transactional
    public AttendanceDto checkOut(WorkerAccount worker, Long employmentId) {
        if (employmentId == null) {
            throw ApiException.badRequest("employmentId is required");
        }
        Employment employment = requireWorkerEmployment(worker, employmentId);
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByEmploymentAndWorkDate(employment, today)
                .orElseThrow(() -> ApiException.badRequest("You have not checked in today"));
        if (attendance.getCheckInAt() == null) {
            throw ApiException.badRequest("You have not checked in today");
        }
        if (attendance.getCheckOutAt() != null) {
            throw ApiException.badRequest("You have already checked out today");
        }
        LocalDateTime now = LocalDateTime.now();
        attendance.setCheckOutAt(now);
        attendance.setStatus(AttendanceStatus.CHECKED_OUT);
        attendance.setMinutesWorked(
                (int) Math.max(0, Duration.between(attendance.getCheckInAt(), now).toMinutes()));
        attendanceRepository.save(attendance);
        return AttendanceDto.from(attendance);
    }

    public List<AttendanceDto> attendanceForWorker(WorkerAccount worker, Long employmentId,
                                                   LocalDate from, LocalDate to) {
        LocalDate start = from != null ? from : LocalDate.now().minusMonths(3);
        LocalDate end = to != null ? to : LocalDate.now().plusDays(1);
        List<Employment> scope = employmentId != null
                ? List.of(requireWorkerEmployment(worker, employmentId))
                : employmentRepository.findByWorkerOrderByJoiningDateDesc(worker);
        if (scope.isEmpty()) {
            return List.of();
        }
        return attendanceRepository
                .findByEmploymentInAndWorkDateBetweenOrderByWorkDateDesc(scope, start, end).stream()
                .map(AttendanceDto::from).toList();
    }

    public List<AttendanceDto> attendanceForEmployer(EmployerAccount employer, Long employmentId,
                                                     LocalDate from, LocalDate to) {
        LocalDate start = from != null ? from : LocalDate.now().minusMonths(3);
        LocalDate end = to != null ? to : LocalDate.now().plusDays(1);
        List<Employment> scope = employmentId != null
                ? List.of(requireEmployerEmployment(employer, employmentId))
                : employmentRepository.findByEmployerOrderByJoiningDateDesc(employer);
        if (scope.isEmpty()) {
            return List.of();
        }
        return attendanceRepository
                .findByEmploymentInAndWorkDateBetweenOrderByWorkDateDesc(scope, start, end).stream()
                .map(AttendanceDto::from).toList();
    }


    // ---------------------------------------------------------------- payroll

    public PayrollSummaryDto payrollForEmployer(EmployerAccount employer, Long employmentId,
                                                LocalDate from, LocalDate to) {
        return payroll(requireEmployerEmployment(employer, employmentId), from, to);
    }

    public PayrollSummaryDto payrollForWorker(WorkerAccount worker, Long employmentId,
                                              LocalDate from, LocalDate to) {
        return payroll(requireWorkerEmployment(worker, employmentId), from, to);
    }

    /**
     * Actual pay. Everything payable comes from approved attendance (CHECKED_OUT rows), never
     * from the schedule - 10 scheduled days with 9 attended pays for 9.
     */
    private PayrollSummaryDto payroll(Employment employment, LocalDate from, LocalDate to) {
        JobPost job = employment.getJob();
        LocalDate start = from != null ? from
                : firstNonNull(job.getStartDate(), employment.getJoiningDate(),
                        LocalDate.now().withDayOfMonth(1));
        LocalDate end = to != null ? to
                : firstNonNull(job.getEndDate(), LocalDate.now());
        if (end.isBefore(start)) {
            throw ApiException.badRequest("The end of the period cannot be before its start");
        }

        List<Attendance> rows = attendanceRepository
                .findByEmploymentAndWorkDateBetweenOrderByWorkDateDesc(employment, start, end);

        int payableDays = 0;
        int payableMinutes = 0;
        for (Attendance a : rows) {
            if (a.getStatus() != AttendanceStatus.CHECKED_OUT) {
                continue;
            }
            payableDays++;
            payableMinutes += a.getMinutesWorked() != null ? a.getMinutesWorked() : 0;
        }
        double payableHours = ScheduleCalculator.round2(payableMinutes / 60.0);

        ScheduleCalculator.ScheduleInput input = scheduleInput(job, start, end);
        int scheduledDays = scheduleCalculator.scheduledDays(input);
        double scheduledHoursPerDay = scheduleCalculator.paidMinutesPerDay(input) / 60.0;
        double overtimeHours = scheduledHoursPerDay > 0
                ? ScheduleCalculator.round2(
                        Math.max(0, payableHours - payableDays * scheduledHoursPerDay))
                : 0;

        SalaryUnit basis = employment.getSalaryUnit() != null
                ? employment.getSalaryUnit() : SalaryUnit.DAILY;
        double rate = employment.getSalary();
        double gross;
        String label;
        switch (basis) {
            case HOURLY -> {
                gross = rate * payableHours;
                label = money(rate) + "/hour x " + payableHours + " hours worked";
            }
            case PER_SHIFT -> {
                gross = rate * payableDays;
                label = money(rate) + "/shift x " + payableDays + " shifts attended";
            }
            case PER_WEEK -> {
                int perWeek = scheduleCalculator.workingDaysPerWeek(input);
                gross = rate * (payableDays / (double) perWeek);
                label = money(rate) + "/week x " + payableDays + " of " + perWeek + " days a week";
            }
            case MONTHLY -> {
                if (scheduledDays > 0) {
                    gross = rate * (payableDays / (double) scheduledDays);
                    label = money(rate) + "/month pro-rated over " + payableDays + " of "
                            + scheduledDays + " scheduled days";
                } else {
                    gross = 0;
                    label = money(rate) + "/month - no scheduled day falls in this period";
                }
            }
            default -> {
                gross = rate * payableDays;
                label = money(rate) + "/day x " + payableDays + " days attended";
            }
        }

        return new PayrollSummaryDto(employment.getId(), start, end, basis, rate,
                scheduledDays, payableDays, payableHours, overtimeHours,
                ScheduleCalculator.round2(gross), label,
                rows.stream().map(AttendanceDto::from).toList());
    }

    /** The job's schedule, clamped to the payroll period being asked about. */
    private ScheduleCalculator.ScheduleInput scheduleInput(JobPost job, LocalDate from, LocalDate to) {
        List<ScheduleCalculator.ShiftWindow> windows = new ArrayList<>();
        for (JobShift s : job.getShifts()) {
            windows.add(new ScheduleCalculator.ShiftWindow(
                    s.getStartTime(), s.getEndTime(), s.getBreakStart(), s.getBreakEnd(),
                    s.getBreakMinutes()));
        }
        LocalDate start = job.getStartDate() != null && job.getStartDate().isAfter(from)
                ? job.getStartDate() : from;
        LocalDate end = job.getEndDate() != null && job.getEndDate().isBefore(to)
                ? job.getEndDate() : to;
        if (end.isBefore(start)) {
            end = start;
        }
        return new ScheduleCalculator.ScheduleInput(
                job.getEngagementModel(), job.getWorkDate(), start, end, JobDuration.SPECIFIC,
                new ArrayList<>(job.getWorkingDays()), windows, job.getShiftArrangement(),
                job.isBreakPaid(), job.getSalary(), job.getSalaryUnit(), job.getPayrollCycle(),
                job.getWorkPattern(), job.getDurationMonths(),
                job.getDayTimes() == null ? List.of() : new ArrayList<>(job.getDayTimes()));
    }

    private static String money(double amount) {
        return "\u20B9" + (amount == Math.rint(amount) ? String.valueOf((long) amount) : String.valueOf(amount));
    }

    @SafeVarargs
    private static <T> T firstNonNull(T... values) {
        for (T v : values) {
            if (v != null) return v;
        }
        return null;
    }

    // ---------------------------------------------------------------- helpers

    private Employment requireWorkerEmployment(WorkerAccount worker, Long id) {
        Employment employment = employmentRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Employment not found"));
        if (!employment.getWorker().getId().equals(worker.getId())) {
            throw ApiException.forbidden("This is not your employment");
        }
        return employment;
    }

    private Employment requireEmployerEmployment(EmployerAccount employer, Long id) {
        Employment employment = employmentRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Employment not found"));
        if (!employment.getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("This is not your employment");
        }
        return employment;
    }

    /** CURRENT (the default) or PAST; anything else means "no filter". */
    private boolean matchesScope(Employment e, String scope) {
        if (scope == null || scope.isBlank() || "ALL".equalsIgnoreCase(scope)) {
            return true;
        }
        if ("PAST".equalsIgnoreCase(scope)) {
            return !e.isCurrent();
        }
        if ("CURRENT".equalsIgnoreCase(scope)) {
            return e.isCurrent();
        }
        return true;
    }

    private boolean worksOn(Employment employment, String dayKey) {
        List<String> days = employment.getJob().getWorkingDays();
        return days == null || days.isEmpty() || days.contains(dayKey);
    }

    private Optional<JobShift> firstShift(JobPost job) {
        List<JobShift> shifts = job.getShifts();
        return shifts == null || shifts.isEmpty() ? Optional.empty() : Optional.of(shifts.get(0));
    }

    private String shiftLabel(JobPost job) {
        return firstShift(job).map(s -> {
            String window = s.getStartTime() != null && s.getEndTime() != null
                    ? s.getStartTime().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"))
                            + " - " + s.getEndTime().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"))
                    : null;
            if (isBlank(s.getLabel())) {
                return window;
            }
            return window == null ? s.getLabel() : s.getLabel() + " " + window;
        }).orElse(null);
    }

    private EmploymentDto toCard(Employment e) {
        EmployerProfile profile = employerProfileRepository
                .findByAccountId(e.getEmployer().getId()).orElse(null);
        return new EmploymentDto(
                e.getId(), e.getJob().getId(), e.getJob().getTitle(),
                businessName(e.getEmployer(), profile), e.getEmployer().getId(),
                e.getStatus(), e.getJoiningDate(), e.getEmploymentType(),
                e.getSalary(), e.getSalaryUnit(),
                new ArrayList<>(e.getJob().getWorkingDays()),
                shiftLabel(e.getJob()), e.getWorkLocation(), e.isCurrent());
    }

    private EmploymentDetailDto toDetail(Employment e) {
        EmployerProfile profile = employerProfileRepository
                .findByAccountId(e.getEmployer().getId()).orElse(null);
        return new EmploymentDetailDto(
                e.getId(), e.getJob().getId(), e.getJob().getTitle(),
                businessName(e.getEmployer(), profile), e.getEmployer().getId(),
                e.getStatus(), e.getJoiningDate(), e.getEmploymentType(),
                e.getSalary(), e.getSalaryUnit(),
                new ArrayList<>(e.getJob().getWorkingDays()),
                shiftLabel(e.getJob()), e.getWorkLocation(), e.isCurrent(),
                e.getReportingTime(), e.getContactPersonName(), e.getContactPersonPhone(),
                e.getDressCode(), new ArrayList<>(e.getDocumentsToCarry()),
                e.getJoiningAcknowledgedAt() != null,
                latitude(e, profile), longitude(e, profile),
                new ArrayList<>(e.getJob().getBenefits()));
    }

    private Double latitude(Employment e, EmployerProfile profile) {
        if (e.getJob().getLatitude() != 0) {
            return e.getJob().getLatitude();
        }
        return profile != null && profile.getLatitude() != 0 ? profile.getLatitude() : null;
    }

    private Double longitude(Employment e, EmployerProfile profile) {
        if (e.getJob().getLongitude() != 0) {
            return e.getJob().getLongitude();
        }
        return profile != null && profile.getLongitude() != 0 ? profile.getLongitude() : null;
    }

    private String businessName(EmployerAccount employer, EmployerProfile profile) {
        return profile != null && !isBlank(profile.getBusinessName())
                ? profile.getBusinessName() : employer.getName();
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static String joinNonBlank(String a, String b) {
        if (isBlank(a)) {
            return isBlank(b) ? null : b;
        }
        return isBlank(b) ? a : a + ", " + b;
    }

    /** Kept so the unused-import warning on DayOfWeek stays honest. */
    static String dayKeyOf(DayOfWeek day) {
        return DAY_KEYS.get(day.getValue() - 1);
    }

    /** Shared with the seeder so both sides agree on what "a full day" looks like. */
    static LocalTime defaultReportingTime() {
        return LocalTime.of(9, 0);
    }
}
