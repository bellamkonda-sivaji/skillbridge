package com.skillbridge.controller;

import com.skillbridge.dto.SupportDtos.*;
import com.skillbridge.model.SupportTicketStatus;
import com.skillbridge.service.SupportService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** The other side of the desk: the back-office inbox. Gated on ROLE_ADMIN. */
@RestController
@RequestMapping("/api/admin/support")
public class AdminSupportController {

    private final SupportService support;

    public AdminSupportController(SupportService support) {
        this.support = support;
    }

    @GetMapping("/tickets")
    public List<TicketView> inbox(@RequestParam(required = false) SupportTicketStatus status) {
        return support.inbox(status);
    }

    @GetMapping("/tickets/{id}")
    public TicketView one(@PathVariable Long id) {
        return support.byId(id);
    }

    @GetMapping("/summary")
    public SupportSummary summary() {
        return support.summary();
    }

    @PostMapping("/tickets/{id}/assign")
    public TicketView assign(@PathVariable Long id) {
        return support.assignToMe(id);
    }

    @PostMapping("/tickets/{id}/replies")
    public TicketView reply(@PathVariable Long id, @RequestBody ReplyRequest request) {
        return support.replyAsAdmin(id, request);
    }

    @PatchMapping("/tickets/{id}/status")
    public TicketView status(@PathVariable Long id, @RequestBody StatusRequest request) {
        return support.setStatus(id, request.getStatus());
    }
}
