package com.english_hub.core.modules.assignment.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.modules.assignment.infrastructure.persistence.projection.AssignmentSkillProjection;
import java.util.List;
import org.springframework.data.repository.Repository;

public interface AssignmentSkillJpaRepository extends Repository<AssignmentModule, Long> {

	List<AssignmentSkillProjection> findByAssignmentIdInOrderByAssignmentIdAscOrderIndexAscIdAsc(
			List<Long> assignmentIds);
}
