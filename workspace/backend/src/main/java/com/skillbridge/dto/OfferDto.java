package com.skillbridge.dto;

import com.skillbridge.model.EmploymentType;
import com.skillbridge.model.JobOffer;
import com.skillbridge.model.OfferStatus;
import com.skillbridge.model.SalaryUnit;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
        LocalDateTime sentAt
) {
    /** {@code employerName} is the business name when there is one, else the account name. */
    public static OfferDto from(JobOffer o, String employerName) {
        return new OfferDto(o.getId(), o.getApplication().getId(),
                o.getApplication().getJob().getTitle(), employerName,
                o.getApplication().getJob().getEmployer().getId(),
                o.getSalary(), o.getSalaryUnit(), o.getEmploymentType(),
                o.getJoiningDate(), o.getWorkLocation(), o.getStatus(), o.getSentAt());
    }
}
