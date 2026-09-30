package com.skillbridge.controller;

import com.skillbridge.dto.payment.PaymentDtos.*;
import com.skillbridge.model.AdminPermission;
import com.skillbridge.service.AdminGuard;
import com.skillbridge.service.payment.FinanceQueryService;
import com.skillbridge.service.payment.PayoutService;
import com.skillbridge.service.payment.ReconcileService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/** The back office's view of the money. VIEW_PAYMENTS to read, MANAGE_PAYMENTS to act. */
@RestController
@RequestMapping("/api/admin")
public class AdminFinanceController {

    private final FinanceQueryService finance;
    private final ReconcileService reconcile;
    private final PayoutService payouts;
    private final AdminGuard guard;

    public AdminFinanceController(FinanceQueryService finance, ReconcileService reconcile,
                                  PayoutService payouts, AdminGuard guard) {
        this.finance = finance;
        this.reconcile = reconcile;
        this.payouts = payouts;
        this.guard = guard;
    }

    @GetMapping("/finance/summary")
    public FinanceSummaryDto summary() {
        guard.require(AdminPermission.VIEW_PAYMENTS);
        return finance.summary();
    }

    @GetMapping("/finance/ledger")
    public PageDto<LedgerTransactionDto> ledger(
            @RequestParam(required = false) String accountType,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) String kind,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        guard.require(AdminPermission.VIEW_PAYMENTS);
        return finance.ledgerPage(accountType, ownerId, kind, from, to, q, page, size);
    }

    @GetMapping("/finance/escrows")
    public PageDto<EscrowDto> escrows(@RequestParam(required = false) String status,
                                      @RequestParam(required = false) String q,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "25") int size) {
        guard.require(AdminPermission.VIEW_PAYMENTS);
        return finance.escrowPage(status, q, page, size);
    }

    @GetMapping("/finance/payouts")
    public PageDto<PayoutDto> payouts(@RequestParam(required = false) String status,
                                      @RequestParam(required = false) String q,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "25") int size) {
        guard.require(AdminPermission.VIEW_PAYMENTS);
        return finance.payoutPage(status, q, page, size);
    }

    @PostMapping("/finance/payouts/{id}/retry")
    public PayoutDto retryPayout(@PathVariable Long id) {
        guard.require(AdminPermission.MANAGE_PAYMENTS);
        return payouts.retry(id, "worker");
    }

    @GetMapping("/finance/orders")
    public PageDto<PaymentOrderDto> orders(@RequestParam(required = false) String status,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "25") int size) {
        guard.require(AdminPermission.VIEW_PAYMENTS);
        return finance.orderPage(status, page, size);
    }

    @GetMapping("/finance/webhooks")
    public PageDto<WebhookEventDto> webhooks(@RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "25") int size) {
        guard.require(AdminPermission.VIEW_PAYMENTS);
        return finance.webhookPage(page, size);
    }

    /** Safe to call as often as you like: every order it settles is locked and re-checked. */
    @PostMapping("/payments/reconcile")
    public ReconcileResultDto reconcile() {
        guard.require(AdminPermission.MANAGE_PAYMENTS);
        return reconcile.reconcileOpenOrders();
    }
}
