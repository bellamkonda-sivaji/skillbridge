package com.skillbridge.dto;

import com.skillbridge.model.DocumentStatus;
import com.skillbridge.model.DocumentType;

/** One row of the documents panel on the employer-facing worker profile. */
public record WorkerDocumentDto(DocumentType type, String label, DocumentStatus status) {}
