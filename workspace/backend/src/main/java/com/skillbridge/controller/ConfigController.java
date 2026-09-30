package com.skillbridge.controller;

import com.skillbridge.dto.admin.AdminDtos.HiringMethodOptionDto;
import com.skillbridge.dto.admin.AdminDtos.LabelledValueDto;
import com.skillbridge.dto.admin.AdminDtos.VocabularyDto;
import com.skillbridge.model.HiringMethod;
import com.skillbridge.model.InterviewMode;
import com.skillbridge.service.payment.RazorpayClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/** Public configuration the posting wizard and the checkout render before anything is priced. */
@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Value("${skillbridge.pricing.platform-fee-percent:0}")
    private double platformFeePercent;

    private final RazorpayClient razorpay;

    public ConfigController(RazorpayClient razorpay) {
        this.razorpay = razorpay;
    }

    @GetMapping("/pricing")
    public Map<String, Double> pricing() {
        return Map.of("platformFeePercent", platformFeePercent);
    }

    /**
     * Whether the checkout can be offered at all, and the publishable half of the key.
     *
     * Said out loud rather than left as an empty screen: an unconfigured gateway is an
     * operator's problem, and the app should be able to tell an employer which.
     */
    @GetMapping("/payments")
    public Map<String, Object> payments() {
        Map<String, Object> out = new HashMap<>();
        out.put("razorpayEnabled", razorpay.razorpayEnabled());
        out.put("keyId", razorpay.publishableKey());
        out.put("currency", "INR");
        out.put("platformFeePercent", platformFeePercent);
        return out;
    }

    /**
     * The words the whole UI must use. Around Tirupati nobody "schedules an interview" - the
     * employer rings you, or says come to the shop tomorrow - so the product says "call or
     * visit". Keeping the wording here means one edit changes every screen, and means the
     * frontend never has to hard-code a translation of an enum name.
     */
    @GetMapping("/vocabulary")
    public VocabularyDto vocabulary() {
        return new VocabularyDto(
                "call or visit",
                "calls & visits",
                InterviewMode.offered().stream()
                        .map(m -> new LabelledValueDto(m.name(), m.label()))
                        .toList(),
                HiringMethod.offered().stream()
                        .map(h -> new HiringMethodOptionDto(h.name(), h.label(), h.hint()))
                        .toList());
    }
}
