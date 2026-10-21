package com.english_hub.core.modules.assignment.domain.repository;

import com.english_hub.core.common.persistence.repository.IRepository;
import com.english_hub.core.modules.assignment.application.page.AssignmentPageRequest;
import com.english_hub.core.modules.assignment.domain.model.Assignment;
import com.english_hub.core.modules.assignment.domain.model.AssignmentModuleSummary;
import com.english_hub.core.modules.assignment.domain.model.AssignmentPage;
import com.english_hub.core.modules.assignment.domain.model.AssignmentStatus;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface AssignmentRepository extends IRepository<Assignment, Long> {

	Optional<Assignment> findByIdForUpdate(Long id);

	AssignmentPage findPage(Long classId, AssignmentStatus status, AssignmentPageRequest pageRequest);

	Map<Long, List<ModuleSkill>> findSkillsByAssignmentIds(List<Long> assignmentIds);

	List<AssignmentModuleSummary> findModuleSummaries(Long assignmentId);
}
