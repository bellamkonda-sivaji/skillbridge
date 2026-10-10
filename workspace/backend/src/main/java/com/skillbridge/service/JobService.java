package com.skillbridge.service;

import com.skillbridge.dto.JobPricingDto;
import com.skillbridge.dto.JobDemandDto;
import com.skillbridge.dto.PriceChangeRequest;
import com.skillbridge.dto.JobBenefitDto;
import com.skillbridge.dto.JobDto;
import com.skillbridge.dto.JobRequest;
import com.skillbridge.dto.JobSearchRequest;
import com.skillbridge.dto.JobShiftDto;
import com.skillbridge.dto.ScheduleEstimateDto;
import com.skillbridge.dto.ScheduleEstimateRequest;
import com.skillbridge.dto.DayTimeDto;
import com.skillbridge.dto.MatchDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/** Job posts themselves. The application lifecycle lives in {@link ApplicationService}. */
@Service
public class JobService {

    private final JobPostRepository jobRepository;

    private final ShopService shopService;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final MatchRepository matchRepository;
    private final GeoService geoService;
    private final SkillLexicon lexicon;
    private final MatchingService matchingService;
    private final ScheduleCalculator scheduleCalculator;
    private final PricingService pricingService;
    private final JobPriceChangeRepository priceChangeRepository;
    private final JobDemandService demandService;

    public JobService(JobPostRepository jobRepository, WorkerProfileRepository workerProfileRepository,
                      EmployerProfileRepository employerProfileRepository, MatchRepository matchRepository,
                      GeoService geoService, SkillLexicon lexicon, MatchingService matchingService,
                      ScheduleCalculator scheduleCalculator, PricingService pricingService,
                      JobPriceChangeRepository priceChangeRepository, JobDemandService demandService,
                      ShopService shopService) {
        this.shopService = shopService;
        this.pricingService = pricingService;
        this.priceChangeRepository = priceChangeRepository;
        this.demandService = demandService;
        this.jobRepository = jobRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.matchRepository = matchRepository;
        this.geoService = geoService;
        this.lexicon = lexicon;
        this.matchingService = matchingService;
        this.scheduleCalculator = scheduleCalculator;
    }

    public List<JobDto> listOpenJobs() {
        return jobRepository.findByStatusOrderByPostedAtDesc(JobStatus.OPEN).stream()
                .map(j -> JobDto.from(j, null)).collect(Collectors.toList());
    }

    @Transactional
    public JobDto getJob(Long id, Account viewer) {
        JobPost job = jobRepository.findById(id).orElseThrow(() -> ApiException.notFound("Job not found"));
        Double match = null;
        if (viewer instanceof WorkerAccount worker) {
            match = matchRepository.findByWorkerAndJob(worker, job).map(Match::getScore).orElse(null);
        }
        // Anyone but the owning employer counts as a view - that is what jobViews measures.
        boolean owner = viewer instanceof EmployerAccount e && job.getEmployer().getId().equals(e.getId());
        if (!owner) {
            job.setJobViews(job.getJobViews() + 1);
            jobRepository.save(job);
        }
        return JobDto.from(job, match);
    }

