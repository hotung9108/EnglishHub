package com.english_hub.core.modules.auth.application.event;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import com.english_hub.core.modules.auth.domain.repository.RefreshTokenRepository;
import com.english_hub.core.modules.user.domain.event.UserSoftDeletedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserSoftDeletedListenerTest {
	@Mock
	private RefreshTokenRepository tokens;

	@Test
	void delegatesRevocationToAuthPortForExactlyTheTargetUser() {
		UserSoftDeletedListener listener = new UserSoftDeletedListener(tokens);
		listener.onUserSoftDeleted(new UserSoftDeletedEvent(42L));
		verify(tokens).revokeAllByUserId(42L);
		verifyNoMoreInteractions(tokens);
	}

	@Test
	void propagatesRevocationFailureToTheCaller() {
		IllegalStateException failure = new IllegalStateException("Revocation failed");
		doThrow(failure).when(tokens).revokeAllByUserId(42L);
		UserSoftDeletedListener listener = new UserSoftDeletedListener(tokens);
		assertThatThrownBy(() -> listener.onUserSoftDeleted(new UserSoftDeletedEvent(42L)))
				.isSameAs(failure);
	}

	@Test
	void rejectsAnEventWithoutATargetUserBeforeRevocation() {
		assertThatThrownBy(() -> new UserSoftDeletedEvent(null))
				.isInstanceOf(NullPointerException.class)
				.hasMessage("userId must not be null");
		verifyNoInteractions(tokens);
	}
}
