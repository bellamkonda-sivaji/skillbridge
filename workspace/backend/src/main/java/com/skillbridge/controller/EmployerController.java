package com.skillbridge.controller;

import com.skillbridge.dto.*;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.ApplicationStatus;
import com.skillbridge.model.JobStatus;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.ApplicationService;
import com.skillbridge.service.EmployerService;
import com.skillbridge.service.EmploymentService;
import com.skillbridge.service.InterviewService;
import com.skillbridge.service.JobService;
import com.skillbridge.service.OfferService;
import com.skillbridge.service.UserService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

/** Everything a signed-in employer can do. The whole namespace is gated on ROLE_EMPLOYER. */
@RestController
@RequestMapping("/api/employer")
public class EmployerController {

    private final JobService jobService;
    private final ApplicationService applicationService;
    private final UserService userService;
    private final InterviewService interviewService;
    private final EmployerService employerService;
    private final EmploymentService employmentService;
    private final OfferService offerService;

    public EmployerController(JobService jobService, ApplicationService applicationService,
                              UserService userService, InterviewService interviewService,
                              EmployerService employerService, EmploymentService employmentService,
                              OfferService offerService) {
        this.offerService = offerService;
        this.jobService = jobService;
        this.applicationService = applicationService;
        this.userService = userService;
        this.interviewService = interviewService;
        this.employerService = employerService;
        this.employmentService = employmentService;
    }

    // ---------------------------------------------------------------- dashboard

    @GetMapping("/dashboard")
    public EmployerDashboardDto dashboard() {
        return employerService.dashboard(AuthenticationUtils.currentEmployer());
    }

    // ---------------------------------------------------------------- employments & attendance

    @GetMapping("/employments")
    public List<EmploymentDto> employments(@RequestParam(required = false, defaultValue = "CURRENT") String scope) {
        return employmentService.listForEmployer(AuthenticationUtils.currentEmployer(), scope);
    }

    @GetMapping("/attendance")
    public List<AttendanceDto> attendance(
            @RequestParam(required = false) Long employmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return employmentService.attendanceForEmployer(AuthenticationUtils.currentEmployer(),
                employmentId, from, to);
    }

    @GetMapping("/employments/{id}/payroll")
    public PayrollSummaryDto payroll(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return employmentService.payrollForEmployer(AuthenticationUtils.currentEmployer(), id, from, to);
    }

    // ---------------------------------------------------------------- jobs

    @GetMapping("/jobs")
    public List<JobSummaryDto> myJobs(@RequestParam(required = false, defaultValue = "ALL") String status,
                                      @RequestParam(required = false) String q) {
        return employerService.jobs(AuthenticationUtils.currentEmployer(), status, q);
    }

    @GetMapping("/jobs/{jobId}")
    public JobDetailDto jobDetail(@PathVariable Long jobId) {
        return employerService.jobDetail(AuthenticationUtils.currentEmployer(), jobId);
    }

    /** Pure calculation over the schedule/salary step of the wizard - persists nothing. */
    @PostMapping("/jobs/estimate")
    public ScheduleEstimateDto estimate(@RequestBody ScheduleEstimateRequest request) {
        AuthenticationUtils.currentEmployer();
        return jobService.estimate(request);
    }

    @GetMapping("/jobs/{jobId}/estimate")
    public ScheduleEstimateDto jobEstimate(@PathVariable Long jobId) {
        return jobService.estimateForJob(AuthenticationUtils.currentEmployer(), jobId);
    }

    @PostMapping("/jobs")
    @ResponseStatus(HttpStatus.CREATED)
    public JobDto postJob(@RequestBody JobRequest request) {
        return jobService.postJob(AuthenticationUtils.currentEmployer(), request);
    }

    @PutMapping("/jobs/{jobId}")
    public JobDto updateJob(@PathVariable Long jobId, @RequestBody JobRequest request) {
        return jobService.updateJob(AuthenticationUtils.currentEmployer(), jobId, request);
    }

    @PatchMapping("/jobs/{jobId}/status")
    public JobDto setStatus(@PathVariable Long jobId, @RequestBody StatusRequest request) {
        return jobService.setJobStatus(AuthenticationUtils.currentEmployer(), jobId,
                parse(JobStatus.class, request.status()));
    }

