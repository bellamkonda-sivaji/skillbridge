package com.skillbridge.config;

import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * The back-office half of the demo data: outreach that has (and deliberately has not) happened,
 * a handful of audited admin actions, and one application carried the whole way to PAID so the
 * application history has a full multi-stage timeline to render.
 */
@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
        name = "skillbridge.seed.enabled", havingValue = "true", matchIfMissing = true)
@Order(2)
public class BackOfficeSeeder implements CommandLineRunner {

    private static final String PAID_JOB_TITLE = "One-day site clearance crew";

    private final ContactLogRepository contactLogRepository;
    private final AdminAuditLogRepository auditLogRepository;
    private final AdminAccountRepository adminAccountRepository;
    private final JobApplicationRepository applicationRepository;
    private final EmploymentRepository employmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final InterviewRepository interviewRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final JobOfferRepository offerRepository;

    public BackOfficeSeeder(ContactLogRepository contactLogRepository,
                            AdminAuditLogRepository auditLogRepository,
                            AdminAccountRepository adminAccountRepository,
                            JobApplicationRepository applicationRepository,
                            EmploymentRepository employmentRepository,
                            AttendanceRepository attendanceRepository,
                            InterviewRepository interviewRepository,
                            WalletRepository walletRepository,
                            WalletTransactionRepository transactionRepository,
                            JobOfferRepository offerRepository) {
        this.contactLogRepository = contactLogRepository;
        this.auditLogRepository = auditLogRepository;
        this.adminAccountRepository = adminAccountRepository;
        this.applicationRepository = applicationRepository;
        this.employmentRepository = employmentRepository;
        this.attendanceRepository = attendanceRepository;
        this.interviewRepository = interviewRepository;
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.offerRepository = offerRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (contactLogRepository.count() > 0 || applicationRepository.count() == 0) {
            return;
        }
        List<AdminAccount> admins = adminAccountRepository.findAllByOrderByCreatedAtAsc();
        if (admins.isEmpty()) {
            return;
        }
        AdminAccount superAdmin = pick(admins, AdminRole.SUPER_ADMIN);
        AdminAccount operations = pick(admins, AdminRole.ADMIN);
        AdminAccount hr = pick(admins, AdminRole.HR);

        List<JobApplication> applications = new ArrayList<>(applicationRepository.findAll());
        applications.sort(Comparator.comparing(JobApplication::getId));

        Employment paidEmployment = completeAndPayOneEngagement(applications);
        seedContacts(applications, operations, hr, paidEmployment);
        seedAudit(superAdmin, operations, hr);
        seedOpenChaseWork();
    }

    // ================================================================== contacts

    /**
     * Roughly two thirds of the applications get an outreach row, with a realistic spread of
     * outcomes. The remaining third is left alone on purpose - that is what makes
     * notContactedCount and the UNCONTACTED_APPLICANTS task non-zero.
     */
    private void seedContacts(List<JobApplication> applications, AdminAccount operations,
                              AdminAccount hr, Employment paidEmployment) {
        ContactChannel[] channels = ContactChannel.values();
        ContactOutcome[] outcomes = {
                ContactOutcome.REACHED, ContactOutcome.INTERESTED, ContactOutcome.NO_ANSWER,
                ContactOutcome.REACHED, ContactOutcome.CALLBACK_REQUESTED, ContactOutcome.BUSY,
                ContactOutcome.INTERESTED, ContactOutcome.NOT_INTERESTED, ContactOutcome.REACHED,
                ContactOutcome.WRONG_NUMBER
        };
        String[] notes = {
                "Spoke to the worker, confirmed availability for the shift.",
                "Keen on the role, asked about travel allowance.",
                "Rang twice, no answer. Will retry this evening.",
                "Walked through the timings and the reporting address.",
                "Asked us to call back after 6pm.",
                "Line busy - left a WhatsApp message instead.",
                "Wants the job, sending the profile to the employer.",
                "Already placed elsewhere this week.",
                "Confirmed documents in hand for joining.",
                "Number does not belong to the worker any more."
        };

        int written = 0;
        for (int i = 0; i < applications.size() && written < 25; i++) {
            JobApplication a = applications.get(i);
            if (i % 3 == 2) {
                continue;   // deliberately never contacted
            }
            AdminAccount by = (i % 2 == 0) ? hr : operations;
            LocalDateTime first = a.getAppliedAt().plusHours(5 + (i % 7));
            written += write(a, channels[i % channels.length], outcomes[i % outcomes.length],
                    notes[i % notes.length], by, first);
            if (i % 5 == 0 && written < 25) {
                written += write(a, ContactChannel.CALL, ContactOutcome.REACHED,
                        "Follow-up call - confirmed the worker is still interested.",
                        operations, a.getAppliedAt().plusDays(1).plusHours(3));
            }
        }
        // A couple of calls logged today, so the daily report is never an empty page.
        for (int i = 0; i < applications.size() && written < 25; i++) {
            JobApplication a = applications.get(i);
            if (i % 3 != 2) {
                continue;
            }
            if (i % 6 != 2) {
                continue;
            }
            written += write(a, ContactChannel.WHATSAPP, ContactOutcome.INTERESTED,
                    "Messaged the worker about today's shortlist.", hr,
                    LocalDateTime.now().minusHours(2));
        }

        // The application that went all the way to PAID gets its own two-call story.
        if (paidEmployment != null && paidEmployment.getApplication() != null) {
            JobApplication a = paidEmployment.getApplication();
            contactLogRepository.findByApplicationIdOrderByContactedAtAsc(a.getId())
                    .forEach(contactLogRepository::delete);
            write(a, ContactChannel.CALL, ContactOutcome.REACHED,
                    "Called about the clearance day - available and happy to take it.",
                    operations, a.getAppliedAt().plusHours(4));
            write(a, ContactChannel.WHATSAPP, ContactOutcome.INTERESTED,
                    "Sent the reporting address and the 9am start time.",
                    hr, a.getAppliedAt().plusDays(1));
        }
    }

