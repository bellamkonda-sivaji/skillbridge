package com.skillbridge.dto;

import com.skillbridge.model.WorkType;

import java.util.List;

public record JobSearchRequest(
        String q,
        List<String> skills,
        String city,
        WorkType workType,
        Double maxDistanceKm,
        Double lat,
        Double lng,
        Double minSalary,
        Double maxSalary,
        Boolean urgent
) {}
