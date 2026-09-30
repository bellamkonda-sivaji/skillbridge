package com.skillbridge.controller;

import com.skillbridge.dto.AuthRequest;
import com.skillbridge.dto.AuthResponse;
import com.skillbridge.dto.admin.AdminDtos.AdminDto;
import com.skillbridge.dto.admin.AdminDtos.AdminRegisterRequest;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.AdminAuthService;
import com.skillbridge.service.AdminTeamService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * Sign-in, the signed-in admin's own record, and the bootstrap-or-SUPER_ADMIN register route.
 * The whole namespace is permitAll in the filter chain, so register enforces its own rule.
 */
@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final AdminAuthService authService;
    private final AdminTeamService teamService;

    public AdminAuthController(AdminAuthService authService, AdminTeamService teamService) {
        this.authService = authService;
        this.teamService = teamService;
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody @Valid AuthRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AdminDto me() {
        return teamService.toDto(AuthenticationUtils.currentAdmin());
    }

    /**
     * Allowed unauthenticated only while no admin exists at all; after that it demands a
     * SUPER_ADMIN token and the caller picks the new account's role.
     */
    @PostMapping("/register")
    public AuthResponse register(@RequestBody AdminRegisterRequest request) {
        return teamService.register(request);
    }
}
