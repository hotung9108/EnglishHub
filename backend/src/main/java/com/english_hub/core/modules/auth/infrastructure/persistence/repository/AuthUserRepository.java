package com.english_hub.core.modules.auth.infrastructure.persistence.repository;

import com.english_hub.core.modules.auth.infrastructure.persistence.entity.AuthUserJpaEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthUserRepository extends JpaRepository<AuthUserJpaEntity, Long> {

	Optional<AuthUserJpaEntity> findByEmail(String email);

	Optional<AuthUserJpaEntity> findByEmailIgnoreCase(String email);
}
