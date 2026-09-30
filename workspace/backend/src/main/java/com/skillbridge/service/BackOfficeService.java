package com.skillbridge.service;

import com.skillbridge.dto.admin.AdminDtos.*;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/** Every back-office read screen except the application history and the daily report. */
@Service
public class BackOfficeService {

    private final WorkerAccountRepository workerAccountRepository;
    private final EmployerAccountRepository employerAccountRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final JobPostRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final JobOfferRepository offerRepository;
    private final InterviewRepository interviewRepository;
    private final EmploymentRepository employmentRepository;
    private final ContactLogRepository contactLogRepository;
    private final SkillRepository skillRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final BackOfficeAssembler assembler;
    private final AdminGuard guard;

    public BackOfficeService(WorkerAccountRepository workerAccountRepository,
                             EmployerAccountRepository employerAccountRepository,
                             WorkerProfileRepository workerProfileRepository,
                             EmployerProfileRepository employerProfileRepository,
                             JobPostRepository jobRepository,
                             JobApplicationRepository applicationRepository,
                             JobOfferRepository offerRepository,
                             InterviewRepository interviewRepository,
                             EmploymentRepository employmentRepository,
                             ContactLogRepository contactLogRepository,
                             SkillRepository skillRepository,
                             WalletRepository walletRepository,
                             WalletTransactionRepository transactionRepository,
                             BackOfficeAssembler assembler, AdminGuard guard) {
        this.workerAccountRepository = workerAccountRepository;
        this.employerAccountRepository = employerAccountRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.offerRepository = offerRepository;
        this.interviewRepository = interviewRepository;
        this.employmentRepository = employmentRepository;
        this.contactLogRepository = contactLogRepository;
        this.skillRepository = skillRepository;
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.assembler = assembler;
        this.guard = guard;
    }

    // ================================================================== overview

