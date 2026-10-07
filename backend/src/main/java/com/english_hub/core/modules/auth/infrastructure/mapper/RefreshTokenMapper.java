package com.english_hub.core.modules.auth.infrastructure.mapper;

import org.springframework.stereotype.Component;

import com.english_hub.core.common.utils.TimeTypeMapper;
import com.english_hub.core.modules.auth.domain.model.RefreshToken;
import com.english_hub.core.modules.auth.infrastructure.persistence.entity.RefreshTokenJpaEntity;

/** Maps between domain RefreshToken and JPA RefreshToken entity. */
@Component
public class RefreshTokenMapper {

	public RefreshToken toDomain(RefreshTokenJpaEntity source) {
		RefreshToken target = new RefreshToken(
			source.getUserId(),
			source.getTokenHash(),
			TimeTypeMapper.toInstant(source.getExpiresAt()),
			TimeTypeMapper.toInstant(source.getRevokedAt()),
			source.getUserAgent(),
			source.getIpAddress()
		);
		target.setId(source.getId());
		target.setCreatedAt(TimeTypeMapper.toInstant(source.getCreatedAt()));
		return target;
	}

	public RefreshTokenJpaEntity toEntity(RefreshToken source) {
		RefreshTokenJpaEntity target =
			new RefreshTokenJpaEntity(
				source.getUserId(),
				source.getTokenHash(),
				TimeTypeMapper.toOffsetDateTime(source.getExpiresAt()),
				source.getUserAgent(),
				source.getIpAddress()
			);
		target.setId(source.getId());
		target.setRevokedAt(TimeTypeMapper.toOffsetDateTime(source.getRevokedAt()));
		target.setCreatedAt(TimeTypeMapper.toOffsetDateTime(source.getCreatedAt()));
		return target;
	}
}