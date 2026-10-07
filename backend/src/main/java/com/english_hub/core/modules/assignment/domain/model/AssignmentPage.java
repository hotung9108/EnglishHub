package com.english_hub.core.modules.assignment.domain.model;

import com.english_hub.core.common.application.BasePageResponse;
import java.util.List;

/** Paginated assignment list returned by the application layer. */
public class AssignmentPage extends BasePageResponse<Assignment> {

	public AssignmentPage(List<Assignment> assignments, int page, int limit, long total) {
		super(assignments, page, limit, total);
	}

	public List<Assignment> assignments() {
		return getContent();
	}

	public int page() {
		return getPage();
	}

	public int limit() {
		return getSize();
	}

	public long total() {
		return getTotalElements();
	}
}
