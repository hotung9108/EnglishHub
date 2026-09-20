package com.english_hub.core.modules.user.application.port;

import com.english_hub.core.modules.user.domain.model.User;

public interface CurrentUserProvider {

	User requireActiveUser();

	User requireAdmin();
}
