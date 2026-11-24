package com.english_hub.core.modules.grading.domain.repository;

import com.english_hub.core.modules.grading.application.dto.GradingMetadata;
import com.english_hub.core.modules.grading.domain.model.GradingContext;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;

public interface GradingContextRepository {

	Optional<GradingContext> findBySubmissionModuleId(Long submissionModuleId);

	Optional<GradingContext> findByGradingId(Long gradingId);

	Optional<GradingContext> findByAnswerId(Long answerId);

	Map<Long, GradingMetadata> findMetadataBySubmissionModuleIds(Collection<Long> submissionModuleIds);
}
