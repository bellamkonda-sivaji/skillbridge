package com.skillbridge.service.payment;

import java.text.NumberFormat;
import java.util.Locale;

/**
 * Minor units, everywhere.
 *
 * The old wallet held a {@code double} of rupees. Floating point cannot represent 0.10, so
 * repeated additions drift; a ledger that drifts is a ledger nobody can trust. Every amount
 * in the money path is now a {@code long} of paise, which is also Razorpay's own unit - so
 * nothing is converted between here and the gateway and the classic factor-of-100 error has
 * nowhere to happen.
 *
 * The only conversions are at the edges: legacy rupee data on the way in, and a rupee mirror
 * on the way out for screens that still expect one.
 */
public final class Money {

    private Money() {
    }

    public static long fromRupees(double rupees) {
        return Math.round(rupees * 100.0);
    }

    public static double toRupees(long minor) {
        return minor / 100.0;
    }

    /** Human money for a message a person will read. */
    public static String inr(long minor) {
        NumberFormat f = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        f.setMaximumFractionDigits(minor % 100 == 0 ? 0 : 2);
        return f.format(minor / 100.0);
    }
}
