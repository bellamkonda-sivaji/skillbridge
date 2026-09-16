package com.skillbridge.service;

import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Skill lexicon: normalizes skill names and expands aliases so matching is
 * robust across terminology (e.g. "electrical wiring" == "electrician").
 */
@Component
public class SkillLexicon {

    private static final Map<String, List<String>> ALIASES = Map.ofEntries(
            Map.entry("carpenter", List.of("carpentry", "woodwork", "wood working", "cabinet making", "furniture")),
            Map.entry("electrician", List.of("electrical", "electrical wiring", "wiring", "electrical work")),
            Map.entry("plumber", List.of("plumbing", "pipe fitting", "pipes")),
            Map.entry("painter", List.of("painting", "wall painting", "house painting")),
            Map.entry("welder", List.of("welding", "arc welding", "mig", "metal fabrication")),
            Map.entry("mason", List.of("bricklaying", "bricklayer", "masonry", "tiling")),
            Map.entry("driver", List.of("driving", "taxi", "truck driving", "delivery driver")),
            Map.entry("mechanic", List.of("auto repair", "car repair", "vehicle servicing", "automotive")),
            Map.entry("chef", List.of("cooking", "cook", "kitchen", "culinary")),
            Map.entry("seamstress", List.of("tailoring", "tailor", "stitching", "sewing")),
            Map.entry("gardener", List.of("gardening", "landscaping", "lawn care")),
            Map.entry("cleaner", List.of("cleaning", "housekeeping", "janitorial")),
            Map.entry("security guard", List.of("security", "guarding", "watchman")),
            Map.entry("cashier", List.of("sales", "retail", "billing", "counter")),
            Map.entry("waiter", List.of("waiting", "server", "restaurant service", "f&b")),
            Map.entry("accountant", List.of("accounting", "bookkeeping", "accounts")),
            Map.entry("data entry", List.of("typing", "data processing", "computer operator")),
            Map.entry("packer", List.of("packaging", "warehouse", "loading")),
            Map.entry("baker", List.of("bakery", "bread making", "pastry")),
            Map.entry("hvac", List.of("air conditioning", "ac repair", "refrigeration", "aircon")),
            Map.entry("tilesetter", List.of("tiling", "floor tiling", "tile work")),
            Map.entry("receptionist", List.of("front desk", "office assistant", "admin assistant")),
            Map.entry("nanny", List.of("childcare", "baby sitting", "babysitter", "caregiver")),
            Map.entry("barber", List.of("hair cutting", "hairstyling", "hairdresser"))
    );

    private static final List<String> STOP_WORDS = List.of(
            "and", "or", "the", "of", "in", "for", "with", "experienced", "skilled", "professional");

    public List<String> expand(String skill) {
        String key = skill.trim().toLowerCase(Locale.ROOT);
        return ALIASES.getOrDefault(key, List.of(key));
    }

    public String normalize(String skill) {
        String s = skill.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9 ]", " ");
        return Arrays.stream(s.split("\\s+"))
                .filter(w -> w.length() > 1)
                .filter(w -> !STOP_WORDS.contains(w))
                .reduce((a, b) -> a + " " + b)
                .orElse(s);
    }
}
