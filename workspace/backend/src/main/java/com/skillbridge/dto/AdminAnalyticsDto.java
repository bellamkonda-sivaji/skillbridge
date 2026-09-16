package com.skillbridge.dto;

import java.util.Map;

public record AdminAnalyticsDto(
        long totalUsers,
        long totalWorkers,
        long totalEmployers,
        long totalJobs,
        long openJobs,
        long totalApplications,
        long pendingVerifications,
        long totalMatches,
        long pendingInterviews,
        long upcomingInterviews,
        long totalReviews,
        long newUsersThisWeek,
        long newJobsThisWeek,
        Map<Object, Long> jobsByWorkType,
        Map<Object, Long> jobsByCity,
        Map<String, Long> topSkills,
        Map<String, Long> topCategories
) {}