    public OverviewDto overview(int days) {
        guard.require(AdminPermission.VIEW_DASHBOARD);
        int window = days <= 0 ? 30 : days;
        LocalDate today = LocalDate.now();
        LocalDate from = today.minusDays(window - 1L);
        LocalDateTime since = from.atStartOfDay();
        BackOfficeAssembler.Snapshot s = assembler.snapshot();

        List<WorkerAccount> workers = workerAccountRepository.findAll();
        List<EmployerAccount> employers = employerAccountRepository.findAll();
        List<JobPost> jobs = jobRepository.findAll();
        List<Interview> interviews = s.interviews;
        List<JobOffer> offers = offerRepository.findAll();

        long verifiedWorkers = workerProfileRepository.findAll().stream()
                .filter(p -> p.getVerificationStatus() == VerificationStatus.VERIFIED).count();
        Set<Long> activeWorkers = new HashSet<>();
        for (JobApplication a : s.applications) {
            if (!a.getAppliedAt().isBefore(since)) {
                activeWorkers.add(a.getWorker().getId());
            }
        }

        long contacted = s.applications.stream().filter(a -> assembler.isContacted(s, a)).count();

        // ---- funnel
        long applied = s.applications.size();
        long shortlisted = s.applications.stream().filter(assembler::isShortlisted).count();
        long interviewed = s.applications.stream().filter(a -> assembler.isInterviewed(s, a)).count();
        long offered = s.applications.stream().filter(a -> s.offer(a) != null).count();
        long hired = s.applications.stream().filter(a -> assembler.isHired(s, a)).count();
        long paid = s.applications.stream().filter(assembler::isPaid).count();

        // ---- money
        List<WalletTransaction> workerPayouts = jobPayoutsToWorkers();
        double totalPaidOut = workerPayouts.stream().mapToDouble(WalletTransaction::getAmount).sum();
        double inPeriod = workerPayouts.stream()
                .filter(t -> !t.getCreatedAt().isBefore(since))
                .mapToDouble(WalletTransaction::getAmount).sum();
        Double fees = assembler.platformFeeOn(totalPaidOut);
        long pendingPayments = s.applications.stream()
                .filter(a -> { JobOffer o = s.offer(a);
                    return o != null && o.getStatus() == OfferStatus.ACCEPTED && !assembler.isPaid(a); })
                .count();

        // ---- trend, one row per day across the whole window, zero-filled
        Map<LocalDate, long[]> byDay = new LinkedHashMap<>();
        for (LocalDate d = from; !d.isAfter(today); d = d.plusDays(1)) {
            byDay.put(d, new long[4]);
        }
        jobs.forEach(j -> bump(byDay, j.getPostedAt(), 0));
        s.applications.forEach(a -> bump(byDay, a.getAppliedAt(), 1));
        employmentRepository.findAll().forEach(e -> bump(byDay, e.getCreatedAt(), 2));
        workers.forEach(w -> bump(byDay, w.getCreatedAt(), 3));
        employers.forEach(e -> bump(byDay, e.getCreatedAt(), 3));
        List<TrendPoint> trend = new ArrayList<>();
        byDay.forEach((d, c) -> trend.add(new TrendPoint(d, c[0], c[1], c[2], c[3])));

        // ---- top skills
        List<TopSkill> topSkills = skillRows(null, "WORKERS").stream()
                .sorted(Comparator.<SkillRegistryRowDto>comparingLong(
                        r -> r.workerCount() + r.jobCount()).reversed())
                .limit(10)
                .map(r -> new TopSkill(r.skill(), r.workerCount(), r.jobCount()))
                .toList();

        // ---- recent activity
        List<ActivityItem> activity = new ArrayList<>();
        for (JobApplication a : s.applications) {
            activity.add(new ActivityItem(a.getAppliedAt(), "APPLICATION",
                    a.getWorker().getName() + " applied for " + a.getJob().getTitle(),
                    "APPLICATION", a.getId()));
        }
        for (JobPost j : jobs) {
            activity.add(new ActivityItem(j.getPostedAt(), "JOB",
                    assembler.displayBusinessName(s, j.getEmployer()) + " posted " + j.getTitle(),
                    "JOB", j.getId()));
        }
        for (Interview i : interviews) {
            activity.add(new ActivityItem(i.getCreatedAt(), "INTERVIEW",
                    "Interview with " + i.getWorker().getName() + " (" + i.getStatus() + ")",
                    "INTERVIEW", i.getId()));
        }
        for (JobOffer o : offers) {
            activity.add(new ActivityItem(o.getSentAt(), "OFFER",
                    "Offer to " + o.getApplication().getWorker().getName() + " - " + o.getStatus(),
                    "OFFER", o.getId()));
        }
        for (ContactLog c : contactLogRepository.findAll()) {
            activity.add(new ActivityItem(c.getContactedAt(), "CONTACT",
                    c.getContactedByName() + " logged " + c.getChannel() + "/" + c.getOutcome(),
                    "APPLICATION", c.getApplicationId()));
        }
        activity.sort(Comparator.comparing(ActivityItem::at).reversed());

        return new OverviewDto(
                new WorkerCounts(workers.size(),
                        workers.stream().filter(w -> !w.getCreatedAt().isBefore(since)).count(),
                        verifiedWorkers, activeWorkers.size()),
                new EmployerCounts(employers.size(),
                        employers.stream().filter(e -> !e.getCreatedAt().isBefore(since)).count(),
                        employerProfileRepository.findAll().stream()
                                .filter(EmployerProfile::isVerified).count()),
                new JobCounts(jobs.size(),
                        jobs.stream().filter(j -> !j.getPostedAt().isBefore(since)).count(),
                        jobs.stream().filter(j -> j.getStatus() == JobStatus.OPEN).count(),
                        jobs.stream().filter(j -> j.getStatus() == JobStatus.FILLED).count(),
                        jobs.stream().filter(j -> j.getStatus() == JobStatus.CLOSED
                                || j.getStatus() == JobStatus.CANCELLED).count()),
                new ApplicationCounts(applied,
                        s.applications.stream().filter(a -> !a.getAppliedAt().isBefore(since)).count(),
                        contacted, applied - contacted),
                new InterviewCounts(interviews.size(),
                        interviews.stream().filter(i -> i.getStatus() == InterviewStatus.PENDING
                                || i.getStatus() == InterviewStatus.CONFIRMED).count(),
                        interviews.stream().filter(i -> i.getStatus() == InterviewStatus.COMPLETED).count(),
                        interviews.stream().filter(i -> i.getStatus() == InterviewStatus.CANCELLED).count(),
                        interviews.stream().filter(i -> i.getScheduledAt().isAfter(LocalDateTime.now())
                                && i.getStatus() != InterviewStatus.CANCELLED).count()),
                new OfferCounts(offers.size(),
                        offers.stream().filter(o -> o.getStatus().isOpen()).count(),
                        offers.stream().filter(o -> o.getStatus() == OfferStatus.ACCEPTED).count(),
                        offers.stream().filter(o -> o.getStatus() == OfferStatus.DECLINED).count()),
                new PaymentCounts(BackOfficeAssembler.round2(totalPaidOut),
                        fees == null ? 0 : fees, BackOfficeAssembler.round2(inPeriod), pendingPayments),
                new FunnelCounts(applied, contacted, shortlisted, interviewed, offered, hired, paid),
                trend, topSkills,
                activity.stream().limit(25).toList());
    }

