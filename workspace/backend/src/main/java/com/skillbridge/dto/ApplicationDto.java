package com.skillbridge.dto;

import com.skillbridge.model.ApplicationStatus;
import com.skillbridge.model.InterviewResult;
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
        /**
         * What the worker does and for how long.
         *
         * The applicant list showed a blank where experience should be: the
         * card asked for it and this never carried it, so an employer
         * scanning applicants had to open each one to learn anything.
         */
        String workerJobTitle,
        Integer workerExperienceYears,
        Boolean workerFresher,
        String coverMessage,
        ApplicationStatus status,
        LocalDateTime appliedAt,
        Double matchScore,
        InterviewResult interviewResult,
        String interviewFeedback
) {
    public static ApplicationDto from(JobApplication a, Double matchScore) {
        return new ApplicationDto(
                a.getId(), a.getJob().getId(), a.getJob().getTitle(),
                a.getJob().getEmployer().getId(), a.getJob().getEmployer().getName(),
                a.getJob().getEmployer().getProfile() != null
                        ? a.getJob().getEmployer().getProfile().getBusinessName() : null,
                a.getWorker().getId(), a.getWorker().getName(),
                a.getWorker().getProfile() == null ? null : a.getWorker().getProfile().getJobTitle(),
                a.getWorker().getProfile() == null ? null
                        : a.getWorker().getProfile().getExperienceYears(),
                a.getWorker().getProfile() == null ? null
                        : a.getWorker().getProfile().isFresher(),
                a.getCoverMessage(), a.getStatus(), a.getAppliedAt(), matchScore,
                a.getInterviewResult(), a.getInterviewFeedback());
    }
}
