package com.skillbridge.dto.admin;

import com.skillbridge.model.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Every shape the back-office API answers with, gathered in one place so the admin frontend has
 * a single file to read the contract off. They are plain records - Jackson serialises nested
 * records exactly like top-level ones.
 */
public final class AdminDtos {

    private AdminDtos() {
    }

    // ================================================================== paging

    /** The envelope every admin list endpoint returns. */
    public record PageDto<T>(List<T> content, int page, int size, long totalElements, int totalPages) {
        public static <T> PageDto<T> of(List<T> all, int page, int size) {
            int safeSize = size <= 0 ? 25 : size;
            int safePage = Math.max(page, 0);
            int total = all.size();
            int totalPages = (int) Math.ceil(total / (double) safeSize);
            int from = Math.min(safePage * safeSize, total);
            int to = Math.min(from + safeSize, total);
            return new PageDto<>(all.subList(from, to), safePage, safeSize, total, totalPages);
        }
    }

    // ================================================================== team / auth

    public record AdminDto(Long id, String name, String email, String phone, AdminRole role,
                           List<AdminPermission> permissions, boolean enabled, LocalDateTime createdAt,
                           LocalDateTime lastLoginAt, String createdByName) {
    }

    public record AdminRegisterRequest(String name, String email, String phone, String password,
                                       AdminRole role) {
    }

    public record RoleRequest(AdminRole role) {
    }

    public record StatusRequest(Boolean enabled) {
    }

    // ================================================================== overview

    public record WorkerCounts(long total, long newInPeriod, long verified, long activeInPeriod) {
    }

    public record EmployerCounts(long total, long newInPeriod, long verified) {
    }

    public record JobCounts(long total, long newInPeriod, long open, long filled, long closed) {
    }

    public record ApplicationCounts(long total, long newInPeriod, long contacted, long notContacted) {
    }

    public record InterviewCounts(long total, long scheduled, long completed, long cancelled, long upcoming) {
    }

    public record OfferCounts(long total, long pending, long accepted, long declined) {
    }

    public record PaymentCounts(double totalPaidOut, double platformFees, double inPeriod, long pending) {
    }

    public record FunnelCounts(long applied, long contacted, long shortlisted, long interviewed,
                               long offered, long hired, long paid) {
    }

    public record TrendPoint(LocalDate date, long jobs, long applications, long hires, long signups) {
    }

    public record TopSkill(String skill, long workerCount, long jobCount) {
    }

    public record ActivityItem(LocalDateTime at, String type, String summary, String entityType,
                               Long entityId) {
    }

    public record OverviewDto(WorkerCounts workers, EmployerCounts employers, JobCounts jobs,
                              ApplicationCounts applications, InterviewCounts interviews,
                              OfferCounts offers, PaymentCounts payments, FunnelCounts funnel,
                              List<TrendPoint> trend, List<TopSkill> topSkills,
                              List<ActivityItem> recentActivity) {
    }

    // ================================================================== jobs

    public record JobRowDto(Long id, String title, Long employerId, String businessName,
                            EngagementModel engagementModel, WorkPattern workPattern, JobStatus status,
                            double salary, SalaryUnit salaryUnit, String location, LocalDateTime postedAt,
                            int vacancies, long applicantCount, long contactedCount, long notContactedCount,
                            long shortlistedCount, long interviewedCount, long offeredCount,
                            long hiredCount) {
    }

    public record JobStatsDto(long applicantCount, long contactedCount, long notContactedCount,
                              long shortlistedCount, long interviewedCount, long offeredCount,
                              long hiredCount) {
    }

    public record ShiftDto(String label, String startTime, String endTime, String breakStart,
                           String breakEnd, Integer breakMinutes) {
    }

