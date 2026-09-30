package com.skillbridge.service;

import com.skillbridge.dto.admin.AdminDtos.*;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

/**
 * The shared read model behind every back-office screen: one load of the operational tables per
 * request, indexed the handful of ways the admin rows need it. The dataset is deliberately small,
 * so this is a straightforward in-memory join rather than a pile of bespoke queries.
 */
@Component
public class BackOfficeAssembler {

    private final JobApplicationRepository applicationRepository;
    private final JobOfferRepository offerRepository;
    private final EmploymentRepository employmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final InterviewRepository interviewRepository;
    private final ContactLogRepository contactLogRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final MatchRepository matchRepository;

    /** Never hard-coded: the same configured percentage the pricing engine and offers use. */
    @Value("${skillbridge.pricing.platform-fee-percent:0}")
    private double platformFeePercent;

    public BackOfficeAssembler(JobApplicationRepository applicationRepository,
                               JobOfferRepository offerRepository,
                               EmploymentRepository employmentRepository,
                               AttendanceRepository attendanceRepository,
                               InterviewRepository interviewRepository,
                               ContactLogRepository contactLogRepository,
                               EmployerProfileRepository employerProfileRepository,
                               WorkerProfileRepository workerProfileRepository,
                               WalletRepository walletRepository,
                               WalletTransactionRepository transactionRepository,
                               MatchRepository matchRepository) {
        this.applicationRepository = applicationRepository;
        this.offerRepository = offerRepository;
        this.employmentRepository = employmentRepository;
        this.attendanceRepository = attendanceRepository;
        this.interviewRepository = interviewRepository;
        this.contactLogRepository = contactLogRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.matchRepository = matchRepository;
    }

    public double platformFeePercent() {
        return platformFeePercent;
    }

    /** The configured cut of a worker payout, or null when no percentage is configured. */
    public Double platformFeeOn(Double workerAmount) {
        if (workerAmount == null || platformFeePercent <= 0) {
            return null;
        }
        return Math.round(workerAmount * platformFeePercent) / 100.0;
    }

    // ================================================================== the loaded snapshot

    /** One request's view of the operational tables. */
    public final class Snapshot {
        public final List<JobApplication> applications;
        public final Map<Long, List<ContactLog>> contactsByApplication = new HashMap<>();
        public final Map<Long, JobOffer> offerByApplication = new HashMap<>();
        public final Map<Long, Employment> employmentByApplication = new HashMap<>();
        public final Map<String, Interview> interviewByWorkerJob = new HashMap<>();
        public final Map<String, List<Interview>> interviewsByWorkerJob = new HashMap<>();
        public final List<Interview> interviews;
        public final Map<Long, EmployerProfile> employerProfiles = new HashMap<>();
        public final Map<Long, WorkerProfile> workerProfiles = new HashMap<>();
        public final Map<String, Match> matchByWorkerJob = new HashMap<>();

        private Snapshot() {
            this.applications = applicationRepository.findAll();
            for (ContactLog log : contactLogRepository.findAll()) {
                if (log.getApplicationId() != null) {
                    contactsByApplication.computeIfAbsent(log.getApplicationId(), k -> new ArrayList<>())
                            .add(log);
                }
            }
            contactsByApplication.values()
                    .forEach(l -> l.sort(Comparator.comparing(ContactLog::getContactedAt)));
            for (JobOffer offer : offerRepository.findAll()) {
                offerByApplication.put(offer.getApplication().getId(), offer);
            }
            for (Employment e : employmentRepository.findAll()) {
                if (e.getApplication() != null) {
                    employmentByApplication.put(e.getApplication().getId(), e);
                }
            }
            this.interviews = interviewRepository.findAllByOrderByScheduledAtDesc();
            for (Interview i : interviews) {
                if (i.getJob() == null) {
                    continue;
                }
                String key = key(i.getWorker().getId(), i.getJob().getId());
                interviewsByWorkerJob.computeIfAbsent(key, k -> new ArrayList<>()).add(i);
                interviewByWorkerJob.putIfAbsent(key, i);
            }
            interviewsByWorkerJob.values()
                    .forEach(l -> l.sort(Comparator.comparing(Interview::getScheduledAt)));
            employerProfileRepository.findAll()
                    .forEach(p -> employerProfiles.put(p.getAccount().getId(), p));
            workerProfileRepository.findAll()
                    .forEach(p -> workerProfiles.put(p.getAccount().getId(), p));
            for (Match m : matchRepository.findAll()) {
                matchByWorkerJob.put(key(m.getWorker().getId(), m.getJob().getId()), m);
            }
        }

