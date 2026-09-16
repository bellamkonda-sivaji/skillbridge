package com.skillbridge.dto;

import com.skillbridge.model.Skill;

public record SkillDto(Long id, String name, String category) {
    public static SkillDto from(Skill s) {
        return new SkillDto(s.getId(), s.getName(), s.getCategory());
    }
}
