package com.english_hub.backend.features.user.domain.repository;

import com.english_hub.backend.features.user.domain.model.User;
import com.english_hub.backend.features.user.domain.model.UserPage;
import com.english_hub.backend.common.domain.UserRole;
import com.english_hub.backend.common.persistence.repository.IRepository;
import com.english_hub.backend.features.user.application.page.UserPageRequest;

import java.util.Optional;

/**
 * Persistence port owned by the User domain.
 *
 * <p>The domain and application layers depend on this contract, while JPA is
 * provided by an infrastructure adapter.</p>
 */
public interface UserRepository extends IRepository<User, Long> {

	@Override
	Optional<User> findById(Long id);

	boolean existsByEmail(String email);

	UserPage findPage(String query, UserRole role, UserPageRequest pageRequest);

	int revokeActiveRefreshTokens(long userId);
}
