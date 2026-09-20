package com.english_hub.core.features.user.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.features.user.application.command.ChangePasswordCommand;
import com.english_hub.core.features.user.application.command.UpdateOwnProfileCommand;
import com.english_hub.core.features.user.application.port.CurrentUserProvider;
import com.english_hub.core.features.user.domain.model.User;
import com.english_hub.core.features.user.domain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

	@Mock
	private UserRepository userRepository;

	@Mock
	private CurrentUserProvider currentUserProvider;

	private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
	private UserProfileService userProfileService;

	@BeforeEach
	void setUp() {
		userProfileService = new UserProfileService(userRepository, currentUserProvider, passwordEncoder);
	}

	@Test
	void updatesOnlyTheProvidedOwnProfileFields() {
		User currentUser = user(12L);
		when(currentUserProvider.requireActiveUser()).thenReturn(currentUser);

		userProfileService.updateMyProfile(new UpdateOwnProfileCommand(null, "0987654321", ""));

		ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
		verify(userRepository).save(captor.capture());
		assertThat(captor.getValue().phone()).isEqualTo("0987654321");
		assertThat(captor.getValue().avatarUrl()).isNull();
		assertThat(captor.getValue().fullName()).isEqualTo("User");
	}

	@Test
	void returnsTheAuthenticatedUserProfile() {
		User currentUser = user(12L);
		when(currentUserProvider.requireActiveUser()).thenReturn(currentUser);

		assertThat(userProfileService.getMyProfile()).isSameAs(currentUser);
	}

	@Test
	void rejectsANullOwnProfileRequest() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(12L));

		assertThatThrownBy(() -> userProfileService.updateMyProfile(null))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không có dữ liệu để cập nhật.");
		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void rejectsAProfileRequestWithoutAField() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(12L));

		assertThatThrownBy(() -> userProfileService.updateMyProfile(
				new UpdateOwnProfileCommand(null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không có dữ liệu để cập nhật.");
		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void changesPasswordAfterVerifyingTheCurrentPassword() {
		User currentUser = userWithPassword("Current05Password");
		when(currentUserProvider.requireActiveUser()).thenReturn(currentUser);

		userProfileService.changePassword(new ChangePasswordCommand("Current05Password", "Newpass05"));

		ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
		verify(userRepository).save(captor.capture());
		assertThat(passwordEncoder.matches("Newpass05", captor.getValue().passwordHash())).isTrue();
	}

	@Test
	void rejectsAnIncorrectCurrentPassword() {
		when(currentUserProvider.requireActiveUser()).thenReturn(userWithPassword("Current05Password"));

		assertThatThrownBy(() -> userProfileService.changePassword(
				new ChangePasswordCommand("Wrong05Password", "Newpass05")))
				.isInstanceOf(ApiException.class)
				.hasMessage("Mật khẩu hiện tại không chính xác.");
		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void rejectsANewPasswordThatDoesNotMeetThePolicy() {
		when(currentUserProvider.requireActiveUser()).thenReturn(userWithPassword("Current05Password"));

		assertThatThrownBy(() -> userProfileService.changePassword(
				new ChangePasswordCommand("Current05Password", "weakpass")))
				.isInstanceOf(ApiException.class)
				.hasMessage("Mật khẩu mới phải từ 8 ký tự, có chữ hoa và chữ số.");
		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void rejectsMissingPasswordFields() {
		when(currentUserProvider.requireActiveUser()).thenReturn(userWithPassword("Current05Password"));

		assertThatThrownBy(() -> userProfileService.changePassword(
				new ChangePasswordCommand("", "Newpass05")))
				.isInstanceOf(ApiException.class)
				.hasMessage("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.");
		verify(userRepository, never()).save(any(User.class));
	}

	private User user(long id) {
		return new User(id, "User", "user" + id + "@example.com", null, null,
				passwordEncoder.encode("Current05Password"), UserRole.STUDENT, UserStatus.ACTIVE, false,
				null, "HV" + id, null, null);
	}

	private User userWithPassword(String password) {
		User baseUser = user(12L);
		return new User(baseUser.id(), baseUser.fullName(), baseUser.email(), baseUser.phone(),
				baseUser.avatarUrl(), passwordEncoder.encode(password), baseUser.role(), baseUser.status(),
				baseUser.deleted(), baseUser.specialization(), baseUser.studentCode(), baseUser.dateOfBirth(),
				baseUser.parentPhone());
	}
}
