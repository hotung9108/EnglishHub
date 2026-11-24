package com.english_hub.core.modules.user.application.port;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.modules.user.domain.model.User;

public interface CurrentUserProvider {

	/** Returns JWT identity without querying the database or checking locked/deleted user state. */
	AuthenticatedIdentity requireAuthenticatedIdentity();

	User requireActiveUser();

	User requireAdmin();

	record AuthenticatedIdentity(long userId, UserRole role) {
	}
}
