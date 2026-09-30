package com.skillbridge.controller;

import com.skillbridge.dto.admin.AdminDtos.*;
import com.skillbridge.service.LeadService;
import org.springframework.web.bind.annotation.*;

/**
 * The public inbound hook. It sits outside /api/admin on purpose: the caller is a telephony or
 * WhatsApp webhook with no login, and the shared secret header is the whole of its authority.
 */
@RestController
@RequestMapping("/api/leads")
public class LeadController {

    private final LeadService service;

    public LeadController(LeadService service) {
        this.service = service;
    }

    @PostMapping("/inbound")
    public InboundLeadResponse inbound(@RequestHeader(value = "X-Lead-Token", required = false) String token,
                                       @RequestBody InboundLeadRequest request) {
        return service.inbound(token, request);
    }
}