    @DeleteMapping("/jobs/{jobId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteJob(@PathVariable Long jobId) {
        jobService.deleteJob(AuthenticationUtils.currentEmployer(), jobId);
    }

    // ---------------------------------------------------------------- applicants

    @GetMapping("/jobs/{jobId}/applicants")
    public List<ApplicantCardDto> applicants(@PathVariable Long jobId,
                                             @RequestParam(required = false, defaultValue = "ALL") String status,
                                             @RequestParam(required = false, defaultValue = "MATCH") String sort) {
        return employerService.applicants(AuthenticationUtils.currentEmployer(), jobId, status, sort);
    }

    @GetMapping("/jobs/{jobId}/shortlist")
    public List<ApplicantCardDto> shortlist(@PathVariable Long jobId) {
        return employerService.shortlist(AuthenticationUtils.currentEmployer(), jobId);
    }

    /** Kept from the earlier API: the raw application rows for one job. */
    @GetMapping("/jobs/{jobId}/applications")
    public List<ApplicationDto> jobApplications(@PathVariable Long jobId) {
        return applicationService.applicantsForJob(AuthenticationUtils.currentEmployer(), jobId);
    }

    @GetMapping("/applications")
    public List<ApplicationDto> applications() {
        return applicationService.applicationsForEmployer(AuthenticationUtils.currentEmployer());
    }

    @PatchMapping("/applications/{applicationId}")
    public ApplicationDto updateApplication(@PathVariable Long applicationId,
                                            @RequestBody ApplicationDecisionRequest request) {
        return applicationService.updateStatus(AuthenticationUtils.currentEmployer(), applicationId,
                parse(ApplicationStatus.class, request.status()), request.message(),
                request.notifyWorker() == null || request.notifyWorker());
    }

    @PostMapping("/applications/bulk")
    public Map<String, Integer> bulkDecision(@RequestBody BulkDecisionRequest request) {
        int updated = applicationService.bulkUpdateStatus(AuthenticationUtils.currentEmployer(),
                request.applicationIds(), parse(ApplicationStatus.class, request.status()), request.message());
        return Map.of("updated", updated);
    }

    // ---------------------------------------------------------------- offer lifecycle

    @GetMapping("/jobs/{jobId}/interview-results")
    public List<InterviewResultDto> interviewResults(@PathVariable Long jobId) {
        return offerService.interviewResults(AuthenticationUtils.currentEmployer(), jobId);
    }

    @PatchMapping("/applications/{applicationId}/interview-result")
    public ApplicationDto interviewResult(@PathVariable Long applicationId,
                                          @RequestBody InterviewResultRequest request) {
        return offerService.setInterviewResult(AuthenticationUtils.currentEmployer(), applicationId,
                request.result(), request.feedback());
    }

    @GetMapping("/applications/{applicationId}/offer-draft")
    public OfferDraftDto offerDraft(@PathVariable Long applicationId) {
        return offerService.offerDraft(AuthenticationUtils.currentEmployer(), applicationId);
    }

    @PostMapping("/applications/{applicationId}/offer")
    @ResponseStatus(HttpStatus.CREATED)
    public OfferDto createOffer(@PathVariable Long applicationId,
                                @RequestBody(required = false) OfferRequest request) {
        return offerService.createOffer(AuthenticationUtils.currentEmployer(), applicationId, request);
    }

    @GetMapping("/offers")
    public List<OfferDto> offers(@RequestParam(required = false, defaultValue = "ALL") String status) {
        return offerService.offers(AuthenticationUtils.currentEmployer(), status);
    }

    @GetMapping("/offers/{offerId}")
    public OfferDto offer(@PathVariable Long offerId) {
        return offerService.offer(AuthenticationUtils.currentEmployer(), offerId);
    }

    @PostMapping("/offers/{offerId}/cancel")
    public OfferDto cancelOffer(@PathVariable Long offerId) {
        return offerService.cancelOffer(AuthenticationUtils.currentEmployer(), offerId);
    }

    @GetMapping("/offers/{offerId}/joining")
    public JoiningDto joining(@PathVariable Long offerId) {
        return offerService.joining(AuthenticationUtils.currentEmployer(), offerId);
    }

    @PostMapping("/offers/{offerId}/joining")
    public JoiningDto updateJoining(@PathVariable Long offerId,
                                    @RequestBody(required = false) JoiningRequest request) {
        return offerService.updateJoining(AuthenticationUtils.currentEmployer(), offerId, request);
    }

