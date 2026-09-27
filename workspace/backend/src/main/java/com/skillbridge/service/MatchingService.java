package com.skillbridge.service;

import com.skillbridge.dto.MatchDto;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * The intelligent matching engine. Computes a 0-100 compatibility score between
 * a worker profile and a job post using weighted signals:
 *   - Skill compatibility (weight 0.40)
 *   - Distance between worker and job location (weight 0.20)
 *   - Experience (weight 0.10)
 *   - Availability vs work type (weight 0.10)
 *   - Salary expectations (weight 0.15)
 *   - Ratings (weight 0.05)
 */
@Service
public class MatchingService {

    private final WorkerProfileRepository workerRepository;
    private final JobPostRepository jobRepository;
    private final MatchRepository matchRepository;
    private final NotificationService notificationService;
    private final GeoService geoService;
    private final SkillLexicon lexicon;

    private static final double WEIGHT_SKILL = 0.40;
    private static final double WEIGHT_DISTANCE = 0.20;
    private static final double WEIGHT_EXPERIENCE = 0.10;
    private static final double WEIGHT_AVAILABILITY = 0.10;
    private static final double WEIGHT_SALARY = 0.15;
    private static final double WEIGHT_RATING = 0.05;

    public static final double MATCH_THRESHOLD = 60.0;

    public MatchingService(WorkerProfileRepository workerRepository, JobPostRepository jobRepository,
                           MatchRepository matchRepository, NotificationService notificationService,
                           GeoService geoService, SkillLexicon lexicon) {
        this.workerRepository = workerRepository;
        this.jobRepository = jobRepository;
        this.matchRepository = matchRepository;
        this.notificationService = notificationService;
        this.geoService = geoService;
        this.lexicon = lexicon;
    }

    public record ScoreBreakdown(double score, double skillScore, double distanceKm, double distanceScore,
                                 double experienceScore, double availabilityScore, double salaryScore,
                                 double ratingScore, String summary) {}

    public ScoreBreakdown evaluate(WorkerProfile worker, JobPost job) {
        double skillScore = computeSkillScore(worker.getSkills(), job.getRequiredSkills());
        double distanceKm = geoService.distanceKm(worker.getLatitude(), worker.getLongitude(),
                job.getLatitude(), job.getLongitude());
        double distanceScore = computeDistanceScore(distanceKm);
        double experienceScore = computeExperienceScore(worker.getExperienceYears());
        double availabilityScore = computeAvailabilityScore(worker.getAvailability(), job.getWorkType());
        double salaryScore = computeSalaryScore(worker.getExpectedSalary(), worker.getSalaryUnit(),
                job.getSalary(), job.getSalaryUnit());
        double ratingScore = Math.min(100.0, worker.getAccount().getAvgRating() * 20.0);

        double score = WEIGHT_SKILL * skillScore
                + WEIGHT_DISTANCE * distanceScore
                + WEIGHT_EXPERIENCE * experienceScore
                + WEIGHT_AVAILABILITY * availabilityScore
                + WEIGHT_SALARY * salaryScore
                + WEIGHT_RATING * ratingScore;

        String summary = buildSummary(worker, job, skillScore, distanceKm, salaryScore);

        return new ScoreBreakdown(Math.round(score * 100.0) / 100.0, skillScore, Math.round(distanceKm * 10.0) / 10.0,
                distanceScore, experienceScore, availabilityScore, salaryScore, ratingScore, summary);
    }

