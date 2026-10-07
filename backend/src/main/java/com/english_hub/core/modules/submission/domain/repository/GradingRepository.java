package com.english_hub.core.modules.submission.domain.repository;

import com.english_hub.core.common.persistence.repository.IRepository;
import com.english_hub.core.modules.submission.domain.model.Grading;
import com.english_hub.core.modules.submission.domain.model.GradingDraft;
import java.util.Collection;
import java.util.List;

/** Domain port for the {@code gradings} entity. */
public interface GradingRepository extends IRepository<Grading, Long> {

	/** Creates one pending grading row per draft, using the draft's pre-resolved method. */
	List<Grading> bulkCreate(List<GradingDraft> drafts);

	List<Grading> findBySubmissionModuleId(Long submissionModuleId);

	List<Grading> findBySubmissionModuleIds(Collection<Long> submissionModuleIds);
}