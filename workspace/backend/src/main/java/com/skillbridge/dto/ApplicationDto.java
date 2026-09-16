package com.skillbridge.dto;

import com.skillbridge.model.ApplicationStatus;
import com.skillbridge.model.JobApplication;

import java.time.LocalDateTime;

public record ApplicationDto(
        Long id,
        Long jobId,
        String jobTitle,
        Long employerId,
        String employerName,
        String businessName,
        Long workerId,
        String workerName,
        String coverMessage,
        ApplicationStatus status,
        LocalDateTime appliedAt,
        Double matchScore
) {
    public static ApplicationDto from(JobApplication a, Double matchScore) {
        return new ApplicationDto(
                a.getId(), a.getJob().getId(), a.getJob().getTitle(),
                a.getJob().getEmployer().getId(), a.getJob().getEmployer().getName(),
                a.getJob().getEmployer().getEmployerProfile() != null
                        ? a.getJob().getEmployer().getEmployerProfile().getBusinessName() : null,
                a.getWorker().getId(), a.getWorker().getName(),
                a.getCoverMessage(), a.getStatus(), a.getAppliedAt(), matchScore);
    }
}