    // ---------------------------------------------------------------- worker discovery

    @GetMapping("/jobs/{jobId}/recommended")
    public List<ApplicantCardDto> recommended(@PathVariable Long jobId,
                                              @RequestParam(required = false, defaultValue = "TOP") String tab) {
        return employerService.recommended(AuthenticationUtils.currentEmployer(), jobId, tab);
    }

    @GetMapping("/workers/{workerId}")
    public WorkerDetailDto worker(@PathVariable Long workerId,
                                  @RequestParam(required = false) Long jobId) {
        return employerService.workerDetail(AuthenticationUtils.currentEmployer(), workerId, jobId);
    }

    @GetMapping("/workers/{workerId}/work-history")
    public List<WorkHistoryEntryDto> workHistory(@PathVariable Long workerId) {
        return employerService.workHistory(AuthenticationUtils.currentEmployer(), workerId);
    }

    @PostMapping("/compare")
    public List<WorkerDetailDto> compare(@RequestBody CompareRequest request) {
        return employerService.compare(AuthenticationUtils.currentEmployer(),
                request.workerIds(), request.jobId());
    }

    @PostMapping("/jobs/{jobId}/invite")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Boolean> invite(@PathVariable Long jobId, @RequestBody InviteRequest request) {
        employerService.invite(AuthenticationUtils.currentEmployer(), jobId,
                request.workerId(), request.message());
        return Map.of("invited", true);
    }

    // ---------------------------------------------------------------- profile & onboarding

    @GetMapping("/profile")
    public EmployerProfileDto myProfile() {
        return userService.getEmployerProfile(AuthenticationUtils.currentEmployer().getId());
    }

    @PutMapping("/profile")
    public EmployerProfileDto updateProfile(@RequestBody EmployerProfileRequest request) {
        return userService.updateEmployerProfile(AuthenticationUtils.currentEmployer(), request);
    }

    /** The wizard reads this to resume where the employer left off. */
    @GetMapping("/onboarding")
    public EmployerProfileDto onboarding() {
        return employerService.onboarding(AuthenticationUtils.currentEmployer());
    }

    /** Merge update: only the fields present in the body are changed. */
    @PatchMapping("/onboarding")
    public EmployerProfileDto updateOnboarding(@RequestBody EmployerOnboardingRequest request) {
        return employerService.updateOnboarding(AuthenticationUtils.currentEmployer(), request);
    }

    // ---------------------------------------------------------------- interviews

    @GetMapping("/interviews")
    public List<InterviewDto> interviews(@RequestParam(required = false) String from,
                                         @RequestParam(required = false) String to) {
        return interviewService.interviewsForEmployer(
                AuthenticationUtils.currentEmployer(), asDate(from), asDate(to));
    }

    /** The calendar sends full ISO timestamps; a plain date is also accepted. */
    private static LocalDate asDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value.length() > 10 ? value.substring(0, 10) : value);
        } catch (DateTimeParseException e) {
            throw ApiException.badRequest("Invalid date: " + value);
        }
    }

    @PostMapping("/interviews")
    @ResponseStatus(HttpStatus.CREATED)
    public InterviewDto schedule(@RequestBody ScheduleInterviewRequest request) {
        return interviewService.schedule(AuthenticationUtils.currentEmployer(), request);
    }

    @PatchMapping("/interviews/{interviewId}/complete")
    public InterviewDto complete(@PathVariable Long interviewId) {
        return interviewService.complete(AuthenticationUtils.currentEmployer(), interviewId);
    }

    @PatchMapping("/interviews/{interviewId}/cancel")
    public InterviewDto cancel(@PathVariable Long interviewId) {
        return interviewService.cancel(AuthenticationUtils.currentEmployer(), interviewId);
    }

    // ---------------------------------------------------------------- helpers

    /** Turns a client-supplied enum name into a 400 rather than a 500 when it is not one. */
    private static <E extends Enum<E>> E parse(Class<E> type, String value) {
        if (value == null || value.isBlank()) {
            throw ApiException.badRequest("A status is required");
        }
        try {
            return Enum.valueOf(type, value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest("Unknown status \"" + value + "\"");
        }
    }

    public record StatusRequest(String status) {}
}
