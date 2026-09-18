package com.english_hub.backend.features.user.application.service;

import com.english_hub.backend.common.ApiException;
import com.english_hub.backend.common.domain.UserRole;
import com.english_hub.backend.common.domain.UserStatus;
import com.english_hub.backend.features.user.application.dto.UserDto;
import com.english_hub.backend.features.user.application.mapper.UserMapper;
import com.english_hub.backend.features.user.domain.model.User;
import com.english_hub.backend.features.user.domain.repository.UserRepository;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Generic User CRUD facade. Endpoint-specific orchestration remains in
 * {@link AdminUserService} and {@link UserProfileService}.
 */
@Service
public class UserCrudService implements UserService {

	private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

	private final UserRepository userRepository;
	private final UserMapper userMapper;
	private final PasswordEncoder passwordEncoder;

	public UserCrudService(
			UserRepository userRepository,
			UserMapper userMapper,
			PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.userMapper = userMapper;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	@Transactional(readOnly = true)
	public List<UserDto> findAll() {
		return userRepository.findAll().stream().map(userMapper::toDto).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<UserDto> findById(Long id) {
		return userRepository.findById(id).map(userMapper::toDto);
	}

	@Override
	@Transactional
	public UserDto create(UserDto request) {
		validateCreateRequest(request);
		String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
		if (userRepository.existsByEmail(email)) {
			throw ApiException.conflict("Email đã được sử dụng.");
		}
		request.setEmail(email);
		request.setPasswordHash(passwordEncoder.encode(request.getPassword()));
		User saved = userRepository.save(userMapper.toEntity(request));
		return userMapper.toDto(saved);
	}

	@Override
	@Transactional
	public UserDto update(Long id, UserDto request) {
		if (request == null) {
			throw ApiException.badRequest("Không có dữ liệu để cập nhật.");
		}
		User target = userRepository.findById(id)
				.orElseThrow(() -> ApiException.notFound("Không tìm thấy người dùng."));
		boolean changed = false;
		if (request.getFullName() != null) {
			if (request.getFullName().isBlank()) {
				throw ApiException.badRequest("Không có dữ liệu để cập nhật.");
			}
			target.updateFullName(request.getFullName().trim());
			changed = true;
		}
		if (request.getPhone() != null) {
			target.updatePhone(emptyToNull(request.getPhone()));
			changed = true;
		}
		if (request.getAvatarUrl() != null) {
			target.updateAvatarUrl(emptyToNull(request.getAvatarUrl()));
			changed = true;
		}
		if (request.getPassword() != null && !request.getPassword().isBlank()) {
			target.changePassword(passwordEncoder.encode(request.getPassword()));
			changed = true;
		}
		if (!changed) {
			throw ApiException.badRequest("Không có dữ liệu để cập nhật.");
		}
		return userMapper.toDto(userRepository.save(target));
	}

	@Override
	@Transactional
	public void delete(Long id) {
		if (userRepository.findById(id).isEmpty()) {
			throw ApiException.notFound("Không tìm thấy người dùng.");
		}
		userRepository.deleteById(id);
	}

	private void validateCreateRequest(UserDto request) {
		if (request == null
				|| !hasText(request.getFullName())
				|| !hasText(request.getEmail())
				|| !hasText(request.getPassword())
				|| request.getRole() == null
				|| request.getRole() == UserRole.ADMIN
				|| !EMAIL_PATTERN.matcher(request.getEmail().trim()).matches()) {
			throw ApiException.badRequest("Vui lòng nhập đầy đủ và đúng định dạng thông tin.");
		}
	}

	private boolean hasText(String value) {
		return value != null && !value.trim().isEmpty();
	}

	private String emptyToNull(String value) {
		return hasText(value) ? value.trim() : null;
	}
}
