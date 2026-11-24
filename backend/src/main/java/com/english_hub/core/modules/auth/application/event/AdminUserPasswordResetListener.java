package com.english_hub.core.modules.auth.application.event;

import com.english_hub.core.modules.auth.domain.repository.RefreshTokenRepository;
import com.english_hub.core.modules.user.domain.event.AdminUserPasswordResetEvent;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class AdminUserPasswordResetListener {

	private static final Logger LOGGER = LoggerFactory.getLogger(AdminUserPasswordResetListener.class);

	private final RefreshTokenRepository refreshTokenRepository;

	public AdminUserPasswordResetListener(RefreshTokenRepository refreshTokenRepository) {
		this.refreshTokenRepository = refreshTokenRepository;
	}

	@EventListener
	public void onAdminUserPasswordReset(AdminUserPasswordResetEvent event) {
		int revokedRefreshTokens = refreshTokenRepository.revokeAllByUserId(event.targetUserId());
		long adminId = event.adminId();
		long targetUserId = event.targetUserId();
		Instant occurredAt = event.occurredAt();
		if (!TransactionSynchronizationManager.isSynchronizationActive()) {
			LOGGER.warn("Admin password reset audit skipped: transaction synchronization is inactive adminId={} targetUserId={}",
					adminId, targetUserId);
			return;
		}
		registerAudit(adminId, targetUserId, occurredAt, revokedRefreshTokens);
	}

	private static void registerAudit(long adminId, long targetUserId, Instant occurredAt, int revokedRefreshTokens) {
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				LOGGER.info("event=ADMIN_PASSWORD_RESET adminId={} targetUserId={} occurredAt={} revokedRefreshTokens={}",
						adminId, targetUserId, occurredAt, revokedRefreshTokens);
			}
		});
	}
}
