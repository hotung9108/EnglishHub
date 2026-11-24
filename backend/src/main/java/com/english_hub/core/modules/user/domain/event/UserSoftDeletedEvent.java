package com.english_hub.core.modules.user.domain.event;

import java.util.Objects;

public record UserSoftDeletedEvent(Long userId) {
	public UserSoftDeletedEvent {
		Objects.requireNonNull(userId, "userId must not be null");
	}
}
