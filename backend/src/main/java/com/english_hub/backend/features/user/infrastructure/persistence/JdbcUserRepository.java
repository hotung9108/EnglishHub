package com.english_hub.backend.features.user.infrastructure.persistence;

import com.english_hub.backend.features.user.domain.model.UserPage;
import com.english_hub.backend.features.user.domain.model.User;
import com.english_hub.backend.features.user.domain.model.UserRole;
import com.english_hub.backend.features.user.domain.model.UserStatus;
import com.english_hub.backend.features.user.domain.repository.UserRepository;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class JdbcUserRepository implements UserRepository {

	private static final String USER_COLUMNS = """
		u.id,
		u.full_name,
		u.email,
		u.phone,
		u.avatar_url,
		u.password_hash,
		u.role::text AS role,
		u.status::text AS status,
		u.is_deleted,
		tp.specialization,
		sp.student_code,
		sp.date_of_birth,
		sp.parent_phone
		""";

	private final NamedParameterJdbcTemplate jdbc;

	public JdbcUserRepository(NamedParameterJdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public Optional<User> findById(long id) {
		String sql = """
				SELECT %s
				FROM users u
				LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
				LEFT JOIN student_profiles sp ON sp.user_id = u.id
				WHERE u.id = :id AND u.is_deleted = FALSE
				""".formatted(USER_COLUMNS);
		return jdbc.query(sql, Map.of("id", id), USER_ROW_MAPPER).stream().findFirst();
	}

	@Override
	public boolean existsByEmail(String email) {
		String sql = "SELECT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = LOWER(:email))";
		Boolean exists = jdbc.queryForObject(sql, Map.of("email", email), Boolean.class);
		return Boolean.TRUE.equals(exists);
	}

	@Override
	public UserPage findPage(String query, UserRole role, int page, int limit) {
		String normalizedQuery = query == null ? "" : "%" + query.trim() + "%";
		String normalizedRole = role == null ? "" : role.name();
		MapSqlParameterSource parameters = new MapSqlParameterSource()
				.addValue("q", normalizedQuery)
				.addValue("role", normalizedRole)
				.addValue("limit", limit)
				.addValue("offset", (page - 1) * limit);

		String whereClause = """
				WHERE u.is_deleted = FALSE
				  AND (CAST(:q AS VARCHAR) = ''
				       OR u.full_name ILIKE CAST(:q AS VARCHAR)
				       OR u.email ILIKE CAST(:q AS VARCHAR))
				  AND (CAST(:role AS VARCHAR) = '' OR u.role::text = CAST(:role AS VARCHAR))
				""";
		Long total = jdbc.queryForObject(
				"SELECT COUNT(*) FROM users u " + whereClause,
				parameters,
				Long.class);

		String sql = """
				SELECT %s
				FROM users u
				LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
				LEFT JOIN student_profiles sp ON sp.user_id = u.id
				%s
				ORDER BY u.id ASC
				LIMIT :limit OFFSET :offset
				""".formatted(USER_COLUMNS, whereClause);
		List<User> users = jdbc.query(sql, parameters, USER_ROW_MAPPER);
		return new UserPage(users, page, limit, total == null ? 0 : total);
	}

	@Override
	public long create(
			String fullName,
			String email,
			String passwordHash,
			UserRole role) {
		MapSqlParameterSource parameters = new MapSqlParameterSource()
				.addValue("fullName", fullName)
				.addValue("email", email)
				.addValue("passwordHash", passwordHash)
				.addValue("role", role.name());
		Long id = jdbc.queryForObject("""
				INSERT INTO users (full_name, email, password_hash, role, status, is_deleted)
				VALUES (:fullName, :email, :passwordHash, CAST(:role AS user_role), 'ACTIVE'::user_status, FALSE)
				RETURNING id
				""", parameters, Long.class);
		if (id == null) {
			throw new IllegalStateException("User insert did not return an id");
		}
		return id;
	}

	@Override
	public void createTeacherProfile(long userId, String specialization) {
		jdbc.update("""
				INSERT INTO teacher_profiles (user_id, specialization)
				VALUES (:userId, :specialization)
				""", new MapSqlParameterSource()
				.addValue("userId", userId)
				.addValue("specialization", specialization));
	}

	@Override
	public void createStudentProfile(
			long userId,
			String studentCode,
			LocalDate dateOfBirth,
			String parentPhone) {
		jdbc.update("""
				INSERT INTO student_profiles (user_id, student_code, date_of_birth, parent_phone)
				VALUES (:userId, :studentCode, :dateOfBirth, :parentPhone)
				""", new MapSqlParameterSource()
				.addValue("userId", userId)
				.addValue("studentCode", studentCode)
				.addValue("dateOfBirth", dateOfBirth)
				.addValue("parentPhone", parentPhone));
	}

	@Override
	public int updateBase(long userId, Map<String, Object> updates) {
		if (updates.isEmpty()) {
			return 0;
		}
		MapSqlParameterSource parameters = new MapSqlParameterSource().addValue("userId", userId);
		List<String> assignments = new ArrayList<>();
		updates.forEach((column, value) -> {
			assignments.add(column + " = :" + column);
			parameters.addValue(column, value);
		});
		parameters.addValue("updatedAt", java.time.Instant.now());
		assignments.add("updated_at = :updatedAt");
		String sql = "UPDATE users SET " + String.join(", ", assignments)
				+ " WHERE id = :userId AND is_deleted = FALSE";
		return jdbc.update(sql, parameters);
	}

	@Override
	public int updateTeacherProfile(long userId, String specialization) {
		int updated = jdbc.update(
				"UPDATE teacher_profiles SET specialization = :specialization WHERE user_id = :userId",
				new MapSqlParameterSource()
						.addValue("userId", userId)
						.addValue("specialization", specialization));
		if (updated == 0) {
				createTeacherProfile(userId, specialization);
				return 1;
		}
		return updated;
	}

	@Override
	public int updateStudentProfile(long userId, Map<String, Object> updates) {
		if (updates.isEmpty()) {
			return 0;
		}
		MapSqlParameterSource parameters = new MapSqlParameterSource().addValue("userId", userId);
		List<String> assignments = new ArrayList<>();
		updates.forEach((column, value) -> {
			assignments.add(column + " = :" + column);
			parameters.addValue(column, value);
		});
		int updated = jdbc.update(
				"UPDATE student_profiles SET " + String.join(", ", assignments) + " WHERE user_id = :userId",
				parameters);
		if (updated == 0) {
				List<String> columns = new ArrayList<>(updates.keySet());
				List<String> values = columns.stream().map(column -> ":" + column).toList();
				jdbc.update(
						"INSERT INTO student_profiles (user_id, " + String.join(", ", columns) + ") VALUES (:userId, "
								+ String.join(", ", values) + ")",
						parameters);
			return 1;
		}
		return updated;
	}

	@Override
	public int markDeleted(long userId) {
		return jdbc.update(
				"UPDATE users SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP "
						+ "WHERE id = :userId AND is_deleted = FALSE",
				Map.of("userId", userId));
	}

	@Override
	public int updateStatus(long userId, UserStatus status) {
		return jdbc.update("""
				UPDATE users
				SET status = CAST(:status AS user_status), updated_at = CURRENT_TIMESTAMP
				WHERE id = :userId AND is_deleted = FALSE
				""", new MapSqlParameterSource()
				.addValue("status", status.name())
				.addValue("userId", userId));
	}

	@Override
	public int revokeActiveRefreshTokens(long userId) {
		return jdbc.update("""
				UPDATE refresh_tokens
				SET revoked_at = CURRENT_TIMESTAMP
				WHERE user_id = :userId AND revoked_at IS NULL
				""", Map.of("userId", userId));
	}

	private static final RowMapper<User> USER_ROW_MAPPER = new UserRowMapper();

	private static final class UserRowMapper implements RowMapper<User> {

		@Override
		public User mapRow(ResultSet resultSet, int rowNum) throws SQLException {
			java.sql.Date date = resultSet.getDate("date_of_birth");
			return new User(
					resultSet.getLong("id"),
					resultSet.getString("full_name"),
					resultSet.getString("email"),
					resultSet.getString("phone"),
					resultSet.getString("avatar_url"),
					resultSet.getString("password_hash"),
					UserRole.valueOf(resultSet.getString("role")),
					UserStatus.valueOf(resultSet.getString("status")),
					resultSet.getBoolean("is_deleted"),
					resultSet.getString("specialization"),
					resultSet.getString("student_code"),
					date == null ? null : date.toLocalDate(),
					resultSet.getString("parent_phone"));
		}
	}
}
