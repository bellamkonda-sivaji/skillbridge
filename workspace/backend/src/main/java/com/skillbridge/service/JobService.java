package com.skillbridge.service;

import com.skillbridge.dto.*;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JobService {

    private final JobPostRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final GeoService geoService;
    private final SkillLexicon lexicon;
    private final MatchingService matchingService;
    private final WalletService walletService;

    public JobService(JobPostRepository jobRepository, JobApplicationRepository applicationRepository,
                      WorkerProfileRepository workerProfileRepository, EmployerProfileRepository employerProfileRepository,
                      MatchRepository matchRepository, UserRepository userRepository,
                      NotificationService notificationService, GeoService geoService,
                      SkillLexicon lexicon, MatchingService matchingService, WalletService walletService) {
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.matchRepository = matchRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.geoService = geoService;
        this.lexicon = lexicon;
        this.matchingService = matchingService;
        this.walletService = walletService;
    }

    public List<JobDto> listOpenJobs() {
        return jobRepository.findByStatusOrderByPostedAtDesc(JobStatus.OPEN).stream()
                .map(j -> JobDto.from(j, null)).collect(Collectors.toList());
    }

    public JobDto getJob(Long id, User currentUser) {
        JobPost job = jobRepository.findById(id).orElseThrow(() -> ApiException.notFound("Job not found"));
        Double match = null;
        if (currentUser != null && currentUser.getRole() == Role.WORKER) {
            match = workerProfileRepository.findByUserId(currentUser.getId())
                    .flatMap(w -> matchRepository.findByWorkerAndJob(currentUser, job))
                    .map(Match::getScore)
                    .orElse(null);
        }
        return JobDto.from(job, match);
    }

    @Transactional
    public JobDto postJob(User employer, JobRequest request) {
        if (employer.getRole() != Role.ADMIN) {
            employerProfileRepository.findByUserId(employer.getId())
                    .orElseThrow(() -> ApiException.badRequest("Complete your business profile before posting jobs"));
        } else {
            employerProfileRepository.findByUserId(employer.getId())
                    .orElseGet(() -> employerProfileRepository.save(
                            EmployerProfile.builder().user(employer).businessName("SkillBridge Platform").build()));
        }
        if (request.title() == null || request.title().isBlank() || request.requiredSkills() == null
                || request.requiredSkills().isEmpty() || request.salary() <= 0) {
            throw ApiException.badRequest("Title, at least one required skill and a salary are required");
        }
        JobPost job = JobPost.builder()
                .employer(employer)
                .title(request.title().trim())
                .description(request.description())
                .requiredSkills(request.requiredSkills())
                .workType(request.workType() != null ? request.workType() : WorkType.DAILY)
                .salary(request.salary())
                .salaryUnit(request.salaryUnit() != null ? request.salaryUnit() : SalaryUnit.PER_DAY)
                .city(request.city())
                .area(request.area())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .workersNeeded(Math.max(1, request.workersNeeded()))
                .urgent(request.urgent())
                .status(JobStatus.OPEN)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .build();
        job = jobRepository.save(job);

        matchingService.generateMatchesForJob(job);
        return JobDto.from(job, null);
    }

    @Transactional
    public JobDto updateJob(User employer, Long jobId, JobRequest request) {
        JobPost job = requireEmployerJob(employer, jobId);
        if (request.title() != null && !request.title().isBlank()) job.setTitle(request.title());
        if (request.description() != null) job.setDescription(request.description());
        if (request.requiredSkills() != null && !request.requiredSkills().isEmpty()) job.setRequiredSkills(request.requiredSkills());
        if (request.workType() != null) job.setWorkType(request.workType());
        if (request.salary() > 0) job.setSalary(request.salary());
        if (request.salaryUnit() != null) job.setSalaryUnit(request.salaryUnit());
        if (request.city() != null && !request.city().isBlank()) job.setCity(request.city());
        if (request.area() != null) job.setArea(request.area());
        if (request.latitude() != 0) job.setLatitude(request.latitude());
        if (request.longitude() != 0) job.setLongitude(request.longitude());
        if (request.workersNeeded() > 0) job.setWorkersNeeded(request.workersNeeded());
        job.setUrgent(request.urgent());
        job = jobRepository.save(job);
        matchingService.generateMatchesForJob(job);
        return JobDto.from(job, null);
    }

    @Transactional
    public void setJobStatus(User employer, Long jobId, JobStatus status) {
        JobPost job = requireEmployerJob(employer, jobId);
        job.setStatus(status);
        jobRepository.save(job);
    }

    public List<JobDto> employerJobs(User employer) {
        return jobRepository.findByEmployerOrderByPostedAtDesc(employer).stream()
                .map(j -> JobDto.from(j, null)).collect(Collectors.toList());
    }

    public List<JobDto> searchJobs(User currentUser, JobSearchRequest req) {
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

        List<JobDto> result = new ArrayList<>();
        WorkerProfile workerProfile = null;
        if (currentUser != null && currentUser.getRole() == Role.WORKER) {
            workerProfile = workerProfileRepository.findByUserId(currentUser.getId()).orElse(null);
        }

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
                double monthly = j.getSalary() * switch (j.getSalaryUnit() == null ? SalaryUnit.PER_DAY : j.getSalaryUnit()) {
                    case PER_DAY -> 22.0;
                    case PER_WEEK -> 4.33;
                    case PER_MONTH -> 1.0;
                };
                if (req.minSalary() != null && monthly < req.minSalary()) ok = false;
                if (ok && req.maxSalary() != null && monthly > req.maxSalary()) ok = false;
            }
            if (ok && req.maxDistanceKm() != null && req.lat() != null && req.lng() != null) {
                double dist = geoService.distanceKm(req.lat(), req.lng(), j.getLatitude(), j.getLongitude());
                if (dist > req.maxDistanceKm()) ok = false;
            }
            Double match = null;
            if (ok && workerProfile != null) {
                User wpUser = workerProfile.getUser();
                match = matchRepository.findByWorkerAndJob(wpUser, j).map(Match::getScore).orElse(null);
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

    @Transactional
    public ApplicationDto apply(User worker, Long jobId, String coverMessage) {
        WorkerProfile profile = workerProfileRepository.findByUserId(worker.getId())
                .orElseThrow(() -> ApiException.badRequest("Complete your worker profile before applying"));
        if (!profile.isProfileCompleted()) {
            throw ApiException.badRequest("Complete your worker profile (skills, job title, location) before applying");
        }
        JobPost job = jobRepository.findById(jobId).orElseThrow(() -> ApiException.notFound("Job not found"));
        if (job.getStatus() != JobStatus.OPEN) {
            throw ApiException.badRequest("This job is no longer open");
        }
        if (applicationRepository.findByWorkerIdAndJobId(worker.getId(), jobId).isPresent()) {
            throw ApiException.conflict("You have already applied to this job");
        }
        JobApplication application = JobApplication.builder()
                .worker(worker)
                .job(job)
                .coverMessage(coverMessage)
                .status(ApplicationStatus.PENDING)
                .build();
        application = applicationRepository.save(application);
        job.setApplicantsCount(job.getApplicantsCount() + 1);
        jobRepository.save(job);

        matchingService.evaluateAndSave(profile, job);

        Double match = matchRepository.findByWorkerAndJob(worker, job).map(m -> m.getScore()).orElse(null);
        notificationService.notify(job.getEmployer(), "New application for " + job.getTitle(),
                worker.getName() + " applied for \"" + job.getTitle() + "\"",
                NotificationType.APPLICATION, "/employer/applications");
        return ApplicationDto.from(application, match);
    }

    @Transactional
    public ApplicationDto updateApplicationStatus(User employer, Long applicationId, ApplicationStatus status) {
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("Application not found"));
        if (!application.getJob().getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("This is not your job");
        }
        application.setStatus(status);
        applicationRepository.save(application);
        notificationService.notify(application.getWorker(),
                "Application " + status.name().toLowerCase(),
                "Your application for \"" + application.getJob().getTitle() + "\" is now " + status.name().toLowerCase(),
                NotificationType.APPLICATION, "/worker/applications");
        if (status == ApplicationStatus.ACCEPTED) {
            JobPost job = application.getJob();
            walletService.payForJob(employer, application.getWorker(), job);
            job.setWorkersNeeded(Math.max(0, job.getWorkersNeeded() - 1));
            if (job.getWorkersNeeded() == 0) {
                job.setStatus(JobStatus.FILLED);
            }
            jobRepository.save(job);
        }
        return ApplicationDto.from(application, null);
    }

    public List<ApplicationDto> applicationsForEmployer(User employer) {
        return applicationRepository.findByJobEmployerOrderByAppliedAtDesc(employer).stream()
                .map(a -> {
                    Double match = matchRepository.findByWorkerAndJob(a.getWorker(), a.getJob())
                            .map(m -> m.getScore()).orElse(null);
                    return ApplicationDto.from(a, match);
                }).collect(Collectors.toList());
    }

    public List<ApplicationDto> applicationsForWorker(User worker) {
        return applicationRepository.findByWorkerOrderByAppliedAtDesc(worker).stream()
                .map(a -> {
                    Double match = matchRepository.findByWorkerAndJob(worker, a.getJob())
                            .map(m -> m.getScore()).orElse(null);
                    return ApplicationDto.from(a, match);
                }).collect(Collectors.toList());
    }

    public List<MatchDto> matchesForWorker(User worker) {
        return matchRepository.findByWorkerOrderByScoreDesc(worker).stream().map(MatchDto::from).toList();
    }

    public List<ApplicationDto> applicantsForJob(User employer, Long jobId) {
        JobPost job = requireEmployerJob(employer, jobId);
        return applicationRepository.findByJobOrderByAppliedAtDesc(job).stream()
                .map(a -> {
                    Double match = matchRepository.findByWorkerAndJob(a.getWorker(), a.getJob())
                            .map(m -> m.getScore()).orElse(null);
                    return ApplicationDto.from(a, match);
                }).collect(Collectors.toList());
    }

    private JobPost requireEmployerJob(User employer, Long jobId) {
        JobPost job = jobRepository.findById(jobId).orElseThrow(() -> ApiException.notFound("Job not found"));
        if (!job.getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("This is not your job");
        }
        return job;
    }
}
