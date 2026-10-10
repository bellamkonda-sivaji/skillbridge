package com.skillbridge.service;

import com.skillbridge.model.WorkerCategory;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Which kinds of work a person can cross between.
 *
 * Skill lists never line up. A shop writes "Store Helper" and the worker
 * wrote "Cashier"; both spend the day on the same floor and either could do
 * the other's shift. Comparing the words finds nothing in common, so a
 * worker two streets away hears about no jobs at all.
 *
 * This is the knowledge that fixes it, written down. Nine categories is not
 * a problem that needs a language model guessing at it: the overlaps are
 * known, they are stable, and a shop owner in Tirupati can correct this
 * table in a sentence. It costs nothing to run, answers the same way every
 * time, and when someone asks why they were not told about a job there is a
 * number here to point at.
 *
 * Values are how much of a full skill match to credit when the categories
 * differ: 100 is the same work, 0 is unrelated.
 */
public final class WorkKinship {

    private WorkKinship() {}

    private static final int SAME = 100;

    /**
     * Pairs that genuinely overlap, written once each way round.
     *
     * Deliberately not symmetric in meaning even where the number is: a
     * driver can nearly always deliver, and a delivery rider who has only
     * ridden a two-wheeler cannot necessarily drive a van - but both are
     * worth telling, so both are listed. Tighten later with vehicle type.
     */
    private static final Map<Set<WorkerCategory>, Integer> KINSHIP = Map.ofEntries(
            // The same shop floor. Billing, shelves, customers - people move
            // between these two daily without anyone calling it a new job.
            Map.entry(Set.of(WorkerCategory.STORE_HELPER, WorkerCategory.CASHIER), 85),

            // Front of house. Taking money and serving customers are the same
            // temperament and often the same person on a quiet day.
            Map.entry(Set.of(WorkerCategory.CASHIER, WorkerCategory.SERVICE_STAFF), 70),

            // A restaurant floor. Kitchens and service share staff constantly,
            // though a cook asked to wait tables is a step down in skill.
            Map.entry(Set.of(WorkerCategory.KITCHEN_STAFF, WorkerCategory.SERVICE_STAFF), 65),

            // Both are vehicles and a licence. The closest pair in this list.
            Map.entry(Set.of(WorkerCategory.DRIVER, WorkerCategory.DELIVERY_PARTNER), 90),

            // Loading, carrying, stock. A store helper has done this work.
            Map.entry(Set.of(WorkerCategory.STORE_HELPER, WorkerCategory.DELIVERY_PARTNER), 55),

            // Cleaning happens in every shop and kitchen, and is where people
            // without other experience start.
            Map.entry(Set.of(WorkerCategory.CLEANING_STAFF, WorkerCategory.STORE_HELPER), 50),
            Map.entry(Set.of(WorkerCategory.CLEANING_STAFF, WorkerCategory.KITCHEN_STAFF), 50),
            Map.entry(Set.of(WorkerCategory.CLEANING_STAFF, WorkerCategory.SERVICE_STAFF), 45),

            // Both are a post on the premises, long hours, little else shared.
            Map.entry(Set.of(WorkerCategory.SECURITY, WorkerCategory.CLEANING_STAFF), 35)
    );

    /**
     * How well one kind of work prepares someone for another.
     *
     * OTHER sits in the middle for everything: it means the worker did not
     * say, which is not the same as being unsuited, and treating it as zero
     * would silence everyone who skipped that question.
     */
    public static int between(WorkerCategory worker, WorkerCategory job) {
        if (worker == null || job == null) return 45;
        if (worker == job) return SAME;
        if (worker == WorkerCategory.OTHER || job == WorkerCategory.OTHER) return 45;
        Integer known = KINSHIP.get(Set.of(worker, job));
        return known == null ? 15 : known;
    }

    /**
     * Skills that mean the same thing on a shop floor.
     *
     * Each line is one family: any word in it counts as a match for any
     * other. Written from how the jobs are actually advertised, not from a
     * dictionary - "Billing" and "Cash Handling" are the same task.
     */
    private static final List<Set<String>> FAMILIES = List.of(
            Set.of("cashier", "billing", "cash handling", "payments", "pos", "counter"),
            Set.of("retail", "sales", "shop assistant", "store helper", "shelf arrangement",
                    "stock management", "inventory", "packing"),
            Set.of("cooking", "basic cooking", "food preparation", "kitchen", "chef", "cook"),
            Set.of("serving", "waiter", "service", "customer service", "hospitality"),
            Set.of("cleaning", "housekeeping", "sweeping", "mopping", "dishwashing"),
            Set.of("driving", "driver", "two wheeler", "car", "heavy vehicle", "delivery",
                    "rider", "taxi"),
            Set.of("loading", "unloading", "loading / unloading", "lifting", "helper", "labour"),
            Set.of("security", "guard", "watchman"),
            Set.of("data entry", "typing", "computer", "office assistant", "clerk"),
            Set.of("plumbing", "pipe fitting", "bathroom fitting"),
            Set.of("electrical", "electrical wiring", "electrician", "solar installation"),
            Set.of("masonry", "construction", "painting", "carpentry", "welding")
    );

    /** True when two skill words belong to the same family of work. */
    public static boolean sameFamily(String a, String b) {
        String x = norm(a);
        String y = norm(b);
        if (x.isEmpty() || y.isEmpty()) return false;
        if (x.equals(y)) return true;
        // One contained in the other catches "Cook" against "Cook / Kitchen Helper".
        if (x.contains(y) || y.contains(x)) return true;
        for (Set<String> family : FAMILIES) {
            if (inFamily(family, x) && inFamily(family, y)) return true;
        }
        return false;
    }

    private static boolean inFamily(Set<String> family, String term) {
        for (String word : family) {
            if (term.equals(word) || term.contains(word) || word.contains(term)) return true;
        }
        return false;
    }

    private static String norm(String s) {
        return s == null ? "" : s.trim().toLowerCase(Locale.ENGLISH);
    }
}
