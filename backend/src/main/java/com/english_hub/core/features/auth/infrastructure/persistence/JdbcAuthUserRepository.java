package com.english_hub.core.features.auth.infrastructure.persistence;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.features.auth.domain.model.AuthUser;
import com.english_hub.core.features.auth.domain.repository.AuthUserRepository;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcAuthUserRepository implements AuthUserRepository {

	private static final String USER_COLUMNS = """
		u.id,
		u.full_name,
		u.email,
		u.password_hash,
		u.role::text AS role,
		u.status::text AS status,
		u.created_at,
		u.updated_at
		""";

	private final NamedParameterJdbcTemplate jdbc;

	public JdbcAuthUserRepository(NamedParameterJdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public Optional<AuthUser> findByEmail(String email) {
		String sql = """
				SELECT %s
				FROM users u
				WHERE LOWER(u.email) = LOWER(:email) AND u.is_deleted = FALSE
				""".formatted(USER_COLUMNS);
		return jdbc.query(sql, Map.of("email", email), AUTH_USER_ROW_MAPPER).stream().findFirst();
	}

	@Override
	public Optional<AuthUser> findById(Long id) {
		String sql = """
				SELECT %s
				FROM users u
				WHERE u.id = :id AND u.is_deleted = FALSE
				""".formatted(USER_COLUMNS);
		return jdbc.query(sql, Map.of("id", id), AUTH_USER_ROW_MAPPER).stream().findFirst();
	}

	@Override
	public List<AuthUser> findAll() {
		String sql = """
				SELECT %s
				FROM users u
				WHERE u.is_deleted = FALSE
				ORDER BY u.id ASC
				""".formatted(USER_COLUMNS);
		return jdbc.query(sql, AUTH_USER_ROW_MAPPER);
	}

	@Override
	public boolean existsById(Long id) {
		Boolean exists = jdbc.queryForObject(
				"SELECT EXISTS (SELECT 1 FROM users WHERE id = :id AND is_deleted = FALSE)",
				Map.of("id", id),
				Boolean.class);
		return Boolean.TRUE.equals(exists);
	}

	@Override
	public long count() {
		Long total = jdbc.queryForObject(
				"SELECT COUNT(*) FROM users WHERE is_deleted = FALSE",
				Map.of(),
				Long.class);
		return total == null ? 0 : total;
	}

	@Override
	public AuthUser save(AuthUser entity) {
		if (entity.getId() == null) {
			Long id = jdbc.queryForObject("""
					INSERT INTO users (full_name, email, password_hash, role, status)
					VALUES (:fullName, :email, :passwordHash, CAST(:role AS user_role), CAST(:status AS user_status))
					RETURNING id
					""", parameters(entity), Long.class);
			entity.setId(id == null ? 0L : id);
			return entity;
		}
		jdbc.update("""
				UPDATE users
				SET full_name = :fullName,
				    email = :email,
				    password_hash = :passwordHash,
				    role = CAST(:role AS user_role),
				    status = CAST(:status AS user_status),
				    updated_at = CURRENT_TIMESTAMP
				WHERE id = :id AND is_deleted = FALSE
				""", parameters(entity));
		return entity;
	}

	@Override
	public void deleteById(Long id) {
		jdbc.update(
				"UPDATE users SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND is_deleted = FALSE",
				Map.of("id", id));
	}

	private MapSqlParameterSource parameters(AuthUser entity) {
		return new MapSqlParameterSource()
				.addValue("id", entity.getId())
				.addValue("fullName", entity.getFullName())
				.addValue("email", entity.getEmail())
				.addValue("passwordHash", entity.getPasswordHash())
				.addValue("role", entity.getRole().name())
				.addValue("status", entity.getStatus().name());
	}

	private static final RowMapper<AuthUser> AUTH_USER_ROW_MAPPER = new AuthUserRowMapper();

	private static final class AuthUserRowMapper implements RowMapper<AuthUser> {

		@Override
		public AuthUser mapRow(ResultSet resultSet, int rowNum) throws SQLException {
			AuthUser user = new AuthUser();
			user.setId(resultSet.getLong("id"));
			user.setFullName(resultSet.getString("full_name"));
			user.setEmail(resultSet.getString("email"));
			user.setPasswordHash(resultSet.getString("password_hash"));
			user.setRole(UserRole.valueOf(resultSet.getString("role")));
			user.setStatus(UserStatus.valueOf(resultSet.getString("status")));
			user.setCreatedAt(resultSet.getObject("created_at", OffsetDateTime.class).toInstant());
			user.setUpdatedAt(resultSet.getObject("updated_at", OffsetDateTime.class).toInstant());
			return user;
		}
	}
}