package com.skillbridge.controller;

import com.skillbridge.dto.SupportDtos.*;
import com.skillbridge.service.SupportService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Asking for help, from either app.
 *
 * Open to any signed-in worker or employer; the service decides what they are
 * allowed to see. Kept out of /api/worker and /api/employer on purpose - it is
 * one desk, and both sides queue at it.
 */
@RestController
@RequestMapping("/api/support")
public class SupportController {

    private final SupportService support;

    public SupportController(SupportService support) {
        this.support = support;
    }

    @PostMapping("/tickets")
    public TicketView raise(@RequestBody RaiseRequest request) {
        return support.raise(request);
    }

    @GetMapping("/tickets")
    public List<TicketView> mine() {
        return support.mine();
    }

    @GetMapping("/tickets/{id}")
    public TicketView one(@PathVariable Long id) {
        return support.mineById(id);
    }

    @PostMapping("/tickets/{id}/replies")
    public TicketView reply(@PathVariable Long id, @RequestBody ReplyRequest request) {
        return support.replyAsRaiser(id, request);
    }
}
