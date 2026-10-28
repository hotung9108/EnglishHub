package com.english_hub.core.modules.user.domain.repository;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.persistence.repository.IRepository;
import com.english_hub.core.modules.user.application.page.UserPageRequest;
import com.english_hub.core.modules.user.domain.model.User;
import com.english_hub.core.modules.user.domain.model.UserPage;

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

	/**
	 * Returns users for list summaries, with teacher/student profile fields deliberately unloaded (null).
	 * A null profile field does not indicate that the stored profile is missing. Do not save these
	 * partial aggregates: use {@link #findById(Long)} to load the full user before reading or updating profiles.
	 */
	UserPage findPage(String query, UserRole role, UserPageRequest pageRequest);

	int revokeActiveRefreshTokens(long userId);
}
