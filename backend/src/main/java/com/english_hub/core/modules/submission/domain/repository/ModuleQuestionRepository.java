package com.english_hub.core.modules.submission.domain.repository;

import com.english_hub.core.modules.submission.domain.model.ModuleQuestion;
import java.util.List;

/** Domain port for reading the questions of an assignment module. */
public interface ModuleQuestionRepository {

	/** Returns the module's questions ordered by order index. */
	List<ModuleQuestion> findByModuleId(Long moduleId);
}