package com.skillbridge.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Public pricing configuration the posting wizard renders before a job is priced. */
@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Value("${skillbridge.pricing.platform-fee-percent:0}")
    private double platformFeePercent;

    @GetMapping("/pricing")
    public Map<String, Double> pricing() {
        return Map.of("platformFeePercent", platformFeePercent);
    }
}
