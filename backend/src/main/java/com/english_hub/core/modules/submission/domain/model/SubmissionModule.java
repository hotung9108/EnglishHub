package com.english_hub.core.modules.submission.domain.model;

import com.english_hub.core.common.domain.BaseEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Per-module row of a submission, mirroring one assignment module. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionModule extends BaseEntity<Long> {

	private Long submissionId;

	private Long moduleId;

	private SubmissionStatus status;
}