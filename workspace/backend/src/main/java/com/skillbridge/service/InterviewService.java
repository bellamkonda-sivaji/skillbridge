package com.skillbridge.service;

import com.skillbridge.dto.InterviewDetailDto;
import com.skillbridge.dto.InterviewDto;
import com.skillbridge.dto.InterviewRequest;
import com.skillbridge.dto.ScheduleInterviewRequest;
import com.skillbridge.dto.SendMessageRequest;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.ConversationRepository;
import com.skillbridge.repository.EmployerProfileRepository;
import com.skillbridge.repository.InterviewRepository;
import com.skillbridge.repository.JobApplicationRepository;
import com.skillbridge.repository.JobPostRepository;
import com.skillbridge.repository.WorkerAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final WorkerAccountRepository workerRepository;
    private final JobPostRepository jobRepository;
    private final ConversationRepository conversationRepository;
    private final ChatService chatService;
    private final NotificationService notificationService;
    private final JobApplicationRepository applicationRepository;
    private final ApplicationService applicationService;
    private final EmployerProfileRepository employerProfileRepository;

    public InterviewService(InterviewRepository interviewRepository, WorkerAccountRepository workerRepository,
                            JobPostRepository jobRepository, ConversationRepository conversationRepository,
                            ChatService chatService, NotificationService notificationService,
                            JobApplicationRepository applicationRepository,
                            ApplicationService applicationService,
                            EmployerProfileRepository employerProfileRepository) {
        this.interviewRepository = interviewRepository;
        this.workerRepository = workerRepository;
        this.jobRepository = jobRepository;
        this.conversationRepository = conversationRepository;
        this.chatService = chatService;
        this.notificationService = notificationService;
        this.applicationRepository = applicationRepository;
        this.applicationService = applicationService;
        this.employerProfileRepository = employerProfileRepository;
    }

    /**
     * The employer scheduling screen: a date and a time on two separate controls, and an
     * optional "send the details to the worker" tick. Scheduling also walks the matching
     * application to INTERVIEW_SCHEDULED so both sides agree on where the candidate stands.
     */
    @Transactional
    public InterviewDto schedule(EmployerAccount employer, ScheduleInterviewRequest request) {
        if (request.workerId() == null || request.date() == null || request.time() == null
                || request.mode() == null) {
            throw ApiException.badRequest("Worker, date, time and interview mode are required");
        }
        WorkerAccount worker = workerRepository.findById(request.workerId())
                .orElseThrow(() -> ApiException.notFound("Worker not found"));
        JobPost job = request.jobId() != null
                ? jobRepository.findById(request.jobId())
                        .orElseThrow(() -> ApiException.notFound("Job not found"))
                : null;
        if (job != null && !job.getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("This is not your job");
        }
        boolean sendDetails = request.sendDetails() == null || request.sendDetails();
        LocalDateTime scheduledAt = LocalDateTime.of(request.date(), request.time());

        Conversation conversation = chatService.getOrCreateConversation(worker, employer, job);
        Interview interview = interviewRepository.save(Interview.builder()
                .employer(employer)
                .worker(worker)
                .job(job)
                .conversation(conversation)
                .scheduledAt(scheduledAt)
                .durationMinutes(request.durationMinutes() != null && request.durationMinutes() > 0
                        ? request.durationMinutes() : 30)
                .mode(request.mode())
                .location(request.location())
                .notes(request.notes())
                .status(InterviewStatus.PENDING)
                .build());

        if (job != null) {
            moveApplicationToInterview(worker, job);
        }
        if (sendDetails) {
            chatService.sendMessage(employer, new SendMessageRequest(conversation.getId(), null, null,
                    "Interview invitation: " + request.mode().name().replace("_", " ")
                            + (request.location() != null && !request.location().isBlank()
                                    ? " at " + request.location() : "")
                            + " on " + scheduledAt.toString().replace("T", " ")
                            + (request.notes() != null && !request.notes().isBlank()
                                    ? ". " + request.notes() : "")));
            notificationService.notify(worker, "Interview invitation",
                    employer.getName() + " invited you to an interview"
                            + (job != null ? " for \"" + job.getTitle() + "\"" : ""),
                    NotificationType.INTERVIEW, "/worker/interviews");
        }
        return InterviewDto.from(interview);
    }

    /** Walks the worker's application for this job up to INTERVIEW_SCHEDULED where that is legal. */
    private void moveApplicationToInterview(WorkerAccount worker, JobPost job) {
        applicationRepository.findByWorkerIdAndJobId(worker.getId(), job.getId()).ifPresent(application -> {
            ApplicationStatus status = application.getStatus();
            if (status == ApplicationStatus.INTERVIEW_SCHEDULED || status.isTerminal()
                    || status == ApplicationStatus.OFFERED) {
                return;
            }
            if (status == ApplicationStatus.APPLIED || status == ApplicationStatus.VIEWED) {
                applicationService.transition(application, ApplicationStatus.SHORTLISTED, false);
            }
            applicationService.transition(application, ApplicationStatus.INTERVIEW_SCHEDULED, true);
        });
    }

    /** The calendar range query. Both bounds are optional; absent means "no bound". */
    public List<InterviewDto> interviewsForEmployer(EmployerAccount employer, LocalDate from, LocalDate to) {
        LocalDateTime start = from != null ? from.atStartOfDay() : LocalDate.of(1970, 1, 1).atStartOfDay();
        LocalDateTime end = to != null ? to.atTime(LocalTime.MAX) : LocalDate.of(2999, 12, 31).atTime(LocalTime.MAX);
        return interviewRepository
                .findByEmployerAndScheduledAtBetweenOrderByScheduledAtAsc(employer, start, end).stream()
                .map(InterviewDto::from).toList();
    }

    @Transactional
    public InterviewDto cancel(EmployerAccount employer, Long interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> ApiException.notFound("Interview not found"));
        if (!interview.getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("This is not your interview");
        }
        if (interview.getStatus() == InterviewStatus.COMPLETED) {
            throw ApiException.badRequest("A completed interview cannot be cancelled");
        }
        interview.setStatus(InterviewStatus.CANCELLED);
        interviewRepository.save(interview);
        notificationService.notify(interview.getWorker(), "Interview cancelled",
                interview.getEmployer().getName() + " cancelled the interview"
                        + (interview.getJob() != null ? " for \"" + interview.getJob().getTitle() + "\"" : ""),
                NotificationType.INTERVIEW, "/worker/interviews");
        return InterviewDto.from(interview);
    }

    @Transactional
    public InterviewDto schedule(EmployerAccount employer, InterviewRequest request) {
        if (request.workerId() == null || request.scheduledAt() == null || request.mode() == null) {
            throw ApiException.badRequest("Worker, scheduled time and mode are required");
        }
        WorkerAccount worker = workerRepository.findById(request.workerId())
                .orElseThrow(() -> ApiException.notFound("Worker not found"));
        JobPost job = request.jobId() != null
                ? jobRepository.findById(request.jobId()).orElse(null) : null;
        if (job != null && !job.getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("This is not your job");
        }
        Conversation conversation = request.conversationId() != null
                ? conversationRepository.findById(request.conversationId()).orElse(null)
                : null;
        if (conversation == null) {
            conversation = chatService.getOrCreateConversation(worker, employer, job);
        }

        Interview interview = interviewRepository.save(Interview.builder()
                .employer(employer)
                .worker(worker)
                .job(job)
                .conversation(conversation)
                .scheduledAt(request.scheduledAt())
                .mode(request.mode())
                .location(request.location())
                .notes(request.notes())
                .status(InterviewStatus.PENDING)
                .build());

        chatService.sendMessage(employer,
                new SendMessageRequest(conversation.getId(), null, null,
                        "Interview invitation: " + request.mode().name().replace("_", " ")
                                + (request.location() != null ? " at " + request.location() : "")
                                + " on " + request.scheduledAt().toString().replace("T", " ")
                                + (request.notes() != null ? ". " + request.notes() : "")));
        notificationService.notify(worker, "Interview invitation",
                employer.getName() + " invited you to an interview"
                        + (job != null ? " for \"" + job.getTitle() + "\"" : ""),
                NotificationType.INTERVIEW, "/worker/interviews");
        return InterviewDto.from(interview);
    }

    @Transactional
    public InterviewDto respond(Account account, Long interviewId, InterviewStatus status) {
        if (status != InterviewStatus.CONFIRMED && status != InterviewStatus.CANCELLED) {
            throw ApiException.badRequest("You can only confirm or cancel an interview");
        }
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> ApiException.notFound("Interview not found"));
        if (!isParty(interview, account)) {
            throw ApiException.forbidden("Not your interview");
        }
        if (interview.getStatus() == InterviewStatus.COMPLETED) {
            throw ApiException.badRequest("Interview already completed");
        }
        interview.setStatus(status);
        interviewRepository.save(interview);

        Account other = account.accountType() == AccountType.WORKER
                ? interview.getEmployer() : interview.getWorker();
        notificationService.notify(other, "Interview " + status.name().toLowerCase(),
                account.getName() + " " + status.name().toLowerCase()
                        + " the interview for \""
                        + (interview.getJob() != null ? interview.getJob().getTitle() : "the position") + "\"",
                NotificationType.INTERVIEW,
                other.accountType() == AccountType.WORKER ? "/worker/interviews" : "/employer/interviews");
        return InterviewDto.from(interview);
    }

    @Transactional
    public InterviewDto complete(EmployerAccount employer, Long interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> ApiException.notFound("Interview not found"));
        if (!interview.getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("Only the employer can mark an interview complete");
        }
        interview.setStatus(InterviewStatus.COMPLETED);
        interviewRepository.save(interview);
        notificationService.notify(interview.getWorker(), "Interview completed",
                "Your interview with " + interview.getEmployer().getName() + " was completed",
                NotificationType.INTERVIEW, "/worker/interviews");
        return InterviewDto.from(interview);
    }

    public List<InterviewDto> interviewsForEmployer(EmployerAccount employer) {
        return interviewRepository.findByEmployerOrderByScheduledAtDesc(employer).stream()
                .map(InterviewDto::from).toList();
    }

    public List<InterviewDto> interviewsForWorker(WorkerAccount worker) {
        return interviewRepository.findByWorkerOrderByScheduledAtDesc(worker).stream()
                .map(this::toWorkerDto).toList();
    }

    // ---------------------------------------------------------------- worker interview screens

    /** The fixed advice the interview detail screen shows. Served from here so both apps agree. */
    private static final List<String> PREPARATION_TIPS = List.of(
            "Be on time (10 minutes early)",
            "Carry a valid ID proof",
            "Dress neatly and be professional",
            "Be ready to talk about your experience",
            "Ask questions about the job if needed");

    public InterviewDetailDto detailForWorker(WorkerAccount worker, Long interviewId) {
        Interview interview = requireWorkerInterview(worker, interviewId);
        return new InterviewDetailDto(
                interview.getId(),
                interview.getJob() != null ? interview.getJob().getId() : null,
                interview.getJob() != null ? interview.getJob().getTitle() : null,
                businessName(interview.getEmployer()),
                interview.getEmployer().getId(),
                interview.getMode() == null ? null : interview.getMode().canonical(),
                interview.getScheduledAt(),
                InterviewDto.endsAt(interview),
                interview.getDurationMinutes(),
                interview.getLocation(),
                interview.getStatus(),
                InterviewDto.upcoming(interview),
                interview.getInterviewerName(),
                interview.getInterviewerRole(),
                interview.getInterviewerPhone(),
                interview.getAddressLine() != null ? interview.getAddressLine() : interview.getLocation(),
                interview.getLatitude(),
                interview.getLongitude(),
                interview.getNotes(),
                PREPARATION_TIPS,
                InterviewMode.labelOf(interview.getMode()));
    }

    /** The worker asks for another slot: the interview drops back to PENDING and the employer hears about it. */
    @Transactional
    public InterviewDto rescheduleByWorker(WorkerAccount worker, Long interviewId, String reason) {
        Interview interview = requireWorkerInterview(worker, interviewId);
        if (interview.getStatus() == InterviewStatus.COMPLETED) {
            throw ApiException.badRequest("A completed interview cannot be rescheduled");
        }
        if (interview.getStatus() == InterviewStatus.CANCELLED) {
            throw ApiException.badRequest("A cancelled interview cannot be rescheduled");
        }
        interview.setStatus(InterviewStatus.PENDING);
        interviewRepository.save(interview);
        notificationService.notify(interview.getEmployer(), "Reschedule requested",
                worker.getName() + " asked to reschedule the interview"
                        + (interview.getJob() != null ? " for \"" + interview.getJob().getTitle() + "\"" : "")
                        + (reason != null && !reason.isBlank() ? ": " + reason : ""),
                NotificationType.INTERVIEW, "/employer/interviews");
        return toWorkerDto(interview);
    }

    @Transactional
    public InterviewDto cancelByWorker(WorkerAccount worker, Long interviewId, String reason) {
        Interview interview = requireWorkerInterview(worker, interviewId);
        if (interview.getStatus() == InterviewStatus.COMPLETED) {
            throw ApiException.badRequest("A completed interview cannot be cancelled");
        }
        interview.setStatus(InterviewStatus.CANCELLED);
        interviewRepository.save(interview);
        notificationService.notify(interview.getEmployer(), "Interview cancelled",
                worker.getName() + " cancelled the interview"
                        + (interview.getJob() != null ? " for \"" + interview.getJob().getTitle() + "\"" : "")
                        + (reason != null && !reason.isBlank() ? ": " + reason : ""),
                NotificationType.INTERVIEW, "/employer/interviews");
        return toWorkerDto(interview);
    }

    private Interview requireWorkerInterview(WorkerAccount worker, Long interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> ApiException.notFound("Interview not found"));
        if (!interview.getWorker().getId().equals(worker.getId())) {
            throw ApiException.forbidden("This is not your interview");
        }
        return interview;
    }

    private InterviewDto toWorkerDto(Interview interview) {
        return InterviewDto.from(interview, businessName(interview.getEmployer()));
    }

    private String businessName(EmployerAccount employer) {
        return employerProfileRepository.findByAccountId(employer.getId())
                .map(EmployerProfile::getBusinessName)
                .filter(n -> n != null && !n.isBlank())
                .orElse(employer.getName());
    }

    private boolean isParty(Interview interview, Account account) {
        return switch (account.accountType()) {
            case WORKER -> interview.getWorker().getId().equals(account.getId());
            case EMPLOYER -> interview.getEmployer().getId().equals(account.getId());
            case ADMIN -> true;
        };
    }
}
