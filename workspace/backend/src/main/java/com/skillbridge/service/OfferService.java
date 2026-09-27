package com.skillbridge.service;

import com.skillbridge.dto.ApplicationDto;
import com.skillbridge.dto.InterviewResultDto;
import com.skillbridge.dto.JoiningDto;
import com.skillbridge.dto.JoiningRequest;
import com.skillbridge.dto.JoiningStepDto;
import com.skillbridge.dto.OfferDraftDto;
import com.skillbridge.dto.OfferDto;
import com.skillbridge.dto.OfferRequest;
import com.skillbridge.dto.ScheduleEstimateDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.EmployerProfileRepository;
import com.skillbridge.repository.EmploymentRepository;
import com.skillbridge.repository.InterviewRepository;
import com.skillbridge.repository.JobApplicationRepository;
import com.skillbridge.repository.JobOfferRepository;
import com.skillbridge.repository.JobPostRepository;
import com.skillbridge.repository.WorkerProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * The employer-side offer lifecycle: the interview results screen, the prefilled offer draft,
 * sending and tracking offers, and the joining timeline that follows an accepted one.
 *
 * <p>Two rules run through all of it. Money is never invented - every figure comes from
 * {@link ScheduleCalculator} and the configured platform fee. And the joining timeline never
 * moves money either: the wallet transfer stays exactly where it already was, inside the
 * accept-offer transition, guarded by {@code JobApplication#paymentSettled}.</p>
 */
@Service
public class OfferService {

    private static final DateTimeFormatter CLOCK = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);

    private static final List<String> DAY_KEYS =
            List.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");
    private static final Map<String, String> DAY_LABELS = Map.of(
            "MON", "Mon", "TUE", "Tue", "WED", "Wed", "THU", "Thu",
            "FRI", "Fri", "SAT", "Sat", "SUN", "Sun");

    /** How long a new offer stays open when the joining date does not close it sooner. */
    private static final int OFFER_VALID_DAYS = 7;

    /** The probation a monthly or permanent offer is drafted with. */
    private static final int DEFAULT_PROBATION_MONTHS = 3;

    private final JobOfferRepository offerRepository;
    private final JobApplicationRepository applicationRepository;
    private final JobPostRepository jobRepository;
    private final EmploymentRepository employmentRepository;
    private final InterviewRepository interviewRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final ScheduleCalculator scheduleCalculator;
    private final JobService jobService;
    private final ApplicationService applicationService;
    private final ApplicantCardAssembler cardAssembler;
    private final NotificationService notificationService;
    private final AccountDirectory accountDirectory;

    public OfferService(JobOfferRepository offerRepository,
                        JobApplicationRepository applicationRepository,
                        JobPostRepository jobRepository,
                        EmploymentRepository employmentRepository,
                        InterviewRepository interviewRepository,
                        WorkerProfileRepository workerProfileRepository,
                        EmployerProfileRepository employerProfileRepository,
                        ScheduleCalculator scheduleCalculator,
                        JobService jobService,
                        ApplicationService applicationService,
                        ApplicantCardAssembler cardAssembler,
                        NotificationService notificationService,
                        AccountDirectory accountDirectory) {
        this.offerRepository = offerRepository;
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
        this.employmentRepository = employmentRepository;
        this.interviewRepository = interviewRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.scheduleCalculator = scheduleCalculator;
        this.jobService = jobService;
        this.applicationService = applicationService;
        this.cardAssembler = cardAssembler;
        this.notificationService = notificationService;
        this.accountDirectory = accountDirectory;
    }

    // ================================================================== interview results

    public List<InterviewResultDto> interviewResults(EmployerAccount employer, Long jobId) {
        JobPost job = requireJob(employer, jobId);

        // The latest interview per worker on this job, so the row shows when they were actually seen.
        Map<Long, Interview> latest = new LinkedHashMap<>();
        for (Interview i : interviewRepository.findByJobIdOrderByScheduledAtDesc(jobId)) {
            latest.putIfAbsent(i.getWorker().getId(), i);
        }

        List<InterviewResultDto> rows = new ArrayList<>();
        for (JobApplication a : applicationRepository.findByJobIdOrderByAppliedAtDesc(jobId)) {
            Interview interview = latest.get(a.getWorker().getId());
            // Everyone who has reached (or passed) the interview stage, plus anyone already judged.
            boolean interviewed = interview != null
                    || a.getInterviewAt() != null
                    || a.getInterviewResult() != null;
            if (!interviewed) {
                continue;
            }
            WorkerProfile profile = workerProfileRepository.findByAccountId(a.getWorker().getId()).orElse(null);
            rows.add(new InterviewResultDto(
                    a.getId(),
                    a.getWorker().getId(),
                    a.getWorker().getName(),
                    a.getWorker().getPhotoUrl(),
                    a.getWorker().getAvgRating(),
                    a.getWorker().getRatingCount(),
                    profile == null ? null : cardAssembler.distanceKm(profile, job),
                    a.getAppliedAt(),
                    interview != null ? interview.getScheduledAt() : a.getInterviewAt(),
                    interview != null ? interview.getMode() : null,
                    a.getStatus(),
                    a.getInterviewResult(),
                    a.getInterviewFeedback()));
        }
        return rows;
    }

    @Transactional
    public ApplicationDto setInterviewResult(EmployerAccount employer, Long applicationId,
                                             String rawResult, String feedback) {
        JobApplication application = requireApplication(employer, applicationId);
        InterviewResult result = parseResult(rawResult);

        application.setInterviewResult(result);
        application.setInterviewFeedback(feedback);
        application.setInterviewResultAt(LocalDateTime.now());
        applicationRepository.save(application);

        // Move the application along where the result implies it, but never force an illegal
        // transition - a SELECTED candidate who is already OFFERED simply stays where they are.
        ApplicationStatus target = switch (result) {
            case SHORTLISTED, SELECTED -> ApplicationStatus.SHORTLISTED;
            case REJECTED -> ApplicationStatus.REJECTED;
            case INTERVIEWED, ON_HOLD -> null;
        };
        if (target != null && application.getStatus() != target
                && application.getStatus().canTransitionTo(target)) {
            applicationService.transition(application, target);
        }
        return ApplicationDto.from(application, null);
    }

    // ================================================================== offer draft

    public OfferDraftDto offerDraft(EmployerAccount employer, Long applicationId) {
        JobApplication application = requireApplication(employer, applicationId);
        JobPost job = application.getJob();
        EngagementModel model = modelOf(job);
        boolean shortJob = isShortJob(model);
        ScheduleEstimateDto estimate = scheduleCalculator.estimate(jobService.scheduleInput(job));
        WorkerAccount worker = application.getWorker();

        return new OfferDraftDto(
                application.getId(),
                worker.getId(),
                worker.getName(),
                worker.getPhone(),
                worker.getEmail(),
                job.getId(),
                job.getTitle(),
                model,
                model.offerType(),
                OfferDto.offerLabel(model.offerType()),
                shortJob,
                workLocation(job),
                job.getWorkDate(),
                shortJob && model == EngagementModel.ONE_DAY ? null : job.getStartDate(),
                model == EngagementModel.ONE_DAY ? null : job.getEndDate(),
                workingDaysLabel(job),
                workingTimeLabel(job),
                breakLabel(job),
                shortJob ? null : employmentTypeLabel(job, model),
                job.getSalary(),
                job.getSalaryUnit(),
                model.allowedSalaryUnits(job.getWorkPattern()),
                estimate.scheduledDays(),
                estimate.estimatedWorkerEarnings(),
                estimate.platformFee(),
                estimate.estimatedEmployerTotal(),
                suggestedJoiningDate(job, model),
                shortJob ? null : DEFAULT_PROBATION_MONTHS,
                job.getBenefits());
    }

    // ================================================================== create

    @Transactional
    public OfferDto createOffer(EmployerAccount employer, Long applicationId, OfferRequest request) {
        JobApplication application = requireApplication(employer, applicationId);
        if (offerRepository.findByApplicationId(applicationId).isPresent()) {
            throw ApiException.conflict("An offer already exists for this application");
        }
        JobPost job = application.getJob();
        EngagementModel model = modelOf(job);
        boolean shortJob = isShortJob(model);
        OfferRequest req = request != null ? request
                : new OfferRequest(null, null, null, null, null, null, null, null, null, null);

        validate(req, model, shortJob);

        SalaryUnit unit = req.salaryUnit() != null ? req.salaryUnit() : job.getSalaryUnit();
        if (!model.allowedSalaryUnits(job.getWorkPattern()).contains(unit)) {
            throw ApiException.badRequest("A " + words(model) + " job cannot be paid " + words(unit)
                    + ". Allowed: " + names(model.allowedSalaryUnits(job.getWorkPattern())));
        }

        LocalDate workDate = model == EngagementModel.ONE_DAY
                ? (req.workDate() != null ? req.workDate() : job.getWorkDate())
                : null;
        LocalDate joiningDate = req.joiningDate() != null ? req.joiningDate()
                : (workDate != null ? workDate : suggestedJoiningDate(job, model));

        List<BenefitType> benefits = new ArrayList<>();
        if (req.benefits() != null) {
            for (String raw : req.benefits()) {
                BenefitType parsed = BenefitType.parse(raw);
                if (!benefits.contains(parsed)) benefits.add(parsed);
            }
        } else {
            for (String raw : job.getBenefits()) {
                BenefitType parsed = BenefitType.parse(raw);
                if (!benefits.contains(parsed)) benefits.add(parsed);
            }
        }

        applicationService.transition(application, ApplicationStatus.OFFERED);

        LocalDateTime expiresAt = LocalDateTime.now().plusDays(OFFER_VALID_DAYS);
        LocalDate deadline = workDate != null ? workDate : joiningDate;
        if (deadline != null && deadline.atStartOfDay().isBefore(expiresAt)) {
            expiresAt = deadline.atStartOfDay();
        }

        JobOffer offer = offerRepository.save(JobOffer.builder()
                .application(application)
                .salary(req.salary() != null ? req.salary() : job.getSalary())
                .salaryUnit(unit)
                .employmentType(shortJob
                        ? model.legacyEmploymentType(job.getWorkPattern())
                        : (req.employmentType() != null ? req.employmentType() : job.getEmploymentType()))
                .joiningDate(joiningDate)
                .workDate(workDate)
                .workLocation(req.workLocation() != null ? req.workLocation() : workLocation(job))
                .offerType(model.offerType())
                .probationMonths(shortJob ? null
                        : (req.probationMonths() != null ? req.probationMonths() : DEFAULT_PROBATION_MONTHS))
                .benefits(benefits)
                .message(req.message())
                .status(OfferStatus.PENDING)
                .sentAt(LocalDateTime.now())
                .expiresAt(expiresAt)
                .build());

        if (req.notifyWorker() == null || req.notifyWorker()) {
            notificationService.notify(application.getWorker(), "You received a job offer",
                    "You have " + article(model.offerType()) + " " + OfferDto.offerLabel(model.offerType())
                            + " for \"" + job.getTitle() + "\"",
                    NotificationType.APPLICATION, "/worker/offers");
        }
        return toDto(offer);
    }

    /** Rejects the fields that do not apply to this job's duration, with a plain-language reason. */
    private void validate(OfferRequest req, EngagementModel model, boolean shortJob) {
        if (shortJob) {
            if (req.probationMonths() != null) {
                throw ApiException.badRequest("A " + words(model)
                        + " job has no probation period, so probationMonths cannot be set.");
            }
            if (req.employmentType() != null) {
                throw ApiException.badRequest("A " + words(model)
                        + " job has no employment type, so employmentType cannot be set.");
            }
        }
        if (model != EngagementModel.ONE_DAY && req.workDate() != null) {
            throw ApiException.badRequest("Only a one-day job has a work date; use joiningDate instead.");
        }
        if (model == EngagementModel.ONE_DAY && req.joiningDate() != null && req.workDate() != null
                && !req.joiningDate().equals(req.workDate())) {
            throw ApiException.badRequest("A one-day job is offered for its work date; "
                    + "joiningDate cannot differ from workDate.");
        }
        if (req.salary() != null && req.salary() <= 0) {
            throw ApiException.badRequest("The offered pay must be more than zero.");
        }
        if (req.probationMonths() != null && (req.probationMonths() < 0 || req.probationMonths() > 12)) {
            throw ApiException.badRequest("Probation must be between 0 and 12 months.");
        }
    }

    // ================================================================== read & cancel

    public List<OfferDto> offers(EmployerAccount employer, String status) {
        String filter = status == null || status.isBlank() ? "ALL" : status.trim().toUpperCase(Locale.ENGLISH);
        OfferStatus wanted = null;
        if (!"ALL".equals(filter)) {
            try {
                wanted = OfferStatus.valueOf(filter);
            } catch (IllegalArgumentException ex) {
                throw ApiException.badRequest("Unknown offer status \"" + status + "\"");
            }
        }
        List<OfferDto> rows = new ArrayList<>();
        for (JobOffer offer : offerRepository.findByEmployerId(employer.getId())) {
            OfferStatus current = lapseIfExpired(offer);
            if (wanted == null || current == wanted) {
                rows.add(toDto(offer));
            }
        }
        return rows;
    }

    public OfferDto offer(EmployerAccount employer, Long offerId) {
        JobOffer offer = requireOffer(employer, offerId);
        lapseIfExpired(offer);
        return toDto(offer);
    }

    @Transactional
    public OfferDto cancelOffer(EmployerAccount employer, Long offerId) {
        JobOffer offer = requireOffer(employer, offerId);
        if (!lapseIfExpired(offer).isOpen()) {
            throw ApiException.badRequest("This offer is already "
                    + offer.getStatus().name().toLowerCase(Locale.ENGLISH) + " and cannot be cancelled.");
        }
        offer.setStatus(OfferStatus.CANCELLED);
        offer.setRespondedAt(LocalDateTime.now());
        offerRepository.save(offer);
        // The application drops back to shortlisted so the employer can offer somebody else.
        JobApplication application = offer.getApplication();
        if (application.getStatus() == ApplicationStatus.OFFERED) {
            application.setStatus(ApplicationStatus.SHORTLISTED);
            applicationRepository.save(application);
        }
        notificationService.notify(application.getWorker(), "Offer withdrawn",
                "The offer for \"" + application.getJob().getTitle() + "\" has been withdrawn",
                NotificationType.APPLICATION, "/worker/offers");
        return toDto(offer);
    }

    /** A PENDING/VIEWED offer past its expiry reads - and is stored - as EXPIRED. */
    @Transactional
    public OfferStatus lapseIfExpired(JobOffer offer) {
        if (offer.getStatus().isOpen() && offer.getExpiresAt() != null
                && offer.getExpiresAt().isBefore(LocalDateTime.now())) {
            offer.setStatus(OfferStatus.EXPIRED);
            offerRepository.save(offer);
        }
        return offer.getStatus();
    }

    // ================================================================== joining

    public JoiningDto joining(EmployerAccount employer, Long offerId) {
        JobOffer offer = requireOffer(employer, offerId);
        return joiningDto(offer, employmentRepository.findByOfferId(offerId).orElse(null));
    }

    @Transactional
    public JoiningDto updateJoining(EmployerAccount employer, Long offerId, JoiningRequest request) {
        JobOffer offer = requireOffer(employer, offerId);
        if (offer.getStatus() != OfferStatus.ACCEPTED) {
            throw ApiException.badRequest("Joining details can only be recorded once the worker "
                    + "has accepted the offer.");
        }
        Employment employment = employmentRepository.findByOfferId(offerId)
                .orElseThrow(() -> ApiException.notFound("No employment record for this offer"));
        JobApplication application = offer.getApplication();
        boolean shortJob = isShortJob(modelOf(application.getJob()));
        JoiningRequest req = request != null ? request
                : new JoiningRequest(null, null, null, null, null, null, null, null);

        if (shortJob && (req.employeeId() != null || req.department() != null)) {
            throw ApiException.badRequest("A short engagement has no employee id or department.");
        }

        if (req.actualJoiningDate() != null) employment.setActualJoiningDate(req.actualJoiningDate());
        if (req.reportingTime() != null) employment.setReportingTime(req.reportingTime());
        if (req.employeeId() != null) employment.setEmployeeId(req.employeeId());
        if (req.department() != null) employment.setDepartment(req.department());
        if (req.photoProofUrl() != null) employment.setPhotoProofUrl(req.photoProofUrl());
        if (req.notes() != null) employment.setJoiningNotes(req.notes());
        if (req.documentsVerified() != null) {
            employment.getDocumentsVerified().clear();
            for (DocumentType type : req.documentsVerified()) {
                if (type != null && !employment.getDocumentsVerified().contains(type)) {
                    employment.getDocumentsVerified().add(type);
                }
            }
        }
        if (req.markStep() != null && !req.markStep().isBlank()) {
            markStep(employment, shortJob, req.markStep());
        }
        employmentRepository.save(employment);
        // Deliberately no wallet call: the payment already happened once, when the offer was
        // accepted, and JobApplication#paymentSettled keeps it that way.
        return joiningDto(offer, employment);
    }

    private void markStep(Employment employment, boolean shortJob, String rawStep) {
        JoiningStep step;
        try {
            step = JoiningStep.valueOf(rawStep.trim().toUpperCase(Locale.ENGLISH));
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest("Unknown joining step \"" + rawStep + "\"");
        }
        List<JoiningStep> steps = JoiningStep.stepsFor(shortJob);
        if (!steps.contains(step)) {
            throw ApiException.badRequest("A " + (shortJob ? "short" : "monthly")
                    + " engagement has no \"" + step.name() + "\" step. Steps: " + names(steps));
        }
        LocalDateTime now = LocalDateTime.now();
        switch (step) {
            case HIRED, OFFER_ACCEPTED ->
                    throw ApiException.badRequest("The hire is already recorded; it cannot be marked again.");
            case JOINED -> {
                if (employment.getStartedAt() == null) employment.setStartedAt(now);
                if (employment.getJoiningAcknowledgedAt() == null) {
                    employment.setJoiningAcknowledgedAt(now);
                }
                if (employment.getActualJoiningDate() == null) {
                    employment.setActualJoiningDate(now.toLocalDate());
                }
                employment.setStatus(EmploymentStatus.ACTIVE);
            }
            case WORK_DONE, WORK_IN_PROGRESS -> {
                if (employment.getStartedAt() == null) {
                    throw ApiException.badRequest("Mark the worker as joined first.");
                }
                if (employment.getWorkProgressAt() == null) employment.setWorkProgressAt(now);
                if (step == JoiningStep.WORK_DONE) {
                    if (employment.getEndedAt() == null) employment.setEndedAt(now);
                    employment.setStatus(EmploymentStatus.COMPLETED);
                } else {
                    employment.setStatus(EmploymentStatus.ACTIVE);
                }
            }
            case PAYMENT, COMPLETE -> {
                if (employment.getWorkProgressAt() == null) {
                    throw ApiException.badRequest("Mark the work stage first.");
                }
                if (employment.getSettledAt() == null) employment.setSettledAt(now);
                if (employment.getEndedAt() == null) employment.setEndedAt(now);
                employment.setStatus(EmploymentStatus.COMPLETED);
            }
        }
    }

    private JoiningDto joiningDto(JobOffer offer, Employment employment) {
        JobApplication application = offer.getApplication();
        boolean shortJob = isShortJob(modelOf(application.getJob()));
        List<JoiningStep> steps = JoiningStep.stepsFor(shortJob);

        LocalDateTime acceptedAt = offer.getStatus() == OfferStatus.ACCEPTED ? offer.getRespondedAt() : null;
        LocalDateTime[] stamps = {
                acceptedAt,
                employment == null ? null : employment.getStartedAt(),
                employment == null ? null : employment.getWorkProgressAt(),
                employment == null ? null : employment.getSettledAt()
        };

        List<JoiningStepDto> rows = new ArrayList<>();
        boolean currentTaken = false;
        for (int i = 0; i < steps.size(); i++) {
            String state;
            if (stamps[i] != null) {
                state = "DONE";
            } else if (!currentTaken) {
                state = "CURRENT";
                currentTaken = true;
            } else {
                state = "PENDING";
            }
            rows.add(new JoiningStepDto(steps.get(i).name(), steps.get(i).label(),
                    steps.get(i).note(), stamps[i], state));
        }

        return new JoiningDto(
                offer.getId(),
                application.getId(),
                employment == null ? null : employment.getId(),
                application.getWorker().getName(),
                application.getJob().getTitle(),
                shortJob,
                acceptedAt,
                rows,
                employment == null ? null : employment.getActualJoiningDate(),
                employment == null ? null : employment.getReportingTime(),
                shortJob || employment == null ? null : employment.getEmployeeId(),
                shortJob || employment == null ? null : employment.getDepartment(),
                employment == null ? List.of() : List.copyOf(employment.getDocumentsVerified()),
                employment == null ? null : employment.getPhotoProofUrl(),
                employment == null ? null : employment.getJoiningNotes());
    }

    // ================================================================== assembly

    public OfferDto toDto(JobOffer offer) {
        JobPost job = offer.getApplication().getJob();
        ScheduleCalculator.ScheduleInput base = jobService.scheduleInput(job);
        // Re-price the job's schedule at the offered rate, so the money on the offer is the
        // engine's arithmetic rather than a second implementation of it.
        ScheduleCalculator.ScheduleInput priced = new ScheduleCalculator.ScheduleInput(
                base.engagementModel(),
                offer.getWorkDate() != null ? offer.getWorkDate() : base.workDate(),
                base.startDate(), base.endDate(), base.durationType(), base.workingDays(),
                base.shifts(), base.shiftArrangement(), base.breakPaid(),
                offer.getSalary(),
                offer.getSalaryUnit() != null ? offer.getSalaryUnit() : base.salaryUnit(),
                base.payrollCycle(), base.workPattern(), base.durationMonths(), base.dayTimes());
        ScheduleEstimateDto estimate = scheduleCalculator.estimate(priced);
        String employerName = accountDirectory.displayNameOf(AccountType.EMPLOYER, job.getEmployer().getId());
        return OfferDto.from(offer, employerName, estimate.estimatedWorkerEarnings(),
                estimate.platformFee(), estimate.estimatedEmployerTotal());
    }

    // ================================================================== labels

    /** "Mon – Sat" for a contiguous run, otherwise a comma list. Null when nothing is selected. */
    private String workingDaysLabel(JobPost job) {
        List<String> days = job.getWorkingDays();
        if (days == null || days.isEmpty()) {
            return null;
        }
        List<Integer> indexes = new ArrayList<>();
        for (String d : days) {
            int idx = DAY_KEYS.indexOf(d == null ? "" : d.trim().toUpperCase(Locale.ENGLISH));
            if (idx >= 0 && !indexes.contains(idx)) indexes.add(idx);
        }
        if (indexes.isEmpty()) {
            return null;
        }
        indexes.sort(Integer::compareTo);
        boolean contiguous = indexes.get(indexes.size() - 1) - indexes.get(0) == indexes.size() - 1;
        if (indexes.size() == 1) {
            return DAY_LABELS.get(DAY_KEYS.get(indexes.get(0)));
        }
        if (contiguous) {
            return DAY_LABELS.get(DAY_KEYS.get(indexes.get(0))) + " – "
                    + DAY_LABELS.get(DAY_KEYS.get(indexes.get(indexes.size() - 1)));
        }
        List<String> labels = new ArrayList<>();
        for (int idx : indexes) labels.add(DAY_LABELS.get(DAY_KEYS.get(idx)));
        return String.join(", ", labels);
    }

    /** "09:00 AM – 06:00 PM (1 hour break)". Null when the job has no shift to describe. */
    private String workingTimeLabel(JobPost job) {
        LocalTime start = null;
        LocalTime end = null;
        if (job.getShifts() != null && !job.getShifts().isEmpty()) {
            start = job.getShifts().get(0).getStartTime();
            end = job.getShifts().get(job.getShifts().size() - 1).getEndTime();
        } else if (job.getDayTimes() != null && !job.getDayTimes().isEmpty()) {
            start = job.getDayTimes().get(0).getStartTime();
            end = job.getDayTimes().get(0).getEndTime();
        }
        if (start == null || end == null) {
            return null;
        }
        String label = start.format(CLOCK) + " – " + end.format(CLOCK);
        String breakLabel = breakLabel(job);
        return breakLabel == null ? label : label + " (" + breakLabel + " break)";
    }

    /** "1 hour" / "30 minutes". Null when the shifts carry no break. */
    private String breakLabel(JobPost job) {
        if (job.getShifts() == null || job.getShifts().isEmpty()) {
            return null;
        }
        int minutes = 0;
        for (JobShift s : job.getShifts()) {
            minutes += ScheduleCalculator.breakMinutesOf(new ScheduleCalculator.ShiftWindow(
                    s.getStartTime(), s.getEndTime(), s.getBreakStart(), s.getBreakEnd(),
                    s.getBreakMinutes()));
        }
        if (minutes <= 0) {
            return null;
        }
        if (minutes % 60 == 0) {
            int hours = minutes / 60;
            return hours + (hours == 1 ? " hour" : " hours");
        }
        return minutes + " minutes";
    }

    /** Only meaningful for MONTHS / PERMANENT - short engagements get null from the caller. */
    private String employmentTypeLabel(JobPost job, EngagementModel model) {
        String pattern = switch (job.getWorkPattern() == null ? WorkPattern.FULL_DAY : job.getWorkPattern()) {
            case FULL_DAY -> "Full-time";
            case PART_TIME -> "Part-time";
            case SHIFT_BASED -> "Shift-based";
        };
        if (model == EngagementModel.PERMANENT) {
            return pattern + " (permanent)";
        }
        Integer months = job.getDurationMonths();
        if (months != null) {
            return pattern + " (" + months + (months == 1 ? " month)" : " months)");
        }
        return pattern + " (1+ months)";
    }

    private LocalDate suggestedJoiningDate(JobPost job, EngagementModel model) {
        if (model == EngagementModel.ONE_DAY) {
            return job.getWorkDate();
        }
        LocalDate start = job.getStartDate();
        if (isShortJob(model)) {
            return start;
        }
        LocalDate soonest = LocalDate.now().plusDays(OFFER_VALID_DAYS);
        if (start == null) {
            return soonest;
        }
        return start.isAfter(soonest) ? start : soonest;
    }

    private String workLocation(JobPost job) {
        EmployerProfile profile = employerProfileRepository
                .findByAccountId(job.getEmployer().getId()).orElse(null);
        String business = profile != null && profile.getBusinessName() != null
                && !profile.getBusinessName().isBlank()
                ? profile.getBusinessName() : job.getEmployer().getName();
        List<String> parts = new ArrayList<>();
        if (business != null && !business.isBlank()) parts.add(business);
        if (job.getArea() != null && !job.getArea().isBlank()) parts.add(job.getArea());
        if (job.getCity() != null && !job.getCity().isBlank()) parts.add(job.getCity());
        return String.join(", ", parts);
    }

    // ================================================================== helpers

    public static boolean isShortJob(EngagementModel model) {
        return model == EngagementModel.ONE_DAY
                || model == EngagementModel.FEW_DAYS
                || model == EngagementModel.FEW_WEEKS;
    }

    private static EngagementModel modelOf(JobPost job) {
        return job.getEngagementModel() != null ? job.getEngagementModel() : EngagementModel.MONTHS;
    }

    private static String words(Enum<?> value) {
        return value.name().toLowerCase(Locale.ENGLISH).replace('_', ' ');
    }

    private static String names(List<? extends Enum<?>> values) {
        List<String> out = new ArrayList<>();
        for (Enum<?> v : values) out.add(v.name());
        return String.join(", ", out);
    }

    private static String article(OfferType type) {
        String label = OfferDto.offerLabel(type);
        return "aeiou".indexOf(Character.toLowerCase(label.charAt(0))) >= 0 ? "an" : "a";
    }

    private static InterviewResult parseResult(String raw) {
        if (raw == null || raw.isBlank()) {
            throw ApiException.badRequest("A result is required");
        }
        try {
            return InterviewResult.valueOf(raw.trim().toUpperCase(Locale.ENGLISH));
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest("Unknown interview result \"" + raw + "\". Allowed: "
                    + "INTERVIEWED, SHORTLISTED, SELECTED, ON_HOLD, REJECTED");
        }
    }

    private JobPost requireJob(EmployerAccount employer, Long jobId) {
        JobPost job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("Job not found"));
        if (!job.getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("This is not your job");
        }
        return job;
    }

    private JobApplication requireApplication(EmployerAccount employer, Long applicationId) {
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("Application not found"));
        if (!application.getJob().getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("This is not your applicant");
        }
        return application;
    }

    private JobOffer requireOffer(EmployerAccount employer, Long offerId) {
        Optional<JobOffer> found = offerRepository.findById(offerId);
        JobOffer offer = found.orElseThrow(() -> ApiException.notFound("Offer not found"));
        if (!offer.getApplication().getJob().getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("This is not your offer");
        }
        return offer;
    }
}