    /** The whole posting: schedule, pay and duration, as the job detail screen renders it. */
    public record JobFullDto(Long id, String title, String description, List<String> requiredSkills,
                             List<String> responsibilities, WorkType workType,
                             EmploymentType employmentType, WorkerCategory workerCategory,
                             EngagementModel engagementModel, WorkPattern workPattern,
                             HiringMethod hiringMethod, OfferType offerType, JobStatus status,
                             double salary, SalaryUnit salaryUnit, PayrollCycle payrollCycle,
                             Integer salaryDueDayOfMonth, PaymentMode paymentMode,
                             LocalDate workDate, LocalDate startDate, LocalDate endDate,
                             Integer durationMonths, JobDuration durationType,
                             List<String> workingDays, List<ShiftDto> shifts,
                             ShiftArrangement shiftArrangement, boolean breakPaid,
                             boolean overtimeExpected, OvertimePayBasis overtimePayBasis,
                             Double overtimeRate, String city, String area, String location,
                             double latitude, double longitude, int minExperienceYears,
                             List<String> languages, GenderPreference genderPreference,
                             Integer ageMin, Integer ageMax, InterviewType interviewType,
                             List<String> benefits, int vacancies, boolean urgent, int jobViews,
                             LocalDate applicationDeadline, LocalDateTime postedAt,
                             LocalDateTime expiresAt) {
    }

    public record EmployerBriefDto(Long id, String businessName, String contactName, String phone,
                                   String email, boolean verified) {
    }

    public record JobNotesDto(long contacted, long notContacted, long responded, long awaitingResponse) {
    }

    public record ApplicantRowDto(Long applicationId, Long workerId, String name, String phone,
                                  String photoUrl, double rating, int ratingCount, Double distanceKm,
                                  Integer matchScore, ApplicationStatus status, LocalDateTime appliedAt,
                                  LocalDateTime lastContactAt, ContactOutcome lastContactOutcome,
                                  long contactCount, LocalDateTime interviewAt, OfferStatus offerStatus,
                                  boolean hired, boolean paid) {
    }

    public record JobDetailDto(JobFullDto job, EmployerBriefDto employer, JobStatsDto stats,
                               List<ApplicantRowDto> applicants, JobNotesDto notes) {
    }

    // ================================================================== applications

    public record ApplicationRowDto(Long applicationId, Long workerId, String workerName,
                                    String workerPhone, String photoUrl, Long jobId, String jobTitle,
                                    Long employerId, String businessName, ApplicationStatus status,
                                    String currentStage, LocalDateTime appliedAt, boolean contacted,
                                    long contactCount, LocalDateTime lastContactAt,
                                    ContactOutcome lastContactOutcome, LocalDateTime interviewAt,
                                    OfferStatus offerStatus, boolean hired, boolean paid) {
    }

    public record HistoryWorkerDto(Long id, String name, String phone, String photoUrl, double rating,
                                   List<String> skills) {
    }

    public record HistoryJobDto(Long id, String title, EngagementModel engagementModel, double salary,
                                SalaryUnit salaryUnit) {
    }

    public record HistoryEmployerDto(Long id, String businessName, String contactName, String phone) {
    }

    public record HistoryOfferDto(Long id, OfferStatus status, LocalDateTime sentAt,
                                  LocalDateTime respondedAt, double salary, SalaryUnit salaryUnit,
                                  Double estimatedWorkerPay, Double platformFee,
                                  Double estimatedEmployerTotal) {
    }

    public record HistoryPaymentDto(boolean paid, Double amount, LocalDateTime paidAt, String reference,
                                    Double platformFee) {
    }

    public record HistoryAttendanceDto(LocalDate date, AttendanceStatus status, String checkIn,
                                       String checkOut, Double hours, boolean approved) {
    }

    public record ContactLogDto(Long id, Long applicationId, Long jobId, Long workerId, Long employerId,
                                ContactChannel channel, ContactOutcome outcome, String note,
                                Long contactedByAdminId, String contactedByName,
                                LocalDateTime contactedAt, LocalDateTime nextCallAt) {
    }

    public record TimelineEntry(LocalDateTime at, String stage, String label, String detail,
                                String actor, String actorName) {
    }

    public record ApplicationHistoryDto(Long applicationId, HistoryWorkerDto worker, HistoryJobDto job,
                                        HistoryEmployerDto employer, ApplicationStatus status,
                                        String currentStage, boolean contacted, long contactCount,
                                        boolean employerResponded, LocalDateTime employerRespondedAt,
                                        HistoryOfferDto offer, HistoryPaymentDto payment,
                                        List<HistoryAttendanceDto> attendance,
                                        List<ContactLogDto> contacts, List<TimelineEntry> timeline) {
    }

    /**
     * {@code nextCallAt} is how a CALLBACK_REQUESTED outcome gets scheduled - the call queue
     * reads it back as a CALLBACK_DUE row once it falls due. Optional everywhere else.
     */
    public record ContactRequest(ContactChannel channel, ContactOutcome outcome, String note,
                                 LocalDateTime nextCallAt) {
    }