    @Transactional
    public JobDto postJob(EmployerAccount employer, JobRequest request) {
        EmployerProfile profile = employerProfileRepository.findByAccountId(employer.getId())
                .orElseThrow(() -> ApiException.badRequest("Complete your business profile before posting jobs"));
        boolean draft = request.isDraft();
        if (request.title() == null || request.title().isBlank()) {
            throw ApiException.badRequest("A job title is required");
        }
        // A draft is a half-finished wizard, so only a published posting has to be complete.
        if (!draft && (request.requiredSkills() == null || request.requiredSkills().isEmpty()
                || request.salary() <= 0)) {
            throw ApiException.badRequest("Title, at least one required skill and a salary are required");
        }

        // Which of the employer's places this work is at. The shop is the
        // authority on where the job is: an employer with two branches posting
        // for the second one should not have the first one's address attached,
        // which is what inheriting from the profile always did.
        Shop shop = request.shopId() == null ? null : shopService.require(employer, request.shopId());

        String city = firstPresent(
                request.city(),
                shop == null ? null : shop.getCity(),
                profile.getCity(),
                "Tirupati");

        JobPost job = JobPost.builder()
                .employer(employer)
                .title(request.title().trim())
                .description(request.description())
                .requiredSkills(request.requiredSkills() != null
                        ? new ArrayList<>(request.requiredSkills()) : new ArrayList<>())
                .workType(request.workType() != null ? request.workType() : WorkType.DAILY)
                .employmentType(request.employmentType() != null ? request.employmentType() : EmploymentType.FULL_TIME)
                .salary(request.salary())
                .salaryUnit(request.salaryUnit())
                .city(city)
                .area(request.area())
                // Inherited from the business, like the coordinates above: the
                // work is almost always at the shop, and a job with no PIN
                // scores nothing on locality when a worker is matched to it.
                .shop(shop)
                .pincode(firstPresent(request.pincode(),
                        shop == null ? null : shop.getPincode(), profile.getPincode(), null))
                .latitude(firstCoord(request.latitude(),
                        shop == null ? 0 : shop.getLatitude(), profile.getLatitude()))
                .longitude(firstCoord(request.longitude(),
                        shop == null ? 0 : shop.getLongitude(), profile.getLongitude()))
                .minExperienceYears(Math.max(0, request.minExperienceYears()))
                .language(request.language())
                .workersNeeded(Math.max(1, request.workersNeeded()))
                .urgent(request.urgent())
                .status(draft ? JobStatus.DRAFT : JobStatus.OPEN)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .build();
        applyWizardFields(job, request);
        if (job.getSalaryUnit() == null) {
            job.setSalaryUnit(job.getEngagementModel().recommendedSalaryUnit(job.getWorkPattern()));
        }
        if (!draft) {
            scheduleCalculator.validate(scheduleInput(job));
        }
        reprice(job);
        job.setOriginalSalary(job.getSalary());
        job = jobRepository.save(job);

        if (job.getStatus() == JobStatus.OPEN) {
            matchingService.generateMatchesForJob(job);
        }
        return JobDto.from(job, null);
    }

    @Transactional
    public JobDto updateJob(EmployerAccount employer, Long jobId, JobRequest request) {
        JobPost job = requireEmployerJob(employer, jobId);
        if (request.title() != null && !request.title().isBlank()) job.setTitle(request.title());
        if (request.description() != null) job.setDescription(request.description());
        if (request.requiredSkills() != null && !request.requiredSkills().isEmpty()) {
            job.setRequiredSkills(new ArrayList<>(request.requiredSkills()));
        }
        if (request.workType() != null) job.setWorkType(request.workType());
        if (request.employmentType() != null) job.setEmploymentType(request.employmentType());
        if (request.salary() > 0) job.setSalary(request.salary());
        if (request.salaryUnit() != null) job.setSalaryUnit(request.salaryUnit());
        reprice(job);
        if (request.city() != null && !request.city().isBlank()) job.setCity(request.city());
        if (request.area() != null) job.setArea(request.area());
        if (request.pincode() != null && !request.pincode().isBlank()) {
            job.setPincode(request.pincode());
        } else if (job.getPincode() == null || job.getPincode().isBlank()) {
            // Inherited, because the work is almost always at the shop. A job
            // without one scores nothing on locality, which would quietly
            // undo the matching for every employer who never retypes it.
            EmployerProfile p = job.getEmployer() == null ? null : job.getEmployer().getProfile();
            if (p != null && p.getPincode() != null) job.setPincode(p.getPincode());
        }
        if (request.latitude() != 0) job.setLatitude(request.latitude());
        if (request.longitude() != 0) job.setLongitude(request.longitude());
        if (request.minExperienceYears() > 0) job.setMinExperienceYears(request.minExperienceYears());
        if (request.language() != null) job.setLanguage(request.language());
        if (request.workersNeeded() > 0) job.setWorkersNeeded(request.workersNeeded());
        job.setUrgent(request.urgent());
        applyWizardFields(job, request);
        // Publishing a draft is done by saving it again without draft=true.
        if (job.getStatus() == JobStatus.DRAFT && !request.isDraft()) {
            job.setStatus(JobStatus.OPEN);
            job.setPostedAt(LocalDateTime.now());
        }
        if (job.getStatus() != JobStatus.DRAFT) {
            scheduleCalculator.validate(scheduleInput(job));
        }
        job = jobRepository.save(job);
        if (job.getStatus() == JobStatus.OPEN) {
            matchingService.generateMatchesForJob(job);
        }
        return JobDto.from(job, null);
    }

