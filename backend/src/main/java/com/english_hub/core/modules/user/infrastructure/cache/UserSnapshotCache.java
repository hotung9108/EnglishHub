package com.english_hub.core.modules.user.infrastructure.cache;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import com.english_hub.core.common.config.CacheConfig;
import com.english_hub.core.modules.user.domain.model.User;
import com.english_hub.core.modules.user.domain.repository.UserRepository;

/**
 * Caches {@link User} lookups used by authentication on every protected request.
 *
 * <p>A single {@code requireActiveUser()} call costs up to two round-trips to
 * Singapore (the user row plus the teacher/student profile), so caching it is
 * the cheapest latency win available. The cached instance is treated as an
 * immutable snapshot: callers must use {@link User#copy()} before mutating.</p>
 */
@Component
public class UserSnapshotCache {

	private final UserRepository userRepository;

	public UserSnapshotCache(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	/**
	 * Returns the cached user, or {@code null} when the user does not exist.
	 * Non-existent ids are cached as well (negative cache) so that requests with
	 * a stale JWT do not hit the database on every call.
	 */
	@Cacheable(cacheNames = CacheConfig.USERS, key = "#userId")
	public User find(long userId) {
		return userRepository.findById(userId).orElse(null);
	}

	/** Drops the entry for one user. Called after every user write. */
	@CacheEvict(cacheNames = CacheConfig.USERS, key = "#userId")
	public void evict(long userId) {
		// Annotation-driven: the cache entry is removed by Spring.
	}
}
