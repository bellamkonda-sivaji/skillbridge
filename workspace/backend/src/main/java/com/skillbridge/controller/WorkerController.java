package com.skillbridge.controller;

import com.skillbridge.dto.*;
import com.skillbridge.model.WorkerAccount;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.ApplicationService;
import com.skillbridge.service.EmploymentService;
import com.skillbridge.service.InterviewService;
import com.skillbridge.service.JobService;
import com.skillbridge.service.MatchingService;
import com.skillbridge.service.UserService;
import com.skillbridge.service.WorkerService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** Everything a signed-in worker can do. The whole namespace is gated on ROLE_WORKER. */
@RestController
@RequestMapping("/api/worker")
public class WorkerController {

    private final WorkerService workerService;
    private final ApplicationService applicationService;
    private final UserService userService;
    private final JobService jobService;
    private final InterviewService interviewService;
    private final MatchingService matchingService;
    private final EmploymentService employmentService;

    public WorkerController(WorkerService workerService, ApplicationService applicationService,
                            UserService userService, JobService jobService,
                            InterviewService interviewService, MatchingService matchingService,
                            EmploymentService employmentService) {
        this.workerService = workerService;
        this.applicationService = applicationService;
        this.userService = userService;
        this.jobService = jobService;
        this.interviewService = interviewService;
        this.matchingService = matchingService;
        this.employmentService = employmentService;
    }

    // ---------------------------------------------------------------- dashboard & search

    @GetMapping("/dashboard")
    public WorkerDashboardDto dashboard() {
        return workerService.dashboard(AuthenticationUtils.currentWorker());
    }

    @PostMapping("/jobs/search")
    public List<JobCardDto> searchJobs(@RequestBody(required = false) WorkerJobSearchRequest request) {
        return workerService.search(AuthenticationUtils.currentWorker(), request);
    }

    // ---------------------------------------------------------------- saved jobs

    @GetMapping("/saved-jobs")
    public List<JobCardDto> savedJobs() {
        return workerService.savedJobs(AuthenticationUtils.currentWorker());
    }

    @PostMapping("/saved-jobs/{jobId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Boolean> saveJob(@PathVariable Long jobId) {
        return Map.of("saved", workerService.saveJob(AuthenticationUtils.currentWorker(), jobId));
    }

    @DeleteMapping("/saved-jobs/{jobId}")
    public Map<String, Boolean> unsaveJob(@PathVariable Long jobId) {
        return Map.of("saved", workerService.unsaveJob(AuthenticationUtils.currentWorker(), jobId));
    }

    // ---------------------------------------------------------------- applications

    @GetMapping("/applications")
    public List<ApplicationCardDto> applications() {
        return applicationService.listForWorker(AuthenticationUtils.currentWorker());
    }

    @GetMapping("/applications/{id}")
    public ApplicationDetailDto application(@PathVariable Long id) {
        return applicationService.detailFor(AuthenticationUtils.currentWorker(), id);
    }

    @PostMapping("/applications/{id}/withdraw")
    public ApplicationDetailDto withdraw(@PathVariable Long id) {
        return applicationService.withdraw(AuthenticationUtils.currentWorker(), id);
    }

    @PostMapping("/jobs/{jobId}/apply")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationDetailDto apply(@PathVariable Long jobId,
                                      @RequestBody(required = false) ApplyRequest request) {
        return applicationService.apply(AuthenticationUtils.currentWorker(), jobId,
                request != null ? request.text() : null);
    }

    // ---------------------------------------------------------------- offers

    @GetMapping("/offers")
    public List<OfferDto> offers() {
        return applicationService.offersForWorker(AuthenticationUtils.currentWorker());
    }

    @GetMapping("/offers/{id}")
    public OfferDto offer(@PathVariable Long id) {
        return applicationService.offerForWorker(AuthenticationUtils.currentWorker(), id);
    }

    @PostMapping("/offers/{id}/accept")
    public OfferDto acceptOffer(@PathVariable Long id) {
        return applicationService.acceptOffer(AuthenticationUtils.currentWorker(), id);
    }

    @PostMapping("/offers/{id}/decline")
    public OfferDto declineOffer(@PathVariable Long id) {
        return applicationService.declineOffer(AuthenticationUtils.currentWorker(), id);
    }

