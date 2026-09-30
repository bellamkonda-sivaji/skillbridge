package com.skillbridge.controller;

import com.skillbridge.dto.admin.AnalyticsDtos.*;
import com.skillbridge.service.AnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * The analytics half of the back office. Every route is a read guarded by VIEW_REPORTS - which HR
 * carries - and writes no audit row, so opening a chart never pollutes the audit trail.
 *
 * <p>All four take an inclusive {@code from}/{@code to} pair of YYYY-MM-DD dates and default to
 * the last 30 days.
 */
@RestController
@RequestMapping("/api/admin/analytics")
public class AnalyticsController {

    private final AnalyticsService analytics;

    public AnalyticsController(AnalyticsService analytics) {
        this.analytics = analytics;
    }

    @GetMapping("/timeseries")
    public TimeseriesResponse timeseries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Granularity granularity) {
        return analytics.timeseries(from, to, granularity);
    }

    @GetMapping("/breakdown")
    public BreakdownResponse breakdown(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Dimension dimension,
            @RequestParam(defaultValue = "50") int limit) {
        return analytics.breakdown(from, to, dimension, limit);
    }

    @GetMapping("/employers")
    public EmployersResponse employers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "50") int limit) {
        return analytics.employers(from, to, limit);
    }

    @GetMapping("/workers")
    public WorkersResponse workers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "50") int limit) {
        return analytics.workers(from, to, limit);
    }
}
