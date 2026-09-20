package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentModuleRepository extends JpaRepository<AssignmentModule, Long> {
}
