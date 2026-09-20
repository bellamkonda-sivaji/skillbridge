package com.skillbridge.dto;

import com.skillbridge.model.WorkExperience;

public record WorkExperienceDto(String role, String employer, double years) {
    public static WorkExperienceDto from(WorkExperience w) {
        return new WorkExperienceDto(w.getRole(), w.getEmployer(), w.getYears());
    }
}
