package com.skillbridge.dto;

import com.skillbridge.model.EmployerProfile;

import java.util.List;

/** What GET /api/employers/{id} serves to anyone, signed in or not. */
public record EmployerPublicProfileDto(
        Long id,
        String businessName,
        String businessType,
        String description,
        String city,
        String area,
        double latitude,
        double longitude,
        String website,
        Integer founded,
        String teamSize,
        boolean verified,
        double avgRating,
        int ratingCount,
        List<String> photos,
        long openJobsCount
) {
    /** {@code id} is the employer ACCOUNT id, so a JobCard's employerId round-trips here. */
    public static EmployerPublicProfileDto from(EmployerProfile p, long openJobsCount) {
        return new EmployerPublicProfileDto(
                p.getAccount().getId(), p.getBusinessName(), p.getBusinessType(), p.getDescription(),
                p.getCity(), p.getArea(), p.getLatitude(), p.getLongitude(), p.getWebsite(),
                p.getFounded(), p.getTeamSize(), p.isVerified(),
                p.getAccount().getAvgRating(), p.getAccount().getRatingCount(),
                List.copyOf(p.getPhotos()), openJobsCount);
    }
}
