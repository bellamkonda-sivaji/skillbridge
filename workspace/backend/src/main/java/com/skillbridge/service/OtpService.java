package com.skillbridge.service;

import com.skillbridge.dto.OtpChallengeResponse;
import com.skillbridge.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Issues and verifies one-time passcodes. Challenges live in memory only - they are
 * short-lived by design, so there is no table for them.
 */
@Service
public class OtpService {

    private final OtpSender otpSender;
    private final int length;
    private final int ttlSeconds;
    private final int resendAfterSeconds;
    private final int maxAttempts;
    private final boolean exposeCode;

    private final Map<String, Challenge> challenges = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public OtpService(OtpSender otpSender,
                      @Value("${skillbridge.otp.length:6}") int length,
                      @Value("${skillbridge.otp.ttl-seconds:300}") int ttlSeconds,
                      @Value("${skillbridge.otp.resend-after-seconds:30}") int resendAfterSeconds,
                      @Value("${skillbridge.otp.max-attempts:5}") int maxAttempts,
                      @Value("${skillbridge.otp.expose-code:false}") boolean exposeCode) {
        this.otpSender = otpSender;
        this.length = length;
        this.ttlSeconds = ttlSeconds;
        this.resendAfterSeconds = resendAfterSeconds;
        this.maxAttempts = maxAttempts;
        this.exposeCode = exposeCode;
    }

    private static final class Challenge {
        private final String code;
        private final Instant expiresAt;
        private final Instant sentAt;
        private int attempts;

        private Challenge(String code, Instant expiresAt, Instant sentAt) {
            this.code = code;
            this.expiresAt = expiresAt;
            this.sentAt = sentAt;
        }

        private boolean isExpired(Instant now) {
            return now.isAfter(expiresAt);
        }
    }

    public OtpChallengeResponse request(String phone) {
        String key = normalize(phone);
        if (key == null) {
            throw ApiException.badRequest("A mobile number is required");
        }
        Instant now = Instant.now();
        prune(now);

        Challenge existing = challenges.get(key);
        if (existing != null && !existing.isExpired(now)
                && now.isBefore(existing.sentAt.plusSeconds(resendAfterSeconds))) {
            long wait = resendAfterSeconds - (now.getEpochSecond() - existing.sentAt.getEpochSecond());
            throw ApiException.tooManyRequests(
                    "Please wait " + Math.max(wait, 1) + " seconds before requesting another OTP");
        }

        String code = generateCode();
        challenges.put(key, new Challenge(code, now.plusSeconds(ttlSeconds), now));
        otpSender.send(key, code);

        return new OtpChallengeResponse(true, ttlSeconds, resendAfterSeconds, exposeCode ? code : null);
    }

    /** Throws {@link ApiException} with 400 when the code is wrong, expired or was never requested. */
    public void verify(String phone, String code) {
        String key = normalize(phone);
        if (key == null) {
            throw ApiException.badRequest("A mobile number is required");
        }
        if (code == null || code.isBlank()) {
            throw ApiException.badRequest("Enter the OTP sent to your mobile number");
        }
        Instant now = Instant.now();
        prune(now);

        Challenge challenge = challenges.get(key);
        if (challenge == null) {
            throw ApiException.badRequest("No OTP was requested for this number. Please request a new one.");
        }
        if (challenge.isExpired(now)) {
            challenges.remove(key);
            throw ApiException.badRequest("This OTP has expired. Please request a new one.");
        }
        if (!challenge.code.equals(code.trim())) {
            challenge.attempts++;
            if (challenge.attempts >= maxAttempts) {
                challenges.remove(key);
                throw ApiException.badRequest("Too many incorrect attempts. Please request a new OTP.");
            }
            int left = maxAttempts - challenge.attempts;
            throw ApiException.badRequest("Incorrect OTP. " + left + " attempt(s) left.");
        }
        challenges.remove(key);
    }

    private String generateCode() {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    private void prune(Instant now) {
        challenges.entrySet().removeIf(e -> e.getValue().isExpired(now));
    }

    private String normalize(String phone) {
        if (phone == null || phone.isBlank()) return null;
        return phone.trim();
    }
}
