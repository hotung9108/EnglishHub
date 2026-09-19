package com.english_hub.backend.infrastructure.persistence.jpa_impl.repository;

import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
}
