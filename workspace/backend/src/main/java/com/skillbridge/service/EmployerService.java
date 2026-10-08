package com.skillbridge.service;

import com.skillbridge.dto.ApplicantCardDto;
import com.skillbridge.dto.DayTimeDto;
import com.skillbridge.dto.EmployerDashboardDto;
import com.skillbridge.dto.EmployerOnboardingRequest;
import com.skillbridge.dto.EmployerProfileDto;
import com.skillbridge.dto.JobBenefitDto;
import com.skillbridge.dto.JobDetailDto;
import com.skillbridge.dto.JobShiftDto;
import com.skillbridge.dto.JobSummaryDto;
import com.skillbridge.dto.WorkHistoryEntryDto;
import com.skillbridge.dto.WorkerDetailDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.EmployerAccountRepository;
import com.skillbridge.repository.EmployerProfileRepository;
import com.skillbridge.repository.InterviewRepository;
import com.skillbridge.repository.JobApplicationRepository;
import com.skillbridge.repository.JobPostRepository;
import com.skillbridge.repository.WorkerProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Everything behind the employer dashboard: the counters, the job list and detail, the applicant
 * screens, worker discovery and the onboarding wizard's merge update.
 */
@Service
public class EmployerService {

    /** How many recent applications the dashboard carries. */
    private static final int DASHBOARD_RECENT = 6;
    /** How many workers a discovery tab returns. */
    private static final int DISCOVERY_LIMIT = 20;
    /** The radius the NEARBY tab considers "nearby". */
    private static final double NEARBY_RADIUS_KM = 25.0;

    private final JobPostRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final EmployerAccountRepository employerAccountRepository;
    private final ApplicantCardAssembler assembler;
    private final NotificationService notificationService;
    private final ChatService chatService;
    private final WorkerHistoryAssembler historyAssembler;

    public EmployerService(JobPostRepository jobRepository, JobApplicationRepository applicationRepository,
                           InterviewRepository interviewRepository, WorkerProfileRepository workerProfileRepository,
                           EmployerProfileRepository employerProfileRepository,
                           EmployerAccountRepository employerAccountRepository,
                           ApplicantCardAssembler assembler, NotificationService notificationService,
                           ChatService chatService, WorkerHistoryAssembler historyAssembler) {
        this.historyAssembler = historyAssembler;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.interviewRepository = interviewRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.employerAccountRepository = employerAccountRepository;
        this.assembler = assembler;
        this.notificationService = notificationService;
        this.chatService = chatService;
    }

    // ------------------------------------------------------------------ dashboard

