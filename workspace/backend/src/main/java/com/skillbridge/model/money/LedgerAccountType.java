package com.skillbridge.model.money;

/**
 * The chart of accounts. Ported from Veyora's {@code ledger_account_type} enum, renamed
 * for this domain: a campaign reserve becomes a job escrow, a creator becomes a worker.
 *
 * Every rupee in the system sits in exactly one of these at any moment, and because every
 * transaction balances, the sum of all of them is always zero.
 */
public enum LedgerAccountType {
    /** The outside world - a card, a bank, the gateway. Money entering debits it. */
    EXTERNAL_SETTLEMENT,
    /** An employer's own float, owner = employer account id. */
    EMPLOYER_WALLET,
    /** Money ring-fenced against one job, owner = job id. */
    JOB_ESCROW,
    /** What a worker is owed, owner = worker account id. */
    WORKER_PAYABLE,
    /** The platform fee, once earned. */
    PLATFORM_REVENUE,
    /** Withheld tax. Unused today; kept so the shape matches Veyora and adding TDS is additive. */
    TAX_LIABILITY,
    /** Gateway fees. */
    PAYMENT_FEES,
    /** Refunds in flight. */
    REFUND_CLEARING
}
