package com.english_hub.core.modules.assignment.infrastructure.persistence.projection;

import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;

public interface AssignmentSkillProjection {

	Long getAssignmentId();

	ModuleSkill getSkill();

	int getOrderIndex();
}
