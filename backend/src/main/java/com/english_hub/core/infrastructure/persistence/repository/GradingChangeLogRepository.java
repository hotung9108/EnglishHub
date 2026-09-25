package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.GradingChangeLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GradingChangeLogRepository extends JpaRepository<GradingChangeLog, Long> {

	List<GradingChangeLog> findByGradingIdOrderByChangedAtDescIdDesc(Long gradingId);
}