    // ================================================================== acting on behalf

    /**
     * A worker as the back office sees them right after taking their details down the phone.
     * Phone is the identity; everything else may be blank because the person is standing at a
     * chicken shop with a 200-rupee handset.
     */
    public record WorkerSummaryDto(Long id, String name, String phone, String email, String city,
                                   String area, List<String> skills, List<String> categories,
                                   double expectedSalary, SalaryUnit salaryUnit,
                                   List<String> languages, String note, boolean enabled,
                                   boolean profileCompleted, VerificationStatus verificationStatus,
                                   LocalDateTime createdAt, long applicationCount,
                                   String registeredByName) {
    }

    /** The details an admin can take down over the phone for a worker. All optional but phone. */
    public record WorkerIntakeRequest(String name, String phone, String city, String area,
                                      List<String> skills, List<String> categories,
                                      Double expectedSalary, SalaryUnit salaryUnit,
                                      List<String> languages, String note, String email,
                                      String password) {
    }

    /** Answers a POST /admin/workers that hit an existing number: no duplicate is ever made. */
    public record DuplicateWorkerDto(Long id, String name, String phone, String message) {
    }

    public record ApplyOnBehalfRequest(Long jobId, String note) {
    }

    public record OnBehalfNoteRequest(String note) {
    }

    public record OnBehalfReasonRequest(String reason) {
    }

    // ================================================================== call queue

    /**
     * One line of "who do I ring next, and why". {@code id} and {@code link} are the same
     * "TYPE:id" handle so the UI can route off a single field.
     */
    public record CallQueueRowDto(String id, CallQueueType type, CallPriority priority,
                                  String reasonLabel, String personName, String personPhone,
                                  String personType, Long workerId, Long employerId,
                                  String counterpartName, String counterpartPhone,
                                  Long jobId, String jobTitle, Long applicationId, Long leadId,
                                  long waitingHours, LocalDateTime lastContactAt,
                                  ContactOutcome lastContactOutcome, long contactCount,
                                  NextAction nextAction, String nextActionLabel, String link) {
    }

    public record CallQueueTypeCountDto(CallQueueType type, String label, long count) {
    }

    public record CallQueuePriorityCountDto(long HIGH, long MEDIUM, long LOW) {
    }

    public record CallQueueSummaryDto(long total, List<CallQueueTypeCountDto> byType,
                                      CallQueuePriorityCountDto byPriority,
                                      long uncontactedWorkers, long uncontactedEmployers) {
    }

    // ================================================================== leads

    public record LeadDto(Long id, LeadSource source, String phone, String name, String message,
                          LeadIntent intent, LeadStatus status, Long workerId, Long employerId,
                          Long assignedAdminId, String assignedAdminName, String note,
                          LocalDateTime createdAt, LocalDateTime updatedAt) {
    }

    public record InboundLeadRequest(LeadSource source, String phone, String name, String message,
                                     LeadIntent intent) {
    }

    public record InboundLeadResponse(Long id, boolean received) {
    }

    public record LeadPatchRequest(LeadStatus status, String note, Long assignedAdminId) {
    }

    /**
     * Converting a lead. {@code type} picks the table; the remaining fields are the same intake
     * an admin fills in for a worker, plus the business name an employer needs.
     */
    public record LeadConvertRequest(String type, String name, String phone, String city,
                                     String area, List<String> skills, List<String> categories,
                                     Double expectedSalary, SalaryUnit salaryUnit,
                                     List<String> languages, String note, String email,
                                     String password, String businessName, String businessType) {
    }

    /** An employer taken down the same way a worker is. */
    public record EmployerSummaryDto(Long id, String name, String phone, String email,
                                     String businessName, String businessType, String city,
                                     String area, boolean enabled, LocalDateTime createdAt,
                                     String registeredByName) {
    }

    /** What a conversion answers with: exactly one of the two is filled in. */
    public record LeadConversionDto(LeadDto lead, WorkerSummaryDto worker,
                                    EmployerSummaryDto employer, boolean created) {
    }

    // ================================================================== vocabulary

    public record LabelledValueDto(String value, String label) {
    }

    public record HiringMethodOptionDto(String value, String label, String hint) {
    }

