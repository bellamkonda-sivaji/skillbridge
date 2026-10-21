package com.skillbridge.service;

import com.skillbridge.exception.ApiException;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class OtpServiceReviewLoginTest {

    private final List<String> sent = new ArrayList<>();
    private final OtpSender sender = (phone, code) -> sent.add(phone);

    private OtpService service(String reviewLogins) {
        return new OtpService(sender, 6, 300, 30, 5, false, reviewLogins, "");
    }

    @Test
    void reviewNumberUsesItsFixedCodeAndSendsNoSms() {
        OtpService otp = service("9000000001:246810");
        otp.request("+91 90000 00001");
        assertTrue(sent.isEmpty());
        assertDoesNotThrow(() -> otp.verify("+91 90000 00001", "246810"));
    }

    @Test
    void otherNumbersCannotUseTheReviewCode() {
        OtpService otp = service("9000000001:246810");
        otp.request("9876543210");
        assertEquals(1, sent.size());
        assertThrows(ApiException.class, () -> otp.verify("9876543210", "246810"));
    }

    @Test
    void blankOrMalformedSpecMeansNoReviewNumbers() {
        assertTrue(OtpService.parseReviewLogins("").isEmpty());
        assertTrue(OtpService.parseReviewLogins(null).isEmpty());
        assertTrue(OtpService.parseReviewLogins("123:999999, 9000000001:abc").isEmpty());
    }

    @Test
    void fixedCodeWorksForAnyNumberWithoutSms() {
        OtpService otp = new OtpService(sender, 6, 300, 30, 5, false, "", "112233");
        otp.request("9876543210");
        assertTrue(sent.isEmpty());
        assertDoesNotThrow(() -> otp.verify("9876543210", "112233"));
    }

    @Test
    void blankFixedCodeKeepsRealOtps() {
        OtpService otp = new OtpService(sender, 6, 300, 30, 5, false, "", "");
        otp.request("9876543210");
        assertEquals(1, sent.size());
        assertThrows(ApiException.class, () -> otp.verify("9876543210", "112233"));
    }
}
