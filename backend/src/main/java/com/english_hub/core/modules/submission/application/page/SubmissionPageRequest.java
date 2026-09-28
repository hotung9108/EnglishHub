package com.english_hub.core.modules.submission.application.page;

import com.english_hub.core.common.application.BasePageRequest;

/**
 * Submission list pagination. Mirrors {@code ClassPageRequest}: pages are
 * 1-indexed and the shared {@code size} field is also exposed as {@code limit}.
 */
public class SubmissionPageRequest extends BasePageRequest {

	private int requestedPage = 1;
	private int requestedLimit = 20;

	public SubmissionPageRequest() {
		setPage(1);
		setLimit(20);
	}

	public SubmissionPageRequest(int page, int limit) {
		requestedPage = page;
		requestedLimit = limit;
		setPage(page);
		setLimit(limit);
	}

	@Override
	public void setPage(int page) {
		requestedPage = page;
		super.setPage(page);
	}

	public int getLimit() {
		return getSize();
	}

	public void setLimit(int limit) {
		requestedLimit = limit;
		super.setSize(limit);
	}

	public int page() {
		return getPage();
	}

	public int limit() {
		return getLimit();
	}

	public boolean isValid() {
		return requestedPage >= 1 && requestedLimit >= 1 && requestedLimit <= 100;
	}
}