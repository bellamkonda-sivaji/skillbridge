package com.skillbridge.config;

import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Seeds the two things that only exist in the "real hiring" model: the lead inbox, and enough
 * deliberately-stuck state that the call queue is a worklist rather than an empty page.
 *
 * <p>Each rule the queue implements gets at least one row planted for it on purpose, because a
 * demo where the queue happens to be empty teaches the operator nothing about what it is for.
 * Runs after {@link BackOfficeSeeder} so it can adjust the state that seeder left behind.
 */
@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
        name = "skillbridge.seed.enabled", havingValue = "true", matchIfMissing = true)
@Order(3)
public class CallQueueSeeder implements CommandLineRunner {

    private final LeadRepository leadRepository;
    private final ContactLogRepository contactLogRepository;
    private final JobApplicationRepository applicationRepository;
    private final JobOfferRepository offerRepository;
    private final JobPostRepository jobRepository;
    private final EmploymentRepository employmentRepository;
    private final AdminAccountRepository adminRepository;
    private final WorkerAccountRepository workerRepository;

    public CallQueueSeeder(LeadRepository leadRepository, ContactLogRepository contactLogRepository,
                           JobApplicationRepository applicationRepository,
                           JobOfferRepository offerRepository, JobPostRepository jobRepository,
                           EmploymentRepository employmentRepository,
                           AdminAccountRepository adminRepository,
                           WorkerAccountRepository workerRepository) {
        this.leadRepository = leadRepository;
        this.contactLogRepository = contactLogRepository;
        this.applicationRepository = applicationRepository;
        this.offerRepository = offerRepository;
        this.jobRepository = jobRepository;
        this.employmentRepository = employmentRepository;
        this.adminRepository = adminRepository;
        this.workerRepository = workerRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (leadRepository.count() > 0) {
            return;
        }
        seedLeads();
        seedQueueState();
    }

    // ================================================================== leads

    /**
     * A day's worth of the phone ringing. Several are left NEW so the inbox opens with work in
     * it, and one is a bare missed call with nothing but a number - which is the commonest and
     * most important shape, because the person could not say anything at all.
     */
    private void seedLeads() {
        LocalDateTime now = LocalDateTime.now();
        lead(LeadSource.MISSED_CALL, "9848011201", null, null, LeadIntent.UNKNOWN,
                LeadStatus.NEW, now.minusHours(1), null);
        lead(LeadSource.MISSED_CALL, "9848011202", null, null, LeadIntent.UNKNOWN,
                LeadStatus.NEW, now.minusHours(5), null);
        lead(LeadSource.WHATSAPP, "9848011203", "Ramesh", "pani undha sir? nenu driver.",
                LeadIntent.WANT_WORK, LeadStatus.NEW, now.minusHours(3), null);
        lead(LeadSource.WHATSAPP, "9848011204", "Lakshmi", "Cleaning work kavali, Tirupati lo.",
                LeadIntent.WANT_WORK, LeadStatus.NEW, now.minusHours(7), null);
        lead(LeadSource.PHONE_IN, "9848011205", "Srinivas Poultry", 
                "Needs two chicken shop helpers from Monday, 12 hour shift.",
                LeadIntent.WANT_TO_HIRE, LeadStatus.NEW, now.minusHours(2), null);
        lead(LeadSource.WALK_IN, "9848011206", "Venkatesh",
                "Walked into the office. Mestri, 12 years, can bring his own team of 4.",
                LeadIntent.WANT_WORK, LeadStatus.CONTACTED, now.minusDays(1),
                "Spoke to him, taking down the team's numbers tomorrow.");
        lead(LeadSource.REFERRAL, "9848011207", "Anjali",
                "Sent by her sister who works at the supermarket.",
                LeadIntent.WANT_WORK, LeadStatus.CONTACTED, now.minusDays(1).minusHours(4),
                "Wants morning shifts only, near Alipiri.");
        lead(LeadSource.PHONE_IN, "9848011208", "Sai Krishna Supermarket",
                "Wants a helper for the billing counter.",
                LeadIntent.WANT_TO_HIRE, LeadStatus.CONTACTED, now.minusDays(2),
                "Called back, they are deciding on the salary.");
        lead(LeadSource.MISSED_CALL, "9848011209", "Kiran", null,
                LeadIntent.WANT_WORK, LeadStatus.CONVERTED, now.minusDays(3),
                "Registered him as a worker over the phone.");
        lead(LeadSource.WHATSAPP, "9848011210", "Mahesh", "Security guard job undha?",
                LeadIntent.WANT_WORK, LeadStatus.CONVERTED, now.minusDays(4),
                "Registered and applied to the night watchman post.");
        lead(LeadSource.WALK_IN, "9848011211", "Padma", "Came in asking about cook work.",
                LeadIntent.WANT_WORK, LeadStatus.CLOSED, now.minusDays(5),
                "Moved to Chennai, closing for now.");
        lead(LeadSource.REFERRAL, "9848011212", "Naveen", "Referred by an employer.",
                LeadIntent.WANT_WORK, LeadStatus.CLOSED, now.minusDays(6),
                "Already placed directly by the shop.");
        lead(LeadSource.WHATSAPP, "9848011213", null,
                "WIN A LOAN UPTO 5 LAKHS CLICK HERE", LeadIntent.UNKNOWN,
                LeadStatus.SPAM, now.minusDays(2).minusHours(6), "Bulk spam blast.");
        lead(LeadSource.MISSED_CALL, "9848011214", null, null, LeadIntent.UNKNOWN,
                LeadStatus.SPAM, now.minusDays(3).minusHours(2), "Repeated robocall.");
        lead(LeadSource.PHONE_IN, "9848011215", "Govindaraja Sweets",
                "Asked about hiring a cook for the festival season.",
                LeadIntent.WANT_TO_HIRE, LeadStatus.NEW, now.minusMinutes(40), null);

        // The two CONVERTED leads point at real workers, so the inbox is not lying.
        List<WorkerAccount> workers = workerRepository.findAll();
        List<Lead> converted = leadRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(l -> l.getStatus() == LeadStatus.CONVERTED).toList();
        for (int i = 0; i < converted.size() && i < workers.size(); i++) {
            Lead lead = converted.get(i);
            lead.setWorkerId(workers.get(i).getId());
            leadRepository.save(lead);
        }
    }

