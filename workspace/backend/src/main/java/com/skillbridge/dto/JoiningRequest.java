package com.skillbridge.dto;

import com.skillbridge.model.DocumentType;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** Everything is optional. {@code markStep} advances the joining timeline when it is present. */
public record JoiningRequest(
        LocalDate actualJoiningDate,
        LocalTime reportingTime,
        String employeeId,
        String department,
        List<DocumentType> documentsVerified,
        String photoProofUrl,
        String notes,
        String markStep
) {}
