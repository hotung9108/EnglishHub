package com.english_hub.backend.features.user.application.service;

import com.english_hub.backend.common.ApiException;
import com.english_hub.backend.features.user.application.command.ChangePasswordCommand;
import com.english_hub.backend.features.user.application.command.UpdateOwnProfileCommand;
import com.english_hub.backend.features.user.application.port.CurrentUserProvider;
import com.english_hub.backend.features.user.domain.model.User;
import com.english_hub.backend.features.user.domain.model.UserRole;
import com.english_hub.backend.features.user.domain.model.UserStatus;
import com.english_hub.backend.features.user.domain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
		when(currentUserProvider.requireActiveUser()).thenReturn(user(12L, UserRole.STUDENT));

		userProfileService.updateMyProfile(new UpdateOwnProfileCommand(null, "0987654321", ""));

		Map<String, Object> expectedUpdates = new LinkedHashMap<>();
		expectedUpdates.put("phone", "0987654321");
		expectedUpdates.put("avatar_url", null);
		verify(userRepository).updateBase(12L, expectedUpdates);
	}

	@Test
	void returnsTheAuthenticatedUserProfile() {
		User currentUser = user(12L, UserRole.STUDENT);
		when(currentUserProvider.requireActiveUser()).thenReturn(currentUser);

		assertThat(userProfileService.getMyProfile()).isSameAs(currentUser);
	}

	@Test
	void rejectsANullOwnProfileRequest() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(12L, UserRole.STUDENT));

		assertThatThrownBy(() -> userProfileService.updateMyProfile(null))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không có dữ liệu để cập nhật.");
		verify(userRepository, never()).updateBase(any(Long.class), any(Map.class));
	}

	@Test
	void rejectsOwnProfileUpdateWithoutAField() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(12L, UserRole.STUDENT));

		assertThatThrownBy(() -> userProfileService.updateMyProfile(
				new UpdateOwnProfileCommand(null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không có dữ liệu để cập nhật.");
		verify(userRepository, never()).updateBase(any(Long.class), any(Map.class));
	}

	@Test
	void changesPasswordAfterVerifyingTheCurrentPassword() {
		User currentUser = userWithPassword("Current05Password");
		when(currentUserProvider.requireActiveUser()).thenReturn(currentUser);

		userProfileService.changePassword(new ChangePasswordCommand("Current05Password", "Newpass05"));

		verify(userRepository).updateBase(any(Long.class), any(Map.class));
	}

	@Test
	void storesAnEncodedNewPassword() {
		User currentUser = userWithPassword("Current05Password");
		when(currentUserProvider.requireActiveUser()).thenReturn(currentUser);

		userProfileService.changePassword(new ChangePasswordCommand("Current05Password", "Newpass05"));

		verify(userRepository).updateBase(eq(12L),
				org.mockito.ArgumentMatchers.argThat(updates -> {
					Object encodedPassword = updates.get("password_hash");
					return encodedPassword instanceof String
							&& passwordEncoder.matches("Newpass05", (String) encodedPassword);
				}));
	}

	@Test
	void rejectsAnIncorrectCurrentPassword() {
		when(currentUserProvider.requireActiveUser()).thenReturn(userWithPassword("Current05Password"));

		assertThatThrownBy(() -> userProfileService.changePassword(
				new ChangePasswordCommand("Wrong05Password", "Newpass05")))
				.isInstanceOf(ApiException.class)
				.hasMessage("Mật khẩu hiện tại không chính xác.");
	}

	@Test
	void rejectsANewPasswordThatDoesNotMeetThePolicy() {
		when(currentUserProvider.requireActiveUser()).thenReturn(userWithPassword("Current05Password"));

		assertThatThrownBy(() -> userProfileService.changePassword(
				new ChangePasswordCommand("Current05Password", "weakpass")))
				.isInstanceOf(ApiException.class)
				.hasMessage("Mật khẩu mới phải từ 8 ký tự, có chữ hoa và chữ số.");
		verify(userRepository, never()).updateBase(any(Long.class), any(Map.class));
	}

	@Test
	void rejectsMissingPasswordFields() {
		when(currentUserProvider.requireActiveUser()).thenReturn(userWithPassword("Current05Password"));

		assertThatThrownBy(() -> userProfileService.changePassword(
				new ChangePasswordCommand("", "Newpass05")))
				.isInstanceOf(ApiException.class)
				.hasMessage("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.");
		verify(userRepository, never()).updateBase(any(Long.class), any(Map.class));
	}

	private User user(long id, UserRole role) {
		return new User(id, "User", "user" + id + "@example.com", null, null,
				passwordEncoder.encode("Current05Password"), role, UserStatus.ACTIVE, false,
				null, role == UserRole.STUDENT ? "HV" + id : null, null, null);
	}

	private User userWithPassword(String password) {
		User baseUser = user(12L, UserRole.STUDENT);
		return new User(baseUser.id(), baseUser.fullName(), baseUser.email(), baseUser.phone(),
				baseUser.avatarUrl(), passwordEncoder.encode(password), baseUser.role(), baseUser.status(),
				baseUser.deleted(), baseUser.specialization(), baseUser.studentCode(), baseUser.dateOfBirth(),
				baseUser.parentPhone());
	}
}
