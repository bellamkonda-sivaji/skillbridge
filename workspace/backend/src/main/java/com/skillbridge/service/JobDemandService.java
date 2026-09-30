package com.skillbridge.service;

import com.skillbridge.dto.JobDemandDto;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Watches every live job and tells the employer, in one sentence, whether it is going to fill
 * - and if not, what price would fix it.
 *
 * The design rule here is that the platform must never invent a number. A shop owner who is
 * told "raise it to Rs 1,050" and does so has spent real money on our advice. So every figure
 * we put in front of them is traceable to something we actually hold:
 *
 *   - the urgency window comes from the employer's OWN dates (a one-day job starting tomorrow
 *     has hours, a permanent role has days), never from a fixed guess;
 *   - the suggested price comes from the median of comparable local postings, and when there
 *     are fewer than three comparables we say we do not know instead of guessing;
 *   - the reach figures come from counting registered workers in that city whose stated
 *     expected pay the job would actually meet.
 *
 * When none of that is available the verdict still stands ("nobody has applied") but the
 * suggestion is null, and the employer is pointed at the admin desk instead of a made-up
 * rupee figure. That is the honest failure mode.
 */
@Service
public class JobDemandService {

    /** Below this many comparable postings the median is noise, so we report nothing. */
    private static final int MIN_COMPARABLES = 3;

    /** We need roughly two applicants per opening to actually fill it - people drop out. */
    private static final double APPLICANTS_PER_OPENING = 2.0;

    /** Never advise a raise larger than this, however bad the numbers look. */
    private static final double MAX_SUGGESTED_RAISE = 0.40;

    /** Do not nag the same employer about the same job more often than this. */
    private static final Duration ALERT_COOLDOWN = Duration.ofHours(6);

    private final JobPostRepository jobs;
    private final JobApplicationRepository applications;
    private final WorkerProfileRepository workers;
    private final JobPriceChangeRepository priceChanges;
    private final PricingService pricing;
    private final NotificationService notifications;

    public JobDemandService(JobPostRepository jobs, JobApplicationRepository applications,
                            WorkerProfileRepository workers, JobPriceChangeRepository priceChanges,
                            PricingService pricing, NotificationService notifications) {
        this.jobs = jobs;
        this.applications = applications;
        this.workers = workers;
        this.priceChanges = priceChanges;
        this.pricing = pricing;
        this.notifications = notifications;
    }

    // ================================================================= the urgency window

    /**
     * How long the employer has before this job needs to be filled, in hours.
     *
     * A one-day job that starts tomorrow morning is the sharp case the whole feature exists
     * for: the employer needs somebody today, so the window is an hour, not a day. A permanent
     * role can take a week without anything being wrong. We read that straight off the job's
     * own dates rather than applying a blanket rule.
     */
    public int windowHours(JobPost job) {
        EngagementModel model = job.getEngagementModel() != null
                ? job.getEngagementModel() : EngagementModel.MONTHS;

        Long hoursToStart = hoursUntilStart(job);

        switch (model) {
            case ONE_DAY: {
                // The work is tomorrow or today - an hour is genuinely all the slack there is.
                if (hoursToStart != null && hoursToStart <= 48) {
                    return 1;
                }
                return 6;
            }
            case FEW_DAYS: {
                if (hoursToStart != null && hoursToStart <= 48) {
                    return 2;
                }
                return 12;
            }
            case FEW_WEEKS:
                return 24;
            case MONTHS:
                return 48;
            case PERMANENT:
            default:
                return 72;
        }
    }

    /** Hours from now until the work is due to start, null when the job carries no date. */
    private Long hoursUntilStart(JobPost job) {
        LocalDate date = job.getWorkDate() != null ? job.getWorkDate() : job.getStartDate();
        if (date == null) {
            return null;
        }
        LocalTime at = LocalTime.of(9, 0);
        if (job.getShifts() != null && !job.getShifts().isEmpty()
                && job.getShifts().get(0).getStartTime() != null) {
            at = job.getShifts().get(0).getStartTime();
        }
        long hours = Duration.between(LocalDateTime.now(), LocalDateTime.of(date, at)).toHours();
        return Math.max(0, hours);
    }

