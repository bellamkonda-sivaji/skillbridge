package com.skillbridge.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The commission table is a promise made to employers in plain language, so these tests are
 * written the way the table is read aloud - including the boundaries, which is where a slab
 * table quietly goes wrong.
 */
class PricingServiceTest {

    private final PricingService pricing = new PricingService();

    @Test
    void eachBandChargesTheRateItAdvertises() {
        assertEquals(7, pricing.feePercent(100));
        assertEquals(7, pricing.feePercent(499));
        assertEquals(10, pricing.feePercent(500));
        assertEquals(10, pricing.feePercent(1000));
        assertEquals(13, pricing.feePercent(1001));
        assertEquals(13, pricing.feePercent(4000));
        assertEquals(16, pricing.feePercent(4001));
        assertEquals(16, pricing.feePercent(10000));
        assertEquals(20, pricing.feePercent(10001));
        assertEquals(20, pricing.feePercent(250000));
    }

    @Test
    void theUpperBoundOfABandBelongsToThatBand() {
        // Read aloud, "Rs 500 to Rs 1,000 is 10%" must mean exactly Rs 1,000 pays 10%.
        assertEquals(10, pricing.feePercent(1000));
        assertEquals(13, pricing.feePercent(4000));
        assertEquals(16, pricing.feePercent(10000));
    }

    @Test
    void aZeroOrNegativePriceIsNeverCharged() {
        assertEquals(0, pricing.feePercent(0));
        assertEquals(0d, pricing.fee(0));
        assertEquals(0d, pricing.takeHome(0));
        assertEquals(0d, pricing.fee(-500));
    }

    @Test
    void theFeeAndTheTakeHomeAlwaysSumBackToThePostedPrice() {
        double[] prices = {50, 499.99, 500, 900, 1000, 1000.01, 3999, 4000, 9999, 10000, 12500, 47777.77};
        for (double price : prices) {
            assertEquals(price, PricingService.round2(pricing.fee(price) + pricing.takeHome(price)),
                    "fee + take-home must reconcile exactly for " + price);
        }
    }

    @Test
    void aNineHundredRupeeDayLosesTenPercent() {
        // The worked example an employer is most likely to check by hand.
        assertEquals(10, pricing.feePercent(900));
        assertEquals(90d, pricing.fee(900));
        assertEquals(810d, pricing.takeHome(900));
    }

    @Test
    void minorUnitsAgreeWithRupeesToThePaisa() {
        assertEquals(9000L, pricing.feeMinor(90000L));      // Rs 900 -> Rs 90
        assertEquals(81000L, pricing.takeHomeMinor(90000L));
        assertEquals(pricing.feeMinor(90000L) + pricing.takeHomeMinor(90000L), 90000L);
    }

    @Test
    void grossForTakeHomeSurvivesItsOwnFee() {
        // The number we advise must actually deliver the take-home we promised, even when the
        // raise pushes the job into a higher commission band.
        double[] targets = {400, 900, 950, 3500, 9000, 15000};
        for (double target : targets) {
            double gross = pricing.grossForTakeHome(target);
            // It must deliver at least what was promised, and never overshoot by more than the
            // rupee that whole-rupee fee rounding can cost.
            assertTrue(pricing.takeHome(gross) >= target,
                    "advising " + gross + " takes home " + pricing.takeHome(gross)
                            + ", short of the promised " + target);
            assertTrue(pricing.takeHome(gross) <= target + 2,
                    "advising " + gross + " overshoots " + target + " by too much");
            assertEquals(gross, Math.rint(gross), "an advised price must be a whole rupee");
        }
    }

    @Test
    void theBandLabelMatchesTheBandCharged() {
        assertEquals("Under \u20b9500", pricing.slabLabel(300));
        assertEquals("\u20b9500 - \u20b91,000", pricing.slabLabel(1000));
        assertEquals("\u20b91,000 - \u20b94,000", pricing.slabLabel(2500));
        assertEquals("\u20b94,000 - \u20b910,000", pricing.slabLabel(10000));
        assertEquals("Above \u20b910,000", pricing.slabLabel(11000));
    }
}
