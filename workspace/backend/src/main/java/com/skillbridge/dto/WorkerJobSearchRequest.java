package com.skillbridge.dto;

import com.skillbridge.model.EmploymentType;

import java.util.List;

/**
 * Body of POST /api/worker/jobs/search. Every field is optional; {@code minSalary} and
 * {@code maxSalary} are compared against the monthly equivalent of the posted wage.
 */
public record WorkerJobSearchRequest(
        String q,
        String category,
        List<EmploymentType> employmentTypes,
        Double minSalary,
        Double maxSalary,
        Double maxDistanceKm,
        Integer minExperience,
        String language,
        QuickFilter quickFilter
) {
    public static WorkerJobSearchRequest empty() {
        return new WorkerJobSearchRequest(null, null, null, null, null, null, null, null, null);
    }
}
