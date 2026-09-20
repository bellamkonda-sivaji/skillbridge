package com.skillbridge.service;

import com.skillbridge.dto.AccountDto;
import com.skillbridge.dto.AuthRequest;
import com.skillbridge.dto.AuthResponse;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.AdminAccount;
import com.skillbridge.repository.AdminAccountRepository;
import com.skillbridge.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

/** Sign-in only: admin accounts are seeded, never self-registered, and have no OTP path. */
@Service
public class AdminAuthService {

    private final AdminAccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AdminAuthService(AdminAccountRepository accountRepository, PasswordEncoder passwordEncoder,
                            JwtUtil jwtUtil) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse login(AuthRequest request) {
        String identifier = request.loginId();
        if (identifier == null || request.password() == null) {
            throw ApiException.badRequest("Email (or mobile number) and password are required");
        }
        AdminAccount account = findByIdentifier(identifier)
                .orElseThrow(() -> ApiException.unauthorized("Invalid credentials"));
        if (!passwordEncoder.matches(request.password(), account.getPassword())) {
            throw ApiException.unauthorized("Invalid credentials");
        }
        if (!account.isEnabled()) {
            throw ApiException.forbidden("Your account has been disabled.");
        }
        return new AuthResponse(jwtUtil.generateToken(account), AccountDto.from(account));
    }

    private Optional<AdminAccount> findByIdentifier(String identifier) {
        String id = identifier.trim();
        return accountRepository.findByEmail(id)
                .or(() -> accountRepository.findByEmail(id.toLowerCase()))
                .or(() -> accountRepository.findByPhone(id));
    }
}
