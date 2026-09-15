package com.english_hub.backend.features.user.application.port;

import com.english_hub.backend.features.user.domain.model.User;

public interface CurrentUserProvider {

	User requireActiveUser();

	User requireAdmin();
}
