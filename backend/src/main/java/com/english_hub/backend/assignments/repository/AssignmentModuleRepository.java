package com.english_hub.backend.assignments.repository;

import com.english_hub.backend.assignments.entity.AssignmentModule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentModuleRepository extends JpaRepository<AssignmentModule, Long> {
}