        public List<ContactLog> contacts(JobApplication a) {
            return contactsByApplication.getOrDefault(a.getId(), List.of());
        }

        public JobOffer offer(JobApplication a) {
            return offerByApplication.get(a.getId());
        }

        public Employment employment(JobApplication a) {
            return employmentByApplication.get(a.getId());
        }

        public List<Interview> interviews(JobApplication a) {
            return interviewsByWorkerJob.getOrDefault(
                    key(a.getWorker().getId(), a.getJob().getId()), List.of());
        }

        public Interview latestInterview(JobApplication a) {
            List<Interview> all = interviews(a);
            return all.isEmpty() ? null : all.get(all.size() - 1);
        }

        public String businessName(Long employerAccountId) {
            EmployerProfile p = employerProfiles.get(employerAccountId);
            return p != null && p.getBusinessName() != null ? p.getBusinessName() : null;
        }
    }

    public Snapshot snapshot() {
        return new Snapshot();
    }

    public static String key(Long a, Long b) {
        return a + ":" + b;
    }

    // ================================================================== derived facts

    public boolean isContacted(Snapshot s, JobApplication a) {
        return !s.contacts(a).isEmpty();
    }

    public boolean isHired(Snapshot s, JobApplication a) {
        return s.employment(a) != null || a.getStatus() == ApplicationStatus.ACCEPTED;
    }

    public boolean isPaid(JobApplication a) {
        return a.isPaymentSettled() && paymentTransaction(a) != null;
    }

    public boolean isShortlisted(JobApplication a) {
        return a.getShortlistedAt() != null
                || EnumSet.of(ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW_SCHEDULED,
                        ApplicationStatus.OFFERED, ApplicationStatus.ACCEPTED).contains(a.getStatus());
    }

    public boolean isInterviewed(Snapshot s, JobApplication a) {
        if (a.getInterviewResult() != null) {
            return true;
        }
        return s.interviews(a).stream().anyMatch(i -> i.getStatus() == InterviewStatus.COMPLETED);
    }

    public boolean employerResponded(JobApplication a) {
        return a.getViewedAt() != null || a.getShortlistedAt() != null || a.getDecisionAt() != null
                || a.getInterviewResultAt() != null;
    }

    public LocalDateTime employerRespondedAt(JobApplication a) {
        return firstNonNull(a.getViewedAt(), a.getShortlistedAt(), a.getInterviewResultAt(),
                a.getDecisionAt());
    }

    /** Where the application actually stands, which is richer than the status column alone. */
    public String stageOf(Snapshot s, JobApplication a) {
        if (isPaid(a)) {
            return "PAID";
        }
        Employment employment = s.employment(a);
        if (employment != null) {
            if (employment.getStatus() == EmploymentStatus.COMPLETED
                    || employment.getStatus() == EmploymentStatus.ENDED) {
                return "COMPLETED";
            }
            if (!attendanceOf(employment).isEmpty()) {
                return "ATTENDANCE";
            }
            return "JOINED";
        }
        JobOffer offer = s.offer(a);
        if (offer != null && offer.getStatus() == OfferStatus.ACCEPTED) {
            return "OFFER_ACCEPTED";
        }
        if (offer != null && offer.getStatus() == OfferStatus.DECLINED) {
            return "OFFER_DECLINED";
        }
        if (a.getStatus() == ApplicationStatus.WITHDRAWN) {
            return "WITHDRAWN";
        }
        if (a.getStatus() == ApplicationStatus.REJECTED) {
            return "REJECTED";
        }
        if (offer != null) {
            return "OFFERED";
        }
        if (isInterviewed(s, a)) {
            return "INTERVIEWED";
        }
        if (!s.interviews(a).isEmpty() || a.getInterviewAt() != null) {
            return "INTERVIEW_SCHEDULED";
        }
        if (isShortlisted(a)) {
            return "SHORTLISTED";
        }
        if (isContacted(s, a)) {
            return "CONTACTED";
        }
        if (a.getViewedAt() != null) {
            return "VIEWED";
        }
        return "APPLIED";
    }

