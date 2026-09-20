package com.skillbridge.dto;

import java.util.List;

public record WorkerDashboardDto(
        String greetingName,
        int profileCompletion,
        String profileCompletionHint,
        long jobsNearYou,
        long applicationsCount,
        long interviewsCount,
        double earnings,
        String locationLabel,
        List<JobCardDto> recommendedJobs
) {}
