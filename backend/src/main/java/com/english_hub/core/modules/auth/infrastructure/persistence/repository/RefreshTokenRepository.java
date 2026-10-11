package com.english_hub.core.modules.auth.infrastructure.persistence.repository;

import com.english_hub.core.modules.auth.infrastructure.persistence.entity.RefreshTokenJpaEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository("authRefreshTokenRepository")
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenJpaEntity, Long> {

	Optional<RefreshTokenJpaEntity> findByTokenHash(String tokenHash);
}
