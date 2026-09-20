package com.skillbridge.service;

/**
 * Delivery seam for one-time passcodes. Swap {@link LoggingOtpSender} for an
 * MSG91 / Twilio implementation to send real SMS - nothing else has to change.
 */
public interface OtpSender {
    void send(String phone, String code);
}
