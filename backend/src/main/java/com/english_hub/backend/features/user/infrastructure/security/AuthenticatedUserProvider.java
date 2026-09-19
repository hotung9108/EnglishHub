package com.english_hub.backend.features.user.infrastructure.security;

import com.english_hub.backend.common.ApiException;
import com.english_hub.backend.common.domain.UserRole;
import com.english_hub.backend.common.domain.UserStatus;
import com.english_hub.backend.features.user.application.port.CurrentUserProvider;
import com.english_hub.backend.features.user.domain.model.User;
import com.english_hub.backend.features.user.domain.repository.UserRepository;
import com.english_hub.backend.infrastructure.security.JwtPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticatedUserProvider implements CurrentUserProvider {

	private static final String UNAUTHENTICATED_MESSAGE = "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.";
	private static final String FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";

	private final UserRepository userRepository;

	public AuthenticatedUserProvider(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	public User requireActiveUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !(authentication.getPrincipal() instanceof JwtPrincipal principal)) {
			throw ApiException.unauthorized(UNAUTHENTICATED_MESSAGE);
		}
		User user = userRepository.findById(principal.userId())
				.orElseThrow(() -> ApiException.unauthorized(UNAUTHENTICATED_MESSAGE));
		if (!user.isActive() || user.status() != UserStatus.ACTIVE) {
			throw ApiException.unauthorized(UNAUTHENTICATED_MESSAGE);
		}
		return user;
	}

	@Override
	public User requireAdmin() {
		User user = requireActiveUser();
		if (user.role() != UserRole.ADMIN) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		return user;
	}
}
