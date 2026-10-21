package com.skillbridge.service;

import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.model.money.EarningStatus;
import com.skillbridge.repository.*;
import com.skillbridge.service.payment.EscrowService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

/**
 * Deleting an account, as Google Play requires: from inside the app, and by request from the web.
 *
 * What goes: everything that identifies the person - name, phone, email, photo, date of birth,
 * address and location, documents, bank and UPI details, push tokens - and the login itself.
 * What stays, anonymised: the money records (ledger, earnings, escrow) and the jobs and hires
 * they belong to, which the law requires us to keep and which the other side of a hire still needs.
 *
 * It refuses, with a reason, while work or money is still in flight - deleting a worker who is
 * owed money, or an employer holding someone's wages, would strand the other person.
 */
@Service
public class AccountDeletionService {

    private static final Set<EmploymentStatus> LIVE_WORK = EnumSet.of(
            EmploymentStatus.OFFER_ACCEPTED, EmploymentStatus.JOINING_CONFIRMED, EmploymentStatus.ACTIVE);
    private static final Set<ApplicationStatus> OPEN_APPLICATION = EnumSet.of(
            ApplicationStatus.APPLIED, ApplicationStatus.VIEWED, ApplicationStatus.SHORTLISTED,
            ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.OFFERED);
    private static final Set<EarningStatus> MONEY_OWED = EnumSet.of(
            EarningStatus.ACCRUED, EarningStatus.HELD, EarningStatus.PAYABLE, EarningStatus.IN_BATCH);

    private final WorkerAccountRepository workers;
    private final EmployerAccountRepository employers;
    private final WorkerProfileRepository workerProfiles;
    private final EmployerProfileRepository employerProfiles;
    private final EmploymentRepository employments;
    private final JobApplicationRepository applications;
    private final JobPostRepository jobs;
    private final EarningRepository earnings;
    private final PayoutDestinationRepository payoutDestinations;
    private final DeviceTokenRepository deviceTokens;
    private final LeadRepository leads;
    private final AdminAccountRepository admins;
    private final EscrowService escrow;
    private final NotificationService notifications;
    private final PasswordEncoder passwordEncoder;

    public AccountDeletionService(WorkerAccountRepository workers, EmployerAccountRepository employers,
                                  WorkerProfileRepository workerProfiles, EmployerProfileRepository employerProfiles,
                                  EmploymentRepository employments, JobApplicationRepository applications,
                                  JobPostRepository jobs, EarningRepository earnings,
                                  PayoutDestinationRepository payoutDestinations, DeviceTokenRepository deviceTokens,
                                  LeadRepository leads, AdminAccountRepository admins, EscrowService escrow,
                                  NotificationService notifications, PasswordEncoder passwordEncoder) {
        this.workers = workers;
        this.employers = employers;
        this.workerProfiles = workerProfiles;
        this.employerProfiles = employerProfiles;
        this.employments = employments;
        this.applications = applications;
        this.jobs = jobs;
        this.earnings = earnings;
        this.payoutDestinations = payoutDestinations;
        this.deviceTokens = deviceTokens;
        this.leads = leads;
        this.admins = admins;
        this.escrow = escrow;
        this.notifications = notifications;
        this.passwordEncoder = passwordEncoder;
    }

    // ---------------------------------------------------------------- worker

    @Transactional
    public void deleteWorker(WorkerAccount worker) {
        if (employments.findByWorkerOrderByJoiningDateDesc(worker).stream()
                .anyMatch(e -> LIVE_WORK.contains(e.getStatus()))) {
            throw ApiException.badRequest("You have work that is not finished yet. Finish it, or ask the shop to "
                    + "end it, before deleting your account.");
        }
        if (earnings.findByWorkerIdOrderByIdDesc(worker.getId()).stream()
                .anyMatch(e -> MONEY_OWED.contains(e.getStatus()))) {
            throw ApiException.badRequest("You still have money with LocalWork. Withdraw it first, then delete "
                    + "your account.");
        }
        for (JobApplication a : applications.findByWorkerOrderByAppliedAtDesc(worker)) {
            if (OPEN_APPLICATION.contains(a.getStatus())) {
                a.setStatus(ApplicationStatus.WITHDRAWN);
                applications.save(a);
            }
        }
        workerProfiles.findByAccountId(worker.getId()).ifPresent(p -> {
            p.setDateOfBirth(null);
            p.setGender(null);
            p.setAlternatePhone(null);
            p.setBio(null);
            p.setJobTitle(null);
            p.setCity(null);
            p.setArea(null);
            p.setPincode(null);
            p.setLatitude(0);
            p.setLongitude(0);
            p.getSkills().clear();
            p.setProfileCompleted(false);
            workerProfiles.save(p);
        });
        payoutDestinations.deleteAll(payoutDestinations.findByWorkerIdOrderByIdDesc(worker.getId()));
        deviceTokens.deleteAll(deviceTokens.findByOwnerTypeAndOwnerId(AccountType.WORKER, worker.getId()));
        worker.setName("Deleted user");
        worker.setEmail(null);
        worker.setPhone("deleted-" + worker.getId());
        worker.setPhotoUrl(null);
        worker.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        worker.setEnabled(false);
        workers.save(worker);
    }

    // ---------------------------------------------------------------- employer

    @Transactional
    public void deleteEmployer(EmployerAccount employer) {
        if (employments.findByEmployerOrderByJoiningDateDesc(employer).stream()
                .anyMatch(e -> LIVE_WORK.contains(e.getStatus()))) {
            throw ApiException.badRequest("Someone is still working for you. End or complete that work before "
                    + "deleting your account.");
        }
        long unused = jobs.findByEmployerOrderByPostedAtDesc(employer).stream()
                .mapToLong(j -> escrow.escrowOrEmpty(j.getId()).unreservedMinor()).sum();
        if (unused > 0) {
            throw ApiException.badRequest("Money you added to your jobs is still with LocalWork. Take it back "
                    + "from Billing first, then delete your account.");
        }
        for (JobPost job : jobs.findByEmployerOrderByPostedAtDesc(employer)) {
            if (job.getStatus() == JobStatus.OPEN || job.getStatus() == JobStatus.PAUSED
                    || job.getStatus() == JobStatus.DRAFT) {
                job.setStatus(JobStatus.CLOSED);
                jobs.save(job);
            }
        }
        employerProfiles.findByAccountId(employer.getId()).ifPresent(p -> {
            p.setRegistrationDocUrl(null);
            p.setOwnerIdDocUrl(null);
            p.setLogoUrl(null);
            p.getPhotos().clear();
            p.setAddress(null);
            employerProfiles.save(p);
        });
        deviceTokens.deleteAll(deviceTokens.findByOwnerTypeAndOwnerId(AccountType.EMPLOYER, employer.getId()));
        employer.setName("Deleted user");
        employer.setEmail(null);
        employer.setPhone("deleted-" + employer.getId());
        employer.setPhotoUrl(null);
        employer.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        employer.setEnabled(false);
        employers.save(employer);
    }

    // ---------------------------------------------------------------- from the website

    /** Someone without the app asks for deletion. It reaches the back office as a lead and an alert. */
    @Transactional
    public Long request(String phone, String name, String accountType, String reason) {
        if (phone == null || phone.replaceAll("\\D", "").length() < 10) {
            throw ApiException.badRequest("Enter the mobile number you signed up with.");
        }
        String who = "WORKER".equalsIgnoreCase(accountType) ? "worker"
                : "EMPLOYER".equalsIgnoreCase(accountType) ? "business" : "unknown";
        Lead lead = leads.save(Lead.builder()
                .source(LeadSource.PHONE_IN)
                .phone(phone.trim())
                .name(name == null || name.isBlank() ? null : name.trim())
                .message("[ACCOUNT DELETION REQUEST] " + who + " account."
                        + (reason == null || reason.isBlank() ? "" : " Reason: " + reason.trim()))
                .intent(LeadIntent.UNKNOWN)
                .status(LeadStatus.NEW)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
        for (AdminAccount admin : admins.findAllByOrderByCreatedAtAsc()) {
            notifications.notify(AccountType.ADMIN, admin.getId(), "Account deletion request",
                    "Delete the " + who + " account for " + phone.trim() + ". Verify by phone, then delete it "
                            + "within 30 days.", NotificationType.SYSTEM, "/admin/enquiries");
        }
        return lead.getId();
    }
}
