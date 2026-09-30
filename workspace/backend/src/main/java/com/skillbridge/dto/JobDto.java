package com.skillbridge.dto;

import com.skillbridge.model.EmploymentType;
import com.skillbridge.model.EngagementModel;
import com.skillbridge.model.HiringMethod;
import com.skillbridge.model.OvertimePayBasis;
import com.skillbridge.model.PayrollCycle;
import com.skillbridge.model.ShiftArrangement;
import com.skillbridge.model.GenderPreference;
import com.skillbridge.model.InterviewType;
import com.skillbridge.model.JobDuration;
import com.skillbridge.model.JobPost;
import com.skillbridge.model.JobStatus;
import com.skillbridge.model.PaymentMode;
import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.WorkType;
import com.skillbridge.model.WorkerCategory;
import com.skillbridge.model.WorkPattern;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record JobDto(
        Long id,
        Long employerId,
        String employerName,
        String businessName,
        double employerRating,
        int employerRatingCount,
        String title,
        String description,
        List<String> requiredSkills,
        WorkType workType,
        EmploymentType employmentType,
        double salary,
        SalaryUnit salaryUnit,
        /** What the worker takes home after the platform commission. */
        double workerSalary,
        double platformFee,
        double feePercent,
        String city,
        String area,
        double latitude,
        double longitude,
        int minExperienceYears,
        String language,
        int workersNeeded,
        boolean urgent,
        JobStatus status,
        LocalDateTime postedAt,
        LocalDateTime expiresAt,
        int applicantsCount,
        Double matchScore,
        // ---------------- posting wizard fields ----------------
        WorkerCategory workerCategory,
        List<String> responsibilities,
        List<String> workingDays,
        List<JobShiftDto> shifts,
        JobDuration durationType,
        LocalDate startDate,
        LocalDate endDate,
        List<String> benefits,
        List<JobBenefitDto> jobBenefits,
        PaymentMode paymentMode,
        EngagementModel engagementModel,
        LocalDate workDate,
        ShiftArrangement shiftArrangement,
        boolean breakPaid,
        boolean overtimeExpected,
        OvertimePayBasis overtimePayBasis,
        Double overtimeRate,
        PayrollCycle payrollCycle,
        Integer salaryDueDayOfMonth,
        List<String> languages,
        GenderPreference genderPreference,
        Integer ageMin,
        Integer ageMax,
        InterviewType interviewType,
        LocalDate applicationDeadline,
        boolean autoCloseWhenFilled,
        int jobViews,
        WorkPattern workPattern,
        HiringMethod hiringMethod,
        Integer durationMonths,
        List<DayTimeDto> dayTimes
) {
    public static JobDto from(JobPost j, Double matchScore) {
        return new JobDto(
                j.getId(), j.getEmployer().getId(), j.getEmployer().getName(),
                j.getEmployer().getProfile() != null ? j.getEmployer().getProfile().getBusinessName() : null,
                j.getEmployer().getAvgRating(), j.getEmployer().getRatingCount(),
                j.getTitle(), j.getDescription(), j.getRequiredSkills(), j.getWorkType(),
                j.getEmploymentType(), j.getSalary(), j.getSalaryUnit(),
                j.getWorkerSalary(), j.getPlatformFee(), j.getFeePercent(), j.getCity(), j.getArea(),
                j.getLatitude(), j.getLongitude(), j.getMinExperienceYears(), j.getLanguage(),
                j.getWorkersNeeded(), j.isUrgent(), j.getStatus(), j.getPostedAt(), j.getExpiresAt(),
                j.getApplicantsCount(), matchScore,
                j.getWorkerCategory(), List.copyOf(j.getResponsibilities()), List.copyOf(j.getWorkingDays()),
                j.getShifts().stream().map(JobShiftDto::from).toList(),
                j.getDurationType(), j.getStartDate(), j.getEndDate(),
                List.copyOf(j.getBenefits()),
                j.getJobBenefits().stream().map(JobBenefitDto::from).toList(),
                j.getPaymentMode(),
                j.getEngagementModel(), j.getWorkDate(), j.getShiftArrangement(),
                j.isBreakPaid(), j.isOvertimeExpected(), j.getOvertimePayBasis(),
                j.getOvertimeRate(), j.getPayrollCycle(), j.getSalaryDueDayOfMonth(),
                List.copyOf(j.getLanguages()),
                j.getGenderPreference(), j.getAgeMin(), j.getAgeMax(), j.getInterviewType(),
                j.getApplicationDeadline(), j.isAutoCloseWhenFilled(), j.getJobViews(),
                j.getWorkPattern(), j.getHiringMethod(), j.getDurationMonths(),
                j.getDayTimes() == null ? List.of()
                        : j.getDayTimes().stream().map(d -> new DayTimeDto(
                                d.getDayCode(), d.getStartTime(), d.getEndTime())).toList());
    }
}
