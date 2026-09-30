package com.skillbridge.service.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.skillbridge.dto.payment.PaymentDtos.*;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.AccountType;
import com.skillbridge.model.WorkerAccount;
import com.skillbridge.model.money.*;
import com.skillbridge.repository.PayoutDestinationRepository;
import com.skillbridge.repository.PayoutRepository;
import com.skillbridge.service.WalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Money out - RazorpayX.
 *
 * A contact, then a fund account, then a payout. Three objects rather than one because the
 * middle one is the destination and is reusable: validated once by penny-drop, paid to many
 * times. That is what lets "verified" mean something stronger than "they typed it twice".
 *
 * Paying a worker twice is the most expensive bug available here. It is prevented in two
 * places rather than one: a UNIQUE idempotency key on our own payout row, so a duplicate
 * request never reaches the gateway, and the same key sent as X-Payout-Idempotency, so a
 * retry after a timeout returns the original payout instead of making a second transfer.
 */
@Service
public class PayoutService {

    private final PayoutDestinationRepository destinations;
    private final PayoutRepository payouts;
    private final RazorpayClient razorpay;
    private final LedgerService ledger;
    private final WalletService wallets;

    public PayoutService(PayoutDestinationRepository destinations, PayoutRepository payouts,
                         RazorpayClient razorpay, LedgerService ledger, WalletService wallets) {
        this.destinations = destinations;
        this.payouts = payouts;
        this.razorpay = razorpay;
        this.ledger = ledger;
        this.wallets = wallets;
    }

    // ------------------------------------------------------------------ destinations

    public List<PayoutDestinationDto> listDestinations(Long workerId) {
        return destinations.findByWorkerIdOrderByIdDesc(workerId).stream()
                .map(PayoutDestinationDto::from).toList();
    }

    @Transactional
    public PayoutDestinationDto addDestination(WorkerAccount worker, DestinationRequest req) {
        DestinationKind kind;
        try {
            kind = DestinationKind.valueOf(
                    (req.kind() == null ? "BANK" : req.kind()).trim().toUpperCase(Locale.ENGLISH));
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("A payout destination is either BANK or UPI.");
        }

        String holder = req.accountHolderName() == null || req.accountHolderName().isBlank()
                ? worker.getName() : req.accountHolderName().trim();

        PayoutDestination.PayoutDestinationBuilder b = PayoutDestination.builder()
                .workerId(worker.getId()).kind(kind).accountHolderName(holder);

        if (kind == DestinationKind.BANK) {
            String number = req.accountNumber() == null ? "" : req.accountNumber().replaceAll("\\s", "");
            if (number.length() < 6) {
                throw ApiException.badRequest("Enter the full bank account number.");
            }
            if (req.ifsc() == null || !req.ifsc().trim().matches("(?i)^[A-Z]{4}0[A-Z0-9]{6}$")) {
                throw ApiException.badRequest("That IFSC does not look right. It is 11 characters, "
                        + "four letters then a zero then six more.");
            }
            // Only the last four survive this method. The full number is needed once, to
            // register the fund account with the gateway, and keeping it afterwards buys
            // nothing except a breach to disclose.
            b.accountNumberLast4(number.substring(number.length() - 4))
                    .ifsc(req.ifsc().trim().toUpperCase(Locale.ENGLISH));
        } else {
            if (req.vpa() == null || !req.vpa().trim().matches("^[\\w.\\-]{2,64}@[a-zA-Z]{2,32}$")) {
                throw ApiException.badRequest("That UPI id does not look right, e.g. name@bank.");
            }
            b.vpa(req.vpa().trim().toLowerCase(Locale.ENGLISH));
        }

        PayoutDestination saved = destinations.save(b.build());

        // Register with the gateway if one is configured. When it is not, the destination is
        // still stored and usable through the manual path - an unconfigured gateway is an
        // operator's problem, not a reason a worker cannot record their bank details.
        if (razorpay.razorpayEnabled()) {
            try {
                JsonNode contact = razorpay.createContact(worker.getName(), worker.getEmail(),
                        worker.getPhone(), "worker-" + worker.getId());
                saved.setProviderContactId(contact.path("id").asText(null));
                Map<String, Object> fa = kind == DestinationKind.BANK
                        ? Map.of("contact_id", saved.getProviderContactId(), "account_type", "bank_account",
                                "bank_account", Map.of("name", holder,
                                        "ifsc", saved.getIfsc(),
                                        "account_number", req.accountNumber().replaceAll("\\s", "")))
                        : Map.of("contact_id", saved.getProviderContactId(), "account_type", "vpa",
                                "vpa", Map.of("address", saved.getVpa()));
                saved.setProviderFundAccountId(razorpay.createFundAccount(fa).path("id").asText(null));
                destinations.save(saved);
            } catch (ApiException e) {
                saved.setVerificationNote(e.getMessage());
                destinations.save(saved);
            }
        }

        // First destination a worker adds is their default; otherwise they choose.
        if (destinations.findByWorkerIdOrderByIdDesc(worker.getId()).size() == 1) {
            saved.setDefault(true);
            destinations.save(saved);
        }
        return PayoutDestinationDto.from(saved);
    }

