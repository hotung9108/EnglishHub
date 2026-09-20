package com.english_hub.core.features.user.domain.model;

import com.english_hub.core.common.application.BasePageResponse;
import java.util.List;

/** User-cluster page response built on the shared page response contract. */
public class UserPage extends BasePageResponse<User> {

	public UserPage(List<User> users, int page, int limit, long total) {
		super(users, page, limit, total);
	}

	public List<User> users() {
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
