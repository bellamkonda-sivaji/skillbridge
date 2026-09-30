package com.skillbridge.service.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.skillbridge.dto.payment.PaymentDtos.ReconcileResultDto;
import com.skillbridge.model.money.PaymentOrder;
import com.skillbridge.model.money.PaymentOrderStatus;
import com.skillbridge.repository.PaymentOrderRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Asking the gateway what actually happened.
 *
 * The webhook is the normal path and it is reliable, right up until it is not: a deploy lands
 * mid-delivery, a network partition eats the retry window, a webhook secret is rotated while
 * an event is in flight, someone pauses the endpoint in the dashboard. Every one of those
 * leaves the same wreckage - the employer's money has moved and our books say it has not.
 *
 * That is the worst failure this system can have. A job the employer paid for and cannot
 * staff is not a bug they will report politely, and it is invisible from the inside: the
 * order sits at ATTEMPTED forever, looking like somebody who changed their mind.
 *
 * So this job does not trust our own inbox. It takes every order still open, asks Razorpay
 * what it knows, and makes our record match - through the SAME settle() the webhook uses, so
 * there is one way a job becomes funded no matter which path noticed first, and the order row
 * is locked so the two racing cannot both post.
 */
@Service
public class ReconcileService {

    /** Old enough that a webhook would have arrived by now if it were coming. */
    private static final int SETTLE_GRACE_MINUTES = 5;

    /** Long enough that nobody is still staring at a checkout. */
    private static final int ABANDON_AFTER_HOURS = 24;

    private final PaymentOrderRepository orders;
    private final RazorpayClient razorpay;
    private final RazorpayPaymentService payments;

    public ReconcileService(PaymentOrderRepository orders, RazorpayClient razorpay,
                            RazorpayPaymentService payments) {
        this.orders = orders;
        this.razorpay = razorpay;
        this.payments = payments;
    }

    @Transactional
    public ReconcileResultDto reconcileOpenOrders() {
        if (!razorpay.razorpayEnabled()) {
            return new ReconcileResultDto(0, 0, 0,
                    "Razorpay is not configured on this server.");
        }

        LocalDateTime cutoff = LocalDateTime.now().minus(Duration.ofMinutes(SETTLE_GRACE_MINUTES));
        List<PaymentOrder> open = orders.findOpenBefore(
                List.of(PaymentOrderStatus.CREATED, PaymentOrderStatus.ATTEMPTED), cutoff);

        int updated = 0;
        int abandoned = 0;
        for (PaymentOrder order : open) {
            try {
                JsonNode answer = razorpay.fetchOrderPayments(order.getProviderOrderId());
                JsonNode items = answer == null ? null : answer.path("items");
                JsonNode captured = null;
                boolean allFailed = items != null && items.isArray() && items.size() > 0;
                JsonNode lastFailed = null;
                if (items != null && items.isArray()) {
                    for (JsonNode p : items) {
                        String s = p.path("status").asText("");
                        if ("captured".equals(s)) {
                            captured = p;
                        }
                        if ("failed".equals(s)) {
                            lastFailed = p;
                        } else {
                            allFailed = false;
                        }
                    }
                }

                if (captured != null) {
                    if (payments.settle(order.getId(), captured.path("id").asText(null),
                            captured.path("method").asText(null))) {
                        updated++;
                    }
                    continue;
                }

                // Every attempt failed, and there is at least one. The employer tried and the
                // bank said no - worth recording so the screen can say which, rather than
                // leaving them at "waiting" forever.
                if (allFailed && lastFailed != null) {
                    order.setStatus(PaymentOrderStatus.FAILED);
                    order.setProviderPaymentId(lastFailed.path("id").asText(null));
                    order.setMethod(lastFailed.path("method").asText(null));
                    order.setFailureReason(lastFailed.path("error_description")
                            .asText("The payment failed at the gateway."));
                    order.setUpdatedAt(LocalDateTime.now());
                    orders.save(order);
                    updated++;
                    continue;
                }

                // Nothing was ever attempted and it has been a day. Not a failure - the
                // employer opened a checkout and walked away - so it is ABANDONED, which keeps
                // "failed" meaning "their bank refused".
                boolean nothingAttempted = items == null || !items.isArray() || items.isEmpty();
                if (nothingAttempted && order.getCreatedAt()
                        .isBefore(LocalDateTime.now().minusHours(ABANDON_AFTER_HOURS))) {
                    order.setStatus(PaymentOrderStatus.ABANDONED);
                    order.setUpdatedAt(LocalDateTime.now());
                    orders.save(order);
                    abandoned++;
                }
            } catch (RuntimeException e) {
                // One unreachable order must not stop the rest. The gateway being down is
                // exactly when the queue is longest.
            }
        }
        return new ReconcileResultDto(open.size(), updated, abandoned, null);
    }

    /** Guarded so it no-ops - and costs nothing - when Razorpay is unconfigured. */
    @Scheduled(fixedDelay = 600_000L, initialDelay = 600_000L)
    public void scheduled() {
        if (!razorpay.razorpayEnabled()) {
            return;
        }
        reconcileOpenOrders();
    }
}
