package com.skillbridge.dto;

import com.skillbridge.model.JobPost;
import com.skillbridge.model.JobStatus;
import com.skillbridge.model.SalaryUnit;
import com.skillbridge.model.WorkType;

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
        double salary,
        SalaryUnit salaryUnit,
        String city,
        String area,
        double latitude,
        double longitude,
        int workersNeeded,
        boolean urgent,
        JobStatus status,
        LocalDateTime postedAt,
        LocalDateTime expiresAt,
        int applicantsCount,
        Double matchScore
) {
    public static JobDto from(JobPost j, Double matchScore) {
        return new JobDto(
                j.getId(), j.getEmployer().getId(), j.getEmployer().getName(),
                j.getEmployer().getEmployerProfile() != null ? j.getEmployer().getEmployerProfile().getBusinessName() : null,
                j.getEmployer().getAvgRating(), j.getEmployer().getRatingCount(),
                j.getTitle(), j.getDescription(), j.getRequiredSkills(), j.getWorkType(),
                j.getSalary(), j.getSalaryUnit(), j.getCity(), j.getArea(), j.getLatitude(), j.getLongitude(),
                j.getWorkersNeeded(), j.isUrgent(), j.getStatus(), j.getPostedAt(), j.getExpiresAt(),
                j.getApplicantsCount(), matchScore);
    }
}
