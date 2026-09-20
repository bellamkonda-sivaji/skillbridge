package com.skillbridge.controller;

import com.skillbridge.dto.AccountDto;
import com.skillbridge.dto.AuthRequest;
import com.skillbridge.dto.AuthResponse;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.AdminAuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/** Admins are seeded, so this namespace has sign-in only - no register, no OTP. */
@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final AdminAuthService authService;

    public AdminAuthController(AdminAuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody @Valid AuthRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AccountDto me() {
        return AccountDto.from(AuthenticationUtils.currentAdmin());
    }
}
