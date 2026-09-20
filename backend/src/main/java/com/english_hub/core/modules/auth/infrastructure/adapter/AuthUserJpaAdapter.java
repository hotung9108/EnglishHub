package com.english_hub.core.modules.auth.infrastructure.adapter;

import com.english_hub.core.modules.auth.domain.model.AuthUser;
import com.english_hub.core.modules.auth.domain.repository.AuthUserRepository;
import com.english_hub.core.modules.auth.infrastructure.mapper.AuthUserMapper;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/** JPA adapter for the AuthUser domain repository port. */
@Repository
public class AuthUserJpaAdapter implements AuthUserRepository {

	private final com.english_hub.core.modules.auth.infrastructure.persistence.repository.AuthUserRepository jpaRepository;
	private final AuthUserMapper mapper;

	public AuthUserJpaAdapter(
			com.english_hub.core.modules.auth.infrastructure.persistence.repository.AuthUserRepository jpaRepository,
			AuthUserMapper mapper) {
		this.jpaRepository = jpaRepository;
		this.mapper = mapper;
	}

	@Override
	public Optional<AuthUser> findByEmail(String email) {
		return jpaRepository.findByEmail(email).map(mapper::toDomain);
	}

	@Override
	public Optional<AuthUser> findById(Long id) {
		return jpaRepository.findById(id).map(mapper::toDomain);
	}

	@Override
	public List<AuthUser> findAll() {
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
	public AuthUser save(AuthUser entity) {
		com.english_hub.core.modules.auth.infrastructure.persistence.entity.AuthUserJpaEntity jpaEntity =
				mapper.toEntity(entity);
		com.english_hub.core.modules.auth.infrastructure.persistence.entity.AuthUserJpaEntity saved =
				jpaRepository.save(jpaEntity);
		return mapper.toDomain(saved);
	}

	@Override
	public void deleteById(Long id) {
		jpaRepository.deleteById(id);
	}
}