    /** Applies every posting-wizard field that is actually present on the request. */
    private void applyWizardFields(JobPost job, JobRequest request) {
        if (request.workerCategory() != null) job.setWorkerCategory(request.workerCategory());
        if (request.responsibilities() != null) {
            job.getResponsibilities().clear();
            job.getResponsibilities().addAll(request.responsibilities());
        }
        if (request.workingDays() != null) {
            job.getWorkingDays().clear();
            job.getWorkingDays().addAll(request.workingDays());
        }
        applyBenefits(job, request);
        if (request.languages() != null) {
            job.getLanguages().clear();
            job.getLanguages().addAll(request.languages());
        }
        if (request.shifts() != null) {
            List<JobShift> shifts = new ArrayList<>();
            for (JobShiftDto dto : request.shifts()) {
                if (dto == null) continue;
                shifts.add(JobShift.builder()
                        .label(dto.label()).startTime(dto.startTime()).endTime(dto.endTime())
                        .breakMinutes(dto.breakMinutes())
                        .breakStart(dto.breakStart()).breakEnd(dto.breakEnd()).build());
            }
            job.replaceShifts(shifts);
        }
        if (request.durationType() != null) job.setDurationType(request.durationType());
        if (request.startDate() != null) job.setStartDate(request.startDate());
        if (request.endDate() != null) job.setEndDate(request.endDate());
        applyPaymentMode(job, request);
        if (request.genderPreference() != null) job.setGenderPreference(request.genderPreference());
        if (request.ageMin() != null) job.setAgeMin(request.ageMin());
        if (request.ageMax() != null) job.setAgeMax(request.ageMax());
        if (request.interviewType() != null) job.setInterviewType(request.interviewType());
        if (request.applicationDeadline() != null) job.setApplicationDeadline(request.applicationDeadline());
        if (request.autoCloseWhenFilled() != null) job.setAutoCloseWhenFilled(request.autoCloseWhenFilled());
        applyEngagementRules(job, request);
    }

