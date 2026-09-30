package com.skillbridge.service;

import com.skillbridge.dto.*;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import com.skillbridge.service.payment.EscrowService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Owns the application lifecycle and the offers that hang off it. Every status change goes
 * through {@link #transition}, which is the single place that enforces the transition table and
 * the single place that can release a wallet payment - and it does that at most once per
 * application, which is what fixed the old double-pay on a repeated ACCEPTED.
 */
@Service
public class ApplicationService {

    private static final String[] STAGE_KEYS = {"APPLIED", "VIEWED", "SHORTLISTED", "INTERVIEW", "DECISION"};
    private static final String[] STAGE_LABELS = {"Applied", "Viewed", "Shortlisted", "Interview", "Final Decision"};

    private final JobApplicationRepository applicationRepository;
    private final JobOfferRepository offerRepository;
    private final JobPostRepository jobRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final MatchRepository matchRepository;
    private final JobCardAssembler assembler;
    private final NotificationService notificationService;
    private final WalletService walletService;
    private final EscrowService escrowService;
    private final MatchingService matchingService;
    private final AccountDirectory accountDirectory;
    private final EmploymentService employmentService;

    public ApplicationService(JobApplicationRepository applicationRepository, JobOfferRepository offerRepository,
                              JobPostRepository jobRepository, WorkerProfileRepository workerProfileRepository,
                              MatchRepository matchRepository, JobCardAssembler assembler,
                              NotificationService notificationService, WalletService walletService,
                              EscrowService escrowService,
                              MatchingService matchingService, AccountDirectory accountDirectory,
                              EmploymentService employmentService) {
        this.applicationRepository = applicationRepository;
        this.offerRepository = offerRepository;
        this.jobRepository = jobRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.matchRepository = matchRepository;
        this.assembler = assembler;
        this.notificationService = notificationService;
        this.walletService = walletService;
        this.escrowService = escrowService;
        this.matchingService = matchingService;
        this.accountDirectory = accountDirectory;
        this.employmentService = employmentService;
    }

    // ------------------------------------------------------------------ worker side

    @Transactional
    public ApplicationDetailDto apply(WorkerAccount worker, Long jobId, String coverMessage) {
        WorkerProfile profile = workerProfileRepository.findByAccountId(worker.getId())
                .orElseThrow(() -> ApiException.badRequest("Complete your worker profile before applying"));
        if (!profile.isProfileCompleted()) {
            throw ApiException.badRequest(
                    "Complete your worker profile (skills, job title, location) before applying");
        }
        JobPost job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("Job not found"));
        if (job.getStatus() != JobStatus.OPEN) {
            throw ApiException.badRequest("This job is no longer open");
        }
        if (applicationRepository.findByWorkerIdAndJobId(worker.getId(), jobId).isPresent()) {
            throw ApiException.conflict("You have already applied to this job");
        }

        JobApplication application = applicationRepository.save(JobApplication.builder()
                .worker(worker)
                .job(job)
                .coverMessage(coverMessage)
                .status(ApplicationStatus.APPLIED)
                .build());
        job.setApplicantsCount(job.getApplicantsCount() + 1);
        jobRepository.save(job);

        matchingService.evaluateAndSave(profile, job);
        notificationService.notify(job.getEmployer(), "New application for " + job.getTitle(),
                worker.getName() + " applied for \"" + job.getTitle() + "\"",
                NotificationType.APPLICATION, "/employer/applications");
        return detail(worker, application);
    }

    public List<ApplicationCardDto> listForWorker(WorkerAccount worker) {
        JobCardAssembler.CardContext context = contextFor(worker);
        return applicationRepository.findByWorkerOrderByAppliedAtDesc(worker).stream()
                .map(a -> new ApplicationCardDto(a.getId(), a.getStatus(), a.getAppliedAt(),
                        assembler.cardFor(a, context),
                        !a.getStatus().isTerminal(),
                        offerRepository.findByApplicationId(a.getId()).isPresent()))
                .toList();
    }

    public ApplicationDetailDto detailFor(WorkerAccount worker, Long applicationId) {
        return detail(worker, requireWorkerApplication(worker, applicationId));
    }

    @Transactional
    public ApplicationDetailDto withdraw(WorkerAccount worker, Long applicationId) {
        JobApplication application = requireWorkerApplication(worker, applicationId);
        // An explicit withdraw on a finished application is a mistake worth reporting, even
        // though re-issuing the same status through transition() is a silent no-op.
        if (application.getStatus().isTerminal()) {
            throw ApiException.badRequest("This application is already "
                    + application.getStatus().name().toLowerCase() + " and cannot be withdrawn");
        }
        transition(application, ApplicationStatus.WITHDRAWN);
        return detail(worker, application);
    }

    // ------------------------------------------------------------------ offers

    public List<OfferDto> offersForWorker(WorkerAccount worker) {
        return offerRepository.findByWorkerId(worker.getId()).stream().map(this::toOfferDto).toList();
    }

    public OfferDto offerForWorker(WorkerAccount worker, Long offerId) {
        return toOfferDto(requireWorkerOffer(worker, offerId));
    }

    @Transactional
    public OfferDto acceptOffer(WorkerAccount worker, Long offerId) {
        JobOffer offer = requireWorkerOffer(worker, offerId);
        if (!offer.getStatus().isOpen()) {
            throw ApiException.badRequest("This offer has already been "
                    + offer.getStatus().name().toLowerCase());
        }
        offer.setStatus(OfferStatus.ACCEPTED);
        offer.setRespondedAt(LocalDateTime.now());
        offerRepository.save(offer);
        transition(offer.getApplication(), ApplicationStatus.ACCEPTED);
        // Same transaction: accepting an offer is what brings the employment record into being.
        Employment employment = employmentService.createFromAcceptedOffer(offer);
        // ...and what ring-fences the money. Idempotent per employment, so the double-accept
        // that the isOpen() check above already rejects could not reserve twice even if it
        // slipped through. If neither the job's escrow nor the employer's wallet covers it,
        // this throws 400 telling the employer to fund the job - and the whole acceptance
        // rolls back, rather than leaving an employment with no money behind it.
        escrowService.reserve(employment, "WORKER", worker.getId());
        notificationService.notify(offer.getApplication().getJob().getEmployer(), "Offer accepted",
                worker.getName() + " accepted your offer for \""
                        + offer.getApplication().getJob().getTitle() + "\"",
                NotificationType.APPLICATION, "/employer/applications");
        return toOfferDto(offer);
    }

    @Transactional
    public OfferDto declineOffer(WorkerAccount worker, Long offerId) {
        JobOffer offer = requireWorkerOffer(worker, offerId);
        if (!offer.getStatus().isOpen()) {
            throw ApiException.badRequest("This offer has already been "
                    + offer.getStatus().name().toLowerCase());
        }
        offer.setStatus(OfferStatus.DECLINED);
        offer.setRespondedAt(LocalDateTime.now());
        offerRepository.save(offer);
        // A worker-initiated end to the application is a withdrawal, not an employer rejection.
        transition(offer.getApplication(), ApplicationStatus.WITHDRAWN);
        notificationService.notify(offer.getApplication().getJob().getEmployer(), "Offer declined",
                worker.getName() + " declined your offer for \""
                        + offer.getApplication().getJob().getTitle() + "\"",
                NotificationType.APPLICATION, "/employer/applications");
        return toOfferDto(offer);
    }

    // ------------------------------------------------------------------ employer side

    @Transactional
    public ApplicationDto updateStatus(EmployerAccount employer, Long applicationId, ApplicationStatus status) {
        return updateStatus(employer, applicationId, status, null, true);
    }

    /**
     * The employer decision endpoint. {@code message} is the note the decision screen lets the
     * employer attach; {@code notify} (default true) decides whether the worker hears about it.
     */
    @Transactional
    public ApplicationDto updateStatus(EmployerAccount employer, Long applicationId,
                                       ApplicationStatus status, String message, boolean notify) {
        JobApplication application = requireEmployerApplication(employer, applicationId);
        if (status == ApplicationStatus.WITHDRAWN) {
            throw ApiException.badRequest("Only the worker can withdraw an application");
        }
        ApplicationStatus before = application.getStatus();
        transition(application, status, notify);
        if (notify && message != null && !message.isBlank() && before != status) {
            notificationService.notify(application.getWorker(),
                    "Message from " + employerName(employer), message,
                    NotificationType.APPLICATION, "/worker/applications");
        }
        return ApplicationDto.from(application, matchScore(application));
    }

    /**
     * Bulk shortlist / reject from the applicants screen. Applications whose current status has
     * no legal path to {@code status} are skipped rather than failing the whole batch, so the
     * count that comes back is the number that actually moved.
     */
    @Transactional
    public int bulkUpdateStatus(EmployerAccount employer, List<Long> applicationIds,
                                ApplicationStatus status, String message) {
        if (applicationIds == null || applicationIds.isEmpty()) {
            throw ApiException.badRequest("Select at least one applicant");
        }
        if (status == ApplicationStatus.WITHDRAWN) {
            throw ApiException.badRequest("Only the worker can withdraw an application");
        }
        int updated = 0;
        for (Long id : applicationIds) {
            JobApplication application = requireEmployerApplication(employer, id);
            if (application.getStatus() == status || !application.getStatus().canTransitionTo(status)) {
                continue;
            }
            transition(application, status, true);
            if (message != null && !message.isBlank()) {
                notificationService.notify(application.getWorker(),
                        "Message from " + employerName(employer), message,
                        NotificationType.APPLICATION, "/worker/applications");
            }
            updated++;
        }
        return updated;
    }

    private String employerName(EmployerAccount employer) {
        return accountDirectory.displayNameOf(AccountType.EMPLOYER, employer.getId());
    }

    public List<ApplicationDto> applicationsForEmployer(EmployerAccount employer) {
        return applicationRepository.findByJobEmployerOrderByAppliedAtDesc(employer).stream()
                .map(a -> ApplicationDto.from(a, matchScore(a))).toList();
    }

    public List<ApplicationDto> applicantsForJob(EmployerAccount employer, Long jobId) {
        JobPost job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("Job not found"));
        if (!job.getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("This is not your job");
        }
        return applicationRepository.findByJobOrderByAppliedAtDesc(job).stream()
                .map(a -> ApplicationDto.from(a, matchScore(a))).toList();
    }

    // ------------------------------------------------------------------ lifecycle core

    /**
     * The one door every status change walks through. Re-issuing the current status is a no-op;
     * anything outside the transition table is a 400; ACCEPTED releases the payment once.
     */
    @Transactional
    public JobApplication transition(JobApplication application, ApplicationStatus next) {
        return transition(application, next, true);
    }

    @Transactional
    public JobApplication transition(JobApplication application, ApplicationStatus next, boolean notify) {
        if (next == null) {
            throw ApiException.badRequest("A status is required");
        }
        ApplicationStatus current = application.getStatus();
        if (current == next) {
            return application; // idempotent - this is what stops the double payment
        }
        if (!current.canTransitionTo(next)) {
            throw ApiException.badRequest(current.isTerminal()
                    ? "This application is already " + current.name().toLowerCase() + " and cannot change"
                    : "Cannot move an application from " + current + " to " + next);
        }

        LocalDateTime now = LocalDateTime.now();
        stamp(application, next, now);
        application.setStatus(next);

        if (next == ApplicationStatus.ACCEPTED && !application.isPaymentSettled()) {
            JobPost job = application.getJob();
            // BEHAVIOUR CHANGE: this used to call walletService.payForJob and move the whole
            // wage from the employer to the worker on the spot. Under escrow, accepting is a
            // RESERVATION, not a payment - and it is made in acceptOffer(), where the
            // employment row that the reservation is keyed on already exists. The flag below
            // keeps its old meaning of "the money side of this acceptance has been handled
            // once", which is what stops the seat count decrementing twice.
            application.setPaymentSettled(true);

            job.setWorkersNeeded(Math.max(0, job.getWorkersNeeded() - 1));
            if (job.getWorkersNeeded() == 0) {
                job.setStatus(JobStatus.FILLED);
            }
            jobRepository.save(job);
        }
        applicationRepository.save(application);

        if (notify && next != ApplicationStatus.WITHDRAWN) {
            notificationService.notify(application.getWorker(),
                    "Application " + next.name().toLowerCase().replace("_", " "),
                    "Your application for \"" + application.getJob().getTitle() + "\" is now "
                            + next.name().toLowerCase().replace("_", " "),
                    NotificationType.APPLICATION, "/worker/applications");
        }
        return application;
    }

    /** Backfills the stages the application must have passed through to reach {@code next}. */
    private void stamp(JobApplication a, ApplicationStatus next, LocalDateTime now) {
        switch (next) {
            case VIEWED -> {
                if (a.getViewedAt() == null) a.setViewedAt(now);
            }
            case SHORTLISTED -> {
                if (a.getViewedAt() == null) a.setViewedAt(now);
                if (a.getShortlistedAt() == null) a.setShortlistedAt(now);
            }
            case INTERVIEW_SCHEDULED -> {
                if (a.getViewedAt() == null) a.setViewedAt(now);
                if (a.getShortlistedAt() == null) a.setShortlistedAt(now);
                if (a.getInterviewAt() == null) a.setInterviewAt(now);
            }
            case OFFERED -> {
                // Deliberately does NOT stamp the interview stage - an offer may skip it.
                if (a.getViewedAt() == null) a.setViewedAt(now);
                if (a.getShortlistedAt() == null) a.setShortlistedAt(now);
            }
            case ACCEPTED, REJECTED, WITHDRAWN -> a.setDecisionAt(now);
            case APPLIED -> { /* the row is born here */ }
        }
    }

    // ------------------------------------------------------------------ assembly

    public ApplicationDetailDto detail(WorkerAccount worker, JobApplication a) {
        JobCardAssembler.CardContext context = contextFor(worker);
        return new ApplicationDetailDto(
                a.getId(), a.getStatus(), a.getAppliedAt(),
                assembler.cardFor(a, context),
                timeline(a),
                !a.getStatus().isTerminal(),
                offerRepository.findByApplicationId(a.getId()).map(this::toOfferDto).orElse(null));
    }

    /** Five fixed stages. A stage is DONE once it has a timestamp; exactly one may be CURRENT. */
    public List<TimelineEntryDto> timeline(JobApplication a) {
        LocalDateTime[] stamps = {
                a.getAppliedAt(), a.getViewedAt(), a.getShortlistedAt(), a.getInterviewAt(), a.getDecisionAt()
        };
        int currentStage = switch (a.getStatus()) {
            case APPLIED -> 1;
            case VIEWED -> 2;
            case SHORTLISTED -> 3;
            case INTERVIEW_SCHEDULED, OFFERED -> 4;
            case ACCEPTED, REJECTED, WITHDRAWN -> -1;
        };

        List<TimelineEntryDto> entries = new ArrayList<>(STAGE_KEYS.length);
        for (int i = 0; i < STAGE_KEYS.length; i++) {
            String state = stamps[i] != null ? "DONE" : (i == currentStage ? "CURRENT" : "PENDING");
            entries.add(new TimelineEntryDto(STAGE_KEYS[i], STAGE_LABELS[i], stamps[i],
                    note(i, state, a.getStatus()), state));
        }
        return entries;
    }

    private String note(int stage, String state, ApplicationStatus status) {
        boolean done = "DONE".equals(state);
        return switch (stage) {
            case 0 -> "Your application has been submitted.";
            case 1 -> done ? "The employer viewed your profile."
                    : "Waiting for employer to view your profile.";
            case 2 -> done ? "You have been shortlisted for this role."
                    : "You will be notified if shortlisted.";
            case 3 -> done ? "Your interview has been scheduled."
                    : "You will be notified about interview schedule.";
            default -> {
                if (done) {
                    yield switch (status) {
                        case ACCEPTED -> "You accepted the offer for this role.";
                        case REJECTED -> "The employer did not move ahead with your application.";
                        case WITHDRAWN -> "You withdrew from this application.";
                        default -> "A final decision has been made.";
                    };
                }
                yield status == ApplicationStatus.OFFERED
                        ? "You have an offer waiting for your response."
                        : "You will be notified about the final decision.";
            }
        };
    }

    public OfferDto toOfferDto(JobOffer offer) {
        Long employerId = offer.getApplication().getJob().getEmployer().getId();
        return OfferDto.from(offer, accountDirectory.displayNameOf(AccountType.EMPLOYER, employerId));
    }

    // ------------------------------------------------------------------ helpers

    private JobCardAssembler.CardContext contextFor(WorkerAccount worker) {
        return assembler.contextFor(worker,
                workerProfileRepository.findByAccountId(worker.getId()).orElse(null));
    }

    private Double matchScore(JobApplication a) {
        return matchRepository.findByWorkerAndJob(a.getWorker(), a.getJob())
                .map(Match::getScore).orElse(null);
    }

    private JobApplication requireWorkerApplication(WorkerAccount worker, Long applicationId) {
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("Application not found"));
        if (!application.getWorker().getId().equals(worker.getId())) {
            throw ApiException.forbidden("This is not your application");
        }
        return application;
    }

    private JobApplication requireEmployerApplication(EmployerAccount employer, Long applicationId) {
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("Application not found"));
        if (!application.getJob().getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("This is not your job");
        }
        return application;
    }

    private JobOffer requireWorkerOffer(WorkerAccount worker, Long offerId) {
        JobOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> ApiException.notFound("Offer not found"));
        if (!offer.getApplication().getWorker().getId().equals(worker.getId())) {
            throw ApiException.forbidden("This is not your offer");
        }
        return offer;
    }

    private String workLocation(JobPost job) {
        if (job.getArea() != null && !job.getArea().isBlank()) {
            return job.getArea() + ", " + job.getCity();
        }
        return job.getCity();
    }
}
