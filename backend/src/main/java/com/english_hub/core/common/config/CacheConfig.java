package com.english_hub.core.common.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * In-memory (L1) cache for data that is read on almost every request.
 *
 * <p>Staging runs on a home server while PostgreSQL (Neon) lives in Singapore,
 * so every avoided SELECT removes a full network round-trip (~40ms) from the
 * request. Only immutable snapshots are cached; callers must copy before
 * mutating (see {@code User#copy()}).</p>
 */
@Configuration
@EnableCaching
public class CacheConfig {

	/** Cached {@code User} snapshots, keyed by user id. */
	public static final String USERS = "users";

	/** Cached class access checks, keyed by {@code "<classId>:<userId>"}. */
	public static final String CLASS_ACCESS = "class-access";

	private static final long USER_CACHE_MAX_SIZE = 5_000;
	private static final long CLASS_ACCESS_CACHE_MAX_SIZE = 20_000;

	@Bean
	@ConditionalOnProperty(name = "app.cache.enabled", havingValue = "true", matchIfMissing = true)
	CacheManager cacheManager() {
		SimpleCacheManager cacheManager = new SimpleCacheManager();
		cacheManager.setCaches(List.of(
				// 5 minutes: user status/role changes are rare and are evicted explicitly
				// whenever a user is saved or deleted.
				new CaffeineCache(USERS, Caffeine.newBuilder()
						.expireAfterWrite(Duration.ofMinutes(5))
						.maximumSize(USER_CACHE_MAX_SIZE)
						.build()),
				// 1 minute: membership changes must become visible quickly. Entries are
				// also evicted explicitly when a class or class member is saved.
				new CaffeineCache(CLASS_ACCESS, Caffeine.newBuilder()
						.expireAfterWrite(Duration.ofMinutes(1))
						.maximumSize(CLASS_ACCESS_CACHE_MAX_SIZE)
						.build())));
		return cacheManager;
	}
}
