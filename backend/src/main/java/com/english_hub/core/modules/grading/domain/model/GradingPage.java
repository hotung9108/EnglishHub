package com.english_hub.core.modules.grading.domain.model;

import com.english_hub.core.common.application.BasePageResponse;
import java.util.List;

public class GradingPage extends BasePageResponse<Grading> {

	public GradingPage(List<Grading> content, int page, int limit, long total) {
		super(content, page, limit, total);
	}
}
