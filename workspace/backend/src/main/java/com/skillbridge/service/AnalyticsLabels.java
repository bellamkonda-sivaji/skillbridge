package com.skillbridge.service;

import com.skillbridge.dto.admin.AnalyticsDtos.Dimension;
import com.skillbridge.model.WorkerCategory;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * The human wording behind every breakdown key. A chart axis reading "KITCHEN_STAFF" is a leak of
 * the enum into the product, so every dimension gets a sentence a person would actually say.
 */
final class AnalyticsLabels {

    private AnalyticsLabels() {
    }

    private static final Map<String, String> CATEGORY = new LinkedHashMap<>();
    private static final Map<String, String> ENGAGEMENT = new LinkedHashMap<>();
    private static final Map<String, String> PATTERN = new LinkedHashMap<>();
    private static final Map<String, String> AVAILABILITY = new LinkedHashMap<>();
    private static final Map<String, String> SALARY_BAND = new LinkedHashMap<>();
    private static final Map<String, String> EXPERIENCE = new LinkedHashMap<>();
    private static final Map<String, String> PLAN = new LinkedHashMap<>();

    static {
        CATEGORY.put("STORE_HELPER", "Store Helper");
        CATEGORY.put("CASHIER", "Cashier / Billing");
        CATEGORY.put("DELIVERY_PARTNER", "Delivery Partner");
        CATEGORY.put("KITCHEN_STAFF", "Cook / Kitchen Staff");
        CATEGORY.put("SERVICE_STAFF", "Waiter / Service Staff");
        CATEGORY.put("CLEANING_STAFF", "Cleaning / Housekeeping");
        CATEGORY.put("SECURITY", "Security Guard");
        CATEGORY.put("DRIVER", "Driver");
        CATEGORY.put("OTHER", "Other work");

        ENGAGEMENT.put("ONE_DAY", "One day");
        ENGAGEMENT.put("FEW_DAYS", "A few days");
        ENGAGEMENT.put("FEW_WEEKS", "A few weeks");
        ENGAGEMENT.put("MONTHS", "A few months");
        ENGAGEMENT.put("PERMANENT", "Permanent");

        PATTERN.put("FULL_DAY", "Full day");
        PATTERN.put("PART_TIME", "Part time");
        PATTERN.put("SHIFT_BASED", "Shift based");

        AVAILABILITY.put("IMMEDIATE", "Available immediately");
        AVAILABILITY.put("PART_TIME", "Part time only");
        AVAILABILITY.put("FULL_TIME", "Full time only");
        AVAILABILITY.put("WEEKENDS_ONLY", "Weekends only");
        AVAILABILITY.put("EVENINGS", "Evenings only");

        SALARY_BAND.put("LT_10K", "Under ₹10,000 a month");
        SALARY_BAND.put("B10_15K", "₹10,000 – ₹15,000 a month");
        SALARY_BAND.put("B15_20K", "₹15,000 – ₹20,000 a month");
        SALARY_BAND.put("B20_30K", "₹20,000 – ₹30,000 a month");
        SALARY_BAND.put("GT_30K", "₹30,000+ a month");

        EXPERIENCE.put("FRESHER", "Fresher (no experience)");
        EXPERIENCE.put("Y1_2", "1 – 2 years");
        EXPERIENCE.put("Y3_5", "3 – 5 years");
        EXPERIENCE.put("Y6_10", "6 – 10 years");
        EXPERIENCE.put("Y10_PLUS", "Over 10 years");

        PLAN.put("STARTER", "Starter");
        PLAN.put("GROWTH", "Growth");
        PLAN.put("BUSINESS", "Business");
        PLAN.put("NONE", "No plan chosen");
    }

    static boolean isCategoryKey(String key) {
        return CATEGORY.containsKey(key);
    }

    static String planLabel(String key) {
        return PLAN.getOrDefault(key, titleCase(key));
    }

    static String label(Dimension dimension, String key) {
        if ("UNSPECIFIED".equals(key)) {
            return switch (dimension) {
                case SALARY_BAND -> "Pay not stated";
                case CITY -> "City not stated";
                case BUSINESS_TYPE -> "Business type not stated";
                default -> "Not specified";
            };
        }
        return switch (dimension) {
            case CATEGORY -> CATEGORY.getOrDefault(key, titleCase(key));
            case ENGAGEMENT -> ENGAGEMENT.getOrDefault(key, titleCase(key));
            case WORK_PATTERN -> PATTERN.getOrDefault(key, titleCase(key));
            case AVAILABILITY -> AVAILABILITY.getOrDefault(key, titleCase(key));
            case SALARY_BAND -> SALARY_BAND.getOrDefault(key, titleCase(key));
            case EXPERIENCE -> EXPERIENCE.getOrDefault(key, titleCase(key));
            case CITY, BUSINESS_TYPE, SKILL -> titleCase(key);
        };
    }

    /** "RETAIL_SUPERMARKET" -> "Retail Supermarket"; already-spaced text keeps its own casing. */
    static String titleCase(String raw) {
        if (raw == null || raw.isBlank()) {
            return "Not specified";
        }
        String cleaned = raw.trim().replace('_', ' ').replaceAll("\\s+", " ");
        StringBuilder out = new StringBuilder(cleaned.length());
        for (String part : cleaned.split(" ")) {
            if (part.isEmpty()) {
                continue;
            }
            if (out.length() > 0) {
                out.append(' ');
            }
            out.append(Character.toUpperCase(part.charAt(0)))
                    .append(part.substring(1).toLowerCase(Locale.ENGLISH));
        }
        return out.toString();
    }

    /** Kept so the enum stays referenced when a new category is added without a label. */
    static String fallbackCategory(WorkerCategory category) {
        return category == null ? "Not specified" : titleCase(category.name());
    }
}
