package com.skillbridge.controller;

import com.skillbridge.dto.admin.AdminDtos.*;
import com.skillbridge.service.LeadService;
import org.springframework.web.bind.annotation.*;

/** The back-office lead inbox: everyone who rang us and has not been dealt with yet. */
@RestController
@RequestMapping("/api/admin/leads")
public class AdminLeadController {

    private final LeadService service;

    public AdminLeadController(LeadService service) {
        this.service = service;
    }

    @GetMapping
    public PageDto<LeadDto> list(@RequestParam(required = false) String status,
                                 @RequestParam(required = false) String source,
                                 @RequestParam(required = false) String q,
                                 @RequestParam(defaultValue = "0") int page,
                                 @RequestParam(defaultValue = "25") int size) {
        return service.list(status, source, q, page, size);
    }

    @PatchMapping("/{id}")
    public LeadDto patch(@PathVariable Long id, @RequestBody LeadPatchRequest request) {
        return service.patch(id, request);
    }

    @PostMapping("/{id}/convert")
    public LeadConversionDto convert(@PathVariable Long id, @RequestBody LeadConvertRequest request) {
        return service.convert(id, request);
    }
}
