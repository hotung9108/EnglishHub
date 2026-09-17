package com.english_hub.backend.gradings.repository;

import com.english_hub.backend.gradings.entity.GradingChangeLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GradingChangeLogRepository extends JpaRepository<GradingChangeLog, Long> {
}
