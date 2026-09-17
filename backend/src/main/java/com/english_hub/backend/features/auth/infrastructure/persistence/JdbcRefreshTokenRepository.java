package com.english_hub.backend.features.auth.infrastructure.persistence;

import com.english_hub.backend.features.auth.domain.model.RefreshToken;
import com.english_hub.backend.features.auth.domain.repository.RefreshTokenRepository;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcRefreshTokenRepository implements RefreshTokenRepository {

	private static final String TOKEN_COLUMNS = """
		rt.id,
		rt.user_id,
		rt.token_hash,
		rt.expires_at,
		rt.revoked_at,
		rt.user_agent,
		rt.ip_address,
		rt.created_at
		""";

	private final NamedParameterJdbcTemplate jdbc;

	public JdbcRefreshTokenRepository(NamedParameterJdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public Optional<RefreshToken> findByTokenHash(String tokenHash) {
		String sql = "SELECT %s FROM refresh_tokens rt WHERE rt.token_hash = :tokenHash".formatted(TOKEN_COLUMNS);
		return jdbc.query(sql, Map.of("tokenHash", tokenHash), REFRESH_TOKEN_ROW_MAPPER).stream().findFirst();
	}

	@Override
	public long create(Long userId, String tokenHash, Instant expiresAt, String userAgent, String ipAddress) {
		Long id = jdbc.queryForObject("""
				INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
				VALUES (:userId, :tokenHash, :expiresAt, :userAgent, :ipAddress)
				RETURNING id
				""", new MapSqlParameterSource()
				.addValue("userId", userId)
				.addValue("tokenHash", tokenHash)
				.addValue("expiresAt", expiresAt.atOffset(ZoneOffset.UTC))
				.addValue("userAgent", userAgent)
				.addValue("ipAddress", ipAddress), Long.class);
		return id == null ? 0L : id;
	}

	@Override
	public int revokeByTokenHash(String tokenHash) {
		return jdbc.update(
				"UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = :tokenHash AND revoked_at IS NULL",
				Map.of("tokenHash", tokenHash));
	}

	@Override
	public Optional<RefreshToken> findById(Long id) {
		String sql = "SELECT %s FROM refresh_tokens rt WHERE rt.id = :id".formatted(TOKEN_COLUMNS);
		return jdbc.query(sql, Map.of("id", id), REFRESH_TOKEN_ROW_MAPPER).stream().findFirst();
	}

	@Override
	public List<RefreshToken> findAll() {
		String sql = "SELECT %s FROM refresh_tokens rt ORDER BY rt.id ASC".formatted(TOKEN_COLUMNS);
		return jdbc.query(sql, REFRESH_TOKEN_ROW_MAPPER);
	}

	@Override
	public boolean existsById(Long id) {
		Boolean exists = jdbc.queryForObject(
				"SELECT EXISTS (SELECT 1 FROM refresh_tokens WHERE id = :id)",
				Map.of("id", id),
				Boolean.class);
		return Boolean.TRUE.equals(exists);
	}

	@Override
	public long count() {
		Long total = jdbc.queryForObject("SELECT COUNT(*) FROM refresh_tokens", Map.of(), Long.class);
		return total == null ? 0 : total;
	}

	@Override
	public RefreshToken save(RefreshToken entity) {
		if (entity.getId() == null) {
			Long id = jdbc.queryForObject("""
					INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked_at, user_agent, ip_address)
					VALUES (:userId, :tokenHash, :expiresAt, :revokedAt, :userAgent, :ipAddress)
					RETURNING id
					""", parameters(entity), Long.class);
			entity.setId(id == null ? 0L : id);
			return entity;
		}
		jdbc.update("""
				UPDATE refresh_tokens
				SET token_hash = :tokenHash,
				    expires_at = :expiresAt,
				    revoked_at = :revokedAt,
				    user_agent = :userAgent,
				    ip_address = :ipAddress
				WHERE id = :id
				""", parameters(entity));
		return entity;
	}

	@Override
	public void deleteById(Long id) {
		jdbc.update("DELETE FROM refresh_tokens WHERE id = :id", Map.of("id", id));
	}

	private MapSqlParameterSource parameters(RefreshToken entity) {
		return new MapSqlParameterSource()
				.addValue("id", entity.getId())
				.addValue("userId", entity.getUserId())
				.addValue("tokenHash", entity.getTokenHash())
				.addValue("expiresAt", toOffsetDateTime(entity.getExpiresAt()))
				.addValue("revokedAt", toOffsetDateTime(entity.getRevokedAt()))
				.addValue("userAgent", entity.getUserAgent())
				.addValue("ipAddress", entity.getIpAddress());
	}

	private OffsetDateTime toOffsetDateTime(Instant instant) {
		return instant == null ? null : instant.atOffset(ZoneOffset.UTC);
	}

	private static final RowMapper<RefreshToken> REFRESH_TOKEN_ROW_MAPPER = new RefreshTokenRowMapper();

	private static final class RefreshTokenRowMapper implements RowMapper<RefreshToken> {

		@Override
		public RefreshToken mapRow(ResultSet resultSet, int rowNum) throws SQLException {
			RefreshToken token = new RefreshToken();
			token.setId(resultSet.getLong("id"));
			token.setUserId(resultSet.getLong("user_id"));
			token.setTokenHash(resultSet.getString("token_hash"));
			token.setExpiresAt(resultSet.getObject("expires_at", OffsetDateTime.class).toInstant());
			OffsetDateTime revokedAt = resultSet.getObject("revoked_at", OffsetDateTime.class);
			token.setRevokedAt(revokedAt == null ? null : revokedAt.toInstant());
			token.setUserAgent(resultSet.getString("user_agent"));
			token.setIpAddress(resultSet.getString("ip_address"));
			token.setCreatedAt(resultSet.getObject("created_at", OffsetDateTime.class).toInstant());
			return token;
		}
	}
}