    public EmployerDashboardDto dashboard(EmployerAccount employer) {
        EmployerProfile profile = employerProfileRepository.findByAccountId(employer.getId()).orElse(null);

        long activeJobs = jobRepository.countByEmployerAndStatus(employer, JobStatus.OPEN);
        long applications = applicationRepository.countByJobEmployer(employer);
        long hired = applicationRepository.countByJobEmployerAndStatus(employer, ApplicationStatus.ACCEPTED);

        LocalDate today = LocalDate.now();
        LocalDateTime weekStart = today.with(DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime weekEnd = today.with(DayOfWeek.SUNDAY).atTime(LocalTime.MAX);
        long interviewsThisWeek = interviewRepository.countByEmployerAndScheduledAtBetweenAndStatusNot(
                employer, weekStart, weekEnd, InterviewStatus.CANCELLED);

        List<ApplicantCardDto> recent = applicationRepository
                .findByJobEmployerOrderByAppliedAtDesc(employer).stream()
                .limit(DASHBOARD_RECENT)
                .map(this::cardFor)
                .filter(java.util.Objects::nonNull)
                .toList();

        return new EmployerDashboardDto(
                employer.getName(),
                profile != null ? profile.getBusinessName() : employer.getName(),
                activeJobs, applications, interviewsThisWeek, hired, recent);
    }

    // ------------------------------------------------------------------ jobs

    /** {@code status} is the UI filter: ALL | ACTIVE | PAUSED | FILLED | DRAFT. */
    public List<JobSummaryDto> jobs(EmployerAccount employer, String status, String q) {
        List<JobStatus> wanted = statusFilter(status);
        String needle = q == null ? "" : q.trim().toLowerCase();

        return jobRepository.findByEmployerOrderByPostedAtDesc(employer).stream()
                .filter(j -> wanted == null || wanted.contains(j.getStatus()))
                .filter(j -> needle.isEmpty()
                        || (j.getTitle() != null && j.getTitle().toLowerCase().contains(needle))
                        || (j.getCity() != null && j.getCity().toLowerCase().contains(needle))
                        || (j.getArea() != null && j.getArea().toLowerCase().contains(needle)))
                .map(this::summary)
                .toList();
    }

    private List<JobStatus> statusFilter(String status) {
        if (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) {
            return null;
        }
        return switch (status.toUpperCase()) {
            case "ACTIVE", "OPEN" -> List.of(JobStatus.OPEN);
            case "PAUSED" -> List.of(JobStatus.PAUSED);
            case "FILLED" -> List.of(JobStatus.FILLED);
            case "DRAFT" -> List.of(JobStatus.DRAFT);
            case "CLOSED" -> List.of(JobStatus.CLOSED, JobStatus.CANCELLED);
            default -> throw ApiException.badRequest(
                    "Unknown job filter \"" + status + "\". Use ALL, ACTIVE, PAUSED, FILLED or DRAFT.");
        };
    }

    public JobSummaryDto summary(JobPost job) {
        return new JobSummaryDto(
                job.getId(), job.getTitle(), job.getWorkerCategory(), job.getCity(), job.getArea(),
                job.getStatus(), applicationRepository.countByJobId(job.getId()), job.getPostedAt(),
                job.getSalary(), job.getSalaryUnit(), job.getEmploymentType(), job.getWorkersNeeded(),
                applicationRepository.countByJobIdAndStatus(job.getId(), ApplicationStatus.ACCEPTED),
                job.getEngagementModel(), job.getWorkPattern());
    }

    public JobDetailDto jobDetail(EmployerAccount employer, Long jobId) {
        JobPost job = requireJob(employer, jobId);
        long applications = applicationRepository.countByJobId(job.getId());
        long shortlisted = applicationRepository.countByJobIdAndStatus(job.getId(), ApplicationStatus.SHORTLISTED);
        long hired = applicationRepository.countByJobIdAndStatus(job.getId(), ApplicationStatus.ACCEPTED);

        return new JobDetailDto(
                job.getId(), job.getTitle(), job.getWorkerCategory(), job.getCity(), job.getArea(),
                job.getStatus(), applications, job.getPostedAt(), job.getSalary(), job.getSalaryUnit(),
                job.getEmploymentType(), job.getWorkersNeeded(), hired,
                job.getJobViews(), shortlisted, hired, applications,
                job.getDescription(), List.copyOf(job.getRequiredSkills()), job.getWorkType(),
                job.getLatitude(), job.getLongitude(), job.getMinExperienceYears(), job.getLanguage(),
                job.isUrgent(), job.getExpiresAt(),
                job.getShifts().stream().map(JobShiftDto::from).toList(),
                List.copyOf(job.getResponsibilities()), List.copyOf(job.getBenefits()),
                List.copyOf(job.getLanguages()), List.copyOf(job.getWorkingDays()),
                job.getDurationType(), job.getStartDate(), job.getEndDate(), job.getPaymentMode(),
                job.getGenderPreference(), job.getAgeMin(), job.getAgeMax(), job.getInterviewType(),
                job.getApplicationDeadline(), job.isAutoCloseWhenFilled(),
                job.getEngagementModel(),
                job.getWorkDate(),
                job.getShiftArrangement(),
                job.isBreakPaid(),
                job.isOvertimeExpected(),
                job.getOvertimePayBasis(),
                job.getOvertimeRate(),
                job.getPayrollCycle(),
                job.getSalaryDueDayOfMonth(),
                job.getJobBenefits() == null ? List.of()
                        : job.getJobBenefits().stream().map(JobBenefitDto::from).toList(),
                job.getWorkPattern(),
                job.getHiringMethod(),
                job.getDurationMonths(),
                job.getDayTimes() == null ? List.of()
                        : job.getDayTimes().stream().map(d -> new DayTimeDto(
                                d.getDayCode(), d.getStartTime(), d.getEndTime())).toList());
    }

    // ------------------------------------------------------------------ applicants

    /**
     * {@code status} is the applicants tab: ALL | NEW | SHORTLISTED | INTERVIEW | REJECTED.
     * NEW covers both APPLIED and VIEWED, so a candidate the employer has merely opened does
     * not drop out of every tab.
     */
    public List<ApplicantCardDto> applicants(EmployerAccount employer, Long jobId, String status, String sort) {
        JobPost job = requireJob(employer, jobId);
        List<ApplicationStatus> wanted = applicantFilter(status);

        List<ApplicantCardDto> cards = new ArrayList<>(applicationRepository
                .findByJobIdOrderByAppliedAtDesc(job.getId()).stream()
                .filter(a -> wanted == null || wanted.contains(a.getStatus()))
                .map(this::cardFor)
                .filter(java.util.Objects::nonNull)
                .toList());
        return sortCards(cards, sort);
    }

    private List<ApplicationStatus> applicantFilter(String status) {
        if (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) {
            return null;
        }
        return switch (status.toUpperCase()) {
            case "NEW" -> List.of(ApplicationStatus.APPLIED, ApplicationStatus.VIEWED);
            case "SHORTLISTED" -> List.of(ApplicationStatus.SHORTLISTED);
            case "INTERVIEW", "INTERVIEW_SCHEDULED" -> List.of(ApplicationStatus.INTERVIEW_SCHEDULED);
            case "REJECTED" -> List.of(ApplicationStatus.REJECTED);
            case "OFFERED" -> List.of(ApplicationStatus.OFFERED);
            case "HIRED", "ACCEPTED" -> List.of(ApplicationStatus.ACCEPTED);
            default -> throw ApiException.badRequest(
                    "Unknown applicant filter \"" + status + "\". Use ALL, NEW, SHORTLISTED, INTERVIEW or REJECTED.");
        };
    }

    private List<ApplicantCardDto> sortCards(List<ApplicantCardDto> cards, String sort) {
        String key = sort == null || sort.isBlank() ? "MATCH" : sort.toUpperCase();
        Comparator<ApplicantCardDto> comparator = switch (key) {
            case "RECENT" -> Comparator.comparing(ApplicantCardDto::appliedAt,
                    Comparator.nullsLast(Comparator.reverseOrder()));
            case "EXPERIENCE" -> Comparator.comparingInt(ApplicantCardDto::experienceYears).reversed();
            case "MATCH" -> Comparator.comparing(
                    (ApplicantCardDto c) -> c.matchScore() == null ? -1 : c.matchScore()).reversed();
            default -> throw ApiException.badRequest(
                    "Unknown sort \"" + sort + "\". Use MATCH, RECENT or EXPERIENCE.");
        };
        return cards.stream().sorted(comparator).toList();
    }

    /**
     * The shortlist: everyone who has ever been shortlisted for the job and has not since been
     * rejected or withdrawn, so a candidate does not vanish the moment an interview is booked.
     */
    public List<ApplicantCardDto> shortlist(EmployerAccount employer, Long jobId) {
        JobPost job = requireJob(employer, jobId);
        List<ApplicantCardDto> cards = new ArrayList<>(applicationRepository
                .findByJobIdOrderByAppliedAtDesc(job.getId()).stream()
                .filter(a -> a.getShortlistedAt() != null)
                .filter(a -> a.getStatus() != ApplicationStatus.REJECTED
                        && a.getStatus() != ApplicationStatus.WITHDRAWN)
                .map(this::cardFor)
                .filter(java.util.Objects::nonNull)
                .toList());
        return sortCards(cards, "MATCH");
    }

    // ------------------------------------------------------------------ worker discovery

    /** {@code tab} is TOP | NEARBY | AVAILABLE_NOW | SIMILAR. */
    public List<ApplicantCardDto> recommended(EmployerAccount employer, Long jobId, String tab) {
        JobPost job = requireJob(employer, jobId);
        String key = tab == null || tab.isBlank() ? "TOP" : tab.toUpperCase();

        Map<Long, JobApplication> applied = new HashMap<>();
        for (JobApplication a : applicationRepository.findByJobIdOrderByAppliedAtDesc(job.getId())) {
            applied.put(a.getWorker().getId(), a);
        }

        List<WorkerProfile> candidates = workerProfileRepository.findAll().stream()
                .filter(WorkerProfile::isProfileCompleted)
                .toList();

        List<ApplicantCardDto> cards = new ArrayList<>();
        for (WorkerProfile profile : candidates) {
            if (!matchesTab(profile, job, key, employer)) {
                continue;
            }
            cards.add(assembler.card(profile, job, applied.get(profile.getAccount().getId())));
        }

        Comparator<ApplicantCardDto> order = "NEARBY".equals(key)
                ? Comparator.comparing(c -> c.distanceKm() == null ? Double.MAX_VALUE : c.distanceKm())
                : Comparator.comparing((ApplicantCardDto c) -> c.matchScore() == null ? -1 : c.matchScore())
                        .reversed();
        return cards.stream().sorted(order).limit(DISCOVERY_LIMIT).toList();
    }

    private boolean matchesTab(WorkerProfile profile, JobPost job, String tab, EmployerAccount employer) {
        return switch (tab) {
            case "TOP" -> true;
            case "NEARBY" -> {
                Double d = assembler.distanceKm(profile, job);
                yield d != null && d <= NEARBY_RADIUS_KM;
            }
            case "AVAILABLE_NOW" -> profile.getAvailability() == Availability.IMMEDIATE;
            // "Similar" means a real skill overlap with what this posting asks for.
            case "SIMILAR" -> sharesSkill(profile, job);
            default -> throw ApiException.badRequest(
                    "Unknown tab \"" + tab + "\". Use TOP, NEARBY, AVAILABLE_NOW or SIMILAR.");
        };
    }

    private boolean sharesSkill(WorkerProfile profile, JobPost job) {
        if (job.getRequiredSkills() == null || job.getRequiredSkills().isEmpty()) {
            return true;
        }
        Set<String> workerSkills = new HashSet<>();
        for (String s : profile.getSkills()) {
            if (s != null) workerSkills.add(s.trim().toLowerCase());
        }
        for (String required : job.getRequiredSkills()) {
            if (required == null) continue;
            String needle = required.trim().toLowerCase();
            for (String have : workerSkills) {
                if (have.contains(needle) || needle.contains(have)) {
                    return true;
                }
            }
        }
        return false;
    }

    public WorkerDetailDto workerDetail(EmployerAccount employer, Long workerId, Long jobId) {
        WorkerProfile profile = workerProfileRepository.findByAccountId(workerId)
                .orElseThrow(() -> ApiException.notFound("Worker not found"));
        JobPost job = jobId == null ? null : requireJob(employer, jobId);
        JobApplication application = job == null ? null
                : applicationRepository.findByWorkerIdAndJobId(workerId, job.getId()).orElse(null);
        return assembler.detail(profile, job, application);
    }

    /** The full work history - the profile screen only carries the five most recent inline. */
    public List<WorkHistoryEntryDto> workHistory(EmployerAccount employer, Long workerId) {
        workerProfileRepository.findByAccountId(workerId)
                .orElseThrow(() -> ApiException.notFound("Worker not found"));
        return historyAssembler.workHistory(workerId);
    }

    public List<WorkerDetailDto> compare(EmployerAccount employer, List<Long> workerIds, Long jobId) {
        if (workerIds == null || workerIds.isEmpty()) {
            throw ApiException.badRequest("Pick at least one worker to compare");
        }
        return workerIds.stream().distinct().map(id -> workerDetail(employer, id, jobId)).toList();
    }

    @Transactional
    public void invite(EmployerAccount employer, Long jobId, Long workerId, String message) {
        JobPost job = requireJob(employer, jobId);
        WorkerProfile profile = workerProfileRepository.findByAccountId(workerId)
                .orElseThrow(() -> ApiException.notFound("Worker not found"));
        WorkerAccount worker = profile.getAccount();

        Conversation conversation = chatService.getOrCreateConversation(worker, employer, job);
        String body = message != null && !message.isBlank() ? message
                : "We would like you to apply for \"" + job.getTitle() + "\".";
        chatService.sendMessage(employer, new com.skillbridge.dto.SendMessageRequest(
                conversation.getId(), null, null, body));
        notificationService.notify(worker, "You have been invited to apply",
                employer.getName() + " invited you to apply for \"" + job.getTitle() + "\"",
                NotificationType.JOB_MATCH, "/jobs/" + job.getId());
    }

    // ------------------------------------------------------------------ onboarding

    public EmployerProfileDto onboarding(EmployerAccount employer) {
        return EmployerProfileDto.from(profileOf(employer));
    }

    /**
     * Merge update used by the onboarding wizard: a field that is absent from the request body is
     * left exactly as it was, so a later step never wipes an earlier one.
     */
    @Transactional
    public EmployerProfileDto updateOnboarding(EmployerAccount employer, EmployerOnboardingRequest request) {
        EmployerProfile profile = profileOf(employer);
        boolean accountTouched = false;

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String phone = request.getPhone().trim();
            if (!phone.equals(employer.getPhone())) {
                Optional<EmployerAccount> clash = employerAccountRepository.findByPhone(phone);
                if (clash.isPresent() && !clash.get().getId().equals(employer.getId())) {
                    throw ApiException.conflict("An employer account with this mobile number already exists");
                }
                employer.setPhone(phone);
                accountTouched = true;
            }
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String email = request.getEmail().trim().toLowerCase();
            if (!email.equalsIgnoreCase(employer.getEmail() == null ? "" : employer.getEmail())) {
                Optional<EmployerAccount> clash = employerAccountRepository.findByEmail(email);
                if (clash.isPresent() && !clash.get().getId().equals(employer.getId())) {
                    throw ApiException.conflict("An employer account with this email already exists");
                }
                employer.setEmail(email);
                accountTouched = true;
            }
        }
        if (request.getLogoUrl() != null) {
            employer.setPhotoUrl(request.getLogoUrl());
            accountTouched = true;
        }
        if (accountTouched) {
            employerAccountRepository.save(employer);
        }

        if (request.getEmployerKind() != null) profile.setEmployerKind(request.getEmployerKind());
        if (request.getBusinessName() != null && !request.getBusinessName().isBlank()) {
            profile.setBusinessName(request.getBusinessName().trim());
        }
        if (request.getBusinessType() != null) profile.setBusinessType(request.getBusinessType());
        if (request.getBusinessSize() != null) profile.setBusinessSize(request.getBusinessSize());
        if (request.getDescription() != null) profile.setDescription(request.getDescription());
        if (request.getWebsite() != null) profile.setWebsite(request.getWebsite());
        if (request.getAddress() != null) profile.setAddress(request.getAddress());
        if (request.getPincode() != null) profile.setPincode(request.getPincode());
        if (request.getCity() != null) profile.setCity(request.getCity());
        if (request.getArea() != null) profile.setArea(request.getArea());
        if (request.getLatitude() != null) profile.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) profile.setLongitude(request.getLongitude());
        if (profile.getLatitude() != 0.0 && profile.getLongitude() != 0.0) {
            profile.setLocationEnabled(true);
        }
        if (request.getRegistrationDocUrl() != null) profile.setRegistrationDocUrl(request.getRegistrationDocUrl());
        if (request.getLogoUrl() != null) profile.setLogoUrl(request.getLogoUrl());
        if (request.getOwnerIdDocUrl() != null) profile.setOwnerIdDocUrl(request.getOwnerIdDocUrl());
        if (request.getAuthorizedConfirmed() != null) profile.setAuthorizedConfirmed(request.getAuthorizedConfirmed());
        if (request.getPlan() != null) profile.setPlan(request.getPlan());
        if (request.getPaymentMethod() != null) profile.setPaymentMethod(request.getPaymentMethod());
        if (request.getOnboardingCompleted() != null) profile.setOnboardingCompleted(request.getOnboardingCompleted());
        if (request.getFounded() != null) profile.setFounded(request.getFounded());
        if (request.getTeamSize() != null) profile.setTeamSize(request.getTeamSize());
        if (request.getPhotos() != null) {
            profile.getPhotos().clear();
            profile.getPhotos().addAll(request.getPhotos());
        }

        employerProfileRepository.save(profile);
        return EmployerProfileDto.from(profile);
    }

    // ------------------------------------------------------------------ helpers

    private EmployerProfile profileOf(EmployerAccount employer) {
        return employerProfileRepository.findByAccountId(employer.getId())
                .orElseGet(() -> employerProfileRepository.save(EmployerProfile.builder()
                        .account(employer).businessName(employer.getName()).build()));
    }

    private JobPost requireJob(EmployerAccount employer, Long jobId) {
        JobPost job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("Job not found"));
        if (!job.getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("This is not your job");
        }
        return job;
    }

    /** null when the applicant somehow has no worker profile row - nothing to render. */
    private ApplicantCardDto cardFor(JobApplication application) {
        return workerProfileRepository.findByAccountId(application.getWorker().getId())
                .map(p -> assembler.card(application, p))
                .orElse(null);
    }
}
