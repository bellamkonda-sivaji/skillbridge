package com.skillbridge.dto;

import com.skillbridge.model.BenefitType;
import com.skillbridge.model.JobBenefit;

/** One structured benefit on a job post. */
public record JobBenefitDto(
        Long id,
        BenefitType benefitType,
        Double amount,
        String unit,
        String note
) {
    public static JobBenefitDto from(JobBenefit b) {
        return new JobBenefitDto(b.getId(), b.getBenefitType(), b.getAmount(), b.getUnit(), b.getNote());
    }
}
