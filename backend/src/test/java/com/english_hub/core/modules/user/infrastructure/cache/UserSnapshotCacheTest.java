package com.english_hub.core.modules.user.infrastructure.cache;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

import com.english_hub.core.common.config.CacheConfig;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.user.domain.model.User;
import com.english_hub.core.modules.user.domain.repository.UserRepository;

/**
 * Verifies the cache wiring end-to-end (proxy, key, eviction) without a database.
 *
 * <p>The Gradle test task disables caching globally for determinism; this test
 * opts back in so {@code @Cacheable}/{@code @CacheEvict} are actually exercised.</p>
 */
@SpringBootTest(
		classes = {CacheConfig.class, UserSnapshotCache.class, UserSnapshotCacheTest.MockRepository.class},
		properties = "app.cache.enabled=true")
class UserSnapshotCacheTest {

	private static final long USER_ID = 12L;

	@Autowired
	private UserSnapshotCache cache;

	@Autowired
	private UserRepository userRepository;

	@TestConfiguration
	static class MockRepository {

		@Bean
		UserRepository userRepository() {
			return mock(UserRepository.class);
		}
	}

	@BeforeEach
	void resetCacheAndMock() {
		reset(userRepository);
		cache.evict(USER_ID);
	}

	@Test
	void servesRepeatedLookupsFromTheCache() {
		when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user(USER_ID)));

		User first = cache.find(USER_ID);
		User second = cache.find(USER_ID);

		assertThat(first).isNotNull();
		assertThat(second).isNotNull();
		verify(userRepository, times(1)).findById(USER_ID);
	}

	@Test
	void cachesMissingUsersAsWell() {
		when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

		assertThat(cache.find(USER_ID)).isNull();
		assertThat(cache.find(USER_ID)).isNull();

		verify(userRepository, times(1)).findById(USER_ID);
	}

	@Test
	void reloadsTheUserAfterEviction() {
		when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user(USER_ID)));
		cache.find(USER_ID);

		cache.evict(USER_ID);

		cache.find(USER_ID);
		verify(userRepository, times(2)).findById(USER_ID);
	}

	private User user(long id) {
		return new User(id, "User", "user" + id + "@example.com", null, null, "hash",
				UserRole.TEACHER, UserStatus.ACTIVE, false, "IELTS", null, null, null);
	}
}
