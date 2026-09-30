package com.skillbridge.service.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.dto.payment.PaymentDtos.*;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.money.*;
import com.skillbridge.repository.PaymentOrderRepository;
import com.skillbridge.repository.WebhookEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;

/**
 * Funding a job with real money.
 *
 * The shape of this file is one rule: THE BROWSER IS NOT A SOURCE OF TRUTH.
 *
 *   createOrder   we write down what we asked for, before anyone pays
 *   verify        the redirect comes back; we check the handshake and say "we are waiting
 *                 for the gateway", and nothing else
 *   webhook       the gateway tells us, signed. THIS funds the job.
 *
 * Every one of those exists because the obvious shortcut - fund the job when the browser
 * comes back saying it worked - hands anyone who can edit a URL an unlimited budget.
 */
@Service
public class RazorpayPaymentService {

    private final RazorpayClient razorpay;
    private final PaymentOrderRepository orders;
    private final WebhookEventRepository events;
    private final EscrowService escrow;
    private final ObjectMapper mapper = new ObjectMapper();

    public RazorpayPaymentService(RazorpayClient razorpay, PaymentOrderRepository orders,
                                  WebhookEventRepository events, EscrowService escrow) {
        this.razorpay = razorpay;
        this.orders = orders;
        this.events = events;
        this.escrow = escrow;
    }

    /**
     * Step 1 - the order, written down before the employer goes anywhere.
     *
     * Created even if they abandon the checkout. A payment that succeeds while the browser
     * dies still arrives by webhook, and without a row created here there is nothing to match
     * it to.
     */
    @Transactional
    public OrderCreatedDto createOrder(Long jobId, Long employerId, long amountMinor) {
        if (amountMinor <= 0) {
            throw ApiException.badRequest("Enter an amount to fund");
        }
        String receipt = "JOB-" + jobId + "-" + Long.toString(System.currentTimeMillis(), 36);
        JsonNode created = razorpay.createOrder(amountMinor, "INR", receipt,
                // Our own ids, handed back on every webhook. This is how an event is tied to a
                // job without trusting anything the browser carried.
                Map.of("jobId", String.valueOf(jobId), "employerId", String.valueOf(employerId),
                        "receipt", receipt));

        PaymentOrder row = orders.save(PaymentOrder.builder()
                .jobId(jobId).employerId(employerId)
                .provider("RAZORPAY")
                .providerOrderId(created.path("id").asText(null))
                .amountMinor(amountMinor)
                .currency(created.path("currency").asText("INR"))
                .receipt(receipt)
                .status(PaymentOrderStatus.CREATED)
                .build());

        return new OrderCreatedDto(row.getId(), row.getProviderOrderId(), row.getAmountMinor(),
                row.getCurrency(), razorpay.publishableKey(), receipt);
    }

    /**
     * Step 2 - the redirect comes back.
     *
     * The signature proves the handshake was not forged. It does NOT prove money moved, so
     * this marks the order ATTEMPTED and says we are waiting. Funding happens in the webhook,
     * and the employer watching this screen sees it flip when the gateway confirms.
     */
    @Transactional
    public VerifyResultDto verify(Long jobId, String providerOrderId, String providerPaymentId,
                                  String signature) {
        PaymentOrder row = orders.findByProviderOrderId(providerOrderId)
                .filter(o -> o.getJobId().equals(jobId))
                .orElseThrow(() -> ApiException.badRequest("That payment does not belong to this job."));

        if (!razorpay.verifyPaymentSignature(providerOrderId, providerPaymentId, signature)) {
            row.setStatus(PaymentOrderStatus.FAILED);
            row.setFailureReason("The payment signature did not verify.");
            row.setUpdatedAt(LocalDateTime.now());
            orders.save(row);
            throw ApiException.badRequest(
                    "That payment could not be verified. Nothing has been charged to this job.");
        }

        if (row.getStatus() != PaymentOrderStatus.PAID) {
            row.setStatus(PaymentOrderStatus.ATTEMPTED);
        }
        if (row.getProviderPaymentId() == null) {
            row.setProviderPaymentId(providerPaymentId);
        }
        row.setUpdatedAt(LocalDateTime.now());
        orders.save(row);

        // The honest answer at this moment. Saying "funded" here would be repeating what
        // their own browser said.
        return new VerifyResultDto(true, row.getStatus(),
                row.getStatus() == PaymentOrderStatus.PAID
                        ? "Payment confirmed and the job is funded."
                        : "Your bank has accepted the payment. We fund the job the moment the "
                          + "gateway confirms it, usually within a few seconds.");
    }

    // ------------------------------------------------------------------ the webhook

