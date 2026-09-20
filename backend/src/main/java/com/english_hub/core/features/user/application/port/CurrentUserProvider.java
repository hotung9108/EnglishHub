package com.english_hub.core.features.user.application.port;

import com.english_hub.core.features.user.domain.model.User;

public interface CurrentUserProvider {

	User requireActiveUser();

	User requireAdmin();
}
