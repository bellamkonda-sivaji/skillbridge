package com.skillbridge.service.payment;

import com.skillbridge.dto.payment.PaymentDtos.PayoutRequest;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.model.money.*;
import com.skillbridge.repository.*;
import com.skillbridge.service.WalletService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The six things that must never happen.
 *
 * Every one of these is a way money could be invented, lost or paid twice, and every one is
 * prevented structurally rather than by a caller remembering - which is exactly what these
 * tests assert.
 */
@SpringBootTest
class MoneyTest {

    @Autowired LedgerService ledger;
    @Autowired EscrowService escrow;
    @Autowired PayoutService payouts;
    @Autowired WalletService wallets;
    @Autowired RazorpayPaymentService payments;
    @Autowired RazorpayClient razorpay;

    @Autowired EmploymentRepository employments;
    @Autowired EarningRepository earnings;
    @Autowired LedgerTransactionRepository ledgerTransactions;
    @Autowired WebhookEventRepository webhookEvents;
    @Autowired WorkerAccountRepository workerAccounts;

    // ------------------------------------------------------------------ 1. the ledger

    @Test
    void anUnbalancedPostIsRefused() {
        LedgerService.Post post = new LedgerService.Post("TEST_UNBALANCED")
                .leg(LedgerService.Leg.debit(LedgerAccountType.EXTERNAL_SETTLEMENT, null, 10_000))
                .leg(LedgerService.Leg.credit(LedgerAccountType.PLATFORM_REVENUE, null, 9_999));

        IllegalStateException e = assertThrows(IllegalStateException.class, () -> ledger.post(post));
        assertTrue(e.getMessage().contains("Unbalanced"), e.getMessage());
        // And nothing was written - a refused post leaves no trace at all.
        assertTrue(ledgerTransactions.findAll().stream()
                .noneMatch(t -> "TEST_UNBALANCED".equals(t.getKind())));
    }

    @Test
    void anEmptyPostIsRefused() {
        assertThrows(IllegalStateException.class,
                () -> ledger.post(new LedgerService.Post("TEST_EMPTY")));
        // A post of nothing but zero-value legs is equally empty: zero legs are skipped.
        assertThrows(IllegalStateException.class, () -> ledger.post(new LedgerService.Post("TEST_ZERO")
                .leg(LedgerService.Leg.debit(LedgerAccountType.EXTERNAL_SETTLEMENT, null, 0))
                .leg(LedgerService.Leg.credit(LedgerAccountType.PLATFORM_REVENUE, null, 0))));
    }

    @Test
    void theBooksBalanceToZero() {
        assertEquals(0L, ledger.grandTotalMinor(),
                "every transaction balances, so the whole chart of accounts must sum to zero");
    }

    // ------------------------------------------------------------------ 2. double release

    @Test
    void releasingTwiceIsImpossible() {
        Earning released = earnings.findAll().stream()
                .filter(e -> e.getStatus() == EarningStatus.PAYABLE)
                .findFirst().orElseThrow(() -> new AssertionError("seed a released earning"));
        Employment employment = employments.findById(released.getEmploymentId()).orElseThrow();

        long revenueBefore = ledger.totalMinor(LedgerAccountType.PLATFORM_REVENUE);
        long payableBefore = ledger.balanceMinor(LedgerAccountType.WORKER_PAYABLE, released.getWorkerId());

        escrow.release(employment, "TEST", null);
        escrow.release(employment, "TEST", null);

        assertEquals(revenueBefore, ledger.totalMinor(LedgerAccountType.PLATFORM_REVENUE),
                "a second release must not take the fee again");
        assertEquals(payableBefore, ledger.balanceMinor(LedgerAccountType.WORKER_PAYABLE,
                released.getWorkerId()), "a second release must not credit the worker again");
        assertEquals(1, ledgerTransactions.findAll().stream()
                .filter(t -> ("RELEASE-EMP-" + employment.getId()).equals(t.getIdempotencyKey()))
                .count(), "exactly one EARNING_RELEASED transaction per employment");
    }

    // ------------------------------------------------------------------ 3. short escrow

    @Test
    void reserveRefusesWhenTheEscrowIsShort() {
        Employment template = employments.findAll().stream().findFirst().orElseThrow();
        // An engagement far larger than any escrow or wallet on the system can cover.
        Employment huge = employments.save(Employment.builder()
                .worker(template.getWorker()).employer(template.getEmployer())
                .job(template.getJob())
                // No application or offer: those are unique per employment, and this row is a
                // fixture for the money path, not a real engagement.
                .status(EmploymentStatus.OFFER_ACCEPTED)
                .salary(50_000_000d)
                .build());

        ApiException e = assertThrows(ApiException.class, () -> escrow.reserve(huge, "TEST", null));
        assertEquals(400, e.getStatus());
        // Both figures named, so the employer knows what they have as well as what is missing.
        assertTrue(e.getMessage().contains("escrow") && e.getMessage().contains("needs"), e.getMessage());
        assertTrue(earnings.findByEmploymentId(huge.getId()).isEmpty(),
                "a refused reservation writes no earning");
    }

