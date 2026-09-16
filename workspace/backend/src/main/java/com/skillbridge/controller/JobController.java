package com.skillbridge.controller;

import com.skillbridge.dto.*;
import com.skillbridge.model.JobStatus;
import com.skillbridge.model.User;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.JobService;
import com.skillbridge.service.MatchingService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class JobController {

    private final JobService jobService;
    private final MatchingService matchingService;

    public JobController(JobService jobService, MatchingService matchingService) {
        this.jobService = jobService;
        this.matchingService = matchingService;
    }

    @GetMapping("/jobs")
    public List<JobDto> listJobs() {
        return jobService.listOpenJobs();
    }

    @PostMapping("/jobs/search")
    public List<JobDto> searchJobs(@RequestBody(required = false) JobSearchRequest request) {
        User current = null;
        try {
            current = AuthenticationUtils.currentUser();
        } catch (Exception ignored) {
        }
        return jobService.searchJobs(current, request != null ? request : new JobSearchRequest(
                null, null, null, null, null, null, null, null, null, null));
    }

    @GetMapping("/jobs/{id}")
    public JobDto getJob(@PathVariable Long id) {
        User current = null;
        try {
            current = AuthenticationUtils.currentUser();
        } catch (Exception ignored) {
        }
        return jobService.getJob(id, current);
    }

    @PostMapping("/employer/jobs")
    @ResponseStatus(HttpStatus.CREATED)
    public JobDto postJob(@RequestBody JobRequest request) {
        return jobService.postJob(AuthenticationUtils.currentUser(), request);
    }

    @PutMapping("/employer/jobs/{jobId}")
    public JobDto updateJob(@PathVariable Long jobId, @RequestBody JobRequest request) {
        return jobService.updateJob(AuthenticationUtils.currentUser(), jobId, request);
    }

    @PatchMapping("/employer/jobs/{jobId}/status")
    public JobDto setStatus(@PathVariable Long jobId, @RequestBody StatusRequest request) {
        jobService.setJobStatus(AuthenticationUtils.currentUser(), jobId, JobStatus.valueOf(request.status().toUpperCase()));
        return jobService.getJob(jobId, null);
    }

    @GetMapping("/employer/jobs")
    public List<JobDto> myJobs() {
        return jobService.employerJobs(AuthenticationUtils.currentUser());
    }

    @PostMapping("/jobs/{jobId}/apply")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationDto apply(@PathVariable Long jobId, @RequestBody(required = false) ApplyRequest request) {
        return jobService.apply(AuthenticationUtils.currentUser(), jobId,
                request != null ? request.message() : null);
    }

    @PatchMapping("/employer/applications/{applicationId}")
    public ApplicationDto updateApplication(@PathVariable Long applicationId, @RequestBody StatusRequest request) {
        return jobService.updateApplicationStatus(AuthenticationUtils.currentUser(), applicationId,
                com.skillbridge.model.ApplicationStatus.valueOf(request.status().toUpperCase()));
    }

    @GetMapping("/employer/applications")
    public List<ApplicationDto> employerApplications() {
        return jobService.applicationsForEmployer(AuthenticationUtils.currentUser());
    }

    @GetMapping("/worker/applications")
    public List<ApplicationDto> workerApplications() {
        return jobService.applicationsForWorker(AuthenticationUtils.currentUser());
    }

    @GetMapping("/employer/jobs/{jobId}/applications")
    public List<ApplicationDto> jobApplicants(@PathVariable Long jobId) {
        return jobService.applicantsForJob(AuthenticationUtils.currentUser(), jobId);
    }

    @GetMapping("/worker/matches")
    public List<MatchDto> myMatches() {
        return jobService.matchesForWorker(AuthenticationUtils.currentUser());
    }

    @PatchMapping("/worker/matches/{matchId}/view")
    public void markMatchViewed(@PathVariable Long matchId) {
        matchingService.markViewed(matchId, AuthenticationUtils.currentUser());
    }

    @GetMapping("/match/{workerId}/{jobId}")
    public MatchDto getMatch(@PathVariable Long workerId, @PathVariable Long jobId) {
        return matchingService.getMatchFor(workerId, jobId);
    }

    public record StatusRequest(String status) {}
    public record ApplyRequest(String message) {}
}