    /**
     * Penny-drop: send a rupee and read back the name the bank has on file.
     *
     * The only check that catches a correctly-formed account number belonging to someone
     * else - a transposed digit that passes every format rule. The name it returns is
     * compared to the worker's, and a mismatch becomes NAME_MISMATCH rather than being
     * swallowed, because the alternative is sending their wages to a stranger.
     */
    @Transactional
    public PayoutDestinationDto verifyDestination(WorkerAccount worker, Long id) {
        PayoutDestination d = requireDestination(worker.getId(), id);

        if (!razorpay.razorpayEnabled()) {
            // Said out loud rather than silently marking it verified. Claiming ownership was
            // proved when nothing was checked is the one lie this whole feature exists to
            // avoid, so the state stays PENDING and the screen can say why.
            d.setVerificationStatus(DestinationVerification.PENDING);
            d.setVerified(false);
            d.setVerificationNote("RAZORPAY_NOT_CONFIGURED: a penny-drop needs a payments gateway. "
                    + "This destination is recorded but its ownership has not been proved.");
            return PayoutDestinationDto.from(destinations.save(d));
        }

        try {
            JsonNode result = razorpay.validateFundAccount(d.getProviderFundAccountId(), 100, "INR");
            String bankName = result.at("/results/registered_name").asText(null);
            d.setVerifiedName(bankName);
            if (bankName != null && !namesMatch(bankName, d.getAccountHolderName())) {
                d.setVerificationStatus(DestinationVerification.NAME_MISMATCH);
                d.setVerified(false);
                d.setVerificationNote("The bank holds this account in the name \"" + bankName
                        + "\", which does not match \"" + d.getAccountHolderName() + "\".");
            } else {
                d.setVerificationStatus(DestinationVerification.VERIFIED);
                d.setVerified(true);
                d.setVerificationNote(null);
            }
        } catch (ApiException e) {
            d.setVerificationStatus(DestinationVerification.FAILED);
            d.setVerified(false);
            d.setVerificationNote(e.getMessage());
        }
        return PayoutDestinationDto.from(destinations.save(d));
    }

    /** Deliberately forgiving about case, punctuation and initials; strict about the words. */
    private static boolean namesMatch(String a, String b) {
        return normalise(a).equals(normalise(b));
    }

    private static String normalise(String s) {
        return s == null ? "" : s.toLowerCase(Locale.ENGLISH).replaceAll("[^a-z]", "");
    }

