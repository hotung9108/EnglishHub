package com.english_hub.core.modules.submission.domain.repository;

import com.english_hub.core.common.persistence.repository.IRepository;
import com.english_hub.core.modules.submission.domain.model.Answer;
import java.util.List;

/** Domain port for the {@code answers} entity. */
public interface AnswerRepository extends IRepository<Answer, Long> {

	/** Persists every answer as-is and returns the rows with their ids populated. */
	List<Answer> bulkCreate(Long submissionModuleId, List<Answer> answers);

	List<Answer> findBySubmissionModuleId(Long submissionModuleId);
}