    // ================================================================= the read

    @Transactional
    public JobDemandDto assess(JobPost job) {
        LocalDateTime now = LocalDateTime.now();
        int applicants = (int) applications.countByJobId(job.getId());
        int needed = Math.max(1, job.getWorkersNeeded());
        long hoursLive = job.getPostedAt() == null ? 0
                : Math.max(0, Duration.between(job.getPostedAt(), now).toHours());
        int window = windowHours(job);
        boolean windowPassed = hoursLive >= window;

        if (applicants > 0 && job.getFirstApplicantAt() == null) {
            job.setFirstApplicantAt(now);
        }

        // ---- verdict -------------------------------------------------------------
        DemandVerdict verdict;
        if (job.getStatus() != JobStatus.OPEN) {
            verdict = DemandVerdict.DONE;
        } else if (applicants >= Math.ceil(needed * APPLICANTS_PER_OPENING)) {
            verdict = DemandVerdict.HEALTHY;
        } else if (!windowPassed) {
            verdict = DemandVerdict.TOO_EARLY;
        } else if (applicants == 0) {
            verdict = DemandVerdict.STALLED;
        } else {
            verdict = DemandVerdict.SLOW;
        }

        // ---- what comparable local work pays --------------------------------------
        Market market = market(job);

        // ---- the suggestion, only where it is backed ------------------------------
        Double suggested = null;
        Double increasePercent = null;
        if (verdict == DemandVerdict.SLOW || verdict == DemandVerdict.STALLED) {
            suggested = suggestFor(job, market, hoursLive, window);
            if (suggested != null && job.getSalary() > 0) {
                increasePercent = PricingService.round2(
                        (suggested - job.getSalary()) / job.getSalary() * 100d);
            }
        }

        // ---- how many workers the price actually reaches ---------------------------
        Integer reachNow = reach(job, job.getWorkerSalary() > 0
                ? job.getWorkerSalary() : pricing.takeHome(job.getSalary()));
        Integer reachAt = suggested == null ? null : reach(job, pricing.takeHome(suggested));

        job.setDemandVerdict(verdict);
        job.setSuggestedSalary(suggested);
        job.setDemandCheckedAt(now);

        String[] words = words(job, verdict, applicants, needed, window, suggested, market);

        return new JobDemandDto(
                job.getId(),
                job.getTitle(),
                verdict,
                words[0],
                words[1],
                words[2],
                applicants,
                needed,
                window,
                hoursLive,
                windowPassed,
                job.getSalary(),
                suggested,
                increasePercent,
                market.median,
                market.count,
                reachAt,
                reachNow,
                now);
    }

    @Transactional(readOnly = true)
    public JobDemandDto assessReadOnly(JobPost job) {
        return assess(job);
    }

    // ================================================================= market comparables

    /** What comparable local postings pay. {@code median} is null below MIN_COMPARABLES. */
    public record Market(Double median, Double p75, int count) {}

    public Market market(JobPost job) {
        if (job.getCity() == null || job.getWorkerCategory() == null || job.getSalaryUnit() == null) {
            return new Market(null, null, 0);
        }
        List<JobPost> peers = jobs.findComparables(
                job.getId(), job.getCity(), job.getWorkerCategory(), job.getSalaryUnit(),
                LocalDateTime.now().minusDays(90));
        if (peers.size() < MIN_COMPARABLES) {
            return new Market(null, null, peers.size());
        }
        List<Double> salaries = new ArrayList<>();
        for (JobPost p : peers) {
            salaries.add(p.getSalary());
        }
        salaries.sort(Comparator.naturalOrder());
        return new Market(percentile(salaries, 50), percentile(salaries, 75), salaries.size());
    }

