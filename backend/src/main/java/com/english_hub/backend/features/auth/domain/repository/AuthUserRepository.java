package com.english_hub.backend.features.auth.domain.repository;

import com.english_hub.backend.common.persistence.repository.IRepository;
import com.english_hub.backend.features.auth.domain.model.AuthUser;
import java.util.Optional;

/**
 * Auth-side access to account records.
 *
 * <p>Extends the common {@code IRepository} base; adds the lookup the login
 * flow needs. Soft-deleted accounts are excluded.</p>
 */
public interface AuthUserRepository extends IRepository<AuthUser, Long> {

	Optional<AuthUser> findByEmail(String email);
}