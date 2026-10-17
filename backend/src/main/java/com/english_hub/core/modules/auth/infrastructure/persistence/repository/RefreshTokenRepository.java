package com.english_hub.core.modules.auth.infrastructure.persistence.repository;

import com.english_hub.core.modules.auth.infrastructure.persistence.entity.RefreshTokenJpaEntity;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository("authRefreshTokenRepository")
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenJpaEntity, Long> {

	Optional<RefreshTokenJpaEntity> findByTokenHash(String tokenHash);

	/** Bulk-revokes every active session of a user in a single statement. */
	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("""
			update RefreshTokenJpaEntity t
			   set t.revokedAt = :revokedAt
			 where t.userId = :userId
			   and t.revokedAt is null
			""")
	int revokeAllActiveByUserId(@Param("userId") Long userId, @Param("revokedAt") OffsetDateTime revokedAt);
}
