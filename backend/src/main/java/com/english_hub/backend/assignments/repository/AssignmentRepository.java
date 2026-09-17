package com.english_hub.backend.assignments.repository;

import com.english_hub.backend.assignments.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
}