    public record VocabularyDto(String interviewSingular, String interviewPlural,
                                List<LabelledValueDto> modes,
                                List<HiringMethodOptionDto> hiringMethods) {
    }

    // ================================================================== skills registry

    public record SkillRegistryRowDto(String skill, String category, long workerCount,
                                      long verifiedWorkerCount, long jobCount, long openJobCount,
                                      long applicationCount, long hiredCount, double avgExpectedSalary,
                                      double demandRatio) {
    }

    public record SkillWorkerRowDto(Long id, String name, String phone, String city, boolean verified,
                                    double rating, int ratingCount, int experienceYears,
                                    double expectedSalary, SalaryUnit salaryUnit, long applicationCount,
                                    long hiredCount, LocalDateTime lastActiveAt) {
    }

    // ================================================================== companies

    public record CompanyRowDto(Long employerId, String businessName, String businessType,
                                String contactName, String phone, String email, String city, String area,
                                boolean verified, EmployerPlan plan, LocalDateTime registeredAt,
                                long jobCount, long openJobCount, long applicantCount, long hiredCount,
                                long interviewCount, double totalSpend, double platformFeesPaid,
                                LocalDateTime lastJobPostedAt) {
    }

    public record CompanyDetailDto(Long employerId, String businessName, String businessType,
                                   String contactName, String phone, String email, String city,
                                   String area, boolean verified, EmployerPlan plan,
                                   LocalDateTime registeredAt, long jobCount, long openJobCount,
                                   long applicantCount, long hiredCount, long interviewCount,
                                   double totalSpend, double platformFeesPaid,
                                   LocalDateTime lastJobPostedAt, List<JobRowDto> jobs,
                                   List<ApplicationRowDto> recentApplications,
                                   List<InterviewRowDto> interviews, List<PaymentRowDto> payments) {
    }

    // ================================================================== interviews

    public record InterviewRowDto(Long id, Long applicationId, Long jobId, String jobTitle,
                                  Long employerId, String businessName, Long workerId, String workerName,
                                  String workerPhone, LocalDateTime scheduledAt, InterviewMode mode,
                                  String location, String interviewerName, String interviewerPhone,
                                  InterviewStatus status, InterviewResult result, String feedback,
                                  LocalDateTime createdAt, String modeLabel) {
    }

    public record CalendarDayDto(LocalDate date, int count, List<InterviewRowDto> items) {
    }

    // ================================================================== payments

    public record PaymentRowDto(Long id, LocalDateTime at, String type, double amount, String direction,
                                String reference, String description, Long workerId, String workerName,
                                Long employerId, String businessName, Long jobId, String jobTitle,
                                Double platformFee, String status) {
    }

    public record PaymentSummaryDto(double totalIn, double totalOut, double platformFees, long count) {
    }

    public record PaymentListDto(List<PaymentRowDto> content, int page, int size, long totalElements,
                                 int totalPages, PaymentSummaryDto summary) {
    }

    // ================================================================== reports / audit

    public record DailyCountsDto(long newJobs, long newApplications, long newWorkers, long newEmployers,
                                 long interviewsScheduled, long interviewsHeld, long offersSent,
                                 long offersAccepted, long hires, long contactsLogged,
                                 long paymentsReleased, double amountReleased,
                                 long openRequests) {
    }

    public record TaskItemDto(Long id, String primary, String secondary, LocalDateTime at, String link) {
    }

    public record TaskGroupDto(String type, String label, int count, String severity,
                               List<TaskItemDto> items) {
    }

    public record AttendanceTodayDto(Long employmentId, String workerName, String businessName,
                                     AttendanceStatus status, String checkIn, String checkOut,
                                     boolean approved) {
    }

    public record AdminActivityDto(String adminName, String action, String entityType, Long entityId,
                                   LocalDateTime at) {
    }

    public record DailyReportDto(LocalDate date, DailyCountsDto counts, List<TaskGroupDto> tasks,
                                 List<InterviewRowDto> interviewsToday,
                                 List<AttendanceTodayDto> attendanceToday,
                                 List<AdminActivityDto> adminActivity) {
    }

    public record AuditRowDto(Long id, Long adminId, String adminName, AdminRole adminRole, String action,
                              String entityType, Long entityId, String detail, LocalDateTime createdAt) {
    }
}
