package com.skillbridge.dto;

import com.skillbridge.model.EmploymentType;
import com.skillbridge.model.EngagementModel;
import com.skillbridge.model.OvertimePayBasis;
import com.skillbridge.model.PayrollCycle;
import com.skillbridge.model.ShiftArrangement;
import com.skillbridge.model.GenderPreference;
import com.skillbridge.model.InterviewType;
import com.skillbridge.model.JobDuration;
import com.skillbridge.model.JobStatus;
import com.skillbridge.model.PaymentMode;
import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.WorkType;
import com.skillbridge.model.WorkerCategory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** JobSummary plus every posting-wizard field and the live applicant counters. */
public record JobDetailDto(
        // ---- JobSummary ----
        Long id,
        String title,
        WorkerCategory workerCategory,
        String city,
        String area,
        JobStatus status,
        long applicantsCount,
        LocalDateTime postedAt,
        double salary,
        SalaryUnit salaryUnit,
        EmploymentType employmentType,
        int workersNeeded,
        long filledCount,
        // ---- counters ----
        int jobViews,
        long shortlistedCount,
        long hiredCount,
        long applicationsCount,
        // ---- the rest of the posting ----
        String description,
        List<String> requiredSkills,
        WorkType workType,
        double latitude,
        double longitude,
        int minExperienceYears,
        String language,
        boolean urgent,
        LocalDateTime expiresAt,
        List<JobShiftDto> shifts,
        List<String> responsibilities,
        List<String> benefits,
        List<String> languages,
        List<String> workingDays,
        JobDuration durationType,
        LocalDate startDate,
        LocalDate endDate,
        PaymentMode paymentMode,
        GenderPreference genderPreference,
        Integer ageMin,
        Integer ageMax,
        InterviewType interviewType,
        LocalDate applicationDeadline,
        boolean autoCloseWhenFilled,
        // ---- engagement rules engine ----
        EngagementModel engagementModel,
        LocalDate workDate,
        ShiftArrangement shiftArrangement,
        boolean breakPaid,
        boolean overtimeExpected,
        OvertimePayBasis overtimePayBasis,
        Double overtimeRate,
        PayrollCycle payrollCycle,
        Integer salaryDueDayOfMonth,
        List<JobBenefitDto> jobBenefits
) {}