    private static Double percentile(List<Double> sorted, int p) {
        if (sorted.isEmpty()) {
            return null;
        }
        int index = (int) Math.round((p / 100d) * (sorted.size() - 1));
        return PricingService.round2(sorted.get(Math.min(sorted.size() - 1, Math.max(0, index))));
    }

    /**
     * The price to advise.
     *
     * Preference order, strongest evidence first:
     *   1. comparable local postings pay more than this job  -> advise the local rate;
     *   2. no comparables, but the job is badly overdue      -> advise a measured step up,
     *      scaled by how far past the window it is, capped;
     *   3. otherwise                                          -> advise nothing.
     *
     * Returns null rather than a number we cannot defend.
     */
    private Double suggestFor(JobPost job, Market market, long hoursLive, int window) {
        double current = job.getSalary();
        if (current <= 0) {
            return null;
        }
        Double target = null;

        if (market.median != null && market.median > current) {
            // Aim at the point where the job stops being the cheapest on the street.
            target = Math.max(market.median, current);
            if (market.p75 != null && hoursLive >= window * 2L) {
                target = market.p75;
            }
        } else if (market.median == null) {
            // No local evidence. Only advise when the window has genuinely run out, and keep
            // the step small - this is the weaker signal and the number reflects that.
            if (hoursLive < window) {
                return null;
            }
            double overdue = (double) hoursLive / Math.max(1, window);
            double step = overdue >= 3 ? 0.20 : overdue >= 2 ? 0.15 : 0.10;
            target = current * (1 + step);
        }

        if (target == null) {
            return null;
        }
        double capped = Math.min(target, current * (1 + MAX_SUGGESTED_RAISE));
        double rounded = roundToFriendly(capped);
        return rounded > current ? rounded : null;
    }

    /**
     * Rupee figures people actually say out loud. Nobody offers Rs 1,047 for a day's work -
     * they offer Rs 1,050. Rounding up also means our advice is never short of the market.
     */
    private static double roundToFriendly(double amount) {
        if (amount < 1000) {
            return Math.ceil(amount / 10d) * 10;
        }
        if (amount < 10000) {
            return Math.ceil(amount / 50d) * 50;
        }
        return Math.ceil(amount / 500d) * 500;
    }

    // ================================================================= reach

    /**
     * How many registered workers in this city have said they would work for this take-home.
     * Null when we hold too little profile data in that city to say anything truthful.
     */
    private Integer reach(JobPost job, double takeHome) {
        if (job.getCity() == null || takeHome <= 0) {
            return null;
        }
        List<WorkerProfile> pool = workers.findByCityIgnoreCase(job.getCity());
        if (pool.size() < MIN_COMPARABLES) {
            return null;
        }
        int count = 0;
        for (WorkerProfile w : pool) {
            if (w.getExpectedSalary() <= 0) {
                // No stated expectation - they have not ruled the job out, so they count.
                count++;
            } else if (w.getSalaryUnit() == job.getSalaryUnit() && w.getExpectedSalary() <= takeHome) {
                count++;
            }
        }
        return count;
    }

    // ================================================================= wording

