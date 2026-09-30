package com.skillbridge.controller;

import com.skillbridge.dto.ApplicationDto;
import com.skillbridge.dto.OfferDto;
import com.skillbridge.dto.admin.AdminDtos.*;
import com.skillbridge.service.AdminOnBehalfService;
import org.springframework.web.bind.annotation.*;

/**
 * The back office doing, for a worker on the phone, what the worker app would do for somebody
 * with a smartphone. Everything here needs MANAGE_APPLICATIONS, which HR has.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminOnBehalfController {

    private final AdminOnBehalfService service;

    public AdminOnBehalfController(AdminOnBehalfService service) {
        this.service = service;
    }

    @PostMapping("/workers")
    public WorkerSummaryDto registerWorker(@RequestBody WorkerIntakeRequest request) {
        return service.registerWorker(request);
    }

    @PatchMapping("/workers/{workerId}")
    public WorkerSummaryDto updateWorker(@PathVariable Long workerId,
                                         @RequestBody WorkerIntakeRequest request) {
        return service.updateWorker(workerId, request);
    }

    @PostMapping("/workers/{workerId}/apply")
    public ApplicationDto apply(@PathVariable Long workerId,
                                @RequestBody ApplyOnBehalfRequest request) {
        return service.applyOnBehalf(workerId, request);
    }

    @PostMapping("/applications/{id}/accept-offer")
    public OfferDto acceptOffer(@PathVariable Long id,
                                @RequestBody(required = false) OnBehalfNoteRequest request) {
        return service.acceptOfferOnBehalf(id, request);
    }

    @PostMapping("/applications/{id}/decline-offer")
    public OfferDto declineOffer(@PathVariable Long id,
                                 @RequestBody(required = false) OnBehalfReasonRequest request) {
        return service.declineOfferOnBehalf(id, request);
    }
}