    private void lead(LeadSource source, String phone, String name, String message,
                      LeadIntent intent, LeadStatus status, LocalDateTime at, String note) {
        leadRepository.save(Lead.builder()
                .source(source).phone(phone).name(name).message(message).intent(intent)
                .status(status).note(note).createdAt(at).updatedAt(at).build());
    }

    // ================================================================== call queue state

    /**
     * Plants one row for each rule the queue knows about. The applications are picked by id so
     * the demo is the same on every boot, and each is nudged only as far as it has to go.
     */
    private void seedQueueState() {
        List<AdminAccount> admins = adminRepository.findAllByOrderByCreatedAtAsc();
        if (admins.isEmpty()) {
            return;
        }
        AdminAccount hr = admins.stream().filter(a -> a.getAdminRole() == AdminRole.HR)
                .findFirst().orElse(admins.get(0));
        LocalDateTime now = LocalDateTime.now();

        List<JobApplication> applications = new ArrayList<>(applicationRepository.findAll());
        applications.sort(Comparator.comparing(JobApplication::getId));
        if (applications.isEmpty()) {
            return;
        }

        // ---- CALLBACK_DUE: we said we would ring back at 6pm yesterday, and we did not.
        JobApplication callback = pick(applications, ApplicationStatus.APPLIED, 0);
        if (callback != null) {
            age(callback, now.minusDays(3));
            contactLogRepository.save(log(callback, hr, ContactChannel.CALL,
                    ContactOutcome.CALLBACK_REQUESTED,
                    "On the bus, asked us to ring back after six.",
                    now.minusDays(1).withHour(11).withMinute(20).withSecond(0).withNano(0),
                    now.minusDays(1).withHour(18).withMinute(0).withSecond(0).withNano(0)));
        }

        // ---- NO_ANSWER_RETRY: two tries, nobody picked up, last one this morning.
        JobApplication retry = pick(applications, ApplicationStatus.APPLIED, 1);
        if (retry != null) {
            age(retry, now.minusDays(2));
            contactLogRepository.save(log(retry, hr, ContactChannel.CALL, ContactOutcome.NO_ANSWER,
                    "Rang twice, no answer.", now.minusDays(1).minusHours(2), null));
            contactLogRepository.save(log(retry, hr, ContactChannel.CALL, ContactOutcome.NO_ANSWER,
                    "Still not picking up. Try again this evening.", now.minusHours(9), null));
        }

        // ---- EMPLOYER_NOT_RESPONDING: contacted the worker, the shop has gone quiet.
        JobApplication waiting = pick(applications, ApplicationStatus.VIEWED, 0);
        if (waiting == null) {
            waiting = pick(applications, ApplicationStatus.APPLIED, 2);
        }
        if (waiting != null) {
            age(waiting, now.minusDays(4));
            contactLogRepository.save(log(waiting, hr, ContactChannel.CALL, ContactOutcome.INTERESTED,
                    "Keen and free from Monday - profile sent to the shop.",
                    now.minusDays(3), null));
        }

        // ---- UNCONTACTED_APPLICANT: leave one alone entirely, just make it old enough to nag.
        for (JobApplication a : applications) {
            if (contactLogRepository.countByApplicationId(a.getId()) == 0
                    && !a.getStatus().isTerminal()) {
                age(a, now.minusDays(2).minusHours(3));
                break;
            }
        }

        // ---- WORK_TOMORROW: an accepted hire whose first day is tomorrow.
        //      BackOfficeSeeder takes the one seeded OFFER_ACCEPTED engagement all the way to
        //      COMPLETED, so an engagement that is still running is the honest stand-in.
        Long tomorrowEmploymentId = null;
        for (Employment e : employmentRepository.findAll()) {
            if (e.getApplication() == null) {
                continue;
            }
            if (e.getStatus() == EmploymentStatus.OFFER_ACCEPTED
                    || e.getStatus() == EmploymentStatus.ACTIVE) {
                e.setStatus(EmploymentStatus.OFFER_ACCEPTED);
                e.setJoiningDate(LocalDate.now().plusDays(1));
                e.setStartedAt(null);
                employmentRepository.save(e);
                tomorrowEmploymentId = e.getId();
                break;
            }
        }

        // ---- UNPAID_COMPLETED_WORK: the day was worked, the money has not moved.
        for (Employment e : employmentRepository.findAll()) {
            if (e.getId().equals(tomorrowEmploymentId) || e.getApplication() == null) {
                continue;
            }
            if (e.getStatus() == EmploymentStatus.ACTIVE) {
                e.setStatus(EmploymentStatus.COMPLETED);
                e.setEndedAt(now.minusDays(2));
                e.setSettledAt(null);
                employmentRepository.save(e);
                break;
            }
        }

        // ---- OFFER_NOT_ANSWERED is already planted by BackOfficeSeeder (a PENDING offer aged
        //      three days), so nothing to do here beyond making sure one exists.
        boolean pending = offerRepository.findAll().stream()
                .anyMatch(o -> o.getStatus() == OfferStatus.PENDING
                        && o.getSentAt().isBefore(now.minusDays(1)));
        if (!pending) {
            offerRepository.findAll().stream()
                    .filter(o -> o.getStatus() == OfferStatus.PENDING)
                    .findFirst().ifPresent(o -> {
                        o.setSentAt(now.minusDays(3));
                        offerRepository.save(o);
                    });
        }

        // ---- JOB_NO_APPLICANTS: an open job nobody has looked at for three days.
        for (JobPost job : jobRepository.findAll()) {
            if (job.getStatus() == JobStatus.OPEN
                    && applicationRepository.countByJobId(job.getId()) == 0) {
                job.setPostedAt(now.minusDays(3));
                jobRepository.save(job);
                break;
            }
        }
    }

    /** Backdates an application so a "waited too long" rule can see it. */
    private void age(JobApplication a, LocalDateTime appliedAt) {
        a.setAppliedAt(appliedAt);
        applicationRepository.save(a);
    }

    private JobApplication pick(List<JobApplication> all, ApplicationStatus status, int skip) {
        int seen = 0;
        for (JobApplication a : all) {
            if (a.getStatus() != status) {
                continue;
            }
            if (seen++ < skip) {
                continue;
            }
            return a;
        }
        return null;
    }

    private ContactLog log(JobApplication a, AdminAccount by, ContactChannel channel,
                           ContactOutcome outcome, String note, LocalDateTime at,
                           LocalDateTime nextCallAt) {
        return ContactLog.builder()
                .applicationId(a.getId()).jobId(a.getJob().getId())
                .workerId(a.getWorker().getId()).employerId(a.getJob().getEmployer().getId())
                .channel(channel).outcome(outcome).note(note)
                .contactedByAdminId(by.getId()).contactedByName(by.getName())
                .contactedAt(at).nextCallAt(nextCallAt).build();
    }
}
