package com.english_hub.core.modules.auth.domain.repository;

import com.english_hub.core.common.persistence.repository.IRepository;
import com.english_hub.core.modules.auth.domain.model.RefreshToken;
import java.time.Instant;
import java.util.Optional;

/**
 * Persistence port for refresh sessions.
 *
 * <p>Extends the common {@code IRepository} base and adds the operations the
 * refresh/logout flows need. Lookups always use the hashed token.</p>
 */
public interface RefreshTokenRepository extends IRepository<RefreshToken, Long> {

	Optional<RefreshToken> findByTokenHash(String tokenHash);

	long create(Long userId, String tokenHash, Instant expiresAt, String userAgent, String ipAddress);

	int revokeByTokenHash(String tokenHash);
}