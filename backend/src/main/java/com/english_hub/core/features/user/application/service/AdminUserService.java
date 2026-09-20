package com.english_hub.core.features.user.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.features.user.application.command.CreateUserCommand;
import com.english_hub.core.features.user.application.command.UpdateUserCommand;
import com.english_hub.core.features.user.application.command.UpdateUserStatusCommand;
import com.english_hub.core.features.user.application.port.CurrentUserProvider;
import com.english_hub.core.features.user.application.page.UserPageRequest;
import com.english_hub.core.features.user.domain.model.UserPage;
import com.english_hub.core.features.user.domain.model.User;
import com.english_hub.core.features.user.domain.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
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
		UserPageRequest pageRequest = new UserPageRequest(page, limit);
		validatePagination(pageRequest);
		return userRepository.findPage(query, parseRoleFilter(roleValue), pageRequest);
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

		try {
			User user = User.create(
					request.fullName().trim(),
					email,
					null,
					null,
					passwordEncoder.encode(request.password()),
					role,
					UserStatus.ACTIVE,
					emptyToNull(request.specialization()),
					emptyToNull(request.studentCode()),
					request.dateOfBirth(),
					emptyToNull(request.parentPhone()));
			user = userRepository.save(user);
			if (user.id() == null) {
				throw new IllegalStateException("User insert did not return an id");
			}
			return new CreatedUserData(user.id(), email, role.name());
		} catch (DataIntegrityViolationException exception) {
			if (userRepository.existsByEmail(email)) {
				throw ApiException.conflict("Email đã được sử dụng.");
			}
			throw exception;
		}
	}

	@Transactional
	public void updateUser(long userId, UpdateUserCommand request) {
		currentUserProvider.requireAdmin();
		User target = findUserOrThrow(userId);
		if (request == null) {
			throw ApiException.badRequest("Không có dữ liệu để cập nhật.");
		}

		boolean changed = false;
		if (request.fullName() != null) {
			if (!hasText(request.fullName())) {
				throw ApiException.badRequest("Không có dữ liệu để cập nhật.");
			}
			target.updateFullName(request.fullName().trim());
			changed = true;
		}
		if (request.phone() != null) {
			target.updatePhone(emptyToNull(request.phone()));
			changed = true;
		}

		boolean hasProfileUpdate = target.role() == UserRole.TEACHER
				? request.specialization() != null
				: target.role() == UserRole.STUDENT
						&& (request.studentCode() != null
						|| request.dateOfBirth() != null
						|| request.parentPhone() != null);
		if (!changed && !hasProfileUpdate) {
			throw ApiException.badRequest("Không có dữ liệu để cập nhật.");
		}
		if (target.role() == UserRole.TEACHER && request.specialization() != null) {
			target.updateTeacherProfile(emptyToNull(request.specialization()));
		}
		if (target.role() == UserRole.STUDENT && hasProfileUpdate) {
			target.updateStudentProfile(
					request.studentCode() == null ? target.studentCode() : emptyToNull(request.studentCode()),
					request.dateOfBirth() == null ? target.dateOfBirth() : request.dateOfBirth(),
					request.parentPhone() == null ? target.parentPhone() : emptyToNull(request.parentPhone()));
		}
		userRepository.save(target);
	}

	@Transactional
	public void deleteUser(long userId) {
		currentUserProvider.requireAdmin();
		findUserOrThrow(userId);
		userRepository.deleteById(userId);
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

		User target = findUserOrThrow(userId);
		target.changeStatus(status);
		userRepository.save(target);
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

	private void validatePagination(UserPageRequest pageRequest) {
		if (!pageRequest.isValid()) {
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