    private double computeSkillScore(List<String> workerSkills, List<String> requiredSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty()) {
            return 70.0;
        }
        if (workerSkills == null || workerSkills.isEmpty()) {
            return 0.0;
        }
        List<String> normalizedWorker = new ArrayList<>();
        for (String s : workerSkills) {
            for (String variant : lexicon.expand(s)) {
                String n = lexicon.normalize(variant);
                if (!n.isEmpty()) {
                    normalizedWorker.add(n);
                }
            }
        }
        int matched = 0;
        double partialBonus = 0.0;
        for (String req : requiredSkills) {
            List<String> reqVariants = lexicon.expand(req);
            String reqNorm = lexicon.normalize(req);
            boolean hit = false;
            for (String rv : reqVariants) {
                String rvNorm = lexicon.normalize(rv);
                if (normalizedWorker.contains(rvNorm)) {
                    hit = true;
                    break;
                }
            }
            if (hit) {
                matched++;
                continue;
            }
            for (String rv : reqVariants) {
                String rvNorm = lexicon.normalize(rv);
                for (String ws : normalizedWorker) {
                    if (ws.contains(rvNorm) || rvNorm.contains(ws)) {
                        partialBonus += 0.5;
                        break;
                    }
                }
            }
        }
        double raw = matched + Math.min(partialBonus, (double) (requiredSkills.size() - matched));
        return Math.min(100.0, raw / requiredSkills.size() * 100.0);
    }

    private double computeDistanceScore(double distanceKm) {
        if (distanceKm >= Double.MAX_VALUE) {
            return 50.0; // unknown location -> neutral
        }
        if (distanceKm <= 5.0) return 100.0;
        if (distanceKm >= 50.0) return 0.0;
        return Math.max(0.0, 100.0 * (1.0 - (distanceKm - 5.0) / 45.0));
    }

    private double computeExperienceScore(int years) {
        if (years >= 5) return 100.0;
        if (years >= 3) return 80.0;
        if (years >= 1) return 55.0;
        return 30.0;
    }

    private double computeAvailabilityScore(Availability availability, WorkType workType) {
        if (availability == null || workType == null) return 60.0;
        return switch (workType) {
            case DAILY, WEEKLY -> switch (availability) {
                case IMMEDIATE, PART_TIME, FULL_TIME -> 100.0;
                case EVENINGS -> 60.0;
                case WEEKENDS_ONLY -> 40.0;
            };
            case MONTHLY -> switch (availability) {
                case IMMEDIATE, PART_TIME, FULL_TIME -> 90.0;
                case EVENINGS -> 70.0;
                case WEEKENDS_ONLY -> 50.0;
            };
            case PERMANENT -> switch (availability) {
                case FULL_TIME -> 100.0;
                case IMMEDIATE, PART_TIME -> 70.0;
                case EVENINGS -> 55.0;
                case WEEKENDS_ONLY -> 40.0;
            };
        };
    }

    private double computeSalaryScore(double expected, SalaryUnit expectedUnit, double offered, SalaryUnit offeredUnit) {
        double expectedMonthly = toMonthly(expected, expectedUnit);
        double offeredMonthly = toMonthly(offered, offeredUnit);
        if (expectedMonthly <= 0) return 60.0;
        if (offeredMonthly <= 0) return 60.0;
        double ratio = offeredMonthly / expectedMonthly;
        if (ratio >= 1.0) return 100.0;
        if (ratio >= 0.9) return 80.0;
        if (ratio >= 0.75) return 60.0;
        if (ratio >= 0.6) return 40.0;
        return 20.0;
    }

    private double toMonthly(double amount, SalaryUnit unit) {
        if (unit == null) return amount;
        return switch (unit) {
            case HOURLY -> amount * 8 * 22;
            case PER_SHIFT -> amount * 22;
            case DAILY -> amount * 22;
            case PER_WEEK -> amount * 4.33;
            case MONTHLY -> amount;
        };
    }

    private String buildSummary(WorkerProfile worker, JobPost job, double skillScore, double distanceKm, double salaryScore) {
        StringBuilder sb = new StringBuilder();
        sb.append(worker.getAccount().getName()).append(" matches ").append(job.getTitle());
        if (skillScore >= 80) sb.append(" with strong skill alignment");
        else if (skillScore >= 60) sb.append(" with good skill overlap");
        else sb.append(" with partial skill overlap");
        if (distanceKm < Double.MAX_VALUE && distanceKm <= 10) {
            sb.append(String.format(", located only %.1f km away", distanceKm));
        }
        if (salaryScore >= 80) sb.append(", salary expectations align well");
        return sb.toString();
    }

    @Transactional
    public List<MatchDto> generateMatchesForJob(JobPost job) {
        List<WorkerProfile> workers = workerRepository.findAll();
        List<Match> created = new ArrayList<>();
        for (WorkerProfile worker : workers) {
            Match match = evaluateAndSave(worker, job);
            if (match != null) {
                created.add(match);
            }
        }
        return created.stream().map(MatchDto::from).toList();
    }

    @Transactional
    public List<MatchDto> generateMatchesForWorker(WorkerProfile worker) {
        List<JobPost> jobs = jobRepository.findByStatusOrderByPostedAtDesc(JobStatus.OPEN);
        List<Match> created = new ArrayList<>();
        for (JobPost job : jobs) {
            Match match = evaluateAndSave(worker, job);
            if (match != null) {
                created.add(match);
            }
        }
        return created.stream().map(MatchDto::from).toList();
    }

    @Transactional
    public Match evaluateAndSave(WorkerProfile worker, JobPost job) {
        if (job.getStatus() != JobStatus.OPEN) return null;
        ScoreBreakdown b = evaluate(worker, job);
        if (b.score() < MATCH_THRESHOLD) return null;
        Match match = matchRepository.findByWorkerAndJob(worker.getAccount(), job).orElseGet(() ->
                Match.builder().worker(worker.getAccount()).job(job).build());
        match.setScore(b.score());
        match.setSkillScore(Math.round(b.skillScore() * 100.0) / 100.0);
        match.setDistanceKm(b.distanceKm());
        match.setExperienceScore(Math.round(b.experienceScore() * 100.0) / 100.0);
        match.setAvailabilityScore(Math.round(b.availabilityScore() * 100.0) / 100.0);
        match.setSalaryScore(Math.round(b.salaryScore() * 100.0) / 100.0);
        match.setRatingScore(Math.round(b.ratingScore() * 100.0) / 100.0);
        matchRepository.save(match);

        if (!match.isNotified()) {
            match.setNotified(true);
            matchRepository.save(match);
            notificationService.notify(worker.getAccount(),
                    "New job match (" + String.format("%.0f%%", b.score()) + ")",
                    b.summary(), NotificationType.JOB_MATCH, "/jobs/" + job.getId());
        }
        return match;
    }

    public MatchDto getMatchFor(Long workerId, Long jobId) {
        WorkerAccount worker = workerRepository.findByAccountId(workerId)
                .orElseThrow(() -> ApiException.notFound("Worker profile not found")).getAccount();
        JobPost job = jobRepository.findById(jobId).orElseThrow(() -> ApiException.notFound("Job not found"));
        Match match = matchRepository.findByWorkerAndJob(worker, job)
                .orElseThrow(() -> ApiException.notFound("No match exists"));
        return MatchDto.from(match);
    }

    @Transactional
    public void markViewed(Long matchId, WorkerAccount worker) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> ApiException.notFound("Match not found"));
        if (!match.getWorker().getId().equals(worker.getId())) {
            throw ApiException.forbidden("Not your match");
        }
        match.setViewed(true);
        matchRepository.save(match);
    }
}
