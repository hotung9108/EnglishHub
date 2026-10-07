package com.english_hub.core.modules.submission.domain.repository;

import com.english_hub.core.modules.submission.domain.model.AssignmentWindow;
import java.util.Optional;

/** Read-only port for an assignment's start window, owned by the submission context. */
public interface AssignmentWindowRepository {

	Optional<AssignmentWindow> findWindowById(Long assignmentId);
}