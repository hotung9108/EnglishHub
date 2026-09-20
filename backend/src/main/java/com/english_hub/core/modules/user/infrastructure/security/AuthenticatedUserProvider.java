package com.english_hub.core.modules.user.infrastructure.security;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.security.JwtPrincipal;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import com.english_hub.core.modules.user.domain.repository.UserRepository;

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
