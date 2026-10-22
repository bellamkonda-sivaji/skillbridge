package com.skillbridge.dto;

import com.skillbridge.security.Privacy;
import com.skillbridge.model.AccountType;
import com.skillbridge.model.EmploymentType;
import com.skillbridge.model.EngagementModel;
import com.skillbridge.model.JobPost;
import com.skillbridge.model.JobShift;
import com.skillbridge.model.JobOffer;
import com.skillbridge.model.OfferStatus;
import com.skillbridge.model.OfferType;
import com.skillbridge.model.SalaryUnit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * One offer. The worker app reads the employer/job half of this; the employer offer-tracking
 * screen reads the worker half and the money figures, which are only filled in by the employer
 * service because they come from the schedule engine and the configured platform fee.
 */
public record OfferDto(
        Long id,
        Long applicationId,
        String jobTitle,
        String employerName,
        Long employerId,
        double salary,
        SalaryUnit salaryUnit,
        EmploymentType employmentType,
        LocalDate joiningDate,
        String workLocation,
        OfferStatus status,
        LocalDateTime sentAt,
        // ---- employer offer tracking ----
        Long workerId,
        String workerName,
        String workerPhone,
        Long jobId,
        OfferType offerType,
        String offerLabel,
        LocalDateTime respondedAt,
        LocalDateTime expiresAt,
        LocalDate workDate,
        Integer probationMonths,
        List<String> benefits,
        String message,
        Double estimatedWorkerPay,
        Double platformFee,
        Double estimatedEmployerTotal,
        // What reaches the worker per unit: the offered rate less the commission. The worker
        // screens show this; showing them `salary` promised money they would never get.
        Double workerSalary,
        // ---- the schedule, so the worker can see what they are agreeing to ----
        EngagementModel engagementModel,
        LocalDate startDate,
        LocalDate endDate,
        List<String> workingDays,
        LocalTime startTime,
        LocalTime endTime,
        /** When the worker first opened the offer; null until they have. */
        LocalDateTime viewedAt
) {
    /** {@code employerName} is the business name when there is one, else the account name. */
    public static OfferDto from(JobOffer o, String employerName) {
        return from(o, employerName, null, null, null, null);
    }

    public static OfferDto from(JobOffer o, String employerName, Double workerPay,
                                Double platformFee, Double employerTotal, Double workerSalary) {
        // Offers written before the offer type column existed fall back to the job's duration.
        OfferType offerType = o.getOfferType() != null ? o.getOfferType()
                : (o.getApplication().getJob().getEngagementModel() != null
                        ? o.getApplication().getJob().getEngagementModel().offerType() : null);
        JobPost job = o.getApplication().getJob();
        JobShift shift = job.getShifts() == null || job.getShifts().isEmpty() ? null : job.getShifts().get(0);
        List<String> benefits = new ArrayList<>();
        if (o.getBenefits() != null) {
            o.getBenefits().forEach(b -> benefits.add(b.name()));
        }
        return new OfferDto(o.getId(), o.getApplication().getId(),
                o.getApplication().getJob().getTitle(), employerName,
                o.getApplication().getJob().getEmployer().getId(),
                o.getSalary(), o.getSalaryUnit(), o.getEmploymentType(),
                o.getJoiningDate(), o.getWorkLocation(), o.getStatus(), o.getSentAt(),
                o.getApplication().getWorker().getId(),
                o.getApplication().getWorker().getName(),
                Privacy.contactFor(o.getApplication().getWorker().getPhone(),
                        AccountType.WORKER, o.getApplication().getWorker().getId()),
                o.getApplication().getJob().getId(),
                offerType, offerLabel(offerType),
                o.getRespondedAt(), o.getExpiresAt(), o.getWorkDate(), o.getProbationMonths(),
                benefits, o.getMessage(), workerPay, platformFee, employerTotal, workerSalary,
                job.getEngagementModel(), job.getStartDate(), job.getEndDate(),
                job.getWorkingDays() == null ? List.of() : List.copyOf(job.getWorkingDays()),
                shift == null ? null : shift.getStartTime(), shift == null ? null : shift.getEndTime(),
                o.getViewedAt());
    }

    /** The plain-language name the offer screens print for the paperwork the offer carries. */
    public static String offerLabel(OfferType type) {
        if (type == null) {
            return "work confirmation";
        }
        return switch (type) {
            case NONE, WORK_CONFIRMATION -> "work confirmation";
            case SIMPLE_JOB_OFFER -> "simple job offer";
            case EMPLOYMENT_OFFER -> "employment offer";
            case FULL_EMPLOYMENT_OFFER -> "full employment offer";
        };
    }
}
