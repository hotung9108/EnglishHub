package com.english_hub.backend.infrastructure.persistence.jpa_impl.repository;

import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.AssignmentModule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentModuleRepository extends JpaRepository<AssignmentModule, Long> {
}