    private static void bump(Map<LocalDate, long[]> byDay, LocalDateTime at, int slot) {
        if (at == null) {
            return;
        }
        long[] counts = byDay.get(at.toLocalDate());
        if (counts != null) {
            counts[slot]++;
        }
    }

    // ================================================================== jobs

    public PageDto<JobRowDto> jobs(String status, Long employerId, String engagementModel, String q,
                                   int page, int size) {
        guard.require(AdminPermission.VIEW_JOBS);
        BackOfficeAssembler.Snapshot s = assembler.snapshot();
        List<JobRowDto> rows = new ArrayList<>();
        List<JobPost> all = new ArrayList<>(jobRepository.findAll());
        all.sort(Comparator.comparing(JobPost::getPostedAt).reversed());
        for (JobPost job : all) {
            if (status != null && !status.isBlank()
                    && job.getStatus() != parse(JobStatus.class, status, "status")) {
                continue;
            }
            if (employerId != null && !employerId.equals(job.getEmployer().getId())) {
                continue;
            }
            if (engagementModel != null && !engagementModel.isBlank()
                    && job.getEngagementModel() != parse(EngagementModel.class, engagementModel,
                            "engagementModel")) {
                continue;
            }
            if (!BackOfficeAssembler.matches(q, job.getTitle(), job.getCity(), job.getArea(),
                    assembler.displayBusinessName(s, job.getEmployer()))) {
                continue;
            }
            rows.add(assembler.jobRow(s, job));
        }
        return PageDto.of(rows, page, size);
    }

    public JobDetailDto jobDetail(Long jobId) {
        guard.require(AdminPermission.VIEW_JOBS);
        JobPost job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("Job not found"));
        BackOfficeAssembler.Snapshot s = assembler.snapshot();
        EmployerAccount employer = job.getEmployer();
        EmployerProfile profile = s.employerProfiles.get(employer.getId());

        List<ApplicantRowDto> applicants = new ArrayList<>();
        long responded = 0;
        for (JobApplication a : s.applications) {
            if (!a.getJob().getId().equals(jobId)) {
                continue;
            }
            applicants.add(assembler.applicantRow(s, a));
            if (assembler.employerResponded(a)) {
                responded++;
            }
        }
        applicants.sort(Comparator.comparing(ApplicantRowDto::appliedAt).reversed());
        JobStatsDto stats = assembler.jobStats(s, jobId);