    /** The first value that is actually set: the request, then the shop, then the profile. */
    private static String firstPresent(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v.trim();
        }
        return null;
    }

    /** Same order for coordinates, where "unset" is zero rather than null. */
    private static double firstCoord(double... values) {
        for (double v : values) {
            if (v != 0) return v;
        }
        return 0;
    }

    /** Jobs are funded through SkillBridge - CASH survives only for rows written before this rule. */
    private void applyPaymentMode(JobPost job, JobRequest request) {
        if (request.paymentMode() == PaymentMode.CASH) {
            throw ApiException.badRequest("Jobs are funded through JobOn");
        }
        job.setPaymentMode(PaymentMode.SKILLBRIDGE);
    }

    /** Structured benefits win; a plain benefits list is still accepted and mapped onto them. */
    private void applyBenefits(JobPost job, JobRequest request) {
        List<JobBenefit> rows = null;
        if (request.jobBenefits() != null) {
            rows = new ArrayList<>();
            for (JobBenefitDto dto : request.jobBenefits()) {
                if (dto == null || dto.benefitType() == null) continue;
                rows.add(JobBenefit.builder().benefitType(dto.benefitType())
                        .amount(dto.amount()).unit(dto.unit()).note(dto.note()).build());
            }
        } else if (request.benefits() != null) {
            rows = new ArrayList<>();
            for (String raw : request.benefits()) {
                if (raw == null || raw.isBlank()) continue;
                rows.add(JobBenefit.builder().benefitType(BenefitType.parse(raw)).build());
            }
        }
        if (rows != null) {
            job.replaceBenefits(rows);
        }
    }

    /**
     * The engagement model is the top of the rules engine: the duration the employer picks
     * first. It normalises legacy values, back-fills the legacy employmentType column, infers
     * the work pattern, defaults the hiring method and picks the payroll cycle.
     */
    private void applyEngagementRules(JobPost job, JobRequest request) {
        if (request.engagementModel() != null) {
            EngagementModel normalized = EngagementModel.normalize(request.engagementModel());
            if (normalized == null && !request.isDraft()) {
                throw ApiException.badRequest("Choose how long you need the worker.");
            }
            job.setEngagementModel(normalized != null ? normalized : EngagementModel.ONE_DAY);
        } else if (job.getEngagementModel() == null) {
            job.setEngagementModel(EngagementModel.ONE_DAY);
        }
        EngagementModel model = job.getEngagementModel();

        if (request.workPattern() != null) {
            job.setWorkPattern(request.workPattern());
        } else if (job.getShifts() != null && !job.getShifts().isEmpty()) {
            double paidHoursPerDay = scheduleCalculator.paidMinutesPerDay(scheduleInput(job)) / 60.0;
            job.setWorkPattern(WorkPattern.infer(paidHoursPerDay, job.getShifts().size()));
        } else {
            job.setWorkPattern(WorkPattern.FULL_DAY);
        }
        if (request.employmentType() == null) {
            job.setEmploymentType(model.legacyEmploymentType(job.getWorkPattern()));
        }

        HiringMethod hiringMethod = request.hiringMethod() != null
                ? request.hiringMethod() : model.defaultHiringMethod();
        if ((model == EngagementModel.ONE_DAY || model == EngagementModel.FEW_DAYS)
                && hiringMethod == HiringMethod.INTERVIEW) {
            throw ApiException.badRequest("Interviews aren't needed for short jobs");
        }
        job.setHiringMethod(hiringMethod);

        if (request.durationMonths() != null) job.setDurationMonths(request.durationMonths());
        if (request.dayTimes() != null) {
            job.getDayTimes().clear();
            for (DayTimeDto dto : request.dayTimes()) {
                if (dto == null) continue;
                job.getDayTimes().add(DayTime.builder()
                        .dayCode(dto.dayCode()).startTime(dto.startTime()).endTime(dto.endTime()).build());
            }
        }

        if (request.shiftArrangement() != null) job.setShiftArrangement(request.shiftArrangement());
        if (request.breakPaid() != null) job.setBreakPaid(request.breakPaid());
        if (request.overtimeExpected() != null) job.setOvertimeExpected(request.overtimeExpected());
        if (request.overtimePayBasis() != null) job.setOvertimePayBasis(request.overtimePayBasis());
        if (request.overtimeRate() != null) job.setOvertimeRate(request.overtimeRate());
        if (request.salaryDueDayOfMonth() != null) job.setSalaryDueDayOfMonth(request.salaryDueDayOfMonth());
        if (request.workDate() != null) job.setWorkDate(request.workDate());

        if (model == EngagementModel.ONE_DAY && job.getWorkDate() != null) {
            job.setDurationType(JobDuration.SPECIFIC);
            job.setStartDate(job.getWorkDate());
            job.setEndDate(job.getWorkDate());
        }
        if (model == EngagementModel.PERMANENT && request.endDate() == null
                && request.durationType() == null) {
            job.setDurationType(JobDuration.ONGOING);
        }
        if ((model == EngagementModel.FEW_DAYS || model == EngagementModel.FEW_WEEKS)
                && job.getStartDate() != null && job.getEndDate() != null
                && request.durationType() == null) {
            job.setDurationType(JobDuration.SPECIFIC);
        }
        if (model == EngagementModel.MONTHS && request.durationMonths() != null
                && request.endDate() == null && request.durationType() == null) {
            // Fixed months with no end date stay ongoing; the months are stored on the job.
            job.setDurationType(JobDuration.ONGOING);
            job.setEndDate(null);
        }
        job.setPayrollCycle(request.payrollCycle() != null
                ? request.payrollCycle()
                : (job.getPayrollCycle() != null && request.engagementModel() == null
                        ? job.getPayrollCycle() : model.defaultPayrollCycle()));
    }

    // ---------------------------------------------------------------- schedule estimates

    /** Pure calculation over a request body - nothing is persisted. */
    public ScheduleEstimateDto estimate(ScheduleEstimateRequest request) {
        EngagementModel model = EngagementModel.normalize(request.engagementModel());
        if (model == null) {
            model = EngagementModel.FEW_WEEKS;
        }
        List<ScheduleCalculator.ShiftWindow> windows = new ArrayList<>();
        if (request.shifts() != null) {
            for (JobShiftDto dto : request.shifts()) {
                if (dto == null) continue;
                windows.add(new ScheduleCalculator.ShiftWindow(
                        dto.startTime(), dto.endTime(), dto.breakStart(), dto.breakEnd(),
                        dto.breakMinutes()));
            }
        }
        List<DayTime> dayTimes = new ArrayList<>();
        if (request.dayTimes() != null) {
            for (DayTimeDto dto : request.dayTimes()) {
                if (dto == null) continue;
                dayTimes.add(DayTime.builder()
                        .dayCode(dto.dayCode()).startTime(dto.startTime()).endTime(dto.endTime()).build());
            }
        }
        LocalDate start = request.startDate();
        LocalDate end = request.endDate();
        if (model == EngagementModel.ONE_DAY && request.workDate() != null) {
            start = request.workDate();
            end = request.workDate();
        }
        return scheduleCalculator.estimate(new ScheduleCalculator.ScheduleInput(
                model, request.workDate(), start, end, request.durationType(),
                request.workingDays(), windows,
                request.shiftArrangement(), Boolean.TRUE.equals(request.breakPaid()),
                request.salary() != null ? request.salary() : 0d, request.salaryUnit(),
                model.defaultPayrollCycle(), request.workPattern(), null, dayTimes));
    }

    /** The same estimate for a job that is already saved. */
    @Transactional(readOnly = true)
    public ScheduleEstimateDto estimateForJob(EmployerAccount employer, Long jobId) {
        return scheduleCalculator.estimate(scheduleInput(requireEmployerJob(employer, jobId)));
    }

    /** Turns a saved (or about-to-be-saved) job into the engine's input. */
    public ScheduleCalculator.ScheduleInput scheduleInput(JobPost job) {
        List<ScheduleCalculator.ShiftWindow> windows = new ArrayList<>();
        for (JobShift s : job.getShifts()) {
            windows.add(new ScheduleCalculator.ShiftWindow(
                    s.getStartTime(), s.getEndTime(), s.getBreakStart(), s.getBreakEnd(),
                    s.getBreakMinutes()));
        }
        return new ScheduleCalculator.ScheduleInput(
                job.getEngagementModel(), job.getWorkDate(), job.getStartDate(), job.getEndDate(),
                job.getDurationType(), new ArrayList<>(job.getWorkingDays()), windows,
                job.getShiftArrangement(), job.isBreakPaid(), job.getSalary(), job.getSalaryUnit(),
                job.getPayrollCycle(), job.getWorkPattern(), job.getDurationMonths(),
                job.getDayTimes() == null ? List.of() : new ArrayList<>(job.getDayTimes()));
    }

    /** Drafts only - a published posting is paused or closed, never deleted. */
    @Transactional
    public void deleteJob(EmployerAccount employer, Long jobId) {
        JobPost job = requireEmployerJob(employer, jobId);
        if (job.getStatus() != JobStatus.DRAFT) {
            throw ApiException.badRequest("Only a draft can be deleted. Pause or close this job instead.");
        }
        jobRepository.delete(job);
    }

    @Transactional
    public JobDto setJobStatus(EmployerAccount employer, Long jobId, JobStatus status) {
        JobPost job = requireEmployerJob(employer, jobId);
        JobStatus previous = job.getStatus();
        job.setStatus(status);
        if (previous == JobStatus.DRAFT && status == JobStatus.OPEN) {
            job.setPostedAt(LocalDateTime.now());
        }
        job = jobRepository.save(job);
        if (status == JobStatus.OPEN) {
            matchingService.generateMatchesForJob(job);
        }
        return JobDto.from(job, null);
    }

    public List<JobDto> employerJobs(EmployerAccount employer) {
        return jobRepository.findByEmployerOrderByPostedAtDesc(employer).stream()
                .map(j -> JobDto.from(j, null)).collect(Collectors.toList());
    }

    /** The general-purpose search behind POST /api/jobs/search - open to anyone. */
    /** Open jobs for one business, for the public employer profile. */
    public List<JobDto> openJobsForEmployer(Long employerAccountId) {
        return jobRepository.findAll().stream()
                .filter(j -> j.getStatus() == JobStatus.OPEN)
                .filter(j -> j.getEmployer() != null
                        && j.getEmployer().getId().equals(employerAccountId))
                .sorted((a, b) -> b.getPostedAt().compareTo(a.getPostedAt()))
                .map(j -> JobDto.from(j, null))
                .toList();
    }

    public List<JobDto> searchJobs(Account viewer, JobSearchRequest req) {
        List<JobPost> candidates;
        if (req.q() != null && !req.q().isBlank()) {
            candidates = new ArrayList<>(jobRepository.search(JobStatus.OPEN, req.q()));
            for (String skill : req.q().split("[,\\s]+")) {
                if (skill.length() > 1) {
                    for (JobPost j : jobRepository.findByRequiredSkillContaining(skill)) {
                        if (!candidates.contains(j)) candidates.add(j);
                    }
                }
            }
        } else {
            candidates = jobRepository.findByStatusOrderByPostedAtDesc(JobStatus.OPEN);
        }

        WorkerAccount worker = viewer instanceof WorkerAccount w ? w : null;
        List<JobDto> result = new ArrayList<>();
        for (JobPost j : candidates) {
            boolean ok = j.getStatus() == JobStatus.OPEN;
            if (ok && req.city() != null && !req.city().isBlank() && !j.getCity().equalsIgnoreCase(req.city())) ok = false;
            if (ok && req.workType() != null && j.getWorkType() != req.workType()) ok = false;
            if (ok && req.urgent() != null && j.isUrgent() != req.urgent()) ok = false;
            if (ok && req.skills() != null && !req.skills().isEmpty()) {
                List<String> jobSkills = new ArrayList<>();
                for (String s : j.getRequiredSkills()) {
                    for (String v : lexicon.expand(s)) jobSkills.add(lexicon.normalize(v));
                }
                ok = req.skills().stream().allMatch(s -> {
                    for (String v : lexicon.expand(s)) {
                        if (jobSkills.contains(lexicon.normalize(v))) return true;
                    }
                    return false;
                });
            }
            if (ok && (req.minSalary() != null || req.maxSalary() != null)) {
                double monthly = j.getSalary() * switch (j.getSalaryUnit() == null ? SalaryUnit.DAILY : j.getSalaryUnit()) {
                    case HOURLY -> 176.0;
                    case DAILY -> 22.0;
                    case PER_WEEK -> 4.33;
                    case PER_SHIFT -> 22.0;
                    case MONTHLY -> 1.0;
                };
                if (req.minSalary() != null && monthly < req.minSalary()) ok = false;
                if (ok && req.maxSalary() != null && monthly > req.maxSalary()) ok = false;
            }
            if (ok && req.maxDistanceKm() != null && req.lat() != null && req.lng() != null) {
                Double dist = geoService.distanceKmOrNull(req.lat(), req.lng(), j.getLatitude(), j.getLongitude());
                if (dist == null || dist > req.maxDistanceKm()) ok = false;
            }
            Double match = null;
            if (ok && worker != null) {
                match = matchRepository.findByWorkerAndJob(worker, j).map(Match::getScore).orElse(null);
            }
            if (ok) result.add(JobDto.from(j, match));
        }

        result.sort((a, b) -> {
            double sa = a.matchScore() != null ? a.matchScore() : -1;
            double sb = b.matchScore() != null ? b.matchScore() : -1;
            return Double.compare(sb, sa);
        });
        return result;
    }

    public List<MatchDto> matchesForWorker(WorkerAccount worker) {
        return matchRepository.findByWorkerOrderByScoreDesc(worker).stream().map(MatchDto::from).toList();
    }

    /** Regenerates matches for a worker whose profile just changed. */
    @Transactional
    public void refreshMatches(WorkerAccount worker) {
        workerProfileRepository.findByAccountId(worker.getId())
                .ifPresent(matchingService::generateMatchesForWorker);
    }

    private JobPost requireEmployerJob(EmployerAccount employer, Long jobId) {
        JobPost job = jobRepository.findById(jobId).orElseThrow(() -> ApiException.notFound("Job not found"));
        if (!job.getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("This is not your job");
        }
        return job;
    }

    // ================================================================= pricing

    /**
     * Recomputes the commission split from whatever the salary currently is.
     *
     * The employer's number is left exactly as they typed it - we never quietly raise the
     * posted price to cover our own fee. The commission comes out of it, and the worker-facing
     * figure is what is left.
     */
    public void reprice(JobPost job) {
        double salary = job.getSalary();
        job.applyPricing(
                pricingService.feePercent(salary),
                pricingService.fee(salary),
                pricingService.takeHome(salary));
        if (job.getOriginalSalary() <= 0) {
            job.setOriginalSalary(salary);
        }
    }

    public JobPricingDto pricingOf(JobPost job) {
        if (job.getWorkerSalary() <= 0 && job.getSalary() > 0) {
            reprice(job);
        }
        return new JobPricingDto(
                job.getSalary(),
                job.getPlatformFee(),
                job.getFeePercent(),
                job.getWorkerSalary(),
                job.getSalaryUnit(),
                pricingService.slabLabel(job.getSalary()),
                job.getOriginalSalary() > 0 && job.getOriginalSalary() != job.getSalary()
                        ? job.getOriginalSalary() : null,
                job.getPriceChangeCount());
    }

    /** A quote for a price the employer has typed but not yet committed to. */
    public JobPricingDto quote(double salary, SalaryUnit unit) {
        return new JobPricingDto(
                salary,
                pricingService.fee(salary),
                pricingService.feePercent(salary),
                pricingService.takeHome(salary),
                unit,
                pricingService.slabLabel(salary),
                null,
                0);
    }

    /**
     * Changes what a live job pays, and records why.
     *
     * Allowed on OPEN and DRAFT jobs. It is deliberately NOT allowed once a job is closed or
     * filled: the people already hired agreed to a number, and moving it afterwards would
     * rewrite a deal that has already been struck.
     */
    @Transactional
    public JobPricingDto changePrice(EmployerAccount employer, Long jobId, PriceChangeRequest request) {
        JobPost job = requireEmployerJob(employer, jobId);
        if (job.getStatus() != JobStatus.OPEN && job.getStatus() != JobStatus.DRAFT) {
            throw ApiException.badRequest("You can only change the pay while the job is still open.");
        }
        if (request == null || request.salary() <= 0) {
            throw ApiException.badRequest("Enter the new pay amount.");
        }
        double oldSalary = job.getSalary();
        double oldWorker = job.getWorkerSalary();
        if (Math.abs(request.salary() - oldSalary) < 0.01) {
            return pricingOf(job);
        }

        job.setSalary(request.salary());
        reprice(job);
        job.setPriceChangedAt(LocalDateTime.now());
        job.setPriceChangeCount(job.getPriceChangeCount() + 1);
        // A new price is a new offer to the market, so the advice starts from a clean slate.
        job.setDemandAlertedAt(null);
        job.setSuggestedSalary(null);
        jobRepository.save(job);

        priceChangeRepository.save(JobPriceChange.builder()
                .jobId(job.getId())
                .oldSalary(oldSalary)
                .newSalary(job.getSalary())
                .salaryUnit(job.getSalaryUnit())
                .oldWorkerSalary(oldWorker)
                .newWorkerSalary(job.getWorkerSalary())
                .suggestedSalary(job.getSuggestedSalary())
                .reason(request.reason())
                .changedBy("EMPLOYER")
                .changedById(employer.getId())
                .applicantsAtChange(job.getApplicantsCount())
                .build());

        // A raise is worth telling the people it reaches, so re-run the match pass.
        if (job.getStatus() == JobStatus.OPEN && job.getSalary() > oldSalary) {
            matchingService.generateMatchesForJob(job);
        }
        return pricingOf(job);
    }

    public List<JobPriceChange> priceHistory(EmployerAccount employer, Long jobId) {
        requireEmployerJob(employer, jobId);
        return priceChangeRepository.findByJobIdOrderByChangedAtDesc(jobId);
    }

    // ================================================================= demand advice

    public JobDemandDto demandFor(EmployerAccount employer, Long jobId) {
        return demandService.assess(requireEmployerJob(employer, jobId));
    }

    /** Every open job of this employer that currently needs their attention. */
    public List<JobDemandDto> demandAlerts(EmployerAccount employer) {
        List<JobDemandDto> out = new ArrayList<>();
        for (JobPost job : jobRepository.findByEmployerAndStatusOrderByPostedAtDesc(employer, JobStatus.OPEN)) {
            JobDemandDto read = demandService.assess(job);
            if (read.verdict() == DemandVerdict.SLOW || read.verdict() == DemandVerdict.STALLED) {
                out.add(read);
            }
        }
        return out;
    }

    public JobPricingDto jobPricing(EmployerAccount employer, Long jobId) {
        return pricingOf(requireEmployerJob(employer, jobId));
    }

    /** The commission table as plain rows, for showing the employer the rule itself. */
    public List<java.util.Map<String, Object>> slabTable() {
        List<java.util.Map<String, Object>> rows = new ArrayList<>();
        double[] probes = {100, 800, 2500, 7000, 25000};
        for (double probe : probes) {
            java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("label", pricingService.slabLabel(probe));
            row.put("percent", pricingService.feePercent(probe));
            rows.add(row);
        }
        return rows;
    }
}
