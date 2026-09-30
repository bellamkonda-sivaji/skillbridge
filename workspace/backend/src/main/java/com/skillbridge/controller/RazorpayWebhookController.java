package com.skillbridge.controller;

import com.skillbridge.service.payment.RazorpayPaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * The gateway talking to us.
 *
 * Unauthenticated by necessity - Razorpay has no session - so the signature over the raw
 * bytes is the whole of the security. The body is taken as {@code byte[]} on purpose: Spring
 * would happily bind it to a Map, and re-serialising that back to JSON would reorder keys and
 * change whitespace, so no legitimate delivery would ever verify.
 *
 * Always answers 200 once the event is stored. A 500 makes Razorpay retry an event we already
 * hold, which fixes nothing and only adds noise.
 */
@RestController
@RequestMapping("/api/payments/razorpay")
public class RazorpayWebhookController {

    private final RazorpayPaymentService payments;

    public RazorpayWebhookController(RazorpayPaymentService payments) {
        this.payments = payments;
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> webhook(
            @RequestBody(required = false) byte[] rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestHeader(value = "X-Razorpay-Event-Id", required = false) String eventId) {
        return ResponseEntity.ok(payments.handleWebhook(
                rawBody == null ? new byte[0] : rawBody, signature, eventId));
    }
}