    private int write(JobApplication a, ContactChannel channel, ContactOutcome outcome, String note,
                      AdminAccount by, LocalDateTime at) {
        contactLogRepository.save(ContactLog.builder()
                .applicationId(a.getId())
                .jobId(a.getJob().getId())
                .workerId(a.getWorker().getId())
                .employerId(a.getJob().getEmployer().getId())
                .channel(channel).outcome(outcome).note(note)
                .contactedByAdminId(by.getId()).contactedByName(by.getName())
                .contactedAt(at.isAfter(LocalDateTime.now()) ? LocalDateTime.now().minusHours(1) : at)
                .build());
        return 1;
    }

    // ================================================================== the PAID journey

    /**
     * Takes the seeded one-day hire the whole way: an interview that actually happened, the day
     * worked and approved, the engagement completed and the wallet transfer released. Nothing
     * here touches the offer-acceptance path, so "accept-offer pays exactly once" is untouched.
     */
    private Employment completeAndPayOneEngagement(List<JobApplication> applications) {
        Employment target = null;
        for (Employment e : employmentRepository.findAll()) {
            if (e.getApplication() != null && e.getJob() != null
                    && PAID_JOB_TITLE.equals(e.getJob().getTitle())) {
                target = e;
                break;
            }
        }
        if (target == null) {
            return null;
        }
        JobApplication application = target.getApplication();
        LocalDate workedOn = LocalDate.now().minusDays(2);

        // An interview that was actually held, so the timeline has both stages.
        interviewRepository.save(Interview.builder()
                .employer(target.getEmployer()).worker(target.getWorker()).job(target.getJob())
                .scheduledAt(application.getAppliedAt().plusDays(2).withHour(15).withMinute(0)
                        .withSecond(0).withNano(0))
                .durationMinutes(20).mode(InterviewMode.PHONE)
                .interviewerName(target.getEmployer().getName())
                .interviewerRole("Site Manager")
                .interviewerPhone(target.getEmployer().getPhone())
                .notes("Quick call about the handover clean.")
                .status(InterviewStatus.COMPLETED)
                .createdAt(application.getAppliedAt().plusDays(1))
                .build());

        // The day itself.
        LocalDateTime in = workedOn.atTime(9, 2);
        LocalDateTime out = workedOn.atTime(18, 5);
        attendanceRepository.save(Attendance.builder()
                .employment(target).workDate(workedOn)
                .checkInAt(in).checkOutAt(out)
                .status(AttendanceStatus.CHECKED_OUT)
                .minutesWorked((int) Duration.between(in, out).toMinutes())
                .note("Handover clean finished on schedule.")
                .build());

        target.setActualJoiningDate(workedOn);
        target.setJoiningAcknowledgedAt(workedOn.minusDays(1).atTime(18, 0));
        target.setStartedAt(in);
        target.setWorkProgressAt(workedOn.atTime(12, 0));
        target.setEndedAt(out);
        target.setSettledAt(out.plusMinutes(30));
        target.setStatus(EmploymentStatus.COMPLETED);
        employmentRepository.save(target);

        // The money, through the same wallet ledger every other payment uses.
        double amount = target.getSalary();
        Wallet workerWallet = wallet(AccountType.WORKER, target.getWorker().getId());
        Wallet employerWallet = wallet(AccountType.EMPLOYER, target.getEmployer().getId());
        workerWallet.setBalance(Math.round((workerWallet.getBalance() + amount) * 100.0) / 100.0);
        employerWallet.setBalance(Math.round((employerWallet.getBalance() - amount) * 100.0) / 100.0);
        walletRepository.save(workerWallet);
        walletRepository.save(employerWallet);
        String description = "Payment for \"" + target.getJob().getTitle() + "\"";
        LocalDateTime paidAt = out.plusMinutes(45);
        transactionRepository.save(WalletTransaction.builder()
                .wallet(employerWallet).type(WalletTransaction.Type.DEBIT).amount(amount)
                .description(description).jobId(target.getJob().getId())
                .reference(WalletTransaction.Reference.JOB_PAYMENT).createdAt(paidAt).build());
        transactionRepository.save(WalletTransaction.builder()
                .wallet(workerWallet).type(WalletTransaction.Type.CREDIT).amount(amount)
                .description(description).jobId(target.getJob().getId())
                .reference(WalletTransaction.Reference.JOB_PAYMENT).createdAt(paidAt).build());

        application.setPaymentSettled(true);
        applicationRepository.save(application);
        return target;
    }

