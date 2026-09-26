package com.english_hub.core.modules.student_evaluation.domain.model;

import com.english_hub.core.common.application.BasePageResponse;
import java.util.List;

public class StudentEvaluationPage extends BasePageResponse<StudentEvaluation> {

	public StudentEvaluationPage(List<StudentEvaluation> content, int page, int limit, long total) {
		super(content, page, limit, total);
	}
}
