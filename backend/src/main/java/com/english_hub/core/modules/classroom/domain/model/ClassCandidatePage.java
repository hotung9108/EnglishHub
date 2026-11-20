package com.english_hub.core.modules.classroom.domain.model;

import com.english_hub.core.common.application.BasePageResponse;
import java.util.List;

public class ClassCandidatePage extends BasePageResponse<ClassCandidateStudent> {

	public ClassCandidatePage(List<ClassCandidateStudent> candidates, int page, int limit, long total) {
		super(candidates, page, limit, total);
	}

	public List<ClassCandidateStudent> candidates() {
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
