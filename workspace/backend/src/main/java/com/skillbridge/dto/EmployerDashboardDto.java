package com.skillbridge.dto;

import java.util.List;

/** GET /api/employer/dashboard. */
public record EmployerDashboardDto(
        String greetingName,
        String businessName,
        long activeJobs,
        long applications,
        long interviewsThisWeek,
        long workersHired,
        List<ApplicantCardDto> recentApplications
) {}
