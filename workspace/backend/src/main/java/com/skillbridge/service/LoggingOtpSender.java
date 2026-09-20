package com.skillbridge.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Development sender: writes the passcode to the application log instead of sending an SMS. */
@Component
public class LoggingOtpSender implements OtpSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingOtpSender.class);

    @Override
    public void send(String phone, String code) {
        log.info("OTP for {} is {}", phone, code);
    }
}
