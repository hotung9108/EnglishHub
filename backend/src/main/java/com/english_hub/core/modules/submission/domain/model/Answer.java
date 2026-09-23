package com.english_hub.core.modules.submission.domain.model;

import com.english_hub.core.common.domain.BaseEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One submitted answer of a submission module, mirroring the shared {@code answers} row. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Answer extends BaseEntity<Long> {

	private Long submissionModuleId;

	private Long questionId;

	private String content;
}