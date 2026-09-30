package com.skillbridge.controller;

import com.skillbridge.dto.admin.AdminDtos.CallQueueRowDto;
import com.skillbridge.dto.admin.AdminDtos.CallQueueSummaryDto;
import com.skillbridge.dto.admin.AdminDtos.PageDto;
import com.skillbridge.service.CallQueueService;
import org.springframework.web.bind.annotation.*;

/** The one screen the back office lives on: who to ring next, and why. */
@RestController
@RequestMapping("/api/admin/call-queue")
public class CallQueueController {

    private final CallQueueService service;

    public CallQueueController(CallQueueService service) {
        this.service = service;
    }

    @GetMapping
    public PageDto<CallQueueRowDto> queue(@RequestParam(required = false) Long assignedTo,
                                          @RequestParam(required = false) String type,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "25") int size) {
        return service.queue(assignedTo, type, page, size);
    }

    @GetMapping("/summary")
    public CallQueueSummaryDto summary() {
        return service.summary();
    }
}
