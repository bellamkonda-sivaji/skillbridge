package com.skillbridge.service;

import com.skillbridge.dto.SkillDto;
import com.skillbridge.dto.SkillRequest;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.Skill;
import com.skillbridge.repository.SkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SkillService {

    private final SkillRepository skillRepository;

    public SkillService(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    public List<SkillDto> list() {
        return skillRepository.findAllByOrderByNameAsc().stream().map(SkillDto::from).toList();
    }

    @Transactional
    public SkillDto create(SkillRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw ApiException.badRequest("Skill name is required");
        }
        String name = request.name().trim();
        if (skillRepository.findByNameIgnoreCase(name).isPresent()) {
            throw ApiException.conflict("Skill already exists: " + name);
        }
        Skill skill = Skill.builder()
                .name(name)
                .category(request.category() != null ? request.category().trim() : null)
                .build();
        return SkillDto.from(skillRepository.save(skill));
    }
}
