package com.english_hub.backend.features.user.application.service;

import com.english_hub.backend.common.ApiException;
import com.english_hub.backend.features.user.application.command.ChangePasswordCommand;
import com.english_hub.backend.features.user.application.command.UpdateOwnProfileCommand;
import com.english_hub.backend.features.user.application.port.CurrentUserProvider;
import com.english_hub.backend.features.user.domain.model.User;
import com.english_hub.backend.features.user.domain.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

@Service
public class UserProfileService {

	private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[A-Z])(?=.*\\d).{8,}$");

	private final UserRepository userRepository;
	private final CurrentUserProvider currentUserProvider;
	private final PasswordEncoder passwordEncoder;

	public UserProfileService(
			UserRepository userRepository,
			CurrentUserProvider currentUserProvider,
			PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.currentUserProvider = currentUserProvider;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional(readOnly = true)
	public User getMyProfile() {
		return currentUserProvider.requireActiveUser();
	}

	@Transactional
	public void updateMyProfile(UpdateOwnProfileCommand request) {
		User currentUser = currentUserProvider.requireActiveUser();
		if (request == null) {
			throw ApiException.badRequest("Không có dữ liệu để cập nhật.");
		}

		boolean changed = false;
		if (request.fullName() != null) {
			if (!hasText(request.fullName())) {
				throw ApiException.badRequest("Không có dữ liệu để cập nhật.");
			}
			currentUser.updateFullName(request.fullName().trim());
			changed = true;
		}
		if (request.phone() != null) {
			currentUser.updatePhone(emptyToNull(request.phone()));
			changed = true;
		}
		if (request.avatarUrl() != null) {
			currentUser.updateAvatarUrl(emptyToNull(request.avatarUrl()));
			changed = true;
		}
		if (!changed) {
			throw ApiException.badRequest("Không có dữ liệu để cập nhật.");
		}
		userRepository.save(currentUser);
	}

	@Transactional
	public void changePassword(ChangePasswordCommand request) {
		User currentUser = currentUserProvider.requireActiveUser();
		if (request == null || !hasText(request.currentPassword()) || !hasText(request.newPassword())) {
			throw ApiException.badRequest("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.");
		}
		if (!passwordEncoder.matches(request.currentPassword(), currentUser.passwordHash())) {
			throw ApiException.unauthorized("Mật khẩu hiện tại không chính xác.");
		}
		if (!PASSWORD_PATTERN.matcher(request.newPassword()).matches()) {
			throw ApiException.badRequest("Mật khẩu mới phải từ 8 ký tự, có chữ hoa và chữ số.");
		}
		currentUser.changePassword(passwordEncoder.encode(request.newPassword()));
		userRepository.save(currentUser);
	}

	private boolean hasText(String value) {
		return value != null && !value.trim().isEmpty();
	}

	private String emptyToNull(String value) {
		return hasText(value) ? value.trim() : null;
	}
}
