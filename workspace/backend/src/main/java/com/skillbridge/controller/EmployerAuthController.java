package com.skillbridge.controller;

import com.skillbridge.dto.*;
import com.skillbridge.model.AccountType;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.EmployerAuthService;
import com.skillbridge.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employer/auth")
public class EmployerAuthController {

    private final EmployerAuthService authService;
    private final PasswordResetService passwordResetService;

    public EmployerAuthController(EmployerAuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@RequestBody @Valid RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody @Valid AuthRequest request) {
        return authService.login(request);
    }

    @PostMapping("/otp/request")
    public OtpChallengeResponse requestOtp(@RequestBody OtpRequest request) {
        return authService.requestOtp(request);
    }

    @PostMapping("/otp/verify")
    public OtpVerifyResponse verifyOtp(@RequestBody OtpVerifyRequest request) {
        return authService.verifyOtp(request);
    }

    @GetMapping("/me")
    public AccountDto me() {
        return AccountDto.from(AuthenticationUtils.currentEmployer());
    }

    // ---------------------------------------------------------------- password reset

    /** Always 200, even for an identifier nobody owns - account existence must not leak. */
    @PostMapping("/password/forgot")
    public PasswordForgotResponse forgotPassword(@RequestBody PasswordForgotRequest request) {
        return passwordResetService.forgot(AccountType.EMPLOYER, request.identifier());
    }

    @PostMapping("/password/verify")
    public PasswordVerifyResponse verifyPasswordCode(@RequestBody PasswordVerifyRequest request) {
        return passwordResetService.verify(AccountType.EMPLOYER, request.identifier(), request.code());
    }

    @PostMapping("/password/reset")
    public PasswordResetResponse resetPassword(@RequestBody PasswordResetRequest request) {
        return passwordResetService.reset(AccountType.EMPLOYER, request.identifier(),
                request.resetToken(), request.newPassword());
    }
}
