package com.skillbridge.service;

import com.skillbridge.dto.admin.AdminDtos.*;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * People who arrive without an app: a missed call from a number we have never seen, a WhatsApp
 * "pani undha?", somebody who walked into the office. This is the top of the funnel for a
 * platform whose users mostly cannot type.
 *
 * <p>The only thing a lead must have is a phone number. A bare missed call is a complete, valid
 * lead - the whole point is that somebody who could not say anything still gets rung back.
 */
@Service
public class LeadService {

    private final LeadRepository leadRepository;
    private final WorkerAccountRepository workerRepository;
    private final EmployerAccountRepository employerRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final AdminAccountRepository adminRepository;
    private final AdminOnBehalfService onBehalf;
    private final PasswordEncoder passwordEncoder;
    private final AdminGuard guard;
    private final AdminAuditService audit;

    /**
     * Blank by default, and blank means the endpoint answers 503 rather than accepting
     * unauthenticated leads. An open write endpoint on a public URL is a spam pipe, and a back
     * office drowning in junk rows is worse than one missing a channel.
     */
    @Value("${skillbridge.leads.inbound-token:}")
    private String inboundToken;

    public LeadService(LeadRepository leadRepository, WorkerAccountRepository workerRepository,
                       EmployerAccountRepository employerRepository,
                       EmployerProfileRepository employerProfileRepository,
                       AdminAccountRepository adminRepository, AdminOnBehalfService onBehalf,
                       PasswordEncoder passwordEncoder, AdminGuard guard, AdminAuditService audit) {
        this.leadRepository = leadRepository;
        this.workerRepository = workerRepository;
        this.employerRepository = employerRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.adminRepository = adminRepository;
        this.onBehalf = onBehalf;
        this.passwordEncoder = passwordEncoder;
        this.guard = guard;
        this.audit = audit;
    }

    // ================================================================== inbound

