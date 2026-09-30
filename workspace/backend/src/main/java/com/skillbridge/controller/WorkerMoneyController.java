package com.skillbridge.controller;

import com.skillbridge.dto.payment.PaymentDtos.*;
import com.skillbridge.model.AccountType;
import com.skillbridge.model.WorkerAccount;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.WalletService;
import com.skillbridge.service.payment.FinanceQueryService;
import com.skillbridge.service.payment.PayoutService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** What a worker has earned, where it can go, and how to send it there. */
@RestController
@RequestMapping("/api/worker")
public class WorkerMoneyController {

    private final WalletService wallets;
    private final PayoutService payouts;
    private final FinanceQueryService finance;

    public WorkerMoneyController(WalletService wallets, PayoutService payouts,
                                 FinanceQueryService finance) {
        this.wallets = wallets;
        this.payouts = payouts;
        this.finance = finance;
    }

    @GetMapping("/earnings")
    public WorkerEarningsDto earnings() {
        WorkerAccount me = AuthenticationUtils.currentWorker();
        return new WorkerEarningsDto(
                wallets.availableMinor(AccountType.WORKER, me.getId()),
                wallets.pendingMinor(AccountType.WORKER, me.getId()),
                wallets.lifetimeEarnedMinor(AccountType.WORKER, me.getId()),
                finance.earningsOf(me.getId()),
                payouts.listPayouts(me.getId()));
    }

    @GetMapping("/payout-destinations")
    public List<PayoutDestinationDto> destinations() {
        return payouts.listDestinations(AuthenticationUtils.currentWorker().getId());
    }

    @PostMapping("/payout-destinations")
    public PayoutDestinationDto addDestination(@RequestBody DestinationRequest body) {
        return payouts.addDestination(AuthenticationUtils.currentWorker(), body);
    }

    /** Penny-drop. Names a mismatch rather than swallowing it. */
    @PostMapping("/payout-destinations/{id}/verify")
    public PayoutDestinationDto verifyDestination(@PathVariable Long id) {
        return payouts.verifyDestination(AuthenticationUtils.currentWorker(), id);
    }

    @PostMapping("/payout-destinations/{id}/default")
    public PayoutDestinationDto makeDefault(@PathVariable Long id) {
        return payouts.makeDefault(AuthenticationUtils.currentWorker(), id);
    }

    @DeleteMapping("/payout-destinations/{id}")
    public void deleteDestination(@PathVariable Long id) {
        payouts.deleteDestination(AuthenticationUtils.currentWorker(), id);
    }

    @PostMapping("/payouts")
    public PayoutDto requestPayout(@RequestBody PayoutRequest body) {
        return payouts.requestPayout(AuthenticationUtils.currentWorker(), body);
    }

    @GetMapping("/payouts")
    public List<PayoutDto> payouts() {
        return payouts.listPayouts(AuthenticationUtils.currentWorker().getId());
    }
}
