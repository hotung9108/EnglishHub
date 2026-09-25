package com.english_hub.core.modules.submission.domain.model;

import com.english_hub.core.common.application.BasePageResponse;
import java.util.List;

/** Paginated submission list; page/limit/total are 1-indexed per the shared FE-BE contract. */
public class SubmissionPage extends BasePageResponse<Submission> {

	public SubmissionPage(List<Submission> submissions, int page, int limit, long total) {
		super(submissions, page, limit, total);
	}

	public List<Submission> submissions() {
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