    public List<Attendance> attendanceOf(Employment employment) {
        if (employment == null) {
            return List.of();
        }
        List<Attendance> rows = new ArrayList<>(
                attendanceRepository.findByEmploymentOrderByWorkDateDesc(employment));
        rows.sort(Comparator.comparing(Attendance::getWorkDate));
        return rows;
    }

    /**
     * A day counts once it is finished AND approved. Since the approval column exists, this is a
     * straight read of it rather than the old "checked out with minutes" guess - and because
     * FEW_WEEKS / MONTHS / PERMANENT days are AUTO_APPROVED on punch-out, everything the back
     * office used to count still counts.
     */
    public boolean attendanceApproved(Attendance a) {
        return AttendanceRules.counts(a);
    }

    /** The worker-side credit that settled this application's job, if one was ever written. */
    public WalletTransaction paymentTransaction(JobApplication a) {
        Wallet wallet = walletRepository
                .findByOwnerTypeAndOwnerId(AccountType.WORKER, a.getWorker().getId())
                .orElse(null);
        if (wallet == null) {
            return null;
        }
        return transactionRepository.findByWalletOrderByCreatedAtDesc(wallet).stream()
                .filter(t -> t.getType() == WalletTransaction.Type.CREDIT
                        && t.getReference() == WalletTransaction.Reference.JOB_PAYMENT
                        && Objects.equals(t.getJobId(), a.getJob().getId()))
                .findFirst().orElse(null);
    }

    // ================================================================== rows

    public ApplicantRowDto applicantRow(Snapshot s, JobApplication a) {
        List<ContactLog> contacts = s.contacts(a);
        ContactLog last = contacts.isEmpty() ? null : contacts.get(contacts.size() - 1);
        Interview interview = s.latestInterview(a);
        JobOffer offer = s.offer(a);
        Match match = s.matchByWorkerJob.get(key(a.getWorker().getId(), a.getJob().getId()));
        WorkerProfile profile = s.workerProfiles.get(a.getWorker().getId());
        return new ApplicantRowDto(
                a.getId(), a.getWorker().getId(), a.getWorker().getName(), a.getWorker().getPhone(),
                a.getWorker().getPhotoUrl(), a.getWorker().getAvgRating(), a.getWorker().getRatingCount(),
                match != null ? round1(match.getDistanceKm()) : null,
                match != null ? (int) Math.round(match.getScore()) : null,
                a.getStatus(), a.getAppliedAt(),
                last == null ? null : last.getContactedAt(),
                last == null ? null : last.getOutcome(),
                contacts.size(),
                interview != null ? interview.getScheduledAt() : a.getInterviewAt(),
                offer == null ? null : offer.getStatus(),
                isHired(s, a), isPaid(a));
    }

    public ApplicationRowDto applicationRow(Snapshot s, JobApplication a) {
        List<ContactLog> contacts = s.contacts(a);
        ContactLog last = contacts.isEmpty() ? null : contacts.get(contacts.size() - 1);
        Interview interview = s.latestInterview(a);
        JobOffer offer = s.offer(a);
        JobPost job = a.getJob();
        Long employerId = job.getEmployer().getId();
        return new ApplicationRowDto(
                a.getId(), a.getWorker().getId(), a.getWorker().getName(), a.getWorker().getPhone(),
                a.getWorker().getPhotoUrl(), job.getId(), job.getTitle(), employerId,
                displayBusinessName(s, job.getEmployer()), a.getStatus(), stageOf(s, a), a.getAppliedAt(),
                !contacts.isEmpty(), contacts.size(),
                last == null ? null : last.getContactedAt(),
                last == null ? null : last.getOutcome(),
                interview != null ? interview.getScheduledAt() : a.getInterviewAt(),
                offer == null ? null : offer.getStatus(),
                isHired(s, a), isPaid(a));
    }

    public String displayBusinessName(Snapshot s, EmployerAccount employer) {
        String business = s.businessName(employer.getId());
        return business != null ? business : employer.getName();
    }

    public JobStatsDto jobStats(Snapshot s, Long jobId) {
        long applicants = 0, contacted = 0, shortlisted = 0, interviewed = 0, offered = 0, hired = 0;
        for (JobApplication a : s.applications) {
            if (!a.getJob().getId().equals(jobId)) {
                continue;
            }
            applicants++;
            if (isContacted(s, a)) contacted++;
            if (isShortlisted(a)) shortlisted++;
            if (isInterviewed(s, a)) interviewed++;
            if (s.offer(a) != null) offered++;
            if (isHired(s, a)) hired++;
        }
        return new JobStatsDto(applicants, contacted, applicants - contacted, shortlisted,
                interviewed, offered, hired);
    }

    public JobRowDto jobRow(Snapshot s, JobPost job) {
        JobStatsDto stats = jobStats(s, job.getId());
        return new JobRowDto(job.getId(), job.getTitle(), job.getEmployer().getId(),
                displayBusinessName(s, job.getEmployer()), job.getEngagementModel(),
                job.getWorkPattern(), job.getStatus(), job.getSalary(), job.getSalaryUnit(),
                location(job), job.getPostedAt(), job.getWorkersNeeded(),
                stats.applicantCount(), stats.contactedCount(), stats.notContactedCount(),
                stats.shortlistedCount(), stats.interviewedCount(), stats.offeredCount(),
                stats.hiredCount());
    }

    public static String location(JobPost job) {
        if (job.getArea() != null && !job.getArea().isBlank()) {
            return job.getArea() + ", " + job.getCity();
        }
        return job.getCity();
    }

    public InterviewRowDto interviewRow(Snapshot s, Interview i) {
        JobPost job = i.getJob();
        JobApplication application = null;
        if (job != null) {
            for (JobApplication a : s.applications) {
                if (a.getWorker().getId().equals(i.getWorker().getId())
                        && a.getJob().getId().equals(job.getId())) {
                    application = a;
                    break;
                }
            }
        }
        EmployerAccount employer = i.getEmployer();
        return new InterviewRowDto(i.getId(),
                application == null ? null : application.getId(),
                job == null ? null : job.getId(),
                job == null ? null : job.getTitle(),
                employer.getId(), displayBusinessName(s, employer),
                i.getWorker().getId(), i.getWorker().getName(), i.getWorker().getPhone(),
                i.getScheduledAt(), i.getMode() == null ? null : i.getMode().canonical(),
                i.getLocation() != null ? i.getLocation() : i.getAddressLine(),
                i.getInterviewerName() != null ? i.getInterviewerName() : employer.getName(),
                i.getInterviewerPhone() != null ? i.getInterviewerPhone() : employer.getPhone(),
                i.getStatus(),
                application == null ? null : application.getInterviewResult(),
                application == null ? null : application.getInterviewFeedback(),
                i.getCreatedAt(), InterviewMode.labelOf(i.getMode()));
    }

    public ContactLogDto contactDto(ContactLog log) {
        return new ContactLogDto(log.getId(), log.getApplicationId(), log.getJobId(), log.getWorkerId(),
                log.getEmployerId(), log.getChannel(), log.getOutcome(), log.getNote(),
                log.getContactedByAdminId(), log.getContactedByName(), log.getContactedAt(),
                log.getNextCallAt());
    }

    // ================================================================== small helpers

    public static Double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    public static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    @SafeVarargs
    public static <T> T firstNonNull(T... values) {
        for (T v : values) {
            if (v != null) {
                return v;
            }
        }
        return null;
    }

    public static boolean matches(String q, String... fields) {
        if (q == null || q.isBlank()) {
            return true;
        }
        String needle = q.toLowerCase().trim();
        for (String f : fields) {
            if (f != null && f.toLowerCase().contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