        return new JobDetailDto(jobFull(job),
                new EmployerBriefDto(employer.getId(),
                        assembler.displayBusinessName(s, employer), employer.getName(),
                        employer.getPhone(), employer.getEmail(),
                        profile != null && profile.isVerified()),
                stats, applicants,
                new JobNotesDto(stats.contactedCount(), stats.notContactedCount(), responded,
                        stats.applicantCount() - responded));
    }

    private JobFullDto jobFull(JobPost j) {
        List<ShiftDto> shifts = j.getShifts().stream()
                .map(sh -> new ShiftDto(sh.getLabel(), str(sh.getStartTime()), str(sh.getEndTime()),
                        str(sh.getBreakStart()), str(sh.getBreakEnd()), sh.getBreakMinutes()))
                .toList();
        return new JobFullDto(j.getId(), j.getTitle(), j.getDescription(),
                List.copyOf(j.getRequiredSkills()), List.copyOf(j.getResponsibilities()),
                j.getWorkType(), j.getEmploymentType(), j.getWorkerCategory(), j.getEngagementModel(),
                j.getWorkPattern(), j.getHiringMethod(),
                j.getEngagementModel() == null ? null : j.getEngagementModel().offerType(),
                j.getStatus(), j.getSalary(), j.getSalaryUnit(), j.getPayrollCycle(),
                j.getSalaryDueDayOfMonth(), j.getPaymentMode(), j.getWorkDate(), j.getStartDate(),
                j.getEndDate(), j.getDurationMonths(), j.getDurationType(),
                List.copyOf(j.getWorkingDays()), shifts, j.getShiftArrangement(), j.isBreakPaid(),
                j.isOvertimeExpected(), j.getOvertimePayBasis(), j.getOvertimeRate(),
                j.getCity(), j.getArea(), BackOfficeAssembler.location(j), j.getLatitude(),
                j.getLongitude(), j.getMinExperienceYears(), List.copyOf(j.getLanguages()),
                j.getGenderPreference(), j.getAgeMin(), j.getAgeMax(), j.getInterviewType(),
                j.getBenefits(), j.getWorkersNeeded(), j.isUrgent(), j.getJobViews(),
                j.getApplicationDeadline(), j.getPostedAt(), j.getExpiresAt());
    }

    private static String str(java.time.LocalTime t) {
        return t == null ? null : t.toString();
    }

    // ================================================================== applications

    public PageDto<ApplicationRowDto> applications(String status, Long jobId, Long employerId,
                                                   Boolean contacted, String q, int page, int size) {
        guard.require(AdminPermission.VIEW_APPLICATIONS);
        BackOfficeAssembler.Snapshot s = assembler.snapshot();
        List<JobApplication> all = new ArrayList<>(s.applications);
        all.sort(Comparator.comparing(JobApplication::getAppliedAt).reversed());
        List<ApplicationRowDto> rows = new ArrayList<>();
        for (JobApplication a : all) {
            if (status != null && !status.isBlank()
                    && a.getStatus() != parse(ApplicationStatus.class, status, "status")) {
                continue;
            }
            if (jobId != null && !jobId.equals(a.getJob().getId())) {
                continue;
            }
            if (employerId != null && !employerId.equals(a.getJob().getEmployer().getId())) {
                continue;
            }
            if (contacted != null && assembler.isContacted(s, a) != contacted) {
                continue;
            }
            if (!BackOfficeAssembler.matches(q, a.getWorker().getName(), a.getWorker().getPhone(),
                    a.getJob().getTitle(), assembler.displayBusinessName(s, a.getJob().getEmployer()))) {
                continue;
            }
            rows.add(assembler.applicationRow(s, a));
        }
        return PageDto.of(rows, page, size);
    }

    // ================================================================== skills registry

    public PageDto<SkillRegistryRowDto> skillRegistry(String q, String sort, int page, int size) {
        guard.require(AdminPermission.VIEW_WORKERS);
        return PageDto.of(skillRows(q, sort), page, size);
    }

    /**
     * The registry is the union of what workers hold and what jobs ask for, so a skill nobody has
     * and a skill nobody is hiring for both show up - the gaps are the whole point of the screen.
     */
    List<SkillRegistryRowDto> skillRows(String q, String sort) {
        BackOfficeAssembler.Snapshot s = assembler.snapshot();
        Map<String, String> display = new LinkedHashMap<>();
        Map<String, String> categories = new HashMap<>();
        for (Skill skill : skillRepository.findAllByOrderByNameAsc()) {
            display.putIfAbsent(skill.getName().toLowerCase(), skill.getName());
            categories.put(skill.getName().toLowerCase(), skill.getCategory());
        }
        List<WorkerProfile> profiles = workerProfileRepository.findAll();
        for (WorkerProfile p : profiles) {
            for (String sk : p.getSkills()) {
                if (sk != null && !sk.isBlank()) display.putIfAbsent(sk.toLowerCase(), sk.trim());
            }
        }
        List<JobPost> jobs = jobRepository.findAll();
        for (JobPost j : jobs) {
            for (String sk : j.getRequiredSkills()) {
                if (sk != null && !sk.isBlank()) display.putIfAbsent(sk.toLowerCase(), sk.trim());
            }
        }

        List<SkillRegistryRowDto> rows = new ArrayList<>();
        for (Map.Entry<String, String> entry : display.entrySet()) {
            String keyLower = entry.getKey();
            long workerCount = 0, verifiedCount = 0;
            double salarySum = 0;
            int salaryCount = 0;
            for (WorkerProfile p : profiles) {
                if (hasSkill(p.getSkills(), keyLower)) {
                    workerCount++;
                    if (p.getVerificationStatus() == VerificationStatus.VERIFIED) verifiedCount++;
                    if (p.getExpectedSalary() > 0) {
                        salarySum += p.getExpectedSalary();
                        salaryCount++;
                    }
                }
            }
            Set<Long> jobIds = new HashSet<>();
            long openJobs = 0;
            for (JobPost j : jobs) {
                if (hasSkill(j.getRequiredSkills(), keyLower)) {
                    jobIds.add(j.getId());
                    if (j.getStatus() == JobStatus.OPEN) openJobs++;
                }
            }
            long applicationCount = 0, hiredCount = 0;
            for (JobApplication a : s.applications) {
                if (jobIds.contains(a.getJob().getId())) {
                    applicationCount++;
                    if (assembler.isHired(s, a)) hiredCount++;
                }
            }
            rows.add(new SkillRegistryRowDto(entry.getValue(), categories.get(keyLower),
                    workerCount, verifiedCount, jobIds.size(), openJobs, applicationCount, hiredCount,
                    salaryCount == 0 ? 0 : BackOfficeAssembler.round2(salarySum / salaryCount),
                    BackOfficeAssembler.round2(openJobs / (double) Math.max(workerCount, 1))));
        }
        if (q != null && !q.isBlank()) {
            rows.removeIf(r -> !BackOfficeAssembler.matches(q, r.skill(), r.category()));
        }
        String key = sort == null || sort.isBlank() ? "WORKERS" : sort.toUpperCase(Locale.ENGLISH);
        Comparator<SkillRegistryRowDto> comparator = switch (key) {
            case "JOBS" -> Comparator.comparingLong(SkillRegistryRowDto::jobCount).reversed();
            case "DEMAND" -> Comparator.comparingDouble(SkillRegistryRowDto::demandRatio).reversed();
            default -> Comparator.comparingLong(SkillRegistryRowDto::workerCount).reversed();
        };
        rows.sort(comparator.thenComparing(SkillRegistryRowDto::skill));
        return rows;
    }

    private static boolean hasSkill(List<String> skills, String lower) {
        if (skills == null) {
            return false;
        }
        for (String s : skills) {
            if (s != null && s.trim().equalsIgnoreCase(lower)) {
                return true;
            }
        }
        return false;
    }

    public PageDto<SkillWorkerRowDto> skillWorkers(String skill, int page, int size) {
        guard.require(AdminPermission.VIEW_WORKERS);
        BackOfficeAssembler.Snapshot s = assembler.snapshot();
        String lower = skill.toLowerCase();
        List<SkillWorkerRowDto> rows = new ArrayList<>();
        for (WorkerProfile p : workerProfileRepository.findAll()) {
            if (!hasSkill(p.getSkills(), lower)) {
                continue;
            }
            WorkerAccount account = p.getAccount();
            long applications = 0, hires = 0;
            LocalDateTime lastActive = account.getCreatedAt();
            for (JobApplication a : s.applications) {
                if (a.getWorker().getId().equals(account.getId())) {
                    applications++;
                    if (assembler.isHired(s, a)) hires++;
                    if (lastActive == null || a.getAppliedAt().isAfter(lastActive)) {
                        lastActive = a.getAppliedAt();
                    }
                }
            }
            rows.add(new SkillWorkerRowDto(account.getId(), account.getName(), account.getPhone(),
                    p.getCity(), p.getVerificationStatus() == VerificationStatus.VERIFIED,
                    account.getAvgRating(), account.getRatingCount(), p.getExperienceYears(),
                    p.getExpectedSalary(), p.getSalaryUnit(), applications, hires, lastActive));
        }
        rows.sort(Comparator.comparing(SkillWorkerRowDto::name));
        return PageDto.of(rows, page, size);
    }

    // ================================================================== companies

    public PageDto<CompanyRowDto> companies(Boolean verified, String q, int page, int size) {
        guard.require(AdminPermission.VIEW_EMPLOYERS);
        BackOfficeAssembler.Snapshot s = assembler.snapshot();
        List<CompanyRowDto> rows = new ArrayList<>();
        for (EmployerAccount e : employerAccountRepository.findAll()) {
            CompanyRowDto row = companyRow(s, e);
            if (verified != null && row.verified() != verified) {
                continue;
            }
            if (!BackOfficeAssembler.matches(q, row.businessName(), row.contactName(), row.phone(),
                    row.email(), row.city(), row.area(), row.businessType())) {
                continue;
            }
            rows.add(row);
        }
        rows.sort(Comparator.comparing(CompanyRowDto::businessName,
                Comparator.nullsLast(String::compareToIgnoreCase)));
        return PageDto.of(rows, page, size);
    }

    private CompanyRowDto companyRow(BackOfficeAssembler.Snapshot s, EmployerAccount e) {
        EmployerProfile p = s.employerProfiles.get(e.getId());
        long jobCount = 0, openJobs = 0;
        LocalDateTime lastPosted = null;
        for (JobPost j : jobRepository.findAll()) {
            if (!j.getEmployer().getId().equals(e.getId())) {
                continue;
            }
            jobCount++;
            if (j.getStatus() == JobStatus.OPEN) openJobs++;
            if (lastPosted == null || j.getPostedAt().isAfter(lastPosted)) lastPosted = j.getPostedAt();
        }
        long applicants = 0, hires = 0;
        for (JobApplication a : s.applications) {
            if (a.getJob().getEmployer().getId().equals(e.getId())) {
                applicants++;
                if (assembler.isHired(s, a)) hires++;
            }
        }
        long interviews = s.interviews.stream()
                .filter(i -> i.getEmployer().getId().equals(e.getId())).count();
        double spend = walletRepository.findByOwnerTypeAndOwnerId(AccountType.EMPLOYER, e.getId())
                .map(w -> transactionRepository.findByWalletOrderByCreatedAtDesc(w).stream()
                        .filter(t -> t.getType() == WalletTransaction.Type.DEBIT
                                && t.getReference() == WalletTransaction.Reference.JOB_PAYMENT)
                        .mapToDouble(WalletTransaction::getAmount).sum())
                .orElse(0.0);
        Double fees = assembler.platformFeeOn(spend);
        return new CompanyRowDto(e.getId(),
                p != null ? p.getBusinessName() : e.getName(),
                p == null ? null : p.getBusinessType(), e.getName(), e.getPhone(), e.getEmail(),
                p == null ? null : p.getCity(), p == null ? null : p.getArea(),
                p != null && p.isVerified(), p == null ? null : p.getPlan(), e.getCreatedAt(),
                jobCount, openJobs, applicants, hires, interviews,
                BackOfficeAssembler.round2(spend), fees == null ? 0 : fees, lastPosted);
    }

    public CompanyDetailDto company(Long employerId) {
        guard.require(AdminPermission.VIEW_EMPLOYERS);
        EmployerAccount e = employerAccountRepository.findById(employerId)
                .orElseThrow(() -> ApiException.notFound("Employer not found"));
        BackOfficeAssembler.Snapshot s = assembler.snapshot();
        CompanyRowDto r = companyRow(s, e);

        List<JobRowDto> jobs = jobRepository.findByEmployerOrderByPostedAtDesc(e).stream()
                .map(j -> assembler.jobRow(s, j)).toList();
        List<ApplicationRowDto> applications = s.applications.stream()
                .filter(a -> a.getJob().getEmployer().getId().equals(employerId))
                .sorted(Comparator.comparing(JobApplication::getAppliedAt).reversed())
                .limit(25)
                .map(a -> assembler.applicationRow(s, a)).toList();
        List<InterviewRowDto> interviews = s.interviews.stream()
                .filter(i -> i.getEmployer().getId().equals(employerId))
                .map(i -> assembler.interviewRow(s, i)).toList();
        List<PaymentRowDto> payments = paymentRows(s).stream()
                .filter(p -> employerId.equals(p.employerId())).toList();

        return new CompanyDetailDto(r.employerId(), r.businessName(), r.businessType(),
                r.contactName(), r.phone(), r.email(), r.city(), r.area(), r.verified(), r.plan(),
                r.registeredAt(), r.jobCount(), r.openJobCount(), r.applicantCount(), r.hiredCount(),
                r.interviewCount(), r.totalSpend(), r.platformFeesPaid(), r.lastJobPostedAt(),
                jobs, applications, interviews, payments);
    }

    // ================================================================== interviews

    public PageDto<InterviewRowDto> interviews(LocalDate from, LocalDate to, String status,
                                               Long employerId, String q, int page, int size) {
        guard.require(AdminPermission.VIEW_INTERVIEWS);
        return PageDto.of(interviewRows(from, to, status, employerId, q), page, size);
    }

    private List<InterviewRowDto> interviewRows(LocalDate from, LocalDate to, String status,
                                                Long employerId, String q) {
        BackOfficeAssembler.Snapshot s = assembler.snapshot();
        List<InterviewRowDto> rows = new ArrayList<>();
        for (Interview i : s.interviews) {
            LocalDate day = i.getScheduledAt().toLocalDate();
            if (from != null && day.isBefore(from)) continue;
            if (to != null && day.isAfter(to)) continue;
            if (status != null && !status.isBlank()
                    && i.getStatus() != parse(InterviewStatus.class, status, "status")) continue;
            if (employerId != null && !employerId.equals(i.getEmployer().getId())) continue;
            InterviewRowDto row = assembler.interviewRow(s, i);
            if (!BackOfficeAssembler.matches(q, row.workerName(), row.workerPhone(), row.jobTitle(),
                    row.businessName())) continue;
            rows.add(row);
        }
        rows.sort(Comparator.comparing(InterviewRowDto::scheduledAt).reversed());
        return rows;
    }

    public List<CalendarDayDto> interviewCalendar(LocalDate from, LocalDate to) {
        guard.require(AdminPermission.VIEW_INTERVIEWS);
        LocalDate start = from != null ? from : LocalDate.now().minusDays(7);
        LocalDate end = to != null ? to : LocalDate.now().plusDays(21);
        Map<LocalDate, List<InterviewRowDto>> byDay = new LinkedHashMap<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            byDay.put(d, new ArrayList<>());
        }
        for (InterviewRowDto row : interviewRows(start, end, null, null, null)) {
            byDay.computeIfAbsent(row.scheduledAt().toLocalDate(), k -> new ArrayList<>()).add(row);
        }
        List<CalendarDayDto> days = new ArrayList<>();
        byDay.forEach((d, items) -> {
            items.sort(Comparator.comparing(InterviewRowDto::scheduledAt));
            days.add(new CalendarDayDto(d, items.size(), items));
        });
        days.sort(Comparator.comparing(CalendarDayDto::date));
        return days;
    }

    // ================================================================== payments

    public PaymentListDto payments(LocalDate from, LocalDate to, String type, Long employerId,
                                   Long workerId, String q, int page, int size) {
        guard.require(AdminPermission.VIEW_PAYMENTS);
        BackOfficeAssembler.Snapshot s = assembler.snapshot();
        List<PaymentRowDto> rows = new ArrayList<>();
        for (PaymentRowDto row : paymentRows(s)) {
            LocalDate day = row.at().toLocalDate();
            if (from != null && day.isBefore(from)) continue;
            if (to != null && day.isAfter(to)) continue;
            if (type != null && !type.isBlank() && !type.equalsIgnoreCase(row.type())) continue;
            if (employerId != null && !employerId.equals(row.employerId())) continue;
            if (workerId != null && !workerId.equals(row.workerId())) continue;
            if (!BackOfficeAssembler.matches(q, row.workerName(), row.businessName(), row.jobTitle(),
                    row.description(), row.reference())) continue;
            rows.add(row);
        }
        double in = rows.stream().filter(r -> "IN".equals(r.direction()))
                .mapToDouble(PaymentRowDto::amount).sum();
        double out = rows.stream().filter(r -> "OUT".equals(r.direction()))
                .mapToDouble(PaymentRowDto::amount).sum();
        double fees = rows.stream().filter(r -> r.platformFee() != null)
                .mapToDouble(PaymentRowDto::platformFee).sum();
        PageDto<PaymentRowDto> paged = PageDto.of(rows, page, size);
        return new PaymentListDto(paged.content(), paged.page(), paged.size(), paged.totalElements(),
                paged.totalPages(),
                new PaymentSummaryDto(BackOfficeAssembler.round2(in), BackOfficeAssembler.round2(out),
                        BackOfficeAssembler.round2(fees), rows.size()));
    }

    List<PaymentRowDto> paymentRows(BackOfficeAssembler.Snapshot s) {
        Map<Long, Wallet> wallets = new HashMap<>();
        walletRepository.findAll().forEach(w -> wallets.put(w.getId(), w));
        Map<Long, JobPost> jobs = new HashMap<>();
        jobRepository.findAll().forEach(j -> jobs.put(j.getId(), j));

        List<PaymentRowDto> rows = new ArrayList<>();
        for (WalletTransaction t : transactionRepository.findAllByOrderByCreatedAtDesc()) {
            Wallet wallet = wallets.get(t.getWallet().getId());
            JobPost job = t.getJobId() == null ? null : jobs.get(t.getJobId());
            boolean credit = t.getType() == WalletTransaction.Type.CREDIT;
            Long workerId = null, employerId = null;
            String workerName = null, businessName = null;
            if (wallet != null && wallet.getOwnerType() == AccountType.WORKER) {
                workerId = wallet.getOwnerId();
                workerName = workerAccountRepository.findById(workerId)
                        .map(WorkerAccount::getName).orElse(null);
            } else if (wallet != null && wallet.getOwnerType() == AccountType.EMPLOYER) {
                employerId = wallet.getOwnerId();
                businessName = employerAccountRepository.findById(employerId)
                        .map(e -> assembler.displayBusinessName(s, e)).orElse(null);
            }
            if (job != null) {
                if (employerId == null) {
                    employerId = job.getEmployer().getId();
                    businessName = assembler.displayBusinessName(s, job.getEmployer());
                }
            }
            Double fee = (credit && t.getReference() == WalletTransaction.Reference.JOB_PAYMENT)
                    ? assembler.platformFeeOn(t.getAmount()) : null;
            rows.add(new PaymentRowDto(t.getId(), t.getCreatedAt(),
                    t.getReference() == null ? t.getType().name() : t.getReference().name(),
                    t.getAmount(), credit ? "IN" : "OUT", "WT-" + t.getId(), t.getDescription(),
                    workerId, workerName, employerId, businessName,
                    job == null ? null : job.getId(), job == null ? null : job.getTitle(),
                    fee, "COMPLETED"));
        }
        return rows;
    }

    /** Every worker-side credit that settled a job - the platform's real payout ledger. */
    List<WalletTransaction> jobPayoutsToWorkers() {
        List<WalletTransaction> out = new ArrayList<>();
        for (Wallet w : walletRepository.findAll()) {
            if (w.getOwnerType() != AccountType.WORKER) {
                continue;
            }
            for (WalletTransaction t : transactionRepository.findByWalletOrderByCreatedAtDesc(w)) {
                if (t.getType() == WalletTransaction.Type.CREDIT
                        && t.getReference() == WalletTransaction.Reference.JOB_PAYMENT) {
                    out.add(t);
                }
            }
        }
        return out;
    }

    // ================================================================== misc

    static <E extends Enum<E>> E parse(Class<E> type, String raw, String field) {
        try {
            return Enum.valueOf(type, raw.trim().toUpperCase(Locale.ENGLISH));
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest("Invalid " + field + ": " + raw);
        }
    }
}
