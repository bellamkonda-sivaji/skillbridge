package com.skillbridge.service;

import com.skillbridge.dto.JobCardDto;
import com.skillbridge.dto.QuickFilter;
import com.skillbridge.dto.WorkerDashboardDto;
import com.skillbridge.dto.WorkerJobSearchRequest;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Everything behind the worker dashboard: the summary tiles, job search and saved jobs. */
@Service
public class WorkerService {

    /** Used for "jobs near you" when the worker has not set a travel radius. */
    private static final double DEFAULT_RADIUS_KM = 10.0;
    /** NEARBY quick filter default, per the contract's sample request. */
    private static final double NEARBY_RADIUS_KM = 5.0;
    private static final int RECOMMENDED_LIMIT = 10;

    private final JobPostRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final WorkerProfileRepository profileRepository;
    private final SavedJobRepository savedJobRepository;
    private final InterviewRepository interviewRepository;
    private final JobCardAssembler assembler;
    private final WalletService walletService;
    private final GeoService geoService;
    private final SkillLexicon lexicon;

    public WorkerService(JobPostRepository jobRepository, JobApplicationRepository applicationRepository,
                         WorkerProfileRepository profileRepository, SavedJobRepository savedJobRepository,
                         InterviewRepository interviewRepository, JobCardAssembler assembler,
                         WalletService walletService, GeoService geoService, SkillLexicon lexicon) {
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.profileRepository = profileRepository;
        this.savedJobRepository = savedJobRepository;
        this.interviewRepository = interviewRepository;
        this.assembler = assembler;
        this.walletService = walletService;
        this.geoService = geoService;
        this.lexicon = lexicon;
    }

    // ------------------------------------------------------------------ dashboard

    public WorkerDashboardDto dashboard(WorkerAccount worker) {
        WorkerProfile profile = profileRepository.findByAccountId(worker.getId()).orElse(null);
        JobCardAssembler.CardContext context = assembler.contextFor(worker, profile);
        List<JobPost> openJobs = jobRepository.findByStatusOrderByPostedAtDesc(JobStatus.OPEN);

        List<JobCardDto> recommended = assembler.sorted(assembler.cards(openJobs, context)).stream()
                .limit(RECOMMENDED_LIMIT).toList();

        return new WorkerDashboardDto(
                worker.getName(),
                profileCompletion(worker, profile),
                profileCompletionHint(profileCompletion(worker, profile)),
                jobsNearYou(profile, openJobs),
                applicationRepository.countByWorker(worker),
                interviewRepository.countByWorkerAndStatusNot(worker, InterviewStatus.CANCELLED),
                walletService.earningsFor(AccountType.WORKER, worker.getId()),
                locationLabel(profile),
                recommended);
    }

    /** Ten equally weighted signals, so the number moves visibly as onboarding progresses. */
    public int profileCompletion(WorkerAccount worker, WorkerProfile p) {
        if (p == null) {
            return 0;
        }
        boolean[] filled = {
                worker.getPhotoUrl() != null && !worker.getPhotoUrl().isBlank(),
                p.getDateOfBirth() != null,
                p.getGender() != null,
                p.getJobCategories() != null && !p.getJobCategories().isEmpty(),
                p.getEmploymentTypes() != null && !p.getEmploymentTypes().isEmpty(),
                p.getSkills() != null && !p.getSkills().isEmpty(),
                p.getJobTitle() != null && !p.getJobTitle().isBlank(),
                p.getBio() != null && !p.getBio().isBlank(),
                p.getCity() != null && !p.getCity().isBlank() && p.getLatitude() != 0 && p.getLongitude() != 0,
                p.getExpectedSalary() > 0
        };
        int done = 0;
        for (boolean f : filled) {
            if (f) done++;
        }
        return done * 100 / filled.length;
    }

    private String profileCompletionHint(int completion) {
        return completion >= 100
                ? "Your profile is complete"
                : "Get 80% more job matches";
    }

    private String locationLabel(WorkerProfile p) {
        if (p == null || p.getCity() == null || p.getCity().isBlank()) {
            return "Location not set";
        }
        return p.getArea() != null && !p.getArea().isBlank()
                ? "Near " + p.getCity() + ", " + p.getArea()
                : "Near " + p.getCity();
    }

    private long jobsNearYou(WorkerProfile p, List<JobPost> openJobs) {
        if (p == null || (p.getLatitude() == 0 && p.getLongitude() == 0)) {
            return openJobs.size();
        }
        double radius = p.getPreferredRadiusKm() != null ? p.getPreferredRadiusKm() : DEFAULT_RADIUS_KM;
        return openJobs.stream().filter(j -> {
            Double d = geoService.distanceKmOrNull(p.getLatitude(), p.getLongitude(),
                    j.getLatitude(), j.getLongitude());
            return d != null && d <= radius;
        }).count();
    }

    // ------------------------------------------------------------------ search

    public List<JobCardDto> search(WorkerAccount worker, WorkerJobSearchRequest request) {
        WorkerJobSearchRequest req = request != null ? request : WorkerJobSearchRequest.empty();
        WorkerProfile profile = profileRepository.findByAccountId(worker.getId()).orElse(null);
        JobCardAssembler.CardContext context = assembler.contextFor(worker, profile);

        Double maxDistanceKm = req.maxDistanceKm();
        if (req.quickFilter() == QuickFilter.NEARBY && maxDistanceKm == null) {
            maxDistanceKm = NEARBY_RADIUS_KM;
        }

        List<JobPost> candidates = new ArrayList<>();
        for (JobPost job : jobRepository.findByStatusOrderByPostedAtDesc(JobStatus.OPEN)) {
            if (matches(job, req, profile, maxDistanceKm)) {
                candidates.add(job);
            }
        }
        return assembler.sorted(assembler.cards(candidates, context));
    }

