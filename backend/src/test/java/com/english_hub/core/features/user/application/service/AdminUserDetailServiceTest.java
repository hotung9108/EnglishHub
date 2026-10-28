package com.english_hub.core.features.user.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.application.service.AdminUserService;
import com.english_hub.core.modules.user.domain.model.User;
import com.english_hub.core.modules.user.domain.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserDetailServiceTest {

	@Mock
	private UserRepository userRepository;
	@Mock
	private CurrentUserProvider currentUserProvider;
	@Mock
	private PasswordEncoder passwordEncoder;

	private AdminUserService service;

	@BeforeEach
	void setUp() {
		service = new AdminUserService(userRepository, currentUserProvider, passwordEncoder);
	}

	@ParameterizedTest
	@ValueSource(longs = {12L, 13L})
	void getUser_whenStudentExists_checksAdminBeforeReturningTheRequestedUser(long id) {
		User target = student(id);
		when(currentUserProvider.requireAdmin()).thenReturn(admin());
		when(userRepository.findById(id)).thenReturn(Optional.of(target));

		assertThat(service.getUser(id)).isSameAs(target);

		InOrder order = inOrder(currentUserProvider, userRepository);
		order.verify(currentUserProvider).requireAdmin();
		order.verify(userRepository).findById(id);
		verifyNoMoreInteractions(userRepository);
	}

	@ParameterizedTest
	@ValueSource(longs = {0L, -1L, Long.MIN_VALUE})
	void getUser_whenIdIsNonpositive_returns404WithoutTargetLookup(long id) {
		when(currentUserProvider.requireAdmin()).thenReturn(admin());

		assertThatThrownBy(() -> service.getUser(id))
				.isInstanceOfSatisfying(ApiException.class, exception -> {
					assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
					assertThat(exception.getMessage()).isEqualTo("Không tìm thấy người dùng.");
				});
		verifyNoInteractions(userRepository);
	}

	@Test
	void getUser_whenTargetIsMissing_returns404() {
		when(currentUserProvider.requireAdmin()).thenReturn(admin());
		when(userRepository.findById(Long.MAX_VALUE)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.getUser(Long.MAX_VALUE))
				.isInstanceOfSatisfying(ApiException.class, exception -> {
					assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
					assertThat(exception.getMessage()).isEqualTo("Không tìm thấy người dùng.");
				});
	}

	@ParameterizedTest
	@EnumSource(value = HttpStatus.class, names = {"UNAUTHORIZED", "FORBIDDEN"})
	void getUser_whenAdminBoundaryRejectsCaller_doesNotReadTarget(HttpStatus status) {
		when(currentUserProvider.requireAdmin()).thenThrow(new ApiException(status, "Access rejected"));

		assertThatThrownBy(() -> service.getUser(12L))
				.isInstanceOfSatisfying(ApiException.class, exception ->
						assertThat(exception.getStatus()).isEqualTo(status));
		verifyNoInteractions(userRepository);
	}

	private User student(long id) {
		String name = id == 12L ? "Ngô Thị Phương" : "Lý Đức Việt";
		String email = id == 12L ? "ngo.thi.phuong@gmail.com" : "ly.duc.viet@gmail.com";
		return new User(id, name, email, null, null, "test-password-hash", UserRole.STUDENT,
				UserStatus.ACTIVE, false, null, null, null, null);
	}

	private User admin() {
		return new User(1L, "Hoàng Thanh Ngân", "hoang.thanh.ngan@utc-polyglot.edu.vn",
				null, null, "test-password-hash", UserRole.ADMIN, UserStatus.ACTIVE, false,
				null, null, null, null);
	}
}
