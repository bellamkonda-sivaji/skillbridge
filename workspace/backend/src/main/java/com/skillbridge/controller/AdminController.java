package com.skillbridge.controller;

import com.skillbridge.dto.AccountDto;
import com.skillbridge.dto.AdminAnalyticsDto;
import com.skillbridge.dto.EmployerProfileDto;
import com.skillbridge.dto.InterviewDto;
import com.skillbridge.dto.JobDto;
import com.skillbridge.dto.MatchDto;
import com.skillbridge.dto.ReviewDto;
import com.skillbridge.dto.SkillDto;
import com.skillbridge.dto.SkillRequest;
import com.skillbridge.dto.WalletDto;
import com.skillbridge.dto.WalletTransactionDto;
import com.skillbridge.dto.WorkerProfileDto;
import com.skillbridge.model.AccountType;
import com.skillbridge.model.AdminAccount;
import com.skillbridge.model.AdminPermission;
import com.skillbridge.service.AdminAuditService;
import com.skillbridge.service.AdminGuard;
import com.skillbridge.service.AdminService;
import com.skillbridge.service.SkillService;
import com.skillbridge.service.WalletService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final WalletService walletService;
    private final SkillService skillService;
    private final AdminGuard guard;
    private final AdminAuditService audit;

    public AdminController(AdminService adminService, WalletService walletService,
                           SkillService skillService, AdminGuard guard, AdminAuditService audit) {
        this.adminService = adminService;
        this.walletService = walletService;
        this.skillService = skillService;
        this.guard = guard;
        this.audit = audit;
    }

    @GetMapping("/analytics")
    public AdminAnalyticsDto analytics() {
        return adminService.analytics();
    }

    /** {@code type} is WORKER / EMPLOYER / ADMIN; omitted means every table. */
    @GetMapping("/accounts")
    public List<AccountDto> accounts(@RequestParam(required = false) String type,
                                     @RequestParam(required = false) String q) {
        return adminService.allAccounts(type, q);
    }

    @PatchMapping("/accounts/{accountType}/{accountId}/status")
    public AccountDto toggleAccount(@PathVariable String accountType, @PathVariable Long accountId,
                                    @RequestBody StatusRequest request) {
        AdminAccount admin = guard.require(AdminPermission.TOGGLE_ACCOUNT_STATUS);
        AccountDto result = adminService.setAccountEnabled(
                AccountType.valueOf(accountType.toUpperCase()), accountId, request.enabled());
        audit.record(admin, "ACCOUNT_STATUS_CHANGE", accountType.toUpperCase(), accountId,
                result.name() + " " + (request.enabled() ? "enabled" : "disabled"));
        return result;
    }

    @GetMapping("/verifications")
    public List<WorkerProfileDto> pendingVerifications() {
        return adminService.pendingVerifications();
    }

    @PatchMapping("/verifications/{workerAccountId}")
    public WorkerProfileDto verify(@PathVariable Long workerAccountId, @RequestBody VerifyRequest request) {
        AdminAccount admin = guard.require(AdminPermission.VERIFY_ACCOUNTS);
        WorkerProfileDto result = adminService.verifyWorker(
                workerAccountId, request.approved(), request.note());
        audit.record(admin, "WORKER_VERIFICATION", "WORKER", workerAccountId,
                request.approved() ? "Approved" : "Rejected");
        return result;
    }

    @PatchMapping("/employers/{employerAccountId}/verify")
    public EmployerProfileDto verifyEmployer(@PathVariable Long employerAccountId,
                                             @RequestBody VerifyRequest request) {
        AdminAccount admin = guard.require(AdminPermission.VERIFY_ACCOUNTS);
        EmployerProfileDto result = adminService.verifyEmployer(
                employerAccountId, request.approved());
        audit.record(admin, "EMPLOYER_VERIFICATION", "EMPLOYER", employerAccountId,
                request.approved() ? "Verified" : "Unverified");
        return result;
    }

    @GetMapping("/jobs")
    public List<JobDto> allJobs() {
        return adminService.allJobs();
    }

    @GetMapping("/matches")
    public List<MatchDto> allMatches() {
        return adminService.allMatches();
    }

    @GetMapping("/interviews")
    public List<InterviewDto> allInterviews() {
        return adminService.allInterviews();
    }

    @GetMapping("/reviews/{targetType}")
    public List<ReviewDto> reviewsForType(@PathVariable String targetType) {
        return adminService.reviewsForType(AccountType.valueOf(targetType.toUpperCase()));
    }

    @GetMapping("/employers")
    public List<EmployerProfileDto> allEmployers() {
        return adminService.allEmployers();
    }

    @GetMapping("/wallets")
    public List<WalletDto> allWallets() {
        guard.require(AdminPermission.VIEW_PAYMENTS);
        return walletService.allWallets();
    }

    @GetMapping("/payments")
    public List<WalletTransactionDto> allPayments() {
        guard.require(AdminPermission.VIEW_PAYMENTS);
        return walletService.allTransactions();
    }

    @PostMapping("/skills")
    @ResponseStatus(HttpStatus.CREATED)
    public SkillDto createSkill(@RequestBody SkillRequest request) {
        AdminAccount admin = guard.require(AdminPermission.MANAGE_SKILLS);
        SkillDto created = skillService.create(request);
        audit.record(admin, "SKILL_CREATE", "SKILL", created.id(), created.name());
        return created;
    }

    public record StatusRequest(boolean enabled) {}
    public record VerifyRequest(boolean approved, String note) {}
}
