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
import com.skillbridge.model.WorkerAccount;
import com.skillbridge.model.WorkerProfile;
import com.skillbridge.repository.WorkerAccountRepository;
import com.skillbridge.repository.WorkerProfileRepository;
import com.skillbridge.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Worker-side sign-up and sign-in. Deliberately knows nothing about employers: the phone number
 * uniqueness it enforces is the one inside {@code worker_accounts} only.
 */
@Service
public class WorkerAuthService {

    private final WorkerAccountRepository accountRepository;
    private final WorkerProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;

    public WorkerAuthService(WorkerAccountRepository accountRepository,
                             WorkerProfileRepository profileRepository,
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
            throw ApiException.conflict("A worker account with this mobile number already exists");
        }
        String email = null;
        if (request.email() != null && !request.email().isBlank()) {
            email = request.email().toLowerCase().trim();
            if (accountRepository.existsByEmail(email)) {
                throw ApiException.conflict("A worker account with this email already exists");
            }
        }

        WorkerAccount account = accountRepository.save(WorkerAccount.builder()
                .name(request.name().trim())
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .phone(phone)
                .locale(request.locale() != null ? request.locale() : "en")
                .enabled(true)
                .build());
        profileRepository.save(WorkerProfile.builder().account(account).build());
        return response(account);
    }

    public AuthResponse login(AuthRequest request) {
        String identifier = request.loginId();
        if (identifier == null || request.password() == null) {
            throw ApiException.badRequest("Mobile number (or email) and password are required");
        }
        WorkerAccount account = findByIdentifier(identifier)
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
        Optional<WorkerAccount> existing = accountRepository.findByPhone(request.phone().trim());
        if (existing.isEmpty()) {
            // The number is verified but there is no worker account yet - the client goes on to register.
            return new OtpVerifyResponse(true, null, null);
        }
        WorkerAccount account = existing.get();
        if (!account.isPhoneVerified()) {
            account.setPhoneVerified(true);
            account = accountRepository.save(account);
        }
        return new OtpVerifyResponse(true, jwtUtil.generateToken(account), AccountDto.from(account));
    }

    private Optional<WorkerAccount> findByIdentifier(String identifier) {
        String id = identifier.trim();
        return accountRepository.findByPhone(id)
                .or(() -> accountRepository.findByEmail(id))
                .or(() -> accountRepository.findByEmail(id.toLowerCase()));
    }

    private AuthResponse response(WorkerAccount account) {
        return new AuthResponse(jwtUtil.generateToken(account), AccountDto.from(account));
    }
}