    /**
     * Leaves two things deliberately open so the daily report's chase list is not all zeroes:
     * one live offer that has been sitting unanswered for more than 48 hours, and one shift the
     * worker checked into but never checked out of.
     */
    private void seedOpenChaseWork() {
        for (JobOffer offer : offerRepository.findAll()) {
            if (offer.getStatus() == OfferStatus.PENDING) {
                offer.setSentAt(LocalDateTime.now().minusDays(3));
                offerRepository.save(offer);
                break;
            }
        }
        for (Attendance row : attendanceRepository.findAll()) {
            if (row.getStatus() == AttendanceStatus.CHECKED_OUT
                    && row.getEmployment().getStatus() == EmploymentStatus.ACTIVE
                    && row.getWorkDate().equals(LocalDate.now().minusDays(1))) {
                row.setCheckOutAt(null);
                row.setMinutesWorked(null);
                row.setStatus(AttendanceStatus.CHECKED_IN);
                attendanceRepository.save(row);
                break;
            }
        }
    }

    private Wallet wallet(AccountType type, Long ownerId) {
        return walletRepository.findByOwnerTypeAndOwnerId(type, ownerId)
                .orElseGet(() -> walletRepository.save(
                        Wallet.builder().ownerType(type).ownerId(ownerId).balance(0).build()));
    }

    // ================================================================== audit

    private void seedAudit(AdminAccount superAdmin, AdminAccount operations, AdminAccount hr) {
        LocalDateTime now = LocalDateTime.now();
        audit(superAdmin, "ADMIN_CREATE", "ADMIN", operations.getId(),
                "Created admin@skillbridge.in as ADMIN", now.minusDays(9));
        audit(superAdmin, "ADMIN_CREATE", "ADMIN", hr.getId(),
                "Created hr@skillbridge.in as HR", now.minusDays(9));
        audit(operations, "EMPLOYER_VERIFICATION", "EMPLOYER", 1L,
                "Verified Safiri Constructions", now.minusDays(6));
        audit(operations, "WORKER_VERIFICATION", "WORKER", 1L,
                "Approved John Kamau's Aadhaar", now.minusDays(5));
        audit(hr, "CONTACT_LOGGED", "APPLICATION", 1L,
                "CALL / REACHED with John Kamau", now.minusDays(3));
        audit(operations, "ACCOUNT_STATUS_CHANGE", "WORKER", 9L,
                "Divya Sree disabled then re-enabled after review", now.minusDays(2));
        audit(hr, "CONTACT_LOGGED", "APPLICATION", 2L,
                "WHATSAPP / INTERESTED with Mary Wanjiku", now.minusHours(4));
    }

    private void audit(AdminAccount admin, String action, String entityType, Long entityId,
                       String detail, LocalDateTime at) {
        auditLogRepository.save(AdminAuditLog.builder()
                .adminId(admin.getId()).adminName(admin.getName()).adminRole(admin.getAdminRole())
                .action(action).entityType(entityType).entityId(entityId).detail(detail)
                .createdAt(at).build());
    }

    private static AdminAccount pick(List<AdminAccount> admins, AdminRole role) {
        return admins.stream().filter(a -> a.getAdminRole() == role).findFirst().orElse(admins.get(0));
    }
}