    // ------------------------------------------------------------------ 4. payouts

    @Test
    void aPayoutAboveAvailableIsRefused() {
        WorkerAccount worker = workerAccounts.findAll().stream()
                .filter(w -> wallets.availableMinor(AccountType.WORKER, w.getId()) > 0)
                .findFirst().orElseThrow(() -> new AssertionError("seed a worker with a balance"));
        long available = wallets.availableMinor(AccountType.WORKER, worker.getId());

        ApiException e = assertThrows(ApiException.class, () -> payouts.requestPayout(worker,
                new PayoutRequest(available + 1_00L, null)));
        assertEquals(400, e.getStatus());
        assertTrue(e.getMessage().contains("available"), e.getMessage());
        assertEquals(available, wallets.availableMinor(AccountType.WORKER, worker.getId()),
                "a refused payout moves nothing");
    }

    // ------------------------------------------------------------------ 5. the webhook

    @Test
    void aWebhookWithABadSignatureIsRejected() {
        String eventId = "evt_test_badsig_" + System.nanoTime();
        byte[] body = ("{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":"
                + "{\"id\":\"pay_x\",\"order_id\":\"order_x\",\"status\":\"captured\"}}}}")
                .getBytes(StandardCharsets.UTF_8);

        Map<String, Object> answer = payments.handleWebhook(body, "not-a-real-signature", eventId);
        assertEquals("signature", answer.get("ignored"));

        WebhookEvent stored = webhookEvents.findByProviderAndEventId("RAZORPAY", eventId).orElseThrow();
        assertFalse(stored.isSignatureOk(), "stored for forensics, acted on by nothing");
        assertNotNull(stored.getProcessError());
    }

    @Test
    void anUnconfiguredWebhookSecretNeverVerifies() {
        // No secret configured means every delivery is unverifiable, and false is the safe
        // answer: an endpoint that accepts unsigned events is one anyone can fund a job from.
        assertFalse(razorpay.verifyWebhookSignature("{}".getBytes(StandardCharsets.UTF_8), "abc"));
        assertFalse(razorpay.verifyWebhookSignature("{}".getBytes(StandardCharsets.UTF_8), null));
    }

    @Test
    void theSameEventIdDeliveredTwiceIsProcessedOnce() {
        String eventId = "evt_test_replay_" + System.nanoTime();
        byte[] body = "{\"event\":\"payment.captured\"}".getBytes(StandardCharsets.UTF_8);

        Map<String, Object> first = payments.handleWebhook(body, "sig", eventId);
        Map<String, Object> second = payments.handleWebhook(body, "sig", eventId);

        assertNull(first.get("duplicate"));
        assertEquals(Boolean.TRUE, second.get("duplicate"));
        assertEquals(1, webhookEvents.findAll().stream()
                .filter(e -> eventId.equals(e.getEventId())).count(),
                "the unique event id is what makes redelivery safe");
    }

    // ------------------------------------------------------------------ 6. the gateway

    @Test
    void anUnconfiguredGatewayAnswers503AndNever500() {
        assertFalse(razorpay.razorpayEnabled());
        ApiException e = assertThrows(ApiException.class,
                () -> razorpay.createOrder(10_000, "INR", "rcpt", Map.of()));
        assertEquals(503, e.getStatus());
        assertTrue(e.getMessage().contains("RAZORPAY_NOT_CONFIGURED"), e.getMessage());
    }

    @Test
    void signatureComparisonIsLengthSafe() {
        assertFalse(RazorpayClient.safeEqual("abcdef", "abc"));
        assertFalse(RazorpayClient.safeEqual("abcdef", null));
        assertTrue(RazorpayClient.safeEqual("abcdef", "abcdef"));
    }

    // ------------------------------------------------------------------ 7. the fee

    @Test
    void theFeeComesFromConfigurationAndNetReconcilesExactly() {
        List<Earning> all = earnings.findAll();
        assertFalse(all.isEmpty());
        for (Earning e : all) {
            assertEquals(e.getGrossMinor(), e.getNetMinor() + e.getFeeMinor(),
                    "net + fee must reconcile exactly against gross for earning " + e.getId());
            // The commission is taken OUT of the agreed amount, so it is a fee on the gross.
            long expectedFee = escrow.feeOn(e.getGrossMinor());
            assertEquals(expectedFee, e.getFeeMinor(),
                    "the fee must come from the pricing slabs, never a hard-coded one");
        }
    }
}
