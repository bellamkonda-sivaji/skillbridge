package com.skillbridge.service;

import com.skillbridge.dto.admin.AnalyticsDtos.*;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Everything the back-office analytics screens read. Purely derived numbers over the same
 * in-memory snapshot the rest of the back office uses ({@link BackOfficeAssembler}) - these are
 * reads, so nothing here writes an audit row.
 *
 * <p>Every entry point is guarded by {@link AdminPermission#VIEW_REPORTS}, which HR carries too.
 */
@Service
public class AnalyticsService {

    private static final DateTimeFormatter DAY_MONTH =
            DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH);
    private static final DateTimeFormatter MONTH_YEAR =
            DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter MONTH_ONLY =
            DateTimeFormatter.ofPattern("MMM", Locale.ENGLISH);

    /** A worker's own expected pay carries no schedule, so it converts on a plain 26-day month. */
    private static final double WORKER_DAYS_PER_MONTH = 26;
    private static final double WORKER_HOURS_PER_DAY = 8;

    private final AdminGuard guard;
    private final BackOfficeAssembler assembler;
    private final JobService jobService;
    private final ScheduleCalculator calculator;

    private final JobPostRepository jobRepository;
    private final JobOfferRepository offerRepository;
    private final EmploymentRepository employmentRepository;
    private final WorkerAccountRepository workerAccountRepository;
    private final EmployerAccountRepository employerAccountRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;

    public AnalyticsService(AdminGuard guard, BackOfficeAssembler assembler, JobService jobService,
                            ScheduleCalculator calculator, JobPostRepository jobRepository,
                            JobOfferRepository offerRepository,
                            EmploymentRepository employmentRepository,
                            WorkerAccountRepository workerAccountRepository,
                            EmployerAccountRepository employerAccountRepository,
                            WalletRepository walletRepository,
                            WalletTransactionRepository transactionRepository) {
        this.guard = guard;
        this.assembler = assembler;
        this.jobService = jobService;
        this.calculator = calculator;
        this.jobRepository = jobRepository;
        this.offerRepository = offerRepository;
        this.employmentRepository = employmentRepository;
        this.workerAccountRepository = workerAccountRepository;
        this.employerAccountRepository = employerAccountRepository;
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
    }

    // ================================================================== window

    /** The inclusive date window a request asked for; {@code null}s default to the last 30 days. */
    public record Window(LocalDate from, LocalDate to) {

        public static Window of(LocalDate from, LocalDate to) {
            LocalDate end = to != null ? to : LocalDate.now();
            LocalDate start = from != null ? from : end.minusDays(29);
            if (start.isAfter(end)) {
                LocalDate swap = start;
                start = end;
                end = swap;
            }
            return new Window(start, end);
        }

        public LocalDateTime startAt() {
            return from.atStartOfDay();
        }

        public LocalDateTime endAt() {
            return to.plusDays(1).atStartOfDay();
        }

        public long days() {
            return ChronoUnit.DAYS.between(from, to) + 1;
        }

        public boolean holds(LocalDateTime at) {
            return at != null && !at.isBefore(startAt()) && at.isBefore(endAt());
        }

        /** The window of equal length that ends the day before this one starts. */
        public Window previous() {
            LocalDate prevTo = from.minusDays(1);
            return new Window(prevTo.minusDays(days() - 1), prevTo);
        }
    }

    // ================================================================== 1. timeseries

    public TimeseriesResponse timeseries(LocalDate from, LocalDate to, Granularity granularity) {
        guard.require(AdminPermission.VIEW_REPORTS);
        Window w = Window.of(from, to);
        Granularity g = granularity == null ? Granularity.DAY : granularity;
        BackOfficeAssembler.Snapshot s = assembler.snapshot();

        List<LocalDate> starts = bucketStarts(w, g);
        Map<LocalDate, long[]> counts = new LinkedHashMap<>();
        Map<LocalDate, double[]> money = new LinkedHashMap<>();
        for (LocalDate d : starts) {
            counts.put(d, new long[7]);
            money.put(d, new double[1]);
        }

        for (JobPost j : jobRepository.findAll()) {
            bump(counts, starts, g, w, j.getPostedAt(), 0);
        }
        for (EmployerAccount e : employerAccountRepository.findAll()) {
            bump(counts, starts, g, w, e.getCreatedAt(), 1);
        }
        for (WorkerAccount wk : workerAccountRepository.findAll()) {
            bump(counts, starts, g, w, wk.getCreatedAt(), 2);
        }
        for (JobApplication a : s.applications) {
            bump(counts, starts, g, w, a.getAppliedAt(), 3);
        }
        for (Interview i : s.interviews) {
            bump(counts, starts, g, w, i.getScheduledAt(), 4);
        }
        for (JobOffer o : offerRepository.findAll()) {
            bump(counts, starts, g, w, o.getSentAt(), 5);
        }
        for (Employment e : employmentRepository.findAll()) {
            bump(counts, starts, g, w, e.getCreatedAt(), 6);
        }
        for (WalletTransaction t : workerJobPayments()) {
            LocalDate bucket = bucketOf(starts, g, w, t.getCreatedAt());
            if (bucket != null) {
                money.get(bucket)[0] += t.getAmount();
            }
        }

        List<TimePointDto> points = new ArrayList<>();
        for (LocalDate d : starts) {
            long[] c = counts.get(d);
            double paid = round2(money.get(d)[0]);
            points.add(new TimePointDto(d, bucketLabel(d, g, w), c[0], c[1], c[2], c[3], c[4], c[5],
                    c[6], paid, feeOn(paid)));
        }
        return new TimeseriesResponse(w.from(), w.to(), LocalDateTime.now(), g, points,
                totalsFor(w, s), totalsFor(w.previous(), s));
    }

    /** The same nine figures over any window - used for the window itself and the previous one. */
    private SeriesTotalsDto totalsFor(Window w, BackOfficeAssembler.Snapshot s) {
        long jobs = jobRepository.findAll().stream().filter(j -> w.holds(j.getPostedAt())).count();
        long employers = employerAccountRepository.findAll().stream()
                .filter(e -> w.holds(e.getCreatedAt())).count();
        long workers = workerAccountRepository.findAll().stream()
                .filter(x -> w.holds(x.getCreatedAt())).count();
        long applications = s.applications.stream().filter(a -> w.holds(a.getAppliedAt())).count();
        long interviews = s.interviews.stream().filter(i -> w.holds(i.getScheduledAt())).count();
        long offers = offerRepository.findAll().stream().filter(o -> w.holds(o.getSentAt())).count();
        long hires = employmentRepository.findAll().stream()
                .filter(e -> w.holds(e.getCreatedAt())).count();
        double paid = round2(workerJobPayments().stream()
                .filter(t -> w.holds(t.getCreatedAt()))
                .mapToDouble(WalletTransaction::getAmount).sum());
        return new SeriesTotalsDto(jobs, employers, workers, applications, interviews, offers, hires,
                paid, feeOn(paid));
    }

    private void bump(Map<LocalDate, long[]> counts, List<LocalDate> starts, Granularity g,
                      Window w, LocalDateTime at, int slot) {
        LocalDate bucket = bucketOf(starts, g, w, at);
        if (bucket != null) {
            counts.get(bucket)[slot]++;
        }
    }

    private List<LocalDate> bucketStarts(Window w, Granularity g) {
        List<LocalDate> starts = new ArrayList<>();
        switch (g) {
            case DAY -> {
                for (LocalDate d = w.from(); !d.isAfter(w.to()); d = d.plusDays(1)) {
                    starts.add(d);
                }
            }
            case WEEK -> {
                LocalDate d = w.from().minusDays(w.from().getDayOfWeek().getValue() - 1L);
                for (; !d.isAfter(w.to()); d = d.plusWeeks(1)) {
                    starts.add(d);
                }
            }
            case MONTH -> {
                LocalDate d = w.from().withDayOfMonth(1);
                for (; !d.isAfter(w.to()); d = d.plusMonths(1)) {
                    starts.add(d);
                }
            }
        }
        return starts;
    }

    private LocalDate bucketOf(List<LocalDate> starts, Granularity g, Window w, LocalDateTime at) {
        if (!w.holds(at)) {
            return null;
        }
        LocalDate d = at.toLocalDate();
        LocalDate start = switch (g) {
            case DAY -> d;
            case WEEK -> d.minusDays(d.getDayOfWeek().getValue() - 1L);
            case MONTH -> d.withDayOfMonth(1);
        };
        return starts.contains(start) ? start : null;
    }

    /** "1 Sep", "1&ndash;7 Sep" (or "28 Sep&ndash;4 Oct" across a month), "Sep 2026". */
    private String bucketLabel(LocalDate start, Granularity g, Window w) {
        switch (g) {
            case DAY:
                return start.format(DAY_MONTH);
            case MONTH:
                return start.format(MONTH_YEAR);
            default:
                LocalDate end = start.plusDays(6);
                if (start.getMonth() == end.getMonth()) {
                    return start.getDayOfMonth() + "–" + end.getDayOfMonth() + " "
                            + start.format(MONTH_ONLY);
                }
                return start.format(DAY_MONTH) + "–" + end.format(DAY_MONTH);
        }
    }

    // ================================================================== 2. breakdown

    /** The mutable tally behind one breakdown row. */
    private static final class Bucket {
        long jobCount, openJobCount, vacancies, applicationCount, interviewCount, offerCount;
        long hireCount, workerCount, employerCount;
        double totalPaid;
        final List<Double> salaries = new ArrayList<>();
    }

    public BreakdownResponse breakdown(LocalDate from, LocalDate to, Dimension dimension, int limit) {
        guard.require(AdminPermission.VIEW_REPORTS);
        Window w = Window.of(from, to);
        Dimension dim = dimension == null ? Dimension.CATEGORY : dimension;
        int cap = limit <= 0 ? 50 : limit;
        BackOfficeAssembler.Snapshot s = assembler.snapshot();

        Map<String, Bucket> buckets = new LinkedHashMap<>();
        Map<Long, List<String>> jobKeys = new HashMap<>();
        // Free-text dimensions (city, business type, skill) keep the wording the data was
        // entered with - "Retail / Supermarket" should never be flattened to "Retail Supermarket".
        Map<String, String> display = new HashMap<>();

        // ---- the job side
        for (JobPost j : jobRepository.findAll()) {
            List<String> keys = jobKeys(dim, j, s, display);
            jobKeys.put(j.getId(), keys);
            if (!w.holds(j.getPostedAt())) {
                continue;
            }
            double monthly = monthlyEquivalent(j);
            for (String key : keys) {
                Bucket b = bucket(buckets, key);
                b.jobCount++;
                b.vacancies += Math.max(j.getWorkersNeeded(), 0);
                if (j.getStatus() == JobStatus.OPEN) {
                    b.openJobCount++;
                }
                if (monthly > 0) {
                    b.salaries.add(monthly);
                }
            }
        }

        // ---- the funnel, attributed to the job it belongs to
        for (JobApplication a : s.applications) {
            if (w.holds(a.getAppliedAt())) {
                for (String key : jobKeys.getOrDefault(a.getJob().getId(), List.of())) {
                    bucket(buckets, key).applicationCount++;
                }
            }
        }
        for (Interview i : s.interviews) {
            if (i.getJob() != null && w.holds(i.getScheduledAt())) {
                for (String key : jobKeys.getOrDefault(i.getJob().getId(), List.of())) {
                    bucket(buckets, key).interviewCount++;
                }
            }
        }
        for (JobOffer o : offerRepository.findAll()) {
            if (w.holds(o.getSentAt())) {
                for (String key : jobKeys.getOrDefault(o.getApplication().getJob().getId(), List.of())) {
                    bucket(buckets, key).offerCount++;
                }
            }
        }
        for (Employment e : employmentRepository.findAll()) {
            if (w.holds(e.getCreatedAt())) {
                for (String key : jobKeys.getOrDefault(e.getJob().getId(), List.of())) {
                    bucket(buckets, key).hireCount++;
                }
            }
        }
        for (WalletTransaction t : workerJobPayments()) {
            if (t.getJobId() == null || !w.holds(t.getCreatedAt())) {
                continue;
            }
            for (String key : jobKeys.getOrDefault(t.getJobId(), List.of())) {
                bucket(buckets, key).totalPaid += t.getAmount();
            }
        }

        // ---- the people side: who lives / operates / can do this, regardless of the window
        for (WorkerProfile p : s.workerProfiles.values()) {
            for (String key : workerKeys(dim, p, display)) {
                bucket(buckets, key).workerCount++;
            }
        }
        for (EmployerProfile p : s.employerProfiles.values()) {
            for (String key : employerKeys(dim, p, display)) {
                bucket(buckets, key).employerCount++;
            }
        }

        List<BreakdownRowDto> rows = new ArrayList<>();
        buckets.forEach((key, b) -> rows.add(new BreakdownRowDto(key,
                display.getOrDefault(key, AnalyticsLabels.label(dim, key)),
                b.jobCount, b.openJobCount, b.vacancies, b.applicationCount, b.interviewCount,
                b.offerCount, b.hireCount, b.workerCount, b.employerCount,
                round2(mean(b.salaries)), round2(median(b.salaries)),
                ratio(b.applicationCount, b.jobCount),
                Math.min(1.0, ratio(b.hireCount, b.vacancies)),
                ratio(b.hireCount, b.applicationCount),
                round2(b.totalPaid))));
        rows.sort(Comparator.comparingLong(BreakdownRowDto::jobCount).reversed()
                .thenComparing(BreakdownRowDto::label, String.CASE_INSENSITIVE_ORDER));
        return new BreakdownResponse(w.from(), w.to(), LocalDateTime.now(), dim,
                rows.stream().limit(cap).toList());
    }

    private Bucket bucket(Map<String, Bucket> buckets, String key) {
        return buckets.computeIfAbsent(key, k -> new Bucket());
    }

    /**
     * The key for a free-text value, remembering the original wording as that key's label.
     */
    private static String freeKey(String raw, Map<String, String> display) {
        String key = textKey(raw);
        if (raw != null && !raw.isBlank()) {
            display.putIfAbsent(key, raw.trim());
        }
        return key;
    }

    private List<String> jobKeys(Dimension dim, JobPost j, BackOfficeAssembler.Snapshot s,
                                 Map<String, String> display) {
        switch (dim) {
            case CATEGORY:
                return List.of(j.getWorkerCategory() == null ? "UNSPECIFIED"
                        : j.getWorkerCategory().name());
            case CITY:
                return List.of(freeKey(j.getCity(), display));
            case BUSINESS_TYPE: {
                EmployerProfile p = s.employerProfiles.get(j.getEmployer().getId());
                return List.of(freeKey(p == null ? null : p.getBusinessType(), display));
            }
            case ENGAGEMENT:
                return List.of(j.getEngagementModel() == null ? "UNSPECIFIED"
                        : j.getEngagementModel().name());
            case WORK_PATTERN:
                return List.of(j.getWorkPattern() == null ? "UNSPECIFIED" : j.getWorkPattern().name());
            case SKILL: {
                List<String> keys = new ArrayList<>();
                for (String skill : j.getRequiredSkills()) {
                    String key = freeKey(skill, display);
                    if (!keys.contains(key)) {
                        keys.add(key);
                    }
                }
                return keys;
            }
            case SALARY_BAND:
                return List.of(salaryBand(monthlyEquivalent(j)));
            case EXPERIENCE:
                return List.of(experienceBand(j.getMinExperienceYears()));
            case AVAILABILITY:
            default:
                // A posting has no availability of its own; the row's job figures stay at zero and
                // the dimension answers purely from the worker side.
                return List.of();
        }
    }

    private List<String> workerKeys(Dimension dim, WorkerProfile p, Map<String, String> display) {
        switch (dim) {
            case CITY:
                return List.of(freeKey(p.getCity(), display));
            case SKILL: {
                List<String> keys = new ArrayList<>();
                for (String skill : p.getSkills()) {
                    String key = freeKey(skill, display);
                    if (!keys.contains(key)) {
                        keys.add(key);
                    }
                }
                return keys;
            }
            case SALARY_BAND:
                return List.of(salaryBand(workerMonthlyEquivalent(p)));
            case EXPERIENCE:
                return List.of(experienceBand(p.getExperienceYears()));
            case AVAILABILITY:
                return List.of(p.getAvailability() == null ? "UNSPECIFIED"
                        : p.getAvailability().name());
            case CATEGORY: {
                List<String> keys = new ArrayList<>();
                for (String raw : p.getJobCategories()) {
                    String key = textKey(raw);
                    if (AnalyticsLabels.isCategoryKey(key) && !keys.contains(key)) {
                        keys.add(key);
                    }
                }
                return keys;
            }
            default:
                return List.of();
        }
    }

    private List<String> employerKeys(Dimension dim, EmployerProfile p,
                                      Map<String, String> display) {
        return switch (dim) {
            case CITY -> List.of(freeKey(p.getCity(), display));
            case BUSINESS_TYPE -> List.of(freeKey(p.getBusinessType(), display));
            default -> List.of();
        };
    }

    // ================================================================== 3. employers

    public EmployersResponse employers(LocalDate from, LocalDate to, int limit) {
        guard.require(AdminPermission.VIEW_REPORTS);
        Window w = Window.of(from, to);
        int cap = limit <= 0 ? 50 : limit;
        BackOfficeAssembler.Snapshot s = assembler.snapshot();

        List<EmployerAccount> accounts = employerAccountRepository.findAll();
        List<JobPost> allJobs = jobRepository.findAll();
        List<Employment> allHires = employmentRepository.findAll();
        List<JobOffer> allOffers = offerRepository.findAll();

        Map<Long, LocalDateTime> firstApplicationByJob = new HashMap<>();
        Map<Long, Long> applicationsByJob = new HashMap<>();
        for (JobApplication a : s.applications) {
            Long jobId = a.getJob().getId();
            firstApplicationByJob.merge(jobId, a.getAppliedAt(),
                    (x, y) -> x.isBefore(y) ? x : y);
            if (w.holds(a.getAppliedAt())) {
                applicationsByJob.merge(jobId, 1L, Long::sum);
            }
        }
        Map<Long, LocalDateTime> firstHireByJob = new HashMap<>();
        Map<Long, Long> hiresByJob = new HashMap<>();
        for (Employment e : allHires) {
            Long jobId = e.getJob().getId();
            firstHireByJob.merge(jobId, e.getCreatedAt(), (x, y) -> x.isBefore(y) ? x : y);
            if (w.holds(e.getCreatedAt())) {
                hiresByJob.merge(jobId, 1L, Long::sum);
            }
        }
        Map<Long, Long> offersByJob = new HashMap<>();
        for (JobOffer o : allOffers) {
            if (w.holds(o.getSentAt())) {
                offersByJob.merge(o.getApplication().getJob().getId(), 1L, Long::sum);
            }
        }
        Map<Long, Long> interviewsByEmployer = new HashMap<>();
        for (Interview i : s.interviews) {
            if (w.holds(i.getScheduledAt())) {
                interviewsByEmployer.merge(i.getEmployer().getId(), 1L, Long::sum);
            }
        }

        List<EmployerRowDto> rows = new ArrayList<>();
        long totalJobs = 0, withOne = 0, withTwo = 0, activeEmployers = 0;
        double spendAll = 0;
        List<Double> timeToFirstApplicant = new ArrayList<>();
        List<Double> timeToFill = new ArrayList<>();
        long windowApplications = 0;

        for (EmployerAccount e : accounts) {
            EmployerProfile p = s.employerProfiles.get(e.getId());
            long jobCount = 0, openJobs = 0, vacancies = 0, applications = 0, offers = 0, hires = 0;
            LocalDateTime lastPosted = null;
            List<Double> fillDays = new ArrayList<>();
            for (JobPost j : allJobs) {
                if (!j.getEmployer().getId().equals(e.getId())) {
                    continue;
                }
                if (lastPosted == null || j.getPostedAt().isAfter(lastPosted)) {
                    lastPosted = j.getPostedAt();
                }
                if (!w.holds(j.getPostedAt())) {
                    continue;
                }
                jobCount++;
                vacancies += Math.max(j.getWorkersNeeded(), 0);
                if (j.getStatus() == JobStatus.OPEN) {
                    openJobs++;
                }
                applications += applicationsByJob.getOrDefault(j.getId(), 0L);
                offers += offersByJob.getOrDefault(j.getId(), 0L);
                hires += hiresByJob.getOrDefault(j.getId(), 0L);
                LocalDateTime firstApp = firstApplicationByJob.get(j.getId());
                if (firstApp != null && !firstApp.isBefore(j.getPostedAt())) {
                    timeToFirstApplicant.add(hoursBetween(j.getPostedAt(), firstApp));
                }
                LocalDateTime firstHire = firstHireByJob.get(j.getId());
                if (firstHire != null && !firstHire.isBefore(j.getPostedAt())) {
                    double days = daysBetween(j.getPostedAt(), firstHire);
                    fillDays.add(days);
                    timeToFill.add(days);
                }
            }
            double spend = employerSpend(e.getId(), w);
            spendAll += spend;
            totalJobs += jobCount;
            windowApplications += applications;
            if (jobCount >= 1) {
                withOne++;
                activeEmployers++;
            }
            if (jobCount >= 2) {
                withTwo++;
            }
            rows.add(new EmployerRowDto(e.getId(),
                    p != null && p.getBusinessName() != null ? p.getBusinessName() : e.getName(),
                    p == null ? null : p.getBusinessType(),
                    p == null ? null : p.getCity(),
                    p != null && p.isVerified(),
                    p == null || p.getPlan() == null ? null : p.getPlan().name(),
                    jobCount, openJobs, applications,
                    interviewsByEmployer.getOrDefault(e.getId(), 0L), offers, hires,
                    Math.min(1.0, ratio(hires, vacancies)), round2(mean(fillDays)),
                    round2(spend), feeOn(spend),
                    e.getCreatedAt(), lastPosted));
        }

        rows.sort(Comparator.comparingLong(EmployerRowDto::jobCount).reversed()
                .thenComparing(Comparator.comparingLong(EmployerRowDto::applicationCount).reversed())
                .thenComparing(r -> r.businessName() == null ? "" : r.businessName(),
                        String.CASE_INSENSITIVE_ORDER));

        long verified = s.employerProfiles.values().stream()
                .filter(EmployerProfile::isVerified).count();
        EmployerTotalsDto totals = new EmployerTotalsDto(
                accounts.size(),
                accounts.stream().filter(e -> w.holds(e.getCreatedAt())).count(),
                activeEmployers, verified, totalJobs,
                ratio(totalJobs, activeEmployers),
                ratio(withTwo, withOne),
                ratio(windowApplications, totalJobs),
                round2(mean(timeToFirstApplicant)), round2(mean(timeToFill)),
                round2(spendAll), feeOn(spendAll));

        // ---- by plan
        Map<String, long[]> planCounts = new LinkedHashMap<>();
        Map<String, Double> planSpend = new LinkedHashMap<>();
        for (EmployerPlan plan : EmployerPlan.values()) {
            planCounts.put(plan.name(), new long[3]);
            planSpend.put(plan.name(), 0.0);
        }
        planCounts.put("NONE", new long[3]);
        planSpend.put("NONE", 0.0);
        Map<Long, String> planOf = new HashMap<>();
        for (EmployerAccount e : accounts) {
            EmployerProfile p = s.employerProfiles.get(e.getId());
            String key = p == null || p.getPlan() == null ? "NONE" : p.getPlan().name();
            planOf.put(e.getId(), key);
            planCounts.get(key)[0]++;
            planSpend.merge(key, employerSpend(e.getId(), w), Double::sum);
        }
        for (JobPost j : allJobs) {
            if (w.holds(j.getPostedAt())) {
                planCounts.get(planOf.getOrDefault(j.getEmployer().getId(), "NONE"))[1]++;
            }
        }
        for (Employment e : allHires) {
            if (w.holds(e.getCreatedAt())) {
                planCounts.get(planOf.getOrDefault(e.getEmployer().getId(), "NONE"))[2]++;
            }
        }
        List<PlanRowDto> byPlan = new ArrayList<>();
        planCounts.forEach((key, c) -> byPlan.add(new PlanRowDto(key,
                AnalyticsLabels.planLabel(key), c[0], c[1], c[2],
                round2(planSpend.getOrDefault(key, 0.0)))));

        List<CountPointDto> signupTrend = dailyTrend(w,
                accounts.stream().map(EmployerAccount::getCreatedAt).toList());

        return new EmployersResponse(w.from(), w.to(), LocalDateTime.now(), totals,
                rows.stream().limit(cap).toList(), byPlan, signupTrend);
    }

    // ================================================================== 4. workers

    public WorkersResponse workers(LocalDate from, LocalDate to, int limit) {
        guard.require(AdminPermission.VIEW_REPORTS);
        Window w = Window.of(from, to);
        int cap = limit <= 0 ? 50 : limit;
        BackOfficeAssembler.Snapshot s = assembler.snapshot();

        List<WorkerAccount> accounts = workerAccountRepository.findAll();
        List<Employment> hires = employmentRepository.findAll();

        Map<Long, Long> applicationsByWorker = new HashMap<>();
        Map<Long, LocalDateTime> lastActiveByWorker = new HashMap<>();
        Map<String, LocalDateTime> appliedAtByWorkerJob = new HashMap<>();
        for (JobApplication a : s.applications) {
            Long id = a.getWorker().getId();
            lastActiveByWorker.merge(id, a.getAppliedAt(), (x, y) -> x.isAfter(y) ? x : y);
            appliedAtByWorkerJob.put(BackOfficeAssembler.key(id, a.getJob().getId()), a.getAppliedAt());
            if (w.holds(a.getAppliedAt())) {
                applicationsByWorker.merge(id, 1L, Long::sum);
            }
        }
        Map<Long, Long> interviewsByWorker = new HashMap<>();
        for (Interview i : s.interviews) {
            if (w.holds(i.getScheduledAt())) {
                interviewsByWorker.merge(i.getWorker().getId(), 1L, Long::sum);
            }
        }
        Map<Long, Long> offersByWorker = new HashMap<>();
        for (JobOffer o : offerRepository.findAll()) {
            if (w.holds(o.getSentAt())) {
                offersByWorker.merge(o.getApplication().getWorker().getId(), 1L, Long::sum);
            }
        }
        Map<Long, Long> hiresByWorker = new HashMap<>();
        List<Double> timeToHire = new ArrayList<>();
        for (Employment e : hires) {
            if (!w.holds(e.getCreatedAt())) {
                continue;
            }
            hiresByWorker.merge(e.getWorker().getId(), 1L, Long::sum);
            LocalDateTime applied = appliedAtByWorkerJob.get(
                    BackOfficeAssembler.key(e.getWorker().getId(), e.getJob().getId()));
            if (applied != null && !e.getCreatedAt().isBefore(applied)) {
                timeToHire.add(daysBetween(applied, e.getCreatedAt()));
            }
        }
        Map<Long, Double> earnedByWorker = new HashMap<>();
        double totalEarned = 0;
        for (WalletTransaction t : workerJobPayments()) {
            if (!w.holds(t.getCreatedAt())) {
                continue;
            }
            Long ownerId = t.getWallet().getOwnerId();
            earnedByWorker.merge(ownerId, t.getAmount(), Double::sum);
            totalEarned += t.getAmount();
        }

        List<WorkerRowDto> rows = new ArrayList<>();
        for (WorkerAccount a : accounts) {
            WorkerProfile p = s.workerProfiles.get(a.getId());
            long applications = applicationsByWorker.getOrDefault(a.getId(), 0L);
            long hired = hiresByWorker.getOrDefault(a.getId(), 0L);
            rows.add(new WorkerRowDto(a.getId(), a.getName(),
                    p == null ? null : p.getCity(),
                    p == null ? List.of() : List.copyOf(p.getSkills()),
                    p != null && p.getVerificationStatus() == VerificationStatus.VERIFIED,
                    applications, interviewsByWorker.getOrDefault(a.getId(), 0L),
                    offersByWorker.getOrDefault(a.getId(), 0L), hired,
                    ratio(hired, applications),
                    round2(earnedByWorker.getOrDefault(a.getId(), 0.0)),
                    round2(a.getAvgRating()), a.getRatingCount(),
                    lastActiveByWorker.get(a.getId())));
        }
        rows.sort(Comparator.comparingLong(WorkerRowDto::hireCount).reversed()
                .thenComparing(Comparator.comparingLong(WorkerRowDto::applicationCount).reversed())
                .thenComparing(Comparator.comparingDouble(WorkerRowDto::totalEarned).reversed())
                .thenComparing(r -> r.name() == null ? "" : r.name(), String.CASE_INSENSITIVE_ORDER));

        long verified = s.workerProfiles.values().stream()
                .filter(p -> p.getVerificationStatus() == VerificationStatus.VERIFIED).count();
        long activeWorkers = applicationsByWorker.size();
        long workersHired = hiresByWorker.size();
        long windowApplications = applicationsByWorker.values().stream().mapToLong(Long::longValue).sum();
        List<Double> ratings = accounts.stream().filter(a -> a.getRatingCount() > 0)
                .map(WorkerAccount::getAvgRating).toList();

        WorkerTotalsDto totals = new WorkerTotalsDto(accounts.size(),
                accounts.stream().filter(a -> w.holds(a.getCreatedAt())).count(),
                activeWorkers, verified, ratio(verified, accounts.size()),
                workersHired, ratio(workersHired, activeWorkers),
                ratio(windowApplications, activeWorkers),
                round2(mean(timeToHire)), round2(mean(ratings)), round2(totalEarned));

        List<CountPointDto> signupTrend = dailyTrend(w,
                accounts.stream().map(WorkerAccount::getCreatedAt).toList());
        List<CountPointDto> hireTrend = dailyTrend(w,
                hires.stream().map(Employment::getCreatedAt).toList());

        // ---- skills of the people who applied and got hired in this window
        Map<String, long[]> skillTally = new LinkedHashMap<>();
        Map<String, String> skillLabel = new LinkedHashMap<>();
        for (WorkerProfile p : s.workerProfiles.values()) {
            Long id = p.getAccount().getId();
            long hired = hiresByWorker.getOrDefault(id, 0L);
            long applied = applicationsByWorker.getOrDefault(id, 0L);
            Set<String> seen = new LinkedHashSet<>();
            for (String raw : p.getSkills()) {
                String key = textKey(raw);
                if (key.isEmpty() || !seen.add(key)) {
                    continue;
                }
                skillLabel.putIfAbsent(key, AnalyticsLabels.titleCase(raw));
                long[] t = skillTally.computeIfAbsent(key, k -> new long[3]);
                t[0] += hired;
                t[1] += applied;
                t[2]++;
            }
        }
        List<SkillHireRowDto> topSkills = new ArrayList<>();
        skillTally.forEach((key, t) ->
                topSkills.add(new SkillHireRowDto(skillLabel.get(key), t[0], t[1], t[2])));
        topSkills.sort(Comparator.comparingLong(SkillHireRowDto::hireCount).reversed()
                .thenComparing(Comparator.comparingLong(SkillHireRowDto::applicationCount).reversed())
                .thenComparing(SkillHireRowDto::skill, String.CASE_INSENSITIVE_ORDER));

        return new WorkersResponse(w.from(), w.to(), LocalDateTime.now(), totals,
                rows.stream().limit(cap).toList(), signupTrend, hireTrend,
                topSkills.stream().limit(cap).toList());
    }

    // ================================================================== salary normalisation

    /**
     * Every posting reduced to the same monthly-equivalent rupee figure, so a &#8377;900/day job and a
     * &#8377;18,000/month job can sit in the same average. The conversion reuses the posting wizard's
     * own schedule engine - {@link ScheduleCalculator#WEEKS_PER_MONTH} weeks in a month, the job's
     * selected working days and its paid hours per day - so it can never drift from /jobs/estimate.
     */
    public double monthlyEquivalent(JobPost job) {
        double rate = job.getSalary();
        if (rate <= 0) {
            return 0;
        }
        SalaryUnit unit = job.getSalaryUnit() == null ? SalaryUnit.MONTHLY : job.getSalaryUnit();
        if (unit == SalaryUnit.MONTHLY) {
            return rate;
        }
        if (unit == SalaryUnit.PER_WEEK) {
            return rate * ScheduleCalculator.WEEKS_PER_MONTH;
        }
        ScheduleCalculator.ScheduleInput in = jobService.scheduleInput(job);
        double daysPerMonth = calculator.workingDaysPerWeek(in) * ScheduleCalculator.WEEKS_PER_MONTH;
        return switch (unit) {
            case DAILY -> rate * daysPerMonth;
            case PER_SHIFT -> rate * shiftsPerDay(job, in) * daysPerMonth;
            case HOURLY -> rate * paidHoursPerDay(in) * daysPerMonth;
            default -> rate;
        };
    }

    private int shiftsPerDay(JobPost job, ScheduleCalculator.ScheduleInput in) {
        if (in.shiftsOrEmpty().isEmpty()) {
            return 1;
        }
        return job.getShiftArrangement() == ShiftArrangement.ONE_OF_SHIFTS
                ? 1 : Math.max(1, in.shiftsOrEmpty().size());
    }

    private double paidHoursPerDay(ScheduleCalculator.ScheduleInput in) {
        double hours = calculator.paidMinutesPerDay(in) / 60.0;
        if (hours <= 0 && !in.dayTimesOrEmpty().isEmpty()) {
            long minutes = 0;
            for (DayTime d : in.dayTimesOrEmpty()) {
                minutes += ScheduleCalculator.minutesBetween(d.getStartTime(), d.getEndTime());
            }
            hours = minutes / 60.0 / in.dayTimesOrEmpty().size();
        }
        return hours > 0 ? hours : WORKER_HOURS_PER_DAY;
    }

    /** A worker's expected pay has no schedule behind it, so it uses a flat 26-day, 8-hour month. */
    public double workerMonthlyEquivalent(WorkerProfile p) {
        double rate = p.getExpectedSalary();
        if (rate <= 0) {
            return 0;
        }
        SalaryUnit unit = p.getSalaryUnit() == null ? SalaryUnit.MONTHLY : p.getSalaryUnit();
        return switch (unit) {
            case MONTHLY -> rate;
            case PER_WEEK -> rate * ScheduleCalculator.WEEKS_PER_MONTH;
            case DAILY, PER_SHIFT -> rate * WORKER_DAYS_PER_MONTH;
            case HOURLY -> rate * WORKER_HOURS_PER_DAY * WORKER_DAYS_PER_MONTH;
        };
    }

    // ================================================================== small helpers

    private List<CountPointDto> dailyTrend(Window w, List<LocalDateTime> stamps) {
        Map<LocalDate, long[]> byDay = new LinkedHashMap<>();
        for (LocalDate d = w.from(); !d.isAfter(w.to()); d = d.plusDays(1)) {
            byDay.put(d, new long[1]);
        }
        for (LocalDateTime at : stamps) {
            if (w.holds(at)) {
                byDay.get(at.toLocalDate())[0]++;
            }
        }
        List<CountPointDto> out = new ArrayList<>();
        byDay.forEach((d, c) -> out.add(new CountPointDto(d, d.format(DAY_MONTH), c[0])));
        return out;
    }

    /** Every worker-side JOB_PAYMENT credit - the same definition the payments screen uses. */
    private List<WalletTransaction> workerJobPayments() {
        List<WalletTransaction> out = new ArrayList<>();
        for (Wallet wallet : walletRepository.findAll()) {
            if (wallet.getOwnerType() != AccountType.WORKER) {
                continue;
            }
            for (WalletTransaction t : transactionRepository.findByWalletOrderByCreatedAtDesc(wallet)) {
                if (t.getType() == WalletTransaction.Type.CREDIT
                        && t.getReference() == WalletTransaction.Reference.JOB_PAYMENT) {
                    out.add(t);
                }
            }
        }
        return out;
    }

    private double employerSpend(Long employerId, Window w) {
        return walletRepository.findByOwnerTypeAndOwnerId(AccountType.EMPLOYER, employerId)
                .map(wallet -> transactionRepository.findByWalletOrderByCreatedAtDesc(wallet).stream()
                        .filter(t -> t.getType() == WalletTransaction.Type.DEBIT
                                && t.getReference() == WalletTransaction.Reference.JOB_PAYMENT
                                && w.holds(t.getCreatedAt()))
                        .mapToDouble(WalletTransaction::getAmount).sum())
                .orElse(0.0);
    }

    /** The configured platform-fee percentage applied to an amount; 0 when none is configured. */
    private double feeOn(double amount) {
        Double fee = assembler.platformFeeOn(amount);
        return fee == null ? 0.0 : fee;
    }

    static String textKey(String raw) {
        if (raw == null || raw.isBlank()) {
            return "UNSPECIFIED";
        }
        return raw.trim().toUpperCase(Locale.ENGLISH).replaceAll("[^A-Z0-9]+", "_");
    }

    private static String salaryBand(double monthly) {
        if (monthly <= 0) {
            return "UNSPECIFIED";
        }
        if (monthly < 10000) {
            return "LT_10K";
        }
        if (monthly < 15000) {
            return "B10_15K";
        }
        if (monthly < 20000) {
            return "B15_20K";
        }
        if (monthly < 30000) {
            return "B20_30K";
        }
        return "GT_30K";
    }

    private static String experienceBand(int years) {
        if (years <= 0) {
            return "FRESHER";
        }
        if (years <= 2) {
            return "Y1_2";
        }
        if (years <= 5) {
            return "Y3_5";
        }
        if (years <= 10) {
            return "Y6_10";
        }
        return "Y10_PLUS";
    }

    private static double hoursBetween(LocalDateTime a, LocalDateTime b) {
        return ChronoUnit.MINUTES.between(a, b) / 60.0;
    }

    private static double daysBetween(LocalDateTime a, LocalDateTime b) {
        return ChronoUnit.MINUTES.between(a, b) / (60.0 * 24);
    }

    /** Always a number: a zero denominator answers 0.0 rather than NaN or null. */
    private static double ratio(double numerator, double denominator) {
        if (denominator <= 0) {
            return 0.0;
        }
        return round2(numerator / denominator);
    }

    private static double mean(List<Double> values) {
        if (values == null || values.isEmpty()) {
            return 0.0;
        }
        return values.stream().mapToDouble(Double::doubleValue).sum() / values.size();
    }

    private static double median(List<Double> values) {
        if (values == null || values.isEmpty()) {
            return 0.0;
        }
        List<Double> sorted = new ArrayList<>(values);
        Collections.sort(sorted);
        int n = sorted.size();
        return n % 2 == 1 ? sorted.get(n / 2) : (sorted.get(n / 2 - 1) + sorted.get(n / 2)) / 2.0;
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