    private boolean matches(JobPost job, WorkerJobSearchRequest req, WorkerProfile profile,
                            Double maxDistanceKm) {
        if (!matchesText(job, req.q())) {
            return false;
        }
        if (!matchesCategory(job, req.category())) {
            return false;
        }
        if (req.employmentTypes() != null && !req.employmentTypes().isEmpty()
                && !req.employmentTypes().contains(job.getEmploymentType())) {
            return false;
        }
        if (!matchesQuickFilter(job, req.quickFilter())) {
            return false;
        }
        if (req.minSalary() != null || req.maxSalary() != null) {
            double monthly = toMonthly(job.getSalary(), job.getSalaryUnit());
            if (req.minSalary() != null && monthly < req.minSalary()) {
                return false;
            }
            if (req.maxSalary() != null && monthly > req.maxSalary()) {
                return false;
            }
        }
        // "I have this much experience" - keep the jobs the worker actually qualifies for.
        if (req.minExperience() != null && job.getMinExperienceYears() > req.minExperience()) {
            return false;
        }
        if (req.language() != null && !req.language().isBlank()
                && job.getLanguage() != null && !job.getLanguage().equalsIgnoreCase(req.language())) {
            return false;
        }
        if (maxDistanceKm != null) {
            if (profile == null) {
                return false;
            }
            Double d = geoService.distanceKmOrNull(profile.getLatitude(), profile.getLongitude(),
                    job.getLatitude(), job.getLongitude());
            return d != null && d <= maxDistanceKm;
        }
        return true;
    }

    private boolean matchesText(JobPost job, String q) {
        if (q == null || q.isBlank()) {
            return true;
        }
        String needle = q.trim().toLowerCase(Locale.ROOT);
        if (job.getTitle().toLowerCase(Locale.ROOT).contains(needle)
                || (job.getCity() != null && job.getCity().toLowerCase(Locale.ROOT).contains(needle))
                || (job.getArea() != null && job.getArea().toLowerCase(Locale.ROOT).contains(needle))
                || (job.getDescription() != null
                        && job.getDescription().toLowerCase(Locale.ROOT).contains(needle))) {
            return true;
        }
        return job.getRequiredSkills().stream().anyMatch(s -> {
            String normalized = lexicon.normalize(s);
            if (normalized.contains(needle)) {
                return true;
            }
            return lexicon.expand(s).stream().anyMatch(v -> lexicon.normalize(v).contains(needle));
        });
    }

    private boolean matchesCategory(JobPost job, String category) {
        if (category == null || category.isBlank()) {
            return true;
        }
        String needle = lexicon.normalize(category);
        if (lexicon.normalize(job.getTitle()).contains(needle)) {
            return true;
        }
        return job.getRequiredSkills().stream()
                .anyMatch(s -> lexicon.expand(s).stream()
                        .anyMatch(v -> lexicon.normalize(v).contains(needle) || needle.contains(lexicon.normalize(v))));
    }

    private boolean matchesQuickFilter(JobPost job, QuickFilter filter) {
        if (filter == null) {
            return true;
        }
        return switch (filter) {
            // NEARBY is expressed purely as a distance bound, applied by the caller.
            case NEARBY -> true;
            case FULL_TIME -> job.getEmploymentType() == EmploymentType.FULL_TIME;
            case PART_TIME -> job.getEmploymentType() == EmploymentType.PART_TIME;
            case DAILY_WORK -> job.getEmploymentType() == EmploymentType.DAILY
                    || job.getWorkType() == WorkType.DAILY;
        };
    }

    private double toMonthly(double amount, SalaryUnit unit) {
        if (unit == null) {
            return amount;
        }
        return switch (unit) {
            case PER_HOUR -> amount * 8 * 22;
            case PER_SHIFT -> amount * 22;
            case PER_DAY -> amount * 22;
            case PER_WEEK -> amount * 4.33;
            case PER_MONTH -> amount;
        };
    }

    // ------------------------------------------------------------------ saved jobs

    public List<JobCardDto> savedJobs(WorkerAccount worker) {
        WorkerProfile profile = profileRepository.findByAccountId(worker.getId()).orElse(null);
        JobCardAssembler.CardContext context = assembler.contextFor(worker, profile);
        return savedJobRepository.findByWorkerOrderByCreatedAtDesc(worker).stream()
                .map(s -> assembler.cardFor(s, context)).toList();
    }

    @Transactional
    public boolean saveJob(WorkerAccount worker, Long jobId) {
        JobPost job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("Job not found"));
        if (savedJobRepository.existsByWorkerIdAndJobId(worker.getId(), jobId)) {
            return true;
        }
        savedJobRepository.save(SavedJob.builder().worker(worker).job(job).build());
        return true;
    }

    @Transactional
    public boolean unsaveJob(WorkerAccount worker, Long jobId) {
        savedJobRepository.findByWorkerIdAndJobId(worker.getId(), jobId)
                .ifPresent(savedJobRepository::delete);
        return false;
    }
}
