package com.skillbridge.dto.admin;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Every shape the back-office analytics API answers with. Plain records, one file, so the admin
 * frontend reads the contract off a single place - exactly like {@link AdminDtos}.
 *
 * <p>All four responses share the same envelope fields: {@code from}, {@code to} and
 * {@code generatedAt}, followed by that endpoint's payload.
 */
public final class AnalyticsDtos {

    private AnalyticsDtos() {
    }

    // ================================================================== 1. timeseries

    /** The bucket size a timeseries is rolled up into. */
    public enum Granularity { DAY, WEEK, MONTH }

    /** One chart bucket. Every bucket in the window is present, zero-filled. */
    public record TimePointDto(LocalDate date, String label,
                               long jobsPosted, long employerSignups, long workerSignups,
                               long applications, long interviews, long offers, long hires,
                               double amountPaid, double platformFees) {
    }

    /** The same keys as a point, summed over a window. */
    public record SeriesTotalsDto(long jobsPosted, long employerSignups, long workerSignups,
                                  long applications, long interviews, long offers, long hires,
                                  double amountPaid, double platformFees) {

        public static SeriesTotalsDto zero() {
            return new SeriesTotalsDto(0, 0, 0, 0, 0, 0, 0, 0, 0);
        }
    }

    public record TimeseriesResponse(LocalDate from, LocalDate to, LocalDateTime generatedAt,
                                     Granularity granularity, List<TimePointDto> points,
                                     SeriesTotalsDto totals, SeriesTotalsDto previousTotals) {
    }

    // ================================================================== 2. breakdown

    /** The axis a breakdown slices the window by. */
    public enum Dimension {
        CATEGORY, CITY, BUSINESS_TYPE, ENGAGEMENT, WORK_PATTERN, SKILL,
        SALARY_BAND, EXPERIENCE, AVAILABILITY
    }

    /**
     * One slice. Salary figures are monthly-equivalent rupees; the three ratios are always a
     * number (0.0 when the denominator is zero), never null and never NaN.
     */
    public record BreakdownRowDto(String key, String label,
                                  long jobCount, long openJobCount, long vacancies,
                                  long applicationCount, long interviewCount, long offerCount,
                                  long hireCount, long workerCount, long employerCount,
                                  double avgSalary, double medianSalary,
                                  double applicationsPerJob, double fillRate, double hireRate,
                                  double totalPaid) {
    }

    public record BreakdownResponse(LocalDate from, LocalDate to, LocalDateTime generatedAt,
                                    Dimension dimension, List<BreakdownRowDto> rows) {
    }

    // ================================================================== shared trend

    /** A plain zero-filled daily counter, used by the signup and hire trends. */
    public record CountPointDto(LocalDate date, String label, long count) {
    }

    // ================================================================== 3. employers

    public record EmployerTotalsDto(long totalEmployers, long newEmployers, long activeEmployers,
                                    long verifiedEmployers, long totalJobs, double avgJobsPerEmployer,
                                    double repeatPosterRate, double avgApplicationsPerJob,
                                    double avgTimeToFirstApplicantHours, double avgTimeToFillDays,
                                    double totalSpend, double platformFees) {
    }

    public record EmployerRowDto(Long employerId, String businessName, String businessType, String city,
                                 boolean verified, String plan,
                                 long jobCount, long openJobCount, long applicationCount,
                                 long interviewCount, long offerCount, long hireCount,
                                 double fillRate, double avgTimeToFillDays,
                                 double totalSpend, double platformFees,
                                 LocalDateTime registeredAt, LocalDateTime lastJobPostedAt) {
    }

    public record PlanRowDto(String key, String label, long employerCount, long jobCount,
                             long hireCount, double totalSpend) {
    }

    public record EmployersResponse(LocalDate from, LocalDate to, LocalDateTime generatedAt,
                                    EmployerTotalsDto totals, List<EmployerRowDto> top,
                                    List<PlanRowDto> byPlan, List<CountPointDto> signupTrend) {
    }

    // ================================================================== 4. workers

    public record WorkerTotalsDto(long totalWorkers, long newWorkers, long activeWorkers,
                                  long verifiedWorkers, double verifiedRate, long workersHired,
                                  double hireRate, double avgApplicationsPerWorker,
                                  double avgTimeToHireDays, double avgRating, double totalEarned) {
    }

    public record WorkerRowDto(Long workerId, String name, String city, List<String> skills,
                               boolean verified, long applicationCount, long interviewCount,
                               long offerCount, long hireCount, double hireRate, double totalEarned,
                               double avgRating, int ratingCount, LocalDateTime lastActiveAt) {
    }

    public record SkillHireRowDto(String skill, long hireCount, long applicationCount,
                                 long workerCount) {
    }

    public record WorkersResponse(LocalDate from, LocalDate to, LocalDateTime generatedAt,
                                  WorkerTotalsDto totals, List<WorkerRowDto> top,
                                  List<CountPointDto> signupTrend, List<CountPointDto> hireTrend,
                                  List<SkillHireRowDto> topSkillsHired) {
    }
}
