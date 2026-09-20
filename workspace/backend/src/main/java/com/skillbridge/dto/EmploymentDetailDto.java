package com.skillbridge.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.skillbridge.model.EmploymentStatus;
import com.skillbridge.model.EmploymentType;
import com.skillbridge.model.SalaryUnit;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** {@link EmploymentDto} flattened out with everything the joining screen needs. */
public record EmploymentDetailDto(
        Long id,
        Long jobId,
        String jobTitle,
        String businessName,
        Long employerId,
        EmploymentStatus status,
        LocalDate joiningDate,
        EmploymentType employmentType,
        double salary,
        SalaryUnit salaryUnit,
        List<String> workingDays,
        String shiftLabel,
        String workLocation,
        boolean isCurrent,
        @JsonFormat(pattern = "HH:mm") LocalTime reportingTime,
        String contactPersonName,
        String contactPersonPhone,
        String dressCode,
        List<String> documentsToCarry,
        boolean joiningAcknowledged,
        Double latitude,
        Double longitude,
        List<String> benefits
) {
}
