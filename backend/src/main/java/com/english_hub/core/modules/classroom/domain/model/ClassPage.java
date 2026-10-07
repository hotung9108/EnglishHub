package com.english_hub.core.modules.classroom.domain.model;

import com.english_hub.core.common.application.BasePageResponse;
import java.util.List;

/**
 * Paginated class list response; page/limit/total are 1-indexed per the
 * shared FE-BE contract.
 */
public class ClassPage extends BasePageResponse<EnglishClass> {

	public ClassPage(List<EnglishClass> classes, int page, int limit, long total) {
		super(classes, page, limit, total);
	}

	public List<EnglishClass> classes() {
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