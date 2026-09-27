package com.skillbridge.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.skillbridge.model.DocumentType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/** The joining screen. The step set differs by duration - see JoiningStep. */
public record JoiningDto(
        Long offerId,
        Long applicationId,
        Long employmentId,
        String workerName,
        String jobTitle,
        @JsonProperty("isShortJob") boolean isShortJob,
        LocalDateTime offerAcceptedAt,
        List<JoiningStepDto> steps,
        LocalDate actualJoiningDate,
        LocalTime reportingTime,
        String employeeId,
        String department,
        List<DocumentType> documentsVerified,
        String photoProofUrl,
        String notes
) {}
