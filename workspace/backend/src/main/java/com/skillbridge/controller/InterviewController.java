package com.skillbridge.controller;

import com.skillbridge.dto.InterviewDto;
import com.skillbridge.model.InterviewStatus;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.InterviewService;
import org.springframework.web.bind.annotation.*;

/**
 * Responding to an interview is the one action either side takes, so it lives outside the
 * role-walled namespaces. Scheduling and completing are employer-only and live on
 * {@code /api/employer/interviews}.
 */
@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @PatchMapping("/{interviewId}/respond")
    public InterviewDto respond(@PathVariable Long interviewId, @RequestBody StatusRequest request) {
        return interviewService.respond(AuthenticationUtils.currentAccount(), interviewId,
                InterviewStatus.valueOf(request.status().toUpperCase()));
    }

    public record StatusRequest(String status) {}
}
