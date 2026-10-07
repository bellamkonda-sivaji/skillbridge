package com.skillbridge.dto;

import com.skillbridge.model.EmploymentType;
import com.skillbridge.model.HiringMethod;
import com.skillbridge.model.OvertimePayBasis;
import com.skillbridge.model.PayrollCycle;
import com.skillbridge.model.ShiftArrangement;
import com.skillbridge.model.GenderPreference;
import com.skillbridge.model.InterviewType;
import com.skillbridge.model.JobDuration;
import com.skillbridge.model.PaymentMode;
import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.WorkPattern;
import com.skillbridge.model.WorkType;
import com.skillbridge.model.WorkerCategory;

import java.time.LocalDate;
import java.util.List;

/**
 * Body of POST / PUT /api/employer/jobs. Everything the posting wizard collects. The fields
 * added for the wizard are boxed so an absent field is left untouched by the PUT merge.
 * {@code engagementModel} arrives as a raw string so old duration values can be normalised
 * instead of failing deserialization.
 */
public record JobRequest(
        String title,
        String description,
        List<String> requiredSkills,
        WorkType workType,
        EmploymentType employmentType,
        double salary,
        SalaryUnit salaryUnit,
        String city,
        String area,
        String pincode,
        double latitude,
        double longitude,
        int minExperienceYears,
        String language,
        int workersNeeded,
        boolean urgent,
        // ---------------- posting wizard ----------------
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
        // ---------------- employment rules engine ----------------
        String engagementModel,
        WorkPattern workPattern,
        HiringMethod hiringMethod,
        Integer durationMonths,
        List<DayTimeDto> dayTimes,
        LocalDate workDate,
        ShiftArrangement shiftArrangement,
        Boolean breakPaid,
        Boolean overtimeExpected,
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
        Boolean autoCloseWhenFilled,
        Boolean draft
) {
    public boolean isDraft() {
        return Boolean.TRUE.equals(draft);
    }
}
