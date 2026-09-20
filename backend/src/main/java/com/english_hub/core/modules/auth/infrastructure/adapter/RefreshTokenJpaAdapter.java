package com.english_hub.core.modules.auth.infrastructure.adapter;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.english_hub.core.modules.auth.domain.model.RefreshToken;
import com.english_hub.core.modules.auth.domain.repository.RefreshTokenRepository;
import com.english_hub.core.modules.auth.infrastructure.mapper.RefreshTokenMapper;

/** JPA adapter for the RefreshToken domain repository port. */
@Repository
public class RefreshTokenJpaAdapter implements RefreshTokenRepository {

	private final com.english_hub.core.modules.auth.infrastructure.persistence.repository.RefreshTokenRepository jpaRepository;
	private final RefreshTokenMapper mapper;

	public RefreshTokenJpaAdapter(
			com.english_hub.core.modules.auth.infrastructure.persistence.repository.RefreshTokenRepository jpaRepository,
			RefreshTokenMapper mapper) {
		this.jpaRepository = jpaRepository;
		this.mapper = mapper;
	}

	@Override
	public Optional<RefreshToken> findByTokenHash(String tokenHash) {
		return jpaRepository.findByTokenHash(tokenHash).map(mapper::toDomain);
	}

	@Override
	public long create(Long userId, String tokenHash, Instant expiresAt, String userAgent, String ipAddress) {
		com.english_hub.core.modules.auth.infrastructure.persistence.entity.RefreshTokenJpaEntity token =
				new com.english_hub.core.modules.auth.infrastructure.persistence.entity.RefreshTokenJpaEntity(
						userId,
						tokenHash,
						expiresAt.atOffset(ZoneOffset.UTC),
						userAgent,
						ipAddress);
		com.english_hub.core.modules.auth.infrastructure.persistence.entity.RefreshTokenJpaEntity saved =
				jpaRepository.save(token);
		return saved.getId();
	}

	@Override
	public int revokeByTokenHash(String tokenHash) {
		Optional<com.english_hub.core.modules.auth.infrastructure.persistence.entity.RefreshTokenJpaEntity> token =
				jpaRepository.findByTokenHash(tokenHash);
		if (token.isEmpty()) {
			return 0;
		}
		com.english_hub.core.modules.auth.infrastructure.persistence.entity.RefreshTokenJpaEntity entity = token.get();
		entity.updateFrom(
				entity.getUserId(),
				entity.getTokenHash(),
				entity.getExpiresAt(),
				Instant.now().atOffset(ZoneOffset.UTC),
				entity.getUserAgent(),
				entity.getIpAddress());
		jpaRepository.save(entity);
		return 1;
	}

	@Override
	public Optional<RefreshToken> findById(Long id) {
		return jpaRepository.findById(id).map(mapper::toDomain);
	}

	@Override
	public List<RefreshToken> findAll() {
		return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
	}

	@Override
	public boolean existsById(Long id) {
		return jpaRepository.existsById(id);
	}

	@Override
	public long count() {
		return jpaRepository.count();
	}

	@Override
	public RefreshToken save(RefreshToken entity) {
		com.english_hub.core.modules.auth.infrastructure.persistence.entity.RefreshTokenJpaEntity jpaEntity =
				mapper.toEntity(entity);
		com.english_hub.core.modules.auth.infrastructure.persistence.entity.RefreshTokenJpaEntity saved =
				jpaRepository.save(jpaEntity);
		return mapper.toDomain(saved);
	}

	@Override
	public void deleteById(Long id) {
		jpaRepository.deleteById(id);
	}
}
