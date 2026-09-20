package com.skillbridge.service;

import com.skillbridge.dto.AccountDto;
import com.skillbridge.dto.AuthRequest;
import com.skillbridge.dto.AuthResponse;
import com.skillbridge.dto.OtpChallengeResponse;
import com.skillbridge.dto.OtpRequest;
import com.skillbridge.dto.OtpVerifyRequest;
import com.skillbridge.dto.OtpVerifyResponse;
import com.skillbridge.dto.RegisterRequest;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.EmployerAccount;
import com.skillbridge.model.EmployerProfile;
import com.skillbridge.repository.EmployerAccountRepository;
import com.skillbridge.repository.EmployerProfileRepository;
import com.skillbridge.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Employer-side sign-up and sign-in. The same mobile number may already hold a worker account -
 * that is intentional, so nothing here looks at {@code worker_accounts}.
 */
@Service
public class EmployerAuthService {

    private final EmployerAccountRepository accountRepository;
    private final EmployerProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;

    public EmployerAuthService(EmployerAccountRepository accountRepository,
                               EmployerProfileRepository profileRepository,
                               PasswordEncoder passwordEncoder, JwtUtil jwtUtil, OtpService otpService) {
        this.accountRepository = accountRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.otpService = otpService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.name() == null || request.name().isBlank()
                || request.phone() == null || request.phone().isBlank()
                || request.password() == null || request.password().length() < 6) {
            throw ApiException.badRequest("Name, mobile number and password (min 6 chars) are required");
        }
        String phone = request.phone().trim();
        if (accountRepository.existsByPhone(phone)) {
            throw ApiException.conflict("An employer account with this mobile number already exists");
        }
        String email = null;
        if (request.email() != null && !request.email().isBlank()) {
            email = request.email().toLowerCase().trim();
            if (accountRepository.existsByEmail(email)) {
                throw ApiException.conflict("An employer account with this email already exists");
            }
        }

        EmployerAccount account = accountRepository.save(EmployerAccount.builder()
                .name(request.name().trim())
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .phone(phone)
                .locale(request.locale() != null ? request.locale() : "en")
                .enabled(true)
                .build());
        profileRepository.save(EmployerProfile.builder()
                .account(account)
                .businessName(request.name().trim())
                .build());
        return response(account);
    }

    public AuthResponse login(AuthRequest request) {
        String identifier = request.loginId();
        if (identifier == null || request.password() == null) {
            throw ApiException.badRequest("Mobile number (or email) and password are required");
        }
        EmployerAccount account = findByIdentifier(identifier)
                .orElseThrow(() -> ApiException.unauthorized("Invalid credentials"));
        if (!passwordEncoder.matches(request.password(), account.getPassword())) {
            throw ApiException.unauthorized("Invalid credentials");
        }
        if (!account.isEnabled()) {
            throw ApiException.forbidden("Your account has been disabled. Contact support.");
        }
        return response(account);
    }

    public OtpChallengeResponse requestOtp(OtpRequest request) {
        return otpService.request(request.phone());
    }

    @Transactional
    public OtpVerifyResponse verifyOtp(OtpVerifyRequest request) {
        otpService.verify(request.phone(), request.code());
        Optional<EmployerAccount> existing = accountRepository.findByPhone(request.phone().trim());
        if (existing.isEmpty()) {
            return new OtpVerifyResponse(true, null, null);
        }
        EmployerAccount account = existing.get();
        if (!account.isPhoneVerified()) {
            account.setPhoneVerified(true);
            account = accountRepository.save(account);
        }
        return new OtpVerifyResponse(true, jwtUtil.generateToken(account), AccountDto.from(account));
    }

    private Optional<EmployerAccount> findByIdentifier(String identifier) {
        String id = identifier.trim();
        return accountRepository.findByPhone(id)
                .or(() -> accountRepository.findByEmail(id))
                .or(() -> accountRepository.findByEmail(id.toLowerCase()));
    }

    private AuthResponse response(EmployerAccount account) {
        return new AuthResponse(jwtUtil.generateToken(account), AccountDto.from(account));
    }
}
