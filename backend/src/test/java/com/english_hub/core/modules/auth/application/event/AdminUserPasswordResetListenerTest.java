package com.english_hub.core.modules.auth.application.event;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.english_hub.core.modules.auth.domain.repository.RefreshTokenRepository;
import com.english_hub.core.modules.user.domain.event.AdminUserPasswordResetEvent;
import java.time.Instant;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserPasswordResetListenerTest {

	private static final Instant OCCURRED_AT = Instant.parse("2026-11-15T10:00:00Z");
	private static final AdminUserPasswordResetEvent EVENT = new AdminUserPasswordResetEvent(1L, 12L, OCCURRED_AT);

	@Mock
	private RefreshTokenRepository tokens;

	private AdminUserPasswordResetListener listener;
	private Logger logger;
	private Level originalLevel;
	private boolean originalAdditive;
	private ListAppender<ILoggingEvent> logs;

	@BeforeEach
	void setUp() {
		listener = new AdminUserPasswordResetListener(tokens);
		logger = (Logger) LoggerFactory.getLogger(AdminUserPasswordResetListener.class);
		originalLevel = logger.getLevel();
		originalAdditive = logger.isAdditive();
		logger.setLevel(Level.INFO);
		logger.setAdditive(false);
		logs = new ListAppender<>();
		logs.start();
		logger.addAppender(logs);
		TransactionSynchronizationManager.initSynchronization();
	}

	@AfterEach
	void tearDown() {
		if (TransactionSynchronizationManager.isSynchronizationActive()) {
			TransactionSynchronizationManager.clearSynchronization();
		}
		logger.detachAppender(logs);
		logs.stop();
		logger.setLevel(originalLevel);
		logger.setAdditive(originalAdditive);
	}

	@ParameterizedTest
	@ValueSource(ints = {0, 1, 7})
	void revokesOnlyTheTargetAndLogsTheReturnedCountOnlyAfterCommit(int count) {
		when(tokens.revokeAllByUserId(12L)).thenReturn(count);

		listener.onAdminUserPasswordReset(EVENT);

		verify(tokens).revokeAllByUserId(12L);
		verifyNoMoreInteractions(tokens);
		assertThat(logs.list.isEmpty()).isTrue();
		var callbacks = TransactionSynchronizationManager.getSynchronizations();
		assertThat(callbacks.size()).isEqualTo(1);
		for (TransactionSynchronization callback : callbacks) {
			callback.beforeCommit(false);
			callback.beforeCompletion();
		}
		assertThat(logs.list.isEmpty()).isTrue();
		for (TransactionSynchronization callback : callbacks) {
			callback.afterCommit();
			callback.afterCompletion(TransactionSynchronization.STATUS_COMMITTED);
		}

		assertThat(logs.list.size()).isEqualTo(1);
		ILoggingEvent log = logs.list.getFirst();
		String expected = "event=ADMIN_PASSWORD_RESET adminId=1 targetUserId=12 occurredAt="
				+ OCCURRED_AT + " revokedRefreshTokens=" + count;
		assertThat(log.getLevel()).isEqualTo(Level.INFO);
		assertThat(log.getFormattedMessage().equals(expected)).isTrue();
		assertThat(log.getArgumentArray().length).isEqualTo(4);
		assertThat(log.getMDCPropertyMap().isEmpty()).isTrue();
		assertThat(log.getThrowableProxy() == null).isTrue();
		assertNoSensitiveLogFields();
	}

	@Test
	void rollbackDoesNotWriteASuccessAudit() {
		when(tokens.revokeAllByUserId(12L)).thenReturn(2);
		listener.onAdminUserPasswordReset(EVENT);

		for (TransactionSynchronization callback : TransactionSynchronizationManager.getSynchronizations()) {
			callback.beforeCompletion();
			callback.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
		}
		assertThat(logs.list.isEmpty()).isTrue();
	}

	@Test
	void revocationFailurePropagatesWithoutRegisteringOrLoggingSuccess() {
		IllegalStateException failure = new IllegalStateException("Revocation failed");
		doThrow(failure).when(tokens).revokeAllByUserId(12L);

		Throwable actual = catchThrowable(() -> listener.onAdminUserPasswordReset(EVENT));

		assertThat(actual == failure).isTrue();
		assertThat(TransactionSynchronizationManager.getSynchronizations().isEmpty()).isTrue();
		assertThat(logs.list.isEmpty()).isTrue();
	}

	@Test
	void inactiveSynchronizationStillRevokesButOnlyWritesASafeWarning() {
		TransactionSynchronizationManager.clearSynchronization();
		when(tokens.revokeAllByUserId(12L)).thenReturn(1);

		listener.onAdminUserPasswordReset(EVENT);

		verify(tokens).revokeAllByUserId(12L);
		verifyNoMoreInteractions(tokens);
		assertThat(TransactionSynchronizationManager.isSynchronizationActive()).isFalse();
		assertThat(logs.list.size()).isEqualTo(1);
		assertThat(logs.list.getFirst().getLevel()).isEqualTo(Level.WARN);
		String expected = "Admin password reset audit skipped: transaction synchronization is inactive adminId=1 targetUserId=12";
		assertThat(logs.list.getFirst().getFormattedMessage().equals(expected)).isTrue();
		assertThat(logs.list.getFirst().getArgumentArray().length).isEqualTo(2);
		assertNoSensitiveLogFields();
	}

	private void assertNoSensitiveLogFields() {
		for (ILoggingEvent log : logs.list) {
			String message = log.getFormattedMessage();
			assertThat(message.contains("newPassword")).isFalse();
			assertThat(message.contains("passwordHash")).isFalse();
			assertThat(message.contains("$2")).isFalse();
			for (Object argument : log.getArgumentArray()) {
				assertThat(argument instanceof Long || argument instanceof Integer || argument instanceof Instant)
						.as("Audit argument is metadata only").isTrue();
			}
		}
	}
}
