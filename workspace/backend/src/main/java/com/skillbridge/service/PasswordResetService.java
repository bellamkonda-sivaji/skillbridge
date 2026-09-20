package com.skillbridge.service;

import com.skillbridge.dto.OtpChallengeResponse;
import com.skillbridge.dto.PasswordForgotResponse;
import com.skillbridge.dto.PasswordResetResponse;
import com.skillbridge.dto.PasswordVerifyResponse;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.Account;
import com.skillbridge.model.AccountType;
import com.skillbridge.model.EmployerAccount;
import com.skillbridge.model.WorkerAccount;
import com.skillbridge.repository.EmployerAccountRepository;
import com.skillbridge.repository.WorkerAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * "Forgot password" for both the worker and the employer namespace.
 *
 * <p>Three steps: request a code, exchange the code for a single-use reset token, then set the new
 * password. The first step is deliberately blind - it answers 200 whether or not the identifier
 * matches an account, and only actually sends a code when it does, so the endpoint cannot be used
 * to find out who has an account here.</p>
 */
@Service
public class PasswordResetService {

    /** How long a reset token stays usable once the code has been verified. */
    private static final int TOKEN_TTL_SECONDS = 600;

    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern DIGIT = Pattern.compile("\\d");
    private static final Pattern SPECIAL = Pattern.compile("[^A-Za-z0-9]");

    private final WorkerAccountRepository workerRepository;
    private final EmployerAccountRepository employerRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final int ttlSeconds;
    private final int resendAfterSeconds;

    private final Map<String, ResetToken> tokens = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(WorkerAccountRepository workerRepository,
                                EmployerAccountRepository employerRepository,
                                PasswordEncoder passwordEncoder, OtpService otpService,
                                @Value("${skillbridge.otp.ttl-seconds:300}") int ttlSeconds,
                                @Value("${skillbridge.otp.resend-after-seconds:30}") int resendAfterSeconds) {
        this.workerRepository = workerRepository;
        this.employerRepository = employerRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
        this.ttlSeconds = ttlSeconds;
        this.resendAfterSeconds = resendAfterSeconds;
    }

    private record ResetToken(AccountType type, Long accountId, Instant expiresAt) {}

    // ------------------------------------------------------------------ step 1

    public PasswordForgotResponse forgot(AccountType type, String identifier) {
        String id = identifier == null ? "" : identifier.trim();
        if (id.isEmpty()) {
            throw ApiException.badRequest("Enter your registered email or mobile number");
        }
        Optional<Account> account = findAccount(type, id);
        String devCode = null;
        if (account.isPresent()) {
            try {
                OtpChallengeResponse challenge = otpService.request(otpKey(type, account.get()));
                devCode = challenge.devCode();
            } catch (ApiException ex) {
                // A resend inside the cooldown must not turn into a different answer for an
                // account that exists than for one that does not - the earlier code still stands.
                if (ex.getStatus() != 429) {
                    throw ex;
                }
            }
        }
        // The mask is built from what the caller typed, so an unknown identifier looks identical.
        return new PasswordForgotResponse(true, mask(account.map(this::target).orElse(id)),
                ttlSeconds, resendAfterSeconds, devCode);
    }

    // ------------------------------------------------------------------ step 2

    public PasswordVerifyResponse verify(AccountType type, String identifier, String code) {
        String id = identifier == null ? "" : identifier.trim();
        Account account = findAccount(type, id)
                .orElseThrow(() -> ApiException.badRequest(
                        "That code is not valid. Please request a new one."));
        otpService.verify(otpKey(type, account), code);

        prune();
        String token = newToken();
        tokens.put(token, new ResetToken(type, account.getId(),
                Instant.now().plusSeconds(TOKEN_TTL_SECONDS)));
        return new PasswordVerifyResponse(true, token);
    }

    // ------------------------------------------------------------------ step 3

    @Transactional
    public PasswordResetResponse reset(AccountType type, String identifier, String resetToken, String newPassword) {
        validatePassword(newPassword);
        prune();

        ResetToken token = resetToken == null ? null : tokens.get(resetToken);
        if (token == null || token.type() != type || Instant.now().isAfter(token.expiresAt())) {
            throw ApiException.badRequest(
                    "This reset link has expired or has already been used. Please request a new code.");
        }
        Account account = findAccount(type, identifier == null ? "" : identifier.trim())
                .orElseThrow(() -> ApiException.badRequest("This reset request is no longer valid."));
        if (!account.getId().equals(token.accountId())) {
            throw ApiException.badRequest("This reset request is no longer valid.");
        }
        // Single use: burn the token before the password is written, not after.
        tokens.remove(resetToken);

        String encoded = passwordEncoder.encode(newPassword);
        if (account instanceof WorkerAccount worker) {
            worker.setPassword(encoded);
            workerRepository.save(worker);
        } else if (account instanceof EmployerAccount employer) {
            employer.setPassword(encoded);
            employerRepository.save(employer);
        }
        return new PasswordResetResponse(true);
    }

    /** The four rules the UI shows, enforced here so a scripted caller cannot skip them. */
    private void validatePassword(String password) {
        if (password == null || password.length() < 8
                || !UPPERCASE.matcher(password).find()
                || !DIGIT.matcher(password).find()
                || !SPECIAL.matcher(password).find()) {
            throw ApiException.badRequest("Your password needs at least 8 characters, "
                    + "one uppercase letter, one number and one special character.");
        }
    }

    // ------------------------------------------------------------------ helpers

    private Optional<Account> findAccount(AccountType type, String identifier) {
        if (identifier.isEmpty()) {
            return Optional.empty();
        }
        String lower = identifier.toLowerCase();
        return switch (type) {
            case WORKER -> workerRepository.findByPhone(identifier)
                    .or(() -> workerRepository.findByEmail(identifier))
                    .or(() -> workerRepository.findByEmail(lower))
                    .map(a -> (Account) a);
            case EMPLOYER -> employerRepository.findByPhone(identifier)
                    .or(() -> employerRepository.findByEmail(identifier))
                    .or(() -> employerRepository.findByEmail(lower))
                    .map(a -> (Account) a);
            case ADMIN -> Optional.empty();
        };
    }

    /** Keyed per namespace and per account so a reset code never collides with a login OTP. */
    private String otpKey(AccountType type, Account account) {
        return "pwreset:" + type.name() + ":" + account.getId();
    }

    /** The channel the code went to: the email when there is one, otherwise the mobile number. */
    private String target(Account account) {
        String email = account.getEmail();
        return email != null && !email.isBlank() ? email : account.getPhone();
    }

    /** {@code business@freshmart.com} -> {@code bu****@freshmart.com}; {@code 9000000002} -> {@code 90****02}. */
    static String mask(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String v = value.trim();
        int at = v.indexOf('@');
        if (at > 0) {
            String local = v.substring(0, at);
            String domain = v.substring(at);
            String head = local.length() <= 2 ? local : local.substring(0, 2);
            return head + "****" + domain;
        }
        if (v.length() <= 4) {
            return "****";
        }
        return v.substring(0, 2) + "****" + v.substring(v.length() - 2);
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void prune() {
        Instant now = Instant.now();
        tokens.entrySet().removeIf(e -> now.isAfter(e.getValue().expiresAt()));
    }
}