    // ---------------------------------------------------------------- profile

    @GetMapping("/profile")
    public WorkerProfileDto myProfile() {
        return userService.getWorkerProfile(AuthenticationUtils.currentWorker().getId());
    }

    @PutMapping("/profile")
    public WorkerProfileDto updateProfile(@RequestBody WorkerProfileRequest request) {
        return userService.updateWorkerProfile(AuthenticationUtils.currentWorker(), request);
    }

    /** Merge update: only the fields present in the body are changed. */
    @PatchMapping("/onboarding")
    public WorkerProfileDto updateOnboarding(@RequestBody WorkerOnboardingRequest request) {
        return userService.updateWorkerOnboarding(AuthenticationUtils.currentWorker(), request);
    }

    // ---------------------------------------------------------------- interviews & matches

    @GetMapping("/interviews")
    public List<InterviewDto> interviews() {
        return interviewService.interviewsForWorker(AuthenticationUtils.currentWorker());
    }

    @GetMapping("/interviews/{id}")
    public InterviewDetailDto interview(@PathVariable Long id) {
        return interviewService.detailForWorker(AuthenticationUtils.currentWorker(), id);
    }

    @PostMapping("/interviews/{id}/reschedule")
    public InterviewDto rescheduleInterview(@PathVariable Long id,
                                            @RequestBody(required = false) InterviewActionRequest request) {
        return interviewService.rescheduleByWorker(AuthenticationUtils.currentWorker(), id,
                request != null ? request.reason() : null);
    }

    @PostMapping("/interviews/{id}/cancel")
    public InterviewDto cancelInterview(@PathVariable Long id,
                                        @RequestBody(required = false) InterviewActionRequest request) {
        return interviewService.cancelByWorker(AuthenticationUtils.currentWorker(), id,
                request != null ? request.reason() : null);
    }

    // ---------------------------------------------------------------- employments

    @GetMapping("/employments")
    public List<EmploymentDto> employments(@RequestParam(required = false, defaultValue = "CURRENT") String scope) {
        return employmentService.listForWorker(AuthenticationUtils.currentWorker(), scope);
    }

    @GetMapping("/employments/{id}")
    public EmploymentDetailDto employment(@PathVariable Long id) {
        return employmentService.detailForWorker(AuthenticationUtils.currentWorker(), id);
    }

    @GetMapping("/employments/{id}/payroll")
    public PayrollSummaryDto payroll(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return employmentService.payrollForWorker(AuthenticationUtils.currentWorker(), id, from, to);
    }

    @PostMapping("/employments/{id}/acknowledge-joining")
    public EmploymentDetailDto acknowledgeJoining(@PathVariable Long id) {
        return employmentService.acknowledgeJoining(AuthenticationUtils.currentWorker(), id);
    }

    // ---------------------------------------------------------------- shift & attendance

    @GetMapping("/shifts/today")
    public TodayShiftDto todayShift() {
        return employmentService.todayShift(AuthenticationUtils.currentWorker());
    }

    @PostMapping("/attendance/check-in")
    public AttendanceDto checkIn(@RequestBody(required = false) AttendanceRequest request) {
        return employmentService.checkIn(AuthenticationUtils.currentWorker(),
                request != null ? request.employmentId() : null);
    }

    @PostMapping("/attendance/check-out")
    public AttendanceDto checkOut(@RequestBody(required = false) AttendanceRequest request) {
        return employmentService.checkOut(AuthenticationUtils.currentWorker(),
                request != null ? request.employmentId() : null);
    }

    @GetMapping("/attendance")
    public List<AttendanceDto> attendance(
            @RequestParam(required = false) Long employmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return employmentService.attendanceForWorker(AuthenticationUtils.currentWorker(),
                employmentId, from, to);
    }

    @GetMapping("/matches")
    public List<MatchDto> matches() {
        return jobService.matchesForWorker(AuthenticationUtils.currentWorker());
    }

    @PatchMapping("/matches/{matchId}/view")
    public void markMatchViewed(@PathVariable Long matchId) {
        WorkerAccount worker = AuthenticationUtils.currentWorker();
        matchingService.markViewed(matchId, worker);
    }
}
