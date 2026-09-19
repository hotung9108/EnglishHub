package com.english_hub.backend.infrastructure.persistence.jpa_impl.repository;

import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.SubmissionModule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionModuleRepository extends JpaRepository<SubmissionModule, Long> {
}
