package com.skillbridge.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.skillbridge.model.EngagementModel;
import com.skillbridge.model.OfferType;
import com.skillbridge.model.SalaryUnit;

import java.time.LocalDate;
import java.util.List;

/**
 * The offer form, prefilled from the posted job and shaped by its duration. Short engagements
 * (one day / a few days / a few weeks) carry no probation or employment-type fields at all -
 * those come back null rather than as invented defaults.
 */
public record OfferDraftDto(
        Long applicationId,
        Long workerId,
        String workerName,
        String workerPhone,
        String workerEmail,
        Long jobId,
        String jobTitle,
        EngagementModel engagementModel,
        OfferType offerType,
        String offerLabel,
        @JsonProperty("isShortJob") boolean isShortJob,
        String workLocation,
        LocalDate workDate,
        LocalDate startDate,
        LocalDate endDate,
        String workingDaysLabel,
        String workingTimeLabel,
        String breakLabel,
        String employmentTypeLabel,
        double salary,
        SalaryUnit salaryUnit,
        List<SalaryUnit> allowedSalaryUnits,
        int scheduledDays,
        Double estimatedWorkerPay,
        Double platformFee,
        Double estimatedEmployerTotal,
        LocalDate suggestedJoiningDate,
        Integer probationMonths,
        List<String> benefits
) {}
