package com.english_hub.backend.features.user.application.service;

import com.english_hub.backend.common.ApiException;
import com.english_hub.backend.features.user.application.command.CreateUserCommand;
import com.english_hub.backend.features.user.application.command.UpdateUserCommand;
import com.english_hub.backend.features.user.application.command.UpdateUserStatusCommand;
import com.english_hub.backend.features.user.application.port.CurrentUserProvider;
import com.english_hub.backend.features.user.domain.model.UserPage;
import com.english_hub.backend.features.user.domain.model.User;
import com.english_hub.backend.features.user.domain.model.UserRole;
import com.english_hub.backend.features.user.domain.model.UserStatus;
import com.english_hub.backend.features.user.domain.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class AdminUserService {

	private static final String USER_NOT_FOUND_MESSAGE = "Không tìm thấy người dùng.";
	private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
	private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[A-Z])(?=.*\\d).{8,}$");

	private final UserRepository userRepository;
	private final CurrentUserProvider currentUserProvider;
	private final PasswordEncoder passwordEncoder;

	public AdminUserService(
			UserRepository userRepository,
			CurrentUserProvider currentUserProvider,
			PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.currentUserProvider = currentUserProvider;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional(readOnly = true)
	public UserPage listUsers(String query, String roleValue, int page, int limit) {
		currentUserProvider.requireAdmin();
		validatePagination(page, limit);
		return userRepository.findPage(query, parseRoleFilter(roleValue), page, limit);
	}

	@Transactional
	public CreatedUserData createUser(CreateUserCommand request) {
		currentUserProvider.requireAdmin();
		if (request == null
				|| !hasText(request.fullName())
				|| !hasText(request.email())
				|| !hasText(request.password())
				|| !hasText(request.role())) {
			throw invalidCreateRequest();
		}

		String email = request.email().trim().toLowerCase(Locale.ROOT);
		if (!EMAIL_PATTERN.matcher(email).matches() || !PASSWORD_PATTERN.matcher(request.password()).matches()) {
			throw invalidCreateRequest();
		}

		UserRole role;
		try {
			role = UserRole.fromApiValue(request.role());
		} catch (IllegalArgumentException exception) {
			throw invalidCreateRequest();
		}
		if (role == UserRole.ADMIN) {
			throw invalidCreateRequest();
		}
		if (userRepository.existsByEmail(email)) {
			throw ApiException.conflict("Email đã được sử dụng.");
		}

		long userId;
		try {
			userId = userRepository.create(
					request.fullName().trim(),
					email,
					passwordEncoder.encode(request.password()),
					role);
			if (role == UserRole.TEACHER) {
				userRepository.createTeacherProfile(userId, emptyToNull(request.specialization()));
			} else {
				userRepository.createStudentProfile(
						userId,
						emptyToNull(request.studentCode()),
						request.dateOfBirth(),
						emptyToNull(request.parentPhone()));
			}
		} catch (DataIntegrityViolationException exception) {
			if (userRepository.existsByEmail(email)) {
				throw ApiException.conflict("Email đã được sử dụng.");
			}
			throw exception;
		}

		return new CreatedUserData(userId, email, role.name());
	}

	@Transactional
	public void updateUser(long userId, UpdateUserCommand request) {
		currentUserProvider.requireAdmin();
		User target = findUserOrThrow(userId);
		if (request == null) {
			throw ApiException.badRequest("Không có dữ liệu để cập nhật.");
		}

		Map<String, Object> baseUpdates = new LinkedHashMap<>();
		if (request.fullName() != null) {
			if (!hasText(request.fullName())) {
				throw ApiException.badRequest("Không có dữ liệu để cập nhật.");
			}
			baseUpdates.put("full_name", request.fullName().trim());
		}
		if (request.phone() != null) {
			baseUpdates.put("phone", emptyToNull(request.phone()));
		}

		boolean hasProfileUpdate = target.role() == UserRole.TEACHER
				? request.specialization() != null
				: target.role() == UserRole.STUDENT
						&& (request.studentCode() != null
						|| request.dateOfBirth() != null
						|| request.parentPhone() != null);
		if (baseUpdates.isEmpty() && !hasProfileUpdate) {
			throw ApiException.badRequest("Không có dữ liệu để cập nhật.");
		}

		userRepository.updateBase(target.id(), baseUpdates);
		if (target.role() == UserRole.TEACHER && request.specialization() != null) {
			userRepository.updateTeacherProfile(target.id(), emptyToNull(request.specialization()));
		}
		if (target.role() == UserRole.STUDENT && hasProfileUpdate) {
			Map<String, Object> profileUpdates = new LinkedHashMap<>();
			if (request.studentCode() != null) {
				profileUpdates.put("student_code", emptyToNull(request.studentCode()));
			}
			if (request.dateOfBirth() != null) {
				profileUpdates.put("date_of_birth", request.dateOfBirth());
			}
			if (request.parentPhone() != null) {
				profileUpdates.put("parent_phone", emptyToNull(request.parentPhone()));
			}
			userRepository.updateStudentProfile(target.id(), profileUpdates);
		}
	}

	@Transactional
	public void deleteUser(long userId) {
		currentUserProvider.requireAdmin();
		findUserOrThrow(userId);
		if (userRepository.markDeleted(userId) == 0) {
			throw ApiException.notFound(USER_NOT_FOUND_MESSAGE);
		}
	}

	@Transactional
	public UserStatus updateStatus(long userId, UpdateUserStatusCommand request) {
		currentUserProvider.requireAdmin();
		UserStatus status;
		try {
			status = UserStatus.fromApiValue(request == null ? null : request.status());
		} catch (IllegalArgumentException exception) {
			throw ApiException.badRequest("status phải là ACTIVE hoặc LOCKED.");
		}

		findUserOrThrow(userId);
		if (userRepository.updateStatus(userId, status) == 0) {
			throw ApiException.notFound(USER_NOT_FOUND_MESSAGE);
		}
		if (status == UserStatus.LOCKED) {
			userRepository.revokeActiveRefreshTokens(userId);
		}
		return status;
	}

	private User findUserOrThrow(long userId) {
		return userRepository.findById(userId)
				.orElseThrow(() -> ApiException.notFound(USER_NOT_FOUND_MESSAGE));
	}

	private UserRole parseRoleFilter(String roleValue) {
		if (!hasText(roleValue)) {
			return null;
		}
		try {
			return UserRole.fromApiValue(roleValue);
		} catch (IllegalArgumentException exception) {
			throw ApiException.badRequest("role không hợp lệ.");
		}
	}

	private void validatePagination(int page, int limit) {
		if (page < 1 || limit < 1 || limit > 100) {
			throw ApiException.badRequest("Dữ liệu phân trang không hợp lệ.");
		}
	}

	private ApiException invalidCreateRequest() {
		return ApiException.badRequest("Vui lòng nhập đầy đủ và đúng định dạng thông tin.");
	}

	private boolean hasText(String value) {
		return value != null && !value.trim().isEmpty();
	}

	private String emptyToNull(String value) {
		return hasText(value) ? value.trim() : null;
	}

	public record CreatedUserData(long id, String email, String role) {
	}
}
