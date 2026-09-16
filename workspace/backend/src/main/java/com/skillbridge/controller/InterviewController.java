package com.skillbridge.controller;

import com.skillbridge.dto.InterviewDto;
import com.skillbridge.dto.InterviewRequest;
import com.skillbridge.model.InterviewStatus;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.InterviewService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @PostMapping("/employer/interviews")
    @ResponseStatus(HttpStatus.CREATED)
    public InterviewDto schedule(@RequestBody InterviewRequest request) {
        return interviewService.schedule(AuthenticationUtils.currentUser(), request);
    }

    @GetMapping("/employer/interviews")
    public List<InterviewDto> myEmployerInterviews() {
        return interviewService.interviewsForEmployer(AuthenticationUtils.currentUser());
    }

    @GetMapping("/worker/interviews")
    public List<InterviewDto> myWorkerInterviews() {
        return interviewService.interviewsForWorker(AuthenticationUtils.currentUser());
    }

    @PatchMapping("/interviews/{interviewId}/respond")
    public InterviewDto respond(@PathVariable Long interviewId, @RequestBody StatusRequest request) {
        return interviewService.respond(AuthenticationUtils.currentUser(), interviewId,
                InterviewStatus.valueOf(request.status().toUpperCase()));
    }

    @PatchMapping("/interviews/{interviewId}/complete")
    public InterviewDto complete(@PathVariable Long interviewId) {
        return interviewService.complete(AuthenticationUtils.currentUser(), interviewId);
    }

    public record StatusRequest(String status) {}
}