    /** headline, detail, i18n key - short enough to be read aloud to someone who cannot read. */
    private String[] words(JobPost job, DemandVerdict verdict, int applicants, int needed,
                           int window, Double suggested, Market market) {
        String title = job.getTitle() == null ? "this job" : job.getTitle();
        switch (verdict) {
            case HEALTHY:
                return new String[]{
                        applicants + " people want this job",
                        "You have enough people for " + title + ". Pick one and call them.",
                        "demand.healthy"};
            case TOO_EARLY:
                return new String[]{
                        "Just posted",
                        "Give it " + window + (window == 1 ? " hour" : " hours") + ". We will tell you if nobody comes.",
                        "demand.tooEarly"};
            case SLOW: {
                // Once applicants match the openings the problem is no longer a shortage of
                // people, it is that some will drop out - so say that, rather than claiming
                // they still need workers they already have.
                String base = applicants >= needed
                        ? applicants + (applicants == 1 ? " person has" : " people have")
                          + " applied for " + needed + (needed == 1 ? " opening" : " openings")
                          + ". Some will not turn up, so a few more would be safer."
                        : "Only " + applicants + (applicants == 1 ? " person has" : " people have")
                          + " applied. You need " + needed + ".";
                if (suggested != null) {
                    return new String[]{
                            "A few more would help",
                            base + " Raise the pay to \u20b9" + trim(suggested) + " and more will come.",
                            "demand.slowRaise"};
                }
                return new String[]{"A few more would help", base + " Our team can call workers for you.",
                        "demand.slowCall"};
            }
            case STALLED: {
                String base = "Nobody has applied for " + title + " yet.";
                if (suggested != null) {
                    String why = market.median != null
                            ? " Shops near you pay \u20b9" + trim(market.median) + " for this work."
                            : "";
                    return new String[]{
                            "No one has applied",
                            base + " Raise the pay to \u20b9" + trim(suggested) + "." + why,
                            "demand.stalledRaise"};
                }
                return new String[]{"No one has applied",
                        base + " Our team will call workers for you.", "demand.stalledCall"};
            }
            case DONE:
            default:
                return new String[]{"Closed", "This job is no longer taking applications.", "demand.done"};
        }
    }

    /**
     * Rupees the way they are written in India - 1,100 and 18,000, not 1100.0. These strings go
     * straight into a push notification, so they have to read like money on first glance.
     */
    private static String trim(double v) {
        long whole = (long) Math.rint(v);
        if (Math.abs(v - whole) > 0.005) {
            return String.format("%,.2f", v).replace(",", "@").replace("@", ",");
        }
        String digits = String.valueOf(Math.abs(whole));
        if (digits.length() <= 3) {
            return (whole < 0 ? "-" : "") + digits;
        }
        // Indian grouping: the last three digits, then pairs.
        String tail = digits.substring(digits.length() - 3);
        String head = digits.substring(0, digits.length() - 3);
        StringBuilder out = new StringBuilder();
        while (head.length() > 2) {
            out.insert(0, "," + head.substring(head.length() - 2));
            head = head.substring(0, head.length() - 2);
        }
        if (!head.isEmpty()) {
            out.insert(0, head);
        }
        return (whole < 0 ? "-" : "") + out + "," + tail;
    }

    // ================================================================= the sweep

    /**
     * Every ten minutes, look at every open job and alert the employers whose jobs are in
     * trouble. Ten minutes is fine-grained enough for the one-hour window on a next-day job
     * without waking the employer's phone more than the cooldown allows.
     */
    @Scheduled(fixedDelay = 600_000, initialDelay = 120_000)
    @Transactional
    public void sweep() {
        List<JobPost> open = jobs.findByStatusOrderByPostedAtDesc(JobStatus.OPEN);
        LocalDateTime now = LocalDateTime.now();
        for (JobPost job : open) {
            try {
                JobDemandDto read = assess(job);
                boolean needsAlert = read.verdict() == DemandVerdict.STALLED
                        || read.verdict() == DemandVerdict.SLOW;
                boolean cooled = job.getDemandAlertedAt() == null
                        || Duration.between(job.getDemandAlertedAt(), now).compareTo(ALERT_COOLDOWN) >= 0;
                if (needsAlert && cooled && job.getEmployer() != null) {
                    notifications.notify(
                            AccountType.EMPLOYER,
                            job.getEmployer().getId(),
                            read.headline(),
                            read.detail(),
                            NotificationType.PRICING,
                            "/employer/jobs/" + job.getId());
                    job.setDemandAlertedAt(now);
                }
                jobs.save(job);
            } catch (RuntimeException ex) {
                // One bad job must never stop the sweep for every other employer.
            }
        }
    }
}