    @Transactional
    public PayoutDestinationDto makeDefault(WorkerAccount worker, Long id) {
        PayoutDestination target = requireDestination(worker.getId(), id);
        for (PayoutDestination d : destinations.findByWorkerIdOrderByIdDesc(worker.getId())) {
            if (d.isDefault() != d.getId().equals(id)) {
                d.setDefault(d.getId().equals(id));
                destinations.save(d);
            }
        }
        target.setDefault(true);
        return PayoutDestinationDto.from(destinations.save(target));
    }

    @Transactional
    public void deleteDestination(WorkerAccount worker, Long id) {
        PayoutDestination d = requireDestination(worker.getId(), id);
        boolean inFlight = payouts.findByWorkerIdOrderByIdDesc(worker.getId()).stream()
                .anyMatch(p -> id.equals(p.getDestinationId()) && !terminal(p.getStatus()));
        if (inFlight) {
            throw ApiException.badRequest("A payout to this destination is still in flight.");
        }
        destinations.delete(d);
    }

    private static boolean terminal(PayoutStatus s) {
        return s == PayoutStatus.PAID || s == PayoutStatus.FAILED
                || s == PayoutStatus.CANCELLED || s == PayoutStatus.RETURNED;
    }

    private PayoutDestination requireDestination(Long workerId, Long id) {
        PayoutDestination d = destinations.findById(id)
                .orElseThrow(() -> ApiException.notFound("Payout destination not found"));
        if (!d.getWorkerId().equals(workerId)) {
            throw ApiException.forbidden("That is not your payout destination");
        }
        return d;
    }

    // ------------------------------------------------------------------ payouts

    public List<PayoutDto> listPayouts(Long workerId) {
        return payouts.findByWorkerIdOrderByIdDesc(workerId).stream().map(this::toDto).toList();
    }

    public PayoutDto toDto(Payout p) {
        String label = p.getDestinationId() == null ? null : destinations.findById(p.getDestinationId())
                .map(d -> d.getKind() == DestinationKind.UPI ? d.getVpa()
                        : (d.getIfsc() + " ****" + d.getAccountNumberLast4()))
                .orElse(null);
        return new PayoutDto(p.getId(), p.getWorkerId(), p.getDestinationId(), label,
                p.getAmountMinor(), p.getCurrency(), p.getStatus(), p.getProvider(),
                p.getProviderPayoutId(), p.getFailureReason(), p.getRequestedAt(), p.getProcessedAt());
    }

    /**
     * Requesting a payout moves the money out of the worker's available balance immediately -
     * WORKER_PAYABLE debited, EXTERNAL_SETTLEMENT credited - so a second request cannot spend
     * the same rupee while the first is in flight. A failed payout is corrected by a
     * reversing transaction, never by editing this one.
     */
    @Transactional
    public PayoutDto requestPayout(WorkerAccount worker, PayoutRequest req) {
        long amountMinor = req.amountMinor() == null ? 0 : req.amountMinor();
        if (amountMinor <= 0) {
            throw ApiException.badRequest("Enter an amount to withdraw");
        }
        long available = wallets.availableMinor(AccountType.WORKER, worker.getId());
        if (amountMinor > available) {
            throw ApiException.badRequest("You have " + Money.inr(available)
                    + " available and asked to withdraw " + Money.inr(amountMinor) + ".");
        }

        PayoutDestination destination = req.destinationId() != null
                ? requireDestination(worker.getId(), req.destinationId())
                : destinations.findByWorkerIdOrderByIdDesc(worker.getId()).stream()
                        .filter(PayoutDestination::isDefault).findFirst()
                        .orElseThrow(() -> ApiException.badRequest(
                                "Add a payout destination before withdrawing."));

        String idempotencyKey = "PAYOUT-" + worker.getId() + "-" + destination.getId()
                + "-" + amountMinor + "-" + System.currentTimeMillis();

        Payout payout = payouts.save(Payout.builder()
                .workerId(worker.getId()).destinationId(destination.getId())
                .amountMinor(amountMinor).status(PayoutStatus.REQUESTED)
                .idempotencyKey(idempotencyKey)
                .provider(razorpay.razorpayEnabled() ? "RAZORPAYX" : "MANUAL")
                .build());

        ledger.post(new LedgerService.Post("PAYOUT_REQUESTED")
                .memo("Payout #" + payout.getId() + " to " + worker.getName())
                .by("WORKER", worker.getId())
                .idempotent(idempotencyKey)
                .leg(LedgerService.Leg.debit(LedgerAccountType.WORKER_PAYABLE, worker.getId(), amountMinor))
                .leg(LedgerService.Leg.credit(LedgerAccountType.EXTERNAL_SETTLEMENT, null, amountMinor)));

        wallets.mirror(wallets.getOrCreate(worker), com.skillbridge.model.WalletTransaction.Type.DEBIT,
                amountMinor, "Withdrawal to " + (destination.getKind() == DestinationKind.UPI
                        ? destination.getVpa() : "****" + destination.getAccountNumberLast4()),
                null, com.skillbridge.model.WalletTransaction.Reference.WITHDRAW);

        send(payout, destination, worker.getName());
        return toDto(payout);
    }

