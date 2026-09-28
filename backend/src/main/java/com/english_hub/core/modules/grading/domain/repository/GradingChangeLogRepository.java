package com.english_hub.core.modules.grading.domain.repository;

import com.english_hub.core.modules.grading.domain.model.GradingChangeLog;
import java.util.List;

public interface GradingChangeLogRepository {

	GradingChangeLog save(GradingChangeLog changeLog);

	List<GradingChangeLog> findByGradingIdNewestFirst(Long gradingId);
}
