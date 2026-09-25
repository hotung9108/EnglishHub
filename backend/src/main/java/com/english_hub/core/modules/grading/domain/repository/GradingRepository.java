package com.english_hub.core.modules.grading.domain.repository;

import com.english_hub.core.modules.grading.domain.model.Grading;
import com.english_hub.core.modules.grading.domain.model.GradingFilter;
import com.english_hub.core.modules.grading.domain.model.GradingPage;
import java.util.Optional;

public interface GradingRepository {

	Optional<Grading> findById(Long id);

	Optional<Grading> findBySubmissionModuleId(Long submissionModuleId);

	GradingPage findPage(GradingFilter filter, int page, int limit);

	Grading saveTeacherGrade(Grading grading);
}
