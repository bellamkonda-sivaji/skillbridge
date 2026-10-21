package com.skillbridge.service;

import com.skillbridge.dto.OtpChallengeResponse;
import com.skillbridge.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Issues and verifies one-time passcodes. Challenges live in memory only - they are
 * short-lived by design, so there is no table for them.
 */
@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    private final OtpSender otpSender;
    private final int length;
    private final int ttlSeconds;
    private final int resendAfterSeconds;
    private final int maxAttempts;
    private final boolean exposeCode;
    /** Store-review accounts: a fixed code for a few listed numbers, never for anyone else. */
    private final Map<String, String> reviewCodes;
    /** Demo mode: one code for every number, and no SMS. Blank (the default) turns it off. */
    private final String fixedCode;

    private final Map<String, Challenge> challenges = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public OtpService(OtpSender otpSender,
                      @Value("${skillbridge.otp.length:6}") int length,
                      @Value("${skillbridge.otp.ttl-seconds:300}") int ttlSeconds,
                      @Value("${skillbridge.otp.resend-after-seconds:30}") int resendAfterSeconds,
                      @Value("${skillbridge.otp.max-attempts:5}") int maxAttempts,
                      @Value("${skillbridge.otp.expose-code:false}") boolean exposeCode,
                      @Value("${skillbridge.otp.review-logins:}") String reviewLogins,
                      @Value("${skillbridge.otp.fixed-code:}") String fixedCode) {
        this.otpSender = otpSender;
        this.length = length;
        this.ttlSeconds = ttlSeconds;
        this.resendAfterSeconds = resendAfterSeconds;
        this.maxAttempts = maxAttempts;
        this.exposeCode = exposeCode;
        this.reviewCodes = parseReviewLogins(reviewLogins);
        String fixed = fixedCode == null ? "" : fixedCode.trim();
        this.fixedCode = fixed.matches("\\d{4,8}") ? fixed : null;
        if (this.fixedCode != null) {
            log.warn("OTP demo mode is ON: every number accepts the fixed code and no SMS is sent. "
                    + "Unset OTP_FIXED_CODE before real users sign up.");
        }
    }

    /** "9000000001:123456,9000000002:654321" - the last 10 digits of each number, and its code. */
    static Map<String, String> parseReviewLogins(String spec) {
        Map<String, String> out = new HashMap<>();
        if (spec == null) return out;
        for (String pair : spec.split(",")) {
            String[] parts = pair.trim().split(":");
            if (parts.length != 2) continue;
            String number = lastTen(parts[0]);
            String code = parts[1].trim();
            if (number != null && code.matches("\\d{4,8}")) out.put(number, code);
        }
        return Map.copyOf(out);
    }

    private static String lastTen(String phone) {
        String digits = phone == null ? "" : phone.replaceAll("\\D", "");
        return digits.length() < 10 ? null : digits.substring(digits.length() - 10);
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

        // Not every key is a phone (password reset keys by account), and Map.copyOf rejects null lookups.
        String number = lastTen(key);
        String reviewCode = number == null ? null : reviewCodes.get(number);
        String fixed = reviewCode != null ? reviewCode : fixedCode;
        String code = fixed != null ? fixed : generateCode();
        challenges.put(key, new Challenge(code, now.plusSeconds(ttlSeconds), now));
        // A review number has no SIM behind it; its code is written in the store's review notes.
        if (fixed == null) {
            otpSender.send(key, code);
        }

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
