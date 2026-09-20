package com.english_hub.core.modules.auth.infrastructure.mapper;

import org.springframework.stereotype.Component;

import com.english_hub.core.common.utils.TimeTypeMapper;
import com.english_hub.core.modules.auth.domain.model.AuthUser;
import com.english_hub.core.modules.auth.infrastructure.persistence.entity.AuthUserJpaEntity;

/** Maps between domain AuthUser and JPA AuthUser entity. */
@Component
public class AuthUserMapper {

	public AuthUser toDomain(AuthUserJpaEntity source) {
		AuthUser target = new AuthUser(
				source.getFullName(),
				source.getEmail(),
				source.getPasswordHash(),
				source.getRole(),
				source.getStatus());
		target.setId(source.getId());
		target.setCreatedAt(TimeTypeMapper.toInstant(source.getCreatedAt()));
		target.setUpdatedAt(TimeTypeMapper.toInstant(source.getUpdatedAt()));
		return target;
	}

	public AuthUserJpaEntity toEntity(AuthUser source) {
		AuthUserJpaEntity target =
				new AuthUserJpaEntity(
				source.getFullName(),
				source.getEmail(),
				source.getPasswordHash(),
				source.getRole(),
				source.getStatus());
		target.setId(source.getId());
		target.setCreatedAt(TimeTypeMapper.toOffsetDateTime(source.getCreatedAt()));
		target.setUpdatedAt(TimeTypeMapper.toOffsetDateTime(source.getUpdatedAt()));
		return target;
	}
}