    /**
     * What the gateway tells us. The only thing an unauthenticated caller can reach, and the
     * only thing that funds a job from real money.
     *
     * Unauthenticated by necessity - Razorpay has no session - so the signature over the raw
     * bytes is the whole of the security. Always answers 200 once the event is stored: a 500
     * makes Razorpay retry an event we already hold, which fixes nothing.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Map<String, Object> handleWebhook(byte[] rawBody, String signature, String headerEventId) {
        boolean signatureOk = razorpay.verifyWebhookSignature(rawBody, signature);

        JsonNode event = null;
        try {
            event = mapper.readTree(rawBody);
        } catch (Exception ignored) { /* stored below as unparseable */ }

        // Not every Razorpay event shape carries an id, so a hash of the payload stands in.
        // Either way the column is unique and the second delivery cannot be processed twice.
        String eventId = headerEventId != null && !headerEventId.isBlank() ? headerEventId
                : (event != null && event.at("/payload/payment/entity/id").isTextual()
                        ? event.at("/payload/payment/entity/id").asText()
                        : sha256(rawBody));

        if (events.findByProviderAndEventId("RAZORPAY", eventId).isPresent()) {
            // Already seen. Razorpay retries; this is the retry, and it is a no-op.
            return Map.of("received", true, "duplicate", true);
        }

        WebhookEvent stored = events.save(WebhookEvent.builder()
                .provider("RAZORPAY")
                .eventId(eventId)
                .eventType(event != null ? event.path("event").asText("unknown") : "unparseable")
                .payload(new String(rawBody == null ? new byte[0] : rawBody, StandardCharsets.UTF_8))
                .signatureOk(signatureOk)
                .build());

        if (!signatureOk) {
            // Stored for forensics, acted on by nothing. A webhook URL is public and anyone can
            // post to it; an unsigned delivery is a stranger's opinion.
            stored.setProcessedAt(LocalDateTime.now());
            stored.setProcessError("Signature did not verify. Ignored.");
            events.save(stored);
            return Map.of("received", true, "ignored", "signature");
        }

        try {
            applyEvent(event);
            stored.setProcessedAt(LocalDateTime.now());
        } catch (Exception e) {
            // Recorded rather than thrown: the event is safely stored and an operator can
            // replay it. Throwing would make Razorpay redeliver something we already hold.
            stored.setProcessedAt(LocalDateTime.now());
            stored.setProcessError(truncate(String.valueOf(e.getMessage())));
        }
        events.save(stored);
        return Map.of("received", true);
    }

    /**
     * One captured payment becomes one funded job, exactly once.
     *
     * The job id comes from the order row we wrote before the redirect, not from the
     * webhook's notes - notes are echoed back from what we sent, and reading the id from
     * there would mean trusting a round trip when we have the original.
     */
    private void applyEvent(JsonNode event) {
        if (event == null) {
            return;
        }
        String type = event.path("event").asText("");
        JsonNode payment = event.at("/payload/payment/entity");
        String orderId = payment.path("order_id").asText(null);
        if (orderId == null) {
            return;
        }
        PaymentOrder order = orders.findByProviderOrderId(orderId).orElse(null);
        if (order == null) {
            return;
        }

        if ("payment.failed".equals(type)) {
            if (order.getStatus() != PaymentOrderStatus.PAID) {
                order.setStatus(PaymentOrderStatus.FAILED);
                order.setProviderPaymentId(payment.path("id").asText(null));
                order.setFailureReason(payment.path("error_description").asText("The payment failed."));
                order.setMethod(payment.path("method").asText(null));
                order.setUpdatedAt(LocalDateTime.now());
                orders.save(order);
            }
            return;
        }
        if (!"payment.captured".equals(type) && !"order.paid".equals(type)) {
            return;
        }
        settle(order.getId(), payment.path("id").asText(null), payment.path("method").asText(null));
    }

    /**
     * Make our record match the gateway's, once.
     *
     * The order row is locked and re-read inside the transaction, so a webhook and a
     * reconciliation run racing cannot both fund: whichever gets there first wins, the other
     * sees PAID and does nothing. This is deliberately shared with ReconcileService - one way
     * a job becomes funded, whichever path noticed.
     */
    @Transactional
    public boolean settle(Long orderId, String providerPaymentId, String method) {
        PaymentOrder locked = orders.lockById(orderId).orElse(null);
        if (locked == null || locked.getStatus() == PaymentOrderStatus.PAID) {
            return false;
        }
        locked.setStatus(PaymentOrderStatus.PAID);
        locked.setProviderPaymentId(providerPaymentId);
        locked.setMethod(method);
        locked.setPaidAt(LocalDateTime.now());
        locked.setUpdatedAt(LocalDateTime.now());
        orders.save(locked);

        // The ledger posts here and only here for gateway money - after a signed confirmation
        // that it is captured. Keyed on the order id so a replay cannot double-fund.
        escrow.fund(locked.getJobId(), locked.getEmployerId(), locked.getAmountMinor(),
                LedgerAccountType.EXTERNAL_SETTLEMENT, "RAZORPAY",
                providerPaymentId == null ? locked.getProviderOrderId() : providerPaymentId,
                "EMPLOYER", locked.getEmployerId(), "ORDER-" + locked.getId());
        return true;
    }

    private static String sha256(byte[] raw) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(raw == null ? new byte[0] : raw));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String truncate(String s) {
        return s == null ? null : s.substring(0, Math.min(s.length(), 480));
    }
}
