package com.english_hub.core.modules.student_evaluation.presentation.rest.dto;

import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluation;
import java.time.Instant;
import java.util.List;

public record StudentEvaluationListResponse(List<Item> data, PaginationResponse pagination) {

	public record Item(Long id, Long classId, String teacherName, String content, Instant createdAt) {

		public static Item from(StudentEvaluation evaluation) {
			return new Item(
					evaluation.id(),
					evaluation.classId(),
					evaluation.teacherName(),
					evaluation.content(),
					evaluation.createdAt());
		}
	}
}
