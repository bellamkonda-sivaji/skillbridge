package com.skillbridge.service;

import com.skillbridge.dto.ApplicationDto;
import com.skillbridge.dto.OfferDto;
import com.skillbridge.dto.admin.AdminDtos.*;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * The back office acting FOR somebody who will never open the app.
 *
 * <p>This is not a convenience layer, it is the product. A supermarket helper with a 200-rupee
 * handset gives their details down the phone, we register them, we apply for them, and when the
 * shop owner says yes we accept the offer for them while they are still on the line. Every write
 * here records in the audit log that an admin acted <em>on behalf of</em> a named person, because
 * the audit trail is the only thing that distinguishes this from impersonation.
 *
 * <p>Nothing here reimplements a rule. Applying goes through {@link ApplicationService#apply},
 * accepting goes through {@link ApplicationService#acceptOffer} - so the seat count, the escrow
 * reservation and the idempotency are exactly the ones the worker app gets.
 */
@Service
public class AdminOnBehalfService {

    private final WorkerAccountRepository workerRepository;
    private final WorkerProfileRepository profileRepository;
    private final JobApplicationRepository applicationRepository;
    private final JobOfferRepository offerRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationService applicationService;
    private final AdminGuard guard;
    private final AdminAuditService audit;

    public AdminOnBehalfService(WorkerAccountRepository workerRepository,
                                WorkerProfileRepository profileRepository,
                                JobApplicationRepository applicationRepository,
                                JobOfferRepository offerRepository,
                                PasswordEncoder passwordEncoder,
                                ApplicationService applicationService,
                                AdminGuard guard, AdminAuditService audit) {
        this.workerRepository = workerRepository;
        this.profileRepository = profileRepository;
        this.applicationRepository = applicationRepository;
        this.offerRepository = offerRepository;
        this.passwordEncoder = passwordEncoder;
        this.applicationService = applicationService;
        this.guard = guard;
        this.audit = audit;
    }

    // ================================================================== registration

    /**
     * Registers a worker whose details were taken down over the phone. The mobile number is the
     * identity: email and password are optional, and the password we generate is never told to
     * anybody, because this worker signs in - if they ever do - with an OTP.
     *
     * <p>A number we already hold is answered with 409 and the existing worker, never a second
     * row. Two records for one person is how a back office loses track of a human being.
     */
    @Transactional
    public WorkerSummaryDto registerWorker(WorkerIntakeRequest request) {
        AdminAccount admin = guard.require(AdminPermission.MANAGE_APPLICATIONS);
        if (request == null || request.phone() == null || request.phone().isBlank()) {
            throw ApiException.badRequest("A mobile number is required - it is how we reach them");
        }
        String phone = request.phone().trim();
        Optional<WorkerAccount> existing = workerRepository.findByPhone(phone);
        if (existing.isPresent()) {
            WorkerAccount held = existing.get();
            throw ApiException.conflict("A worker with this mobile number is already registered: "
                    + held.getName() + " (id " + held.getId() + ")");
        }
        String email = null;
        if (request.email() != null && !request.email().isBlank()) {
            email = request.email().toLowerCase().trim();
            if (workerRepository.existsByEmail(email)) {
                throw ApiException.conflict("A worker account with this email already exists");
            }
        }
        String name = request.name() == null || request.name().isBlank()
                ? "Worker " + phone : request.name().trim();
        String rawPassword = request.password() == null || request.password().length() < 6
                ? "sb-" + phone + "-" + System.nanoTime() : request.password();

        WorkerAccount account = workerRepository.save(WorkerAccount.builder()
                .name(name)
                .email(email)
                .phone(phone)
                .password(passwordEncoder.encode(rawPassword))
                .enabled(true)
                .build());

        WorkerProfile profile = WorkerProfile.builder().account(account).build();
        apply(profile, request.city(), request.area(), request.skills(), request.categories(),
                request.expectedSalary(), request.salaryUnit(), request.languages(), request.note());
        // Taken down by a human who asked the questions, so it is complete enough to apply with.
        profile.setProfileCompleted(true);
        profileRepository.save(profile);

        audit.record(admin, "WORKER_REGISTERED_ON_BEHALF", "WORKER", account.getId(),
                "Registered " + name + " (" + phone + ") on behalf over the phone");
        return summary(account, profile, admin.getName());
    }

    @Transactional
    public WorkerSummaryDto updateWorker(Long workerId, WorkerIntakeRequest request) {
        AdminAccount admin = guard.require(AdminPermission.MANAGE_APPLICATIONS);
        WorkerAccount account = workerRepository.findById(workerId)
                .orElseThrow(() -> ApiException.notFound("Worker not found"));
        if (request == null) {
            throw ApiException.badRequest("Nothing to update");
        }
        if (request.name() != null && !request.name().isBlank()) {
            account.setName(request.name().trim());
        }
        if (request.phone() != null && !request.phone().isBlank()
                && !request.phone().trim().equals(account.getPhone())) {
            String phone = request.phone().trim();
            if (workerRepository.existsByPhone(phone)) {
                throw ApiException.conflict("Another worker already holds the number " + phone);
            }
            account.setPhone(phone);
        }
        if (request.email() != null && !request.email().isBlank()) {
            String email = request.email().toLowerCase().trim();
            if (!email.equals(account.getEmail()) && workerRepository.existsByEmail(email)) {
                throw ApiException.conflict("Another worker already holds the email " + email);
            }
            account.setEmail(email);
        }
        workerRepository.save(account);

        WorkerProfile profile = profileRepository.findByAccountId(workerId)
                .orElseGet(() -> WorkerProfile.builder().account(account).build());
        apply(profile, request.city(), request.area(), request.skills(), request.categories(),
                request.expectedSalary(), request.salaryUnit(), request.languages(), request.note());
        profileRepository.save(profile);

        audit.record(admin, "WORKER_UPDATED_ON_BEHALF", "WORKER", account.getId(),
                "Updated " + account.getName() + "'s details on their behalf");
        return summary(account, profile, admin.getName());
    }

    /** Copies only the fields that were actually sent, so a PATCH stays a PATCH. */
    private void apply(WorkerProfile profile, String city, String area, List<String> skills,
                       List<String> categories, Double expectedSalary, SalaryUnit salaryUnit,
                       List<String> languages, String note) {
        if (city != null) profile.setCity(city.trim());
        if (area != null) profile.setArea(area.trim());
        if (skills != null) profile.setSkills(clean(skills));
        if (categories != null) profile.setJobCategories(clean(categories));
        if (languages != null) profile.setLanguages(clean(languages));
        if (expectedSalary != null) profile.setExpectedSalary(expectedSalary);
        if (salaryUnit != null) profile.setSalaryUnit(salaryUnit);
        if (note != null && !note.isBlank()) profile.setBio(note.trim());
        if (profile.getJobTitle() == null || profile.getJobTitle().isBlank()) {
            List<String> s = profile.getSkills();
            profile.setJobTitle(s == null || s.isEmpty() ? "General helper" : s.get(0));
        }
    }

    private static List<String> clean(List<String> raw) {
        List<String> out = new ArrayList<>();
        for (String v : raw) {
            if (v != null && !v.isBlank()) {
                out.add(v.trim());
            }
        }
        return out;
    }

    // ================================================================== applying

    /**
     * Applies for a worker who told us down the phone that they want the job. The duplicate is
     * refused with a plain sentence rather than a conflict code, because the person hearing it is
     * an HR user on a call, not a client library.
     */
    @Transactional
    public ApplicationDto applyOnBehalf(Long workerId, ApplyOnBehalfRequest request) {
        AdminAccount admin = guard.require(AdminPermission.MANAGE_APPLICATIONS);
        if (request == null || request.jobId() == null) {
            throw ApiException.badRequest("jobId is required");
        }
        WorkerAccount worker = workerRepository.findById(workerId)
                .orElseThrow(() -> ApiException.notFound("Worker not found"));
        if (applicationRepository.findByWorkerIdAndJobId(workerId, request.jobId()).isPresent()) {
            throw ApiException.badRequest(worker.getName()
                    + " has already applied to this job - open the existing application instead");
        }
        String note = request.note() == null || request.note().isBlank()
                ? "Applied by the JobOn team on " + worker.getName() + "'s behalf"
                : request.note().trim();
        applicationService.apply(worker, request.jobId(), note);

        JobApplication application = applicationRepository
                .findByWorkerIdAndJobId(workerId, request.jobId())
                .orElseThrow(() -> ApiException.badRequest("The application could not be created"));
        audit.record(admin, "APPLIED_ON_BEHALF", "APPLICATION", application.getId(),
                "Applied to \"" + application.getJob().getTitle() + "\" on behalf of "
                        + worker.getName() + " (" + worker.getPhone() + ")");
        return ApplicationDto.from(application, null);
    }

    // ================================================================== offers

    /**
     * Accepts a pending offer for the worker while they are on the phone. Delegates straight to
     * {@link ApplicationService#acceptOffer}, so the seat count, the employment record and the
     * escrow reservation happen exactly once and exactly as they do in the worker app.
     */
    @Transactional
    public OfferDto acceptOfferOnBehalf(Long applicationId, OnBehalfNoteRequest request) {
        AdminAccount admin = guard.require(AdminPermission.MANAGE_APPLICATIONS);
        JobApplication application = requireApplication(applicationId);
        JobOffer offer = requireOffer(application);
        OfferDto dto = applicationService.acceptOffer(application.getWorker(), offer.getId());
        audit.record(admin, "OFFER_ACCEPTED_ON_BEHALF", "OFFER", offer.getId(),
                "Accepted the offer for \"" + application.getJob().getTitle() + "\" on behalf of "
                        + application.getWorker().getName()
                        + " (" + application.getWorker().getPhone() + ")"
                        + (request == null || request.note() == null || request.note().isBlank()
                            ? "" : " - " + request.note().trim()));
        return dto;
    }

    @Transactional
    public OfferDto declineOfferOnBehalf(Long applicationId, OnBehalfReasonRequest request) {
        AdminAccount admin = guard.require(AdminPermission.MANAGE_APPLICATIONS);
        JobApplication application = requireApplication(applicationId);
        JobOffer offer = requireOffer(application);
        OfferDto dto = applicationService.declineOffer(application.getWorker(), offer.getId());
        audit.record(admin, "OFFER_DECLINED_ON_BEHALF", "OFFER", offer.getId(),
                "Declined the offer for \"" + application.getJob().getTitle() + "\" on behalf of "
                        + application.getWorker().getName()
                        + (request == null || request.reason() == null || request.reason().isBlank()
                            ? "" : " - " + request.reason().trim()));
        return dto;
    }

    private JobApplication requireApplication(Long applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("Application not found"));
    }

    private JobOffer requireOffer(JobApplication application) {
        return offerRepository.findByApplicationId(application.getId())
                .orElseThrow(() -> ApiException.badRequest(
                        "There is no offer on this application yet"));
    }

    // ================================================================== assembly

    public WorkerSummaryDto summary(WorkerAccount account, WorkerProfile profile, String byName) {
        WorkerProfile p = profile != null ? profile
                : profileRepository.findByAccountId(account.getId()).orElse(null);
        return new WorkerSummaryDto(account.getId(), account.getName(), account.getPhone(),
                account.getEmail(),
                p == null ? null : p.getCity(),
                p == null ? null : p.getArea(),
                p == null ? List.of() : List.copyOf(p.getSkills()),
                p == null ? List.of() : List.copyOf(p.getJobCategories()),
                p == null ? 0 : p.getExpectedSalary(),
                p == null ? null : p.getSalaryUnit(),
                p == null ? List.of() : List.copyOf(p.getLanguages()),
                p == null ? null : p.getBio(),
                account.isEnabled(),
                p != null && p.isProfileCompleted(),
                p == null ? null : p.getVerificationStatus(),
                account.getCreatedAt(),
                applicationRepository.countByWorker(account),
                byName);
    }
}
