package com.english_hub.core.modules.user.application.page;

import com.english_hub.core.common.application.BasePageRequest;

/**
 * User list pagination. The public User API calls the shared {@code size}
 * field {@code limit}, so this feature adapter exposes that vocabulary while
 * still inheriting the common page bounds.
 */
public class UserPageRequest extends BasePageRequest {

	private int requestedPage = 1;
	private int requestedLimit = 20;

	public UserPageRequest() {
		setPage(1);
		setLimit(20);
	}

	public UserPageRequest(int page, int limit) {
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
