package com.skillbridge.controller;

import com.skillbridge.dto.*;
import com.skillbridge.model.Account;
import com.skillbridge.model.Availability;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.JobService;
import com.skillbridge.service.MatchingService;
import com.skillbridge.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** The public surface: job listings, worker listings and the public employer profile. */
@RestController
@RequestMapping("/api")
public class JobController {

    private final JobService jobService;
    private final UserService userService;
    private final MatchingService matchingService;

    public JobController(JobService jobService, UserService userService, MatchingService matchingService) {
        this.jobService = jobService;
        this.userService = userService;
        this.matchingService = matchingService;
    }

    @GetMapping("/jobs")
    public List<JobDto> listJobs() {
        return jobService.listOpenJobs();
    }

    @GetMapping("/jobs/{id}")
    public JobDto getJob(@PathVariable Long id) {
        return jobService.getJob(id, AuthenticationUtils.currentAccountOrNull());
    }

    @PostMapping("/jobs/search")
    public List<JobDto> searchJobs(@RequestBody(required = false) JobSearchRequest request) {
        Account current = AuthenticationUtils.currentAccountOrNull();
        return jobService.searchJobs(current, request != null ? request : new JobSearchRequest(
                null, null, null, null, null, null, null, null, null, null));
    }

    @GetMapping("/workers")
    public List<WorkerProfileDto> searchWorkers(@RequestParam(required = false) String q,
                                                @RequestParam(required = false) List<String> skills,
                                                @RequestParam(required = false) String city,
                                                @RequestParam(required = false) Double maxDistanceKm,
                                                @RequestParam(required = false) Double lat,
                                                @RequestParam(required = false) Double lng,
                                                @RequestParam(required = false) Integer minRating,
                                                @RequestParam(required = false) Availability availability,
                                                @RequestParam(required = false) boolean verifiedOnly,
                                                @RequestParam(required = false) Integer minExperience) {
        return userService.searchWorkers(q, skills, city, maxDistanceKm, lat, lng, minRating,
                availability, verifiedOnly, minExperience);
    }

    @GetMapping("/workers/{workerAccountId}")
    public WorkerProfileDto workerProfile(@PathVariable Long workerAccountId) {
        return userService.getWorkerProfile(workerAccountId);
    }

    /** Public business profile, keyed on the employer account id a JobCard carries. */
    @GetMapping("/employers/{employerAccountId}")
    public EmployerPublicProfileDto employerProfile(@PathVariable Long employerAccountId) {
        return userService.getPublicEmployerProfile(employerAccountId);
    }

    @GetMapping("/employers/{employerAccountId}/jobs")
    public List<JobDto> employerOpenJobs(@PathVariable Long employerAccountId) {
        return jobService.openJobsForEmployer(employerAccountId);
    }

    @GetMapping("/me")
    public AccountDto me() {
        return AccountDto.from(AuthenticationUtils.currentAccount());
    }

    @GetMapping("/match/{workerAccountId}/{jobId}")
    public MatchDto getMatch(@PathVariable Long workerAccountId, @PathVariable Long jobId) {
        return matchingService.getMatchFor(workerAccountId, jobId);
    }
}
