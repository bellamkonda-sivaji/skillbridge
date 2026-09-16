package com.skillbridge.controller;

import com.skillbridge.dto.AdminAnalyticsDto;
import com.skillbridge.dto.EmployerProfileDto;
import com.skillbridge.dto.InterviewDto;
import com.skillbridge.dto.JobDto;
import com.skillbridge.dto.MatchDto;
import com.skillbridge.dto.ReviewDto;
import com.skillbridge.dto.SkillDto;
import com.skillbridge.dto.SkillRequest;
import com.skillbridge.dto.UserDto;
import com.skillbridge.dto.WalletDto;
import com.skillbridge.dto.WalletTransactionDto;
import com.skillbridge.dto.WorkerProfileDto;
import com.skillbridge.model.Role;
import com.skillbridge.security.AuthenticationUtils;
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

    public AdminController(AdminService adminService, WalletService walletService, SkillService skillService) {
        this.adminService = adminService;
        this.walletService = walletService;
        this.skillService = skillService;
    }

    @GetMapping("/analytics")
    public AdminAnalyticsDto analytics() {
        return adminService.analytics();
    }

    @GetMapping("/users")
    public List<UserDto> users(@RequestParam(required = false) String role,
                               @RequestParam(required = false) String q) {
        return adminService.allUsers(role, q);
    }

    @PatchMapping("/users/{userId}/status")
    public UserDto toggleUser(@PathVariable Long userId, @RequestBody StatusRequest request) {
        return adminService.setUserEnabled(userId, request.enabled());
    }

    @GetMapping("/verifications")
    public List<WorkerProfileDto> pendingVerifications() {
        return adminService.pendingVerifications();
    }

    @PatchMapping("/verifications/{userId}")
    public WorkerProfileDto verify(@PathVariable Long userId, @RequestBody VerifyRequest request) {
        return adminService.verifyWorker(userId, request.approved(), request.note());
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

    @GetMapping("/reviews/{targetRole}")
    public List<ReviewDto> reviewsForRole(@PathVariable String targetRole) {
        return adminService.reviewsForRole(Role.valueOf(targetRole.toUpperCase()));
    }

    @GetMapping("/employers")
    public List<EmployerProfileDto> allEmployers() {
        return adminService.allEmployers();
    }

    @GetMapping("/wallets")
    public List<WalletDto> allWallets() {
        return walletService.allWallets();
    }

    @GetMapping("/payments")
    public List<WalletTransactionDto> allPayments() {
        return walletService.allTransactions();
    }

    @PostMapping("/skills")
    @ResponseStatus(HttpStatus.CREATED)
    public SkillDto createSkill(@RequestBody SkillRequest request) {
        return skillService.create(request);
    }

    public record StatusRequest(boolean enabled) {}
    public record VerifyRequest(boolean approved, String note) {}
}
