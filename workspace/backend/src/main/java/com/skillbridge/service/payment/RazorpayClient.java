package com.skillbridge.service.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;

/**
 * Razorpay - collecting from employers, and paying workers.
 *
 * One vendor, two products, and conflating them is the first mistake available here:
 *
 *   Razorpay Payments  money IN.  An employer funds a job with a card, net banking or UPI.
 *   RazorpayX Payouts  money OUT. A worker is paid to a bank account or a UPI id. Same host,
 *                      different resources, and a separate account balance to top up.
 *
 * No SDK. Razorpay's REST API is a handful of authenticated POSTs and java.net.http is in
 * the JDK; a dependency here would be a tree of transitive packages to save about a hundred
 * lines, in the one part of the system where I most want to read every line that touches money.
 *
 * THE RULE THIS FILE EXISTS TO PROTECT: the browser is not a source of truth.
 * {@link #verifyPaymentSignature} exists for the redirect and proves only that the handshake
 * was not forged - not that money moved. {@link #verifyWebhookSignature} is what the ledger
 * listens to. A payment is captured when Razorpay says so, over a signed webhook, and never
 * because a page came back saying it went well.
 */
@Component
public class RazorpayClient {

    private static final String API = "https://api.razorpay.com/v1";

    @Value("${skillbridge.razorpay.keyId:}")         private String keyId;
    @Value("${skillbridge.razorpay.keySecret:}")     private String keySecret;
    @Value("${skillbridge.razorpay.webhookSecret:}") private String webhookSecret;
    @Value("${skillbridge.razorpay.accountNumber:}") private String accountNumber;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper mapper = new ObjectMapper();

    public boolean razorpayEnabled() {
        return notBlank(keyId) && notBlank(keySecret);
    }

    /** The publishable half. Safe in a browser; the secret never leaves this process. */
    public String publishableKey() {
        return razorpayEnabled() ? keyId : null;
    }

    public String accountNumber() {
        return accountNumber;
    }

    // ------------------------------------------------------------------ transport

    private String auth() {
        if (!razorpayEnabled()) {
            // Named, not a generic 500. "Razorpay is not configured" is an operator's problem
            // and says so; an employer reading "something went wrong" would retry a payment
            // that cannot work.
            throw new ApiException(503, "RAZORPAY_NOT_CONFIGURED: Online payment is not configured "
                    + "on this server yet. Ask your administrator to add Razorpay credentials.");
        }
        return "Basic " + Base64.getEncoder().encodeToString(
                (keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
    }

    private JsonNode call(String path, String method, Object body, Map<String, String> extraHeaders) {
        String authHeader = auth();
        HttpRequest.Builder req = HttpRequest.newBuilder(URI.create(API + path))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", authHeader)
                .header("Content-Type", "application/json");
        if (extraHeaders != null) {
            extraHeaders.forEach(req::header);
        }
        try {
            if ("GET".equals(method)) {
                req.GET();
            } else {
                req.method(method, HttpRequest.BodyPublishers.ofString(
                        body == null ? "{}" : mapper.writeValueAsString(body), StandardCharsets.UTF_8));
            }
        } catch (Exception e) {
            throw new ApiException(500, "Could not serialise the request to the payment provider.");
        }

        HttpResponse<String> res;
        try {
            res = http.send(req.build(), HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            // The gateway being unreachable is not the same as it refusing. A refusal is
            // final; this is worth retrying, and the message has to let an operator tell
            // them apart.
            throw new ApiException(502, "RAZORPAY_UNREACHABLE: Could not reach the payment provider: "
                    + e.getMessage());
        }

        JsonNode payload = null;
        try {
            if (res.body() != null && !res.body().isBlank()) {
                payload = mapper.readTree(res.body());
            }
        } catch (Exception ignored) { /* non-JSON body; reported below as a plain refusal */ }

        if (res.statusCode() < 200 || res.statusCode() >= 300) {
            String description = payload != null && payload.path("error").hasNonNull("description")
                    ? payload.path("error").path("description").asText()
                    : "The payment provider refused the request (" + res.statusCode() + ").";
            throw new ApiException(res.statusCode() == 400 ? 400 : 502, "RAZORPAY_ERROR: " + description);
        }
        return payload;
    }

    /* ------------------------------------------------------------- money in --- */

    /**
     * An order, created before the employer is sent anywhere.
     *
     * {@code receipt} is our own id and comes back on every webhook, which is how an event is
     * tied to a job without trusting anything the browser carried.
     *
     * Amount is in paise, which is also Razorpay's unit - so there is no conversion here and
     * no opportunity for the classic factor-of-100 error.
     */
    public JsonNode createOrder(long amountMinor, String currency, String receipt, Map<String, String> notes) {
        return call("/orders", "POST", Map.of(
                "amount", amountMinor,
                "currency", currency == null ? "INR" : currency,
                "receipt", receipt,
                // Captured automatically on success. A manual capture would leave money
                // authorised but not taken, and a job half-funded in a way neither side sees.
                "payment_capture", 1,
                "notes", notes == null ? Map.of() : notes), null);
    }

    public JsonNode fetchPayment(String paymentId) {
        return call("/payments/" + paymentId, "GET", null, null);
    }

    /**
     * Every payment attempted against an order. What reconciliation asks.
     *
     * A webhook can be lost - a deploy mid-delivery, a network partition, a signature secret
     * rotated at the wrong moment - and when it is, the money has still moved and only the
     * gateway knows. Polling the order is how the books catch up with reality rather than
     * with our inbox.
     */
    public JsonNode fetchOrderPayments(String orderId) {
        return call("/orders/" + orderId + "/payments", "GET", null, null);
    }

    /**
     * The redirect handshake.
     *
     * Razorpay signs {@code order_id|payment_id} with the key secret. A match proves the
     * values were not made up by whoever is at the browser. It does NOT prove the payment was
     * captured, settled, or not later refunded - only the webhook says that, which is why
     * nothing in this system funds a job from here.
     */
    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        if (!razorpayEnabled()) {
            throw ApiException.badRequest("Online payment is not configured.");
        }
        return safeEqual(hmacHex(keySecret, (orderId + "|" + paymentId).getBytes(StandardCharsets.UTF_8)),
                signature);
    }

    /**
     * The webhook signature - the one that matters.
     *
     * Computed over the RAW body bytes. Re-serialising parsed JSON would reorder keys and
     * change whitespace, and the digest would never match: the controller must hand this the
     * exact bytes that arrived.
     */
    public boolean verifyWebhookSignature(byte[] rawBody, String signature) {
        // No secret configured means every delivery is unverifiable. Returning false is the
        // safe answer - an endpoint that accepts unsigned events is an endpoint anyone on the
        // internet can use to mark a job funded.
        if (!notBlank(webhookSecret) || !notBlank(signature) || rawBody == null) {
            return false;
        }
        return safeEqual(hmacHex(webhookSecret, rawBody), signature);
    }

    private static String hmacHex(String secret, byte[] payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC-SHA256 unavailable", e);
        }
    }

    /** Constant-time compare, so a wrong signature cannot be found a byte at a time. */
    static boolean safeEqual(String a, String b) {
        byte[] x = String.valueOf(a).getBytes(StandardCharsets.UTF_8);
        byte[] y = String.valueOf(b == null ? "" : b).getBytes(StandardCharsets.UTF_8);
        if (x.length != y.length) {
            return false;
        }
        return java.security.MessageDigest.isEqual(x, y);
    }

    /* ------------------------------------------------------------ money out --- */

    /**
     * RazorpayX: a contact, then a fund account, then a payout.
     *
     * Three objects rather than one because the middle one is the destination and is
     * reusable - validated once, paid to many times. That is what lets "verified" mean
     * something stronger than "they typed it twice".
     */
    public JsonNode createContact(String name, String email, String contact, String referenceId) {
        return call("/contacts", "POST", Map.of(
                "name", nz(name), "email", nz(email), "contact", nz(contact),
                "type", "vendor", "reference_id", nz(referenceId)), null);
    }

    public JsonNode createFundAccount(Map<String, Object> body) {
        return call("/fund_accounts", "POST", body, null);
    }

    /**
     * Penny-drop: send a rupee and read back the name the bank has on file.
     *
     * The only check that catches a correctly-formed account number belonging to someone
     * else - a transposed digit that still passes every format rule. The name it returns is
     * compared to the worker's, and a mismatch is shown rather than swallowed, because the
     * alternative is sending their wages to a stranger.
     */
    public JsonNode validateFundAccount(String fundAccountId, long amountMinor, String currency) {
        return call("/fund_accounts/validations", "POST", Map.of(
                "account", Map.of("id", fundAccountId),
                "amount", amountMinor <= 0 ? 100 : amountMinor,
                "currency", currency == null ? "INR" : currency), null);
    }

    /**
     * The transfer itself.
     *
     * {@code X-Payout-Idempotency} is a header Razorpay honours: a retry after a timeout
     * returns the original payout instead of making a second one. Paying a worker twice is
     * the most expensive bug this file could have, and it is prevented here rather than
     * hoped against.
     */
    public JsonNode createPayout(String fundAccountId, long amountMinor, String currency, String mode,
                                 String referenceId, String narration, String idempotencyKey) {
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("account_number", nz(accountNumber));
        body.put("fund_account_id", fundAccountId);
        body.put("amount", amountMinor);
        body.put("currency", currency == null ? "INR" : currency);
        // IMPS for a bank account, UPI for a VPA - the rail has to match the destination or
        // the gateway refuses it.
        body.put("mode", mode);
        body.put("purpose", "payout");
        body.put("queue_if_low_balance", true);
        body.put("reference_id", nz(referenceId));
        body.put("narration", nz(narration));
        Map<String, String> headers = idempotencyKey == null ? null
                : Map.of("X-Payout-Idempotency", idempotencyKey);
        return call("/payouts", "POST", body, headers);
    }

    /** The rail a destination is paid down. A bank account cannot be paid over UPI. */
    public static String payoutModeFor(String kind) {
        return ("UPI".equalsIgnoreCase(kind) || "WALLET".equalsIgnoreCase(kind)) ? "UPI" : "IMPS";
    }

    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }
    private static String nz(String s) { return s == null ? "" : s; }
}
