package com.skillbridge.service;

import com.skillbridge.model.SalaryUnit;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * The one place the platform's commission is decided.
 *
 * The employer posts a price. That price is what the employer pays - it is never inflated
 * behind their back. The commission is taken OUT of it, and the worker-facing screens show
 * the take-home, because a worker who reads "900" and receives 783 stops trusting the app.
 *
 * The slabs are deliberately a table, not a formula. A local business owner can be read the
 * table over the phone, and an admin can quote it without doing arithmetic:
 *
 *   under Rs 500          7%
 *   Rs 500 - 1,000       10%
 *   Rs 1,000 - 4,000     13%
 *   Rs 4,000 - 10,000    16%
 *   above Rs 10,000      20%
 *
 * Each band's upper bound is inclusive, exactly as the table above reads aloud: a job posted
 * at exactly Rs 1,000 sits in the 10% band, not the 13% one.
 *
 * Rounding happens once, here, to whole paise, so nothing downstream rounds a second time and
 * fee + takeHome always sums back to the posted price to the paisa.
 */
@Service
public class PricingService {

    /** An upper bound (inclusive, in rupees) and the percentage that applies up to it. */
    public record Slab(Double upTo, double percent) {
        public boolean covers(double amount) {
            return upTo == null || amount <= upTo;
        }
    }

    private static final List<Slab> SLABS = List.of(
            new Slab(499.99, 7),
            new Slab(1000d, 10),
            new Slab(4000d, 13),
            new Slab(10000d, 16),
            new Slab(null, 20));

    public List<Slab> slabs() {
        return SLABS;
    }

    /** The commission percentage for a posted price. Never negative, never invented. */
    public double feePercent(double postedAmount) {
        if (postedAmount <= 0) {
            return 0d;
        }
        for (Slab slab : SLABS) {
            if (slab.covers(postedAmount)) {
                return slab.percent();
            }
        }
        return SLABS.get(SLABS.size() - 1).percent();
    }

    /**
     * The commission in whole rupees.
     *
     * Rounded to the rupee, not the paisa, because these wages are usually handed over as cash
     * and "Rs 102.30 for the day" is not a number anyone says or counts out. Whole rupees also
     * mean the take-home on a whole-rupee wage is itself a whole number.
     */
    public double fee(double postedAmount) {
        if (postedAmount <= 0) {
            return 0d;
        }
        return Math.round(postedAmount * feePercent(postedAmount) / 100d);
    }

    /** What actually reaches the worker: the posted price minus the commission. */
    public double takeHome(double postedAmount) {
        if (postedAmount <= 0) {
            return 0d;
        }
        return round2(postedAmount - fee(postedAmount));
    }

    // ---------------------------------------------------------------- minor units (paise)

    /**
     * The commission on a minor-unit amount. Rounded to a whole rupee (a multiple of 100 paise)
     * so the ledger charges exactly what the screens quoted, to the paisa.
     */
    public long feeMinor(long postedMinor) {
        if (postedMinor <= 0) {
            return 0L;
        }
        double rupees = postedMinor / 100d;
        return Math.round(rupees * feePercent(rupees) / 100d) * 100L;
    }

    public long takeHomeMinor(long postedMinor) {
        return Math.max(0L, postedMinor - feeMinor(postedMinor));
    }

    // ---------------------------------------------------------------- helpers

    /**
     * The slab is decided on the posted figure as the employer typed it, whatever unit it is
     * in. An hourly rate of Rs 80 is a small job and pays the small-job rate; a monthly salary
     * of Rs 18,000 is a large one. That is the behaviour an employer expects when they read
     * the table, and it keeps the quote on the posting screen honest.
     */
    public double feePercentFor(double amount, SalaryUnit unit) {
        return feePercent(amount);
    }

    public static double round2(double value) {
        return Math.round(value * 100d) / 100d;
    }

    /**
     * The posted price an employer must set for the worker to take home {@code target}.
     *
     * Inverting a slab table is not a division, because raising the price can push the job
     * into a higher band and claw part of the raise back. So we search the bands: for each
     * one, solve the linear case and keep the answer only if it actually lands inside that
     * band. That guarantees the number we advise survives its own fee.
     */
    public double grossForTakeHome(double target) {
        if (target <= 0) {
            return 0d;
        }
        for (Slab slab : SLABS) {
            double gross = Math.ceil(target / (1 - slab.percent() / 100d));
            // Whole-rupee fee rounding can leave the first candidate a rupee short, so step up
            // until it genuinely clears the target. Never down: advising a price that delivers
            // less than we promised is the one outcome that must not happen.
            for (int i = 0; i < 4 && takeHome(gross) < target; i++) {
                gross += 1;
            }
            if (slab.covers(gross) && feePercent(gross) == slab.percent() && takeHome(gross) >= target) {
                return gross;
            }
        }
        double last = SLABS.get(SLABS.size() - 1).percent();
        return Math.ceil(target / (1 - last / 100d));
    }

    /** The band a price falls in, worded the way the table is read aloud. */
    public String slabLabel(double postedAmount) {
        if (postedAmount <= 0) {
            return "";
        }
        if (postedAmount < 500) return "Under \u20b9500";
        if (postedAmount <= 1000) return "\u20b9500 - \u20b91,000";
        if (postedAmount <= 4000) return "\u20b91,000 - \u20b94,000";
        if (postedAmount <= 10000) return "\u20b94,000 - \u20b910,000";
        return "Above \u20b910,000";
    }
}
