package com.english_hub.core.modules.submission.domain.repository;

import com.english_hub.core.common.persistence.repository.IRepository;
import com.english_hub.core.modules.submission.domain.model.SubmissionModule;
import java.util.List;

/** Domain port for the {@code submission_modules} entity. */
public interface SubmissionModuleRepository extends IRepository<SubmissionModule, Long> {

	/** Creates one in-progress submission-module row per module id. */
	List<SubmissionModule> bulkCreate(Long submissionId, List<Long> moduleIds);

	List<SubmissionModule> findBySubmissionId(Long submissionId);
}