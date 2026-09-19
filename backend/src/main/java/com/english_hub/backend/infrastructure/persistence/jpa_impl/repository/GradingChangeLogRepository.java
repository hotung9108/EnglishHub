package com.english_hub.backend.infrastructure.persistence.jpa_impl.repository;

import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.GradingChangeLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GradingChangeLogRepository extends JpaRepository<GradingChangeLog, Long> {
}
