package com.skillbridge.service;

import com.skillbridge.dto.JobCardDto;
import com.skillbridge.model.JobApplication;
import com.skillbridge.model.JobPost;
import com.skillbridge.model.SavedJob;
import com.skillbridge.model.WorkerAccount;
import com.skillbridge.model.WorkerProfile;
import com.skillbridge.repository.JobApplicationRepository;
import com.skillbridge.repository.SavedJobRepository;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Builds the single {@link JobCardDto} shape every worker screen renders. The match score is
 * computed live rather than read from the matches table, so cards below the notification
 * threshold still carry a real number instead of a null.
 */
@Component
public class JobCardAssembler {

    private final SavedJobRepository savedJobRepository;
    private final JobApplicationRepository applicationRepository;
    private final MatchingService matchingService;
    private final GeoService geoService;

    public JobCardAssembler(SavedJobRepository savedJobRepository,
                            JobApplicationRepository applicationRepository,
                            MatchingService matchingService, GeoService geoService) {
        this.savedJobRepository = savedJobRepository;
        this.applicationRepository = applicationRepository;
        this.matchingService = matchingService;
        this.geoService = geoService;
    }

    /**
     * Worker-scoped context, loaded once so a list of cards is not N+1 lookups.
     *
     * {@code originLat}/{@code originLng} override where distances are measured FROM. They are
     * null unless the app sent the phone's current position ("jobs near me right now"); then
     * the profile's home pin is used, exactly as before.
     */
    public record CardContext(WorkerProfile profile, Set<Long> savedJobIds, Set<Long> appliedJobIds,
                              Double originLat, Double originLng) {

        public CardContext(WorkerProfile profile, Set<Long> savedJobIds, Set<Long> appliedJobIds) {
            this(profile, savedJobIds, appliedJobIds, null, null);
        }

        /** The same context measuring from {@code lat,lng} when that is a usable point; unchanged otherwise. */
        public CardContext withOrigin(Double lat, Double lng) {
            return isUsablePoint(lat, lng)
                    ? new CardContext(profile, savedJobIds, appliedJobIds, lat, lng)
                    : this;
        }

        public boolean hasOriginOverride() {
            return originLat != null && originLng != null;
        }

        /** Where distance is measured from, or null when neither an override nor a home pin is known. */
        public double[] origin() {
            if (hasOriginOverride()) {
                return new double[]{originLat, originLng};
            }
            if (profile == null || (profile.getLatitude() == 0 && profile.getLongitude() == 0)) {
                return null;
            }
            return new double[]{profile.getLatitude(), profile.getLongitude()};
        }
    }

    /**
     * A point the app sent that we can measure from: both halves present, finite, on the globe,
     * and not the 0,0 that an unset GPS fix reports.
     */
    public static boolean isUsablePoint(Double lat, Double lng) {
        if (lat == null || lng == null || lat.isNaN() || lng.isNaN()
                || lat.isInfinite() || lng.isInfinite()) {
            return false;
        }
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            return false;
        }
        return !(lat == 0 && lng == 0);
    }

    /** Distance in km (1 dp) from the context's origin to the job; null when either side is unknown. */
    public Double distanceKm(CardContext context, JobPost job) {
        double[] origin = context.origin();
        return origin == null ? null
                : geoService.distanceKmOrNull(origin[0], origin[1], job.getLatitude(), job.getLongitude());
    }

    public CardContext contextFor(WorkerAccount worker, WorkerProfile profile) {
        Set<Long> saved = savedJobRepository.findByWorkerOrderByCreatedAtDesc(worker).stream()
                .map(s -> s.getJob().getId()).collect(Collectors.toCollection(HashSet::new));
        Set<Long> applied = applicationRepository.findByWorkerOrderByAppliedAtDesc(worker).stream()
                .map(a -> a.getJob().getId()).collect(Collectors.toCollection(HashSet::new));
        return new CardContext(profile, saved, applied);
    }

    public List<JobCardDto> cards(List<JobPost> jobs, CardContext context) {
        return jobs.stream().map(j -> card(j, context)).toList();
    }

    public JobCardDto card(JobPost job, CardContext context) {
        WorkerProfile profile = context.profile();
        Double distanceKm = distanceKm(context, job);
        Double matchScore = profile == null ? null
                : Math.round(matchingService.evaluate(profile, job).score() * 10.0) / 10.0;
        return new JobCardDto(
                job.getId(),
                job.getTitle(),
                job.getEmployer().getProfile() != null
                        ? job.getEmployer().getProfile().getBusinessName() : job.getEmployer().getName(),
                job.getEmployer().getId(),
                // Worker-facing screens show the take-home, never the employer's gross. A
                // worker who reads one number and is paid a smaller one stops trusting us.
                job.getWorkerSalary() > 0 ? job.getWorkerSalary() : job.getSalary(),
                job.getSalaryUnit(),
                job.getWorkType(),
                job.getEmploymentType(),
                job.getCity(),
                job.getArea(),
                distanceKm,
                job.getLatitude(),
                job.getLongitude(),
                job.isUrgent(),
                context.savedJobIds().contains(job.getId()),
                matchScore,
                context.appliedJobIds().contains(job.getId()),
                List.copyOf(job.getRequiredSkills()),
                job.getPostedAt(),
                job.getWorkersNeeded(),
                job.getEngagementModel(),
                job.getWorkPattern());
    }

    /** Sort rule the contract fixes: match score desc, then distance asc, unknowns last. */
    public List<JobCardDto> sorted(List<JobCardDto> cards) {
        return cards.stream().sorted((a, b) -> {
            double sa = a.matchScore() != null ? a.matchScore() : -1;
            double sb = b.matchScore() != null ? b.matchScore() : -1;
            int byScore = Double.compare(sb, sa);
            if (byScore != 0) {
                return byScore;
            }
            double da = a.distanceKm() != null ? a.distanceKm() : Double.MAX_VALUE;
            double db = b.distanceKm() != null ? b.distanceKm() : Double.MAX_VALUE;
            return Double.compare(da, db);
        }).toList();
    }

    /** Convenience for the few places that hold a JobApplication and want its card. */
    public JobCardDto cardFor(JobApplication application, CardContext context) {
        return card(application.getJob(), context);
    }

    public JobCardDto cardFor(SavedJob saved, CardContext context) {
        return card(saved.getJob(), context);
    }
}
