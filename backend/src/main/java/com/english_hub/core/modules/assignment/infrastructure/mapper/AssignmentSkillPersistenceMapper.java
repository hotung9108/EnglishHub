package com.english_hub.core.modules.assignment.infrastructure.mapper;

import com.english_hub.core.modules.assignment.infrastructure.persistence.projection.AssignmentSkillProjection;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class AssignmentSkillPersistenceMapper {

	public Map<Long, List<ModuleSkill>> toSkillsByAssignmentId(List<AssignmentSkillProjection> modules) {
		Map<Long, LinkedHashSet<ModuleSkill>> groupedSkills = new LinkedHashMap<>();
		for (AssignmentSkillProjection module : modules) {
			LinkedHashSet<ModuleSkill> skills = groupedSkills.computeIfAbsent(
					module.getAssignmentId(), assignmentId -> new LinkedHashSet<>());
			ModuleSkill skill = ModuleSkill.valueOf(module.getSkill().name());
			skills.add(skill);
		}

		Map<Long, List<ModuleSkill>> skillsByAssignmentId = new LinkedHashMap<>();
		for (Map.Entry<Long, LinkedHashSet<ModuleSkill>> entry : groupedSkills.entrySet()) {
			skillsByAssignmentId.put(entry.getKey(), List.copyOf(entry.getValue()));
		}
		return Map.copyOf(skillsByAssignmentId);
	}
}