    @Transactional
    public InboundLeadResponse inbound(String token, InboundLeadRequest request) {
        if (inboundToken == null || inboundToken.isBlank()) {
            throw ApiException.serviceUnavailable(
                    "Inbound leads are not configured - set skillbridge.leads.inbound-token");
        }
        if (token == null || !inboundToken.equals(token)) {
            throw ApiException.unauthorized("Invalid X-Lead-Token");
        }
        if (request == null || request.phone() == null || request.phone().isBlank()) {
            throw ApiException.badRequest("phone is required");
        }
        Lead lead = leadRepository.save(Lead.builder()
                .source(request.source() == null ? LeadSource.PHONE_IN : request.source())
                .phone(request.phone().trim())
                .name(blankToNull(request.name()))
                .message(blankToNull(request.message()))
                .intent(request.intent() == null ? LeadIntent.UNKNOWN : request.intent())
                .status(LeadStatus.NEW)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
        return new InboundLeadResponse(lead.getId(), true);
    }

    // ================================================================== admin inbox

    public PageDto<LeadDto> list(String status, String source, String q, int page, int size) {
        guard.require(AdminPermission.VIEW_APPLICATIONS);
        Map<Long, String> adminNames = adminNames();
        List<LeadDto> rows = new ArrayList<>();
        for (Lead lead : leadRepository.findAllByOrderByCreatedAtDesc()) {
            if (status != null && !status.isBlank()
                    && !lead.getStatus().name().equalsIgnoreCase(status.trim())) {
                continue;
            }
            if (source != null && !source.isBlank()
                    && !lead.getSource().name().equalsIgnoreCase(source.trim())) {
                continue;
            }
            if (q != null && !q.isBlank() && !matches(lead, q.trim().toLowerCase(Locale.ENGLISH))) {
                continue;
            }
            rows.add(dto(lead, adminNames));
        }
        return PageDto.of(rows, page, size);
    }

    @Transactional
    public LeadDto patch(Long id, LeadPatchRequest request) {
        AdminAccount admin = guard.require(AdminPermission.MANAGE_APPLICATIONS);
        Lead lead = require(id);
        if (request == null) {
            throw ApiException.badRequest("Nothing to update");
        }
        if (request.status() != null) {
            lead.setStatus(request.status());
        }
        if (request.note() != null) {
            lead.setNote(blankToNull(request.note()));
        }
        if (request.assignedAdminId() != null) {
            adminRepository.findById(request.assignedAdminId())
                    .orElseThrow(() -> ApiException.badRequest("No such admin"));
            lead.setAssignedAdminId(request.assignedAdminId());
        }
        lead.setUpdatedAt(LocalDateTime.now());
        leadRepository.save(lead);
        audit.record(admin, "LEAD_UPDATED", "LEAD", lead.getId(),
                "Lead " + lead.getPhone() + " is now " + lead.getStatus());
        return dto(lead, adminNames());
    }

    // ================================================================== conversion

    /**
     * Turns a lead into a real account. If the number already has one - which it often does,
     * because people ring us again - we link the lead to it rather than making a second record.
     */
    @Transactional
    public LeadConversionDto convert(Long id, LeadConvertRequest request) {
        AdminAccount admin = guard.require(AdminPermission.MANAGE_APPLICATIONS);
        Lead lead = require(id);
        if (request == null || request.type() == null || request.type().isBlank()) {
            throw ApiException.badRequest("type must be WORKER or EMPLOYER");
        }
        String type = request.type().trim().toUpperCase(Locale.ENGLISH);
        String phone = request.phone() == null || request.phone().isBlank()
                ? lead.getPhone() : request.phone().trim();
        String name = request.name() == null || request.name().isBlank()
                ? lead.getName() : request.name().trim();

        if ("WORKER".equals(type)) {
            Optional<WorkerAccount> existing = workerRepository.findByPhone(phone);
            WorkerSummaryDto worker;
            boolean created;
            if (existing.isPresent()) {
                worker = onBehalf.summary(existing.get(), null, admin.getName());
                created = false;
            } else {
                worker = onBehalf.registerWorker(new WorkerIntakeRequest(
                        name, phone, request.city(), request.area(), request.skills(),
                        request.categories(), request.expectedSalary(), request.salaryUnit(),
                        request.languages(),
                        request.note() != null ? request.note() : lead.getMessage(),
                        request.email(), request.password()));
                created = true;
            }
            markConverted(lead, worker.id(), null, name, phone);
            audit.record(admin, "LEAD_CONVERTED", "LEAD", lead.getId(),
                    "Converted lead " + lead.getPhone() + " to worker " + worker.id()
                            + (created ? " (new)" : " (already existed)"));
            return new LeadConversionDto(dto(lead, adminNames()), worker, null, created);
        }

        if ("EMPLOYER".equals(type)) {
            Optional<EmployerAccount> existing = employerRepository.findByPhone(phone);
            EmployerAccount account;
            boolean created;
            if (existing.isPresent()) {
                account = existing.get();
                created = false;
            } else {
                account = employerRepository.save(EmployerAccount.builder()
                        .name(name == null || name.isBlank() ? "Employer " + phone : name)
                        .phone(phone)
                        .email(blankToNull(request.email()) == null ? null
                                : request.email().toLowerCase().trim())
                        .password(passwordEncoder.encode(
                                request.password() == null || request.password().length() < 6
                                        ? "sb-" + phone + "-" + System.nanoTime()
                                        : request.password()))
                        .enabled(true)
                        .build());
                employerProfileRepository.save(EmployerProfile.builder()
                        .account(account)
                        .businessName(request.businessName() == null || request.businessName().isBlank()
                                ? account.getName() : request.businessName().trim())
                        .businessType(blankToNull(request.businessType()))
                        .city(blankToNull(request.city()))
                        .area(blankToNull(request.area()))
                        .build());
                created = true;
                audit.record(admin, "EMPLOYER_REGISTERED_ON_BEHALF", "EMPLOYER", account.getId(),
                        "Registered " + account.getName() + " (" + phone + ") on behalf over the phone");
            }
            markConverted(lead, null, account.getId(), name, phone);
            audit.record(admin, "LEAD_CONVERTED", "LEAD", lead.getId(),
                    "Converted lead " + lead.getPhone() + " to employer " + account.getId()
                            + (created ? " (new)" : " (already existed)"));
            return new LeadConversionDto(dto(lead, adminNames()), null,
                    employerSummary(account, admin.getName()), created);
        }

        throw ApiException.badRequest("type must be WORKER or EMPLOYER");
    }

    private void markConverted(Lead lead, Long workerId, Long employerId, String name, String phone) {
        lead.setWorkerId(workerId);
        lead.setEmployerId(employerId);
        lead.setStatus(LeadStatus.CONVERTED);
        if (lead.getName() == null && name != null) {
            lead.setName(name);
        }
        if (phone != null) {
            lead.setPhone(phone);
        }
        lead.setUpdatedAt(LocalDateTime.now());
        leadRepository.save(lead);
    }

    // ================================================================== assembly

    private EmployerSummaryDto employerSummary(EmployerAccount account, String byName) {
        EmployerProfile p = employerProfileRepository.findAll().stream()
                .filter(x -> x.getAccount() != null && x.getAccount().getId().equals(account.getId()))
                .findFirst().orElse(null);
        return new EmployerSummaryDto(account.getId(), account.getName(), account.getPhone(),
                account.getEmail(),
                p == null ? null : p.getBusinessName(),
                p == null ? null : p.getBusinessType(),
                p == null ? null : p.getCity(),
                p == null ? null : p.getArea(),
                account.isEnabled(), account.getCreatedAt(), byName);
    }

    private LeadDto dto(Lead lead, Map<Long, String> adminNames) {
        return new LeadDto(lead.getId(), lead.getSource(), lead.getPhone(), lead.getName(),
                lead.getMessage(), lead.getIntent(), lead.getStatus(), lead.getWorkerId(),
                lead.getEmployerId(), lead.getAssignedAdminId(),
                lead.getAssignedAdminId() == null ? null : adminNames.get(lead.getAssignedAdminId()),
                lead.getNote(), lead.getCreatedAt(), lead.getUpdatedAt());
    }

    private Map<Long, String> adminNames() {
        Map<Long, String> names = new HashMap<>();
        adminRepository.findAll().forEach(a -> names.put(a.getId(), a.getName()));
        return names;
    }

    private Lead require(Long id) {
        return leadRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Lead not found"));
    }

    private static boolean matches(Lead lead, String q) {
        return contains(lead.getPhone(), q) || contains(lead.getName(), q)
                || contains(lead.getMessage(), q) || contains(lead.getNote(), q);
    }

    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase(Locale.ENGLISH).contains(q);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
