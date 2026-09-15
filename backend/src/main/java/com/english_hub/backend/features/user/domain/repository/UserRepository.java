package com.english_hub.backend.features.user.domain.repository;

import com.english_hub.backend.features.user.domain.model.User;
import com.english_hub.backend.features.user.domain.model.UserPage;
import com.english_hub.backend.features.user.domain.model.UserRole;
import com.english_hub.backend.features.user.domain.model.UserStatus;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

/**
 * Persistence port owned by the User domain.
 *
 * <p>The domain and application layers depend on this contract, while JDBC is
 * provided by an infrastructure adapter.</p>
 */
public interface UserRepository {

	Optional<User> findById(long id);

	boolean existsByEmail(String email);

	UserPage findPage(String query, UserRole role, int page, int limit);

	long create(String fullName, String email, String passwordHash, UserRole role);

	void createTeacherProfile(long userId, String specialization);

	void createStudentProfile(long userId, String studentCode, LocalDate dateOfBirth, String parentPhone);

	int updateBase(long userId, Map<String, Object> updates);

	int updateTeacherProfile(long userId, String specialization);

	int updateStudentProfile(long userId, Map<String, Object> updates);

	int markDeleted(long userId);

	int updateStatus(long userId, UserStatus status);

	int revokeActiveRefreshTokens(long userId);
}
