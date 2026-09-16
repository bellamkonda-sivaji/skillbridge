package com.skillbridge.dto;

import com.skillbridge.model.Match;

public record MatchDto(
        Long id,
        JobDto job,
        String workerName,
        double score,
        double skillScore,
        double distanceKm,
        double experienceScore,
        double availabilityScore,
        double salaryScore,
        double ratingScore,
        boolean viewed
) {
    public static MatchDto from(Match m) {
        return new MatchDto(m.getId(), JobDto.from(m.getJob(), m.getScore()),
                m.getWorker().getName(),
                m.getScore(), m.getSkillScore(), m.getDistanceKm(), m.getExperienceScore(),
                m.getAvailabilityScore(), m.getSalaryScore(), m.getRatingScore(), m.isViewed());
    }
}
