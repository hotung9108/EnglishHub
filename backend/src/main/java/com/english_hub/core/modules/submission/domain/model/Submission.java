package com.english_hub.core.modules.submission.domain.model;

import com.english_hub.core.common.domain.BaseEntity;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One attempt by a student at an assignment. Aggregate root of the submission context. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Submission extends BaseEntity<Long> {

	private Long assignmentId;

	private Long studentId;

	private int attemptNumber;

	private OffsetDateTime submittedAt;

	private SubmissionStatus status;
}