package com.english_hub.core.modules.submission.domain.repository;

import com.english_hub.core.modules.submission.domain.model.ModuleInfo;
import java.util.List;

/** Read-only port for an assignment's modules, owned by the submission context. */
public interface AssignmentModuleRepository {

	List<ModuleInfo> findModulesByAssignmentId(Long assignmentId);
}