package com.english_hub.core.modules.auth.application.event;

import com.english_hub.core.modules.auth.domain.repository.RefreshTokenRepository;
import com.english_hub.core.modules.user.domain.event.UserSoftDeletedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class UserSoftDeletedListener {

	private final RefreshTokenRepository refreshTokenRepository;

	public UserSoftDeletedListener(RefreshTokenRepository refreshTokenRepository) {
		this.refreshTokenRepository = refreshTokenRepository;
	}

	// A revocation failure must roll back the user deletion in the same transaction.
	@TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
	public void onUserSoftDeleted(UserSoftDeletedEvent event) {
		refreshTokenRepository.revokeAllByUserId(event.userId());
	}
}
