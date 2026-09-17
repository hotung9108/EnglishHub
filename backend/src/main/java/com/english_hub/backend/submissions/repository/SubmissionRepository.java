package com.english_hub.backend.submissions.repository;

import com.english_hub.backend.submissions.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
}