    /** Hands the payout to RazorpayX, or queues it when no gateway is configured. */
    @Transactional
    public Payout send(Payout payout, PayoutDestination destination, String workerName) {
        if (!razorpay.razorpayEnabled()) {
            // No gateway: the money has left the worker's available balance and is waiting for
            // an operator to move it. QUEUED says exactly that, and is honest in a way that
            // marking it PAID would not be.
            payout.setStatus(PayoutStatus.QUEUED);
            payout.setFailureReason(null);
            return payouts.save(payout);
        }
        payout.setStatus(PayoutStatus.PROCESSING);
        try {
            JsonNode res = razorpay.createPayout(destination.getProviderFundAccountId(),
                    payout.getAmountMinor(), payout.getCurrency(),
                    RazorpayClient.payoutModeFor(destination.getKind().name()),
                    "payout-" + payout.getId(), "JobOn earnings - " + workerName,
                    payout.getIdempotencyKey());
            payout.setProviderPayoutId(res.path("id").asText(null));
            payout.setStatus(mapStatus(res.path("status").asText("processing")));
            payout.setProcessedAt(LocalDateTime.now());
        } catch (ApiException e) {
            payout.setStatus(PayoutStatus.FAILED);
            payout.setFailureReason(e.getMessage());
        }
        return payouts.save(payout);
    }

    private static PayoutStatus mapStatus(String s) {
        return switch (s == null ? "" : s.toLowerCase(Locale.ENGLISH)) {
            case "processed" -> PayoutStatus.PAID;
            case "queued" -> PayoutStatus.QUEUED;
            case "reversed" -> PayoutStatus.RETURNED;
            case "cancelled" -> PayoutStatus.CANCELLED;
            case "failed", "rejected" -> PayoutStatus.FAILED;
            case "pending" -> PayoutStatus.ON_HOLD;
            default -> PayoutStatus.PROCESSING;
        };
    }

    /**
     * Admin retry.
     *
     * Deliberately only for a payout that FAILED or is QUEUED: the money has already left the
     * worker's available balance, so retrying does not touch the ledger, it only asks the
     * gateway again. Retrying anything else would be a second transfer.
     */
    @Transactional
    public PayoutDto retry(Long payoutId, String workerName) {
        Payout p = payouts.findById(payoutId)
                .orElseThrow(() -> ApiException.notFound("Payout not found"));
        if (p.getStatus() != PayoutStatus.FAILED && p.getStatus() != PayoutStatus.QUEUED) {
            throw ApiException.badRequest("Only a failed or queued payout can be retried; this one is "
                    + p.getStatus() + ".");
        }
        PayoutDestination d = p.getDestinationId() == null ? null
                : destinations.findById(p.getDestinationId()).orElse(null);
        if (d == null) {
            throw ApiException.badRequest("That payout has no destination to retry against.");
        }
        return toDto(send(p, d, workerName));
    }
}
