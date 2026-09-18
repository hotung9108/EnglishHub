package com.english_hub.backend.features.user.infrastructure.security;

import com.english_hub.backend.common.ApiException;
import com.english_hub.backend.common.domain.UserRole;
import com.english_hub.backend.common.domain.UserStatus;
import com.english_hub.backend.features.user.domain.model.User;
import com.english_hub.backend.features.user.domain.repository.UserRepository;
import com.english_hub.backend.security.JwtPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticatedUserProviderTest {

	@Mock
	private UserRepository userRepository;

	@AfterEach
	void clearAuthentication() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void rejectsARequestWithoutAuthentication() {
		AuthenticatedUserProvider provider = new AuthenticatedUserProvider(userRepository);

		assertThatThrownBy(provider::requireActiveUser)
				.isInstanceOf(ApiException.class)
				.hasMessage("Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
		verify(userRepository, never()).findById(org.mockito.ArgumentMatchers.anyLong());
	}

	@Test
	void rejectsAnAuthenticationWithANonJwtPrincipal() {
		authenticate("not-a-jwt-principal");
		AuthenticatedUserProvider provider = new AuthenticatedUserProvider(userRepository);

		assertThatThrownBy(provider::requireActiveUser)
				.isInstanceOf(ApiException.class)
				.hasMessage("Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
		verify(userRepository, never()).findById(org.mockito.ArgumentMatchers.anyLong());
	}

	@Test
	void rejectsAnUnknownUser() {
		authenticate(new JwtPrincipal(404L,
				com.english_hub.backend.features.user.domain.model.UserRole.STUDENT));
		when(userRepository.findById(404L)).thenReturn(Optional.empty());
		AuthenticatedUserProvider provider = new AuthenticatedUserProvider(userRepository);

		assertThatThrownBy(provider::requireActiveUser)
				.isInstanceOf(ApiException.class)
				.hasMessage("Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
	}

	@Test
	void rejectsALockedUserEvenWhenTheTokenIsValid() {
		authenticate(new JwtPrincipal(12L,
				com.english_hub.backend.features.user.domain.model.UserRole.STUDENT));
		when(userRepository.findById(12L)).thenReturn(Optional.of(user(12L, UserRole.STUDENT, UserStatus.LOCKED, false)));
		AuthenticatedUserProvider provider = new AuthenticatedUserProvider(userRepository);

		assertThatThrownBy(provider::requireActiveUser)
				.isInstanceOf(ApiException.class)
				.hasMessage("Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
	}

	@Test
	void rejectsASoftDeletedUserEvenWhenTheStatusIsActive() {
		authenticate(new JwtPrincipal(12L,
				com.english_hub.backend.features.user.domain.model.UserRole.STUDENT));
		when(userRepository.findById(12L)).thenReturn(Optional.of(user(12L, UserRole.STUDENT, UserStatus.ACTIVE, true)));
		AuthenticatedUserProvider provider = new AuthenticatedUserProvider(userRepository);

		assertThatThrownBy(provider::requireActiveUser)
				.isInstanceOf(ApiException.class)
				.hasMessage("Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
	}

	@Test
	void returnsAnActiveUserFromTheRepository() {
		User activeUser = user(12L, UserRole.TEACHER, UserStatus.ACTIVE, false);
		authenticate(new JwtPrincipal(12L,
				com.english_hub.backend.features.user.domain.model.UserRole.TEACHER));
		when(userRepository.findById(12L)).thenReturn(Optional.of(activeUser));
		AuthenticatedUserProvider provider = new AuthenticatedUserProvider(userRepository);

		assertThat(provider.requireActiveUser()).isSameAs(activeUser);
	}

	@Test
	void allowsOnlyAnActiveAdminThroughTheAdminBoundary() {
		User admin = user(1L, UserRole.ADMIN, UserStatus.ACTIVE, false);
		authenticate(new JwtPrincipal(1L,
				com.english_hub.backend.features.user.domain.model.UserRole.ADMIN));
		when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
		AuthenticatedUserProvider provider = new AuthenticatedUserProvider(userRepository);

		assertThat(provider.requireAdmin()).isSameAs(admin);
	}

	@Test
	void rejectsAnActiveTeacherThroughTheAdminBoundary() {
		User teacher = user(12L, UserRole.TEACHER, UserStatus.ACTIVE, false);
		authenticate(new JwtPrincipal(12L,
				com.english_hub.backend.features.user.domain.model.UserRole.TEACHER));
		when(userRepository.findById(12L)).thenReturn(Optional.of(teacher));
		AuthenticatedUserProvider provider = new AuthenticatedUserProvider(userRepository);

		assertThatThrownBy(provider::requireAdmin)
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
	}

	private void authenticate(Object principal) {
		SecurityContextHolder.getContext().setAuthentication(
				new UsernamePasswordAuthenticationToken(principal, "token", List.of()));
	}

	private User user(long id, UserRole role, UserStatus status, boolean deleted) {
		return new User(id, "User", "user" + id + "@example.com", null, null, "hash", role, status, deleted,
				role == UserRole.TEACHER ? "IELTS" : null,
				role == UserRole.STUDENT ? "HV" + id : null, null, null);
	}
}
