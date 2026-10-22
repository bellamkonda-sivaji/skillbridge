package com.skillbridge.dto;

import com.skillbridge.model.EmploymentType;

import java.util.List;

/**
 * Body of POST /api/worker/jobs/search. Every field is optional; {@code minSalary} and
 * {@code maxSalary} are compared against the monthly equivalent of the posted wage.
 *
 * {@code lat}/{@code lng} are the phone's current position. When both are present and real
 * (not 0,0) distances - the {@code maxDistanceKm} filter and each card's {@code distanceKm} -
 * are measured from there instead of the worker's saved home location.
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
        QuickFilter quickFilter,
        Double lat,
        Double lng
) {
    /** The pre-location shape, kept so existing callers compile unchanged. */
    public WorkerJobSearchRequest(String q, String category, List<EmploymentType> employmentTypes,
                                  Double minSalary, Double maxSalary, Double maxDistanceKm,
                                  Integer minExperience, String language, QuickFilter quickFilter) {
        this(q, category, employmentTypes, minSalary, maxSalary, maxDistanceKm,
                minExperience, language, quickFilter, null, null);
    }

    public static WorkerJobSearchRequest empty() {
        return new WorkerJobSearchRequest(null, null, null, null, null, null, null, null, null, null, null);
    }
}
