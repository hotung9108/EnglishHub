package com.english_hub.core.features.user.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.features.user.application.command.CreateUserCommand;
import com.english_hub.core.features.user.application.command.UpdateUserCommand;
import com.english_hub.core.features.user.application.command.UpdateUserStatusCommand;
import com.english_hub.core.features.user.application.page.UserPageRequest;
import com.english_hub.core.features.user.application.port.CurrentUserProvider;
import com.english_hub.core.features.user.domain.model.User;
import com.english_hub.core.features.user.domain.model.UserPage;
import com.english_hub.core.features.user.domain.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

	@Mock
	private UserRepository userRepository;

	@Mock
	private CurrentUserProvider currentUserProvider;

	private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
	private AdminUserService adminUserService;

	@BeforeEach
	void setUp() {
		adminUserService = new AdminUserService(userRepository, currentUserProvider, passwordEncoder);
	}

	@Test
	void adminCanCreateAStudentAccountAndItsProfileData() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.existsByEmail("student@example.com")).thenReturn(false);
		when(userRepository.save(any(User.class))).thenAnswer(invocation -> withId(invocation.getArgument(0), 41L));

		AdminUserService.CreatedUserData created = adminUserService.createUser(new CreateUserCommand(
				"New Student", "student@example.com", "Student05", "STUDENT", null,
				"HV0012", LocalDate.of(2005, 3, 10), "0912345678"));

		assertThat(created).isEqualTo(new AdminUserService.CreatedUserData(41L, "student@example.com", "STUDENT"));
		ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
		verify(userRepository).save(captor.capture());
		assertThat(captor.getValue().role()).isEqualTo(UserRole.STUDENT);
		assertThat(captor.getValue().studentCode()).isEqualTo("HV0012");
		assertThat(captor.getValue().dateOfBirth()).isEqualTo(LocalDate.of(2005, 3, 10));
		assertThat(captor.getValue().parentPhone()).isEqualTo("0912345678");
	}

	@Test
	void adminCanListUsersWithRoleAndPaginationFilters() {
		UserPage expectedPage = new UserPage(List.of(user(41L, UserRole.TEACHER)), 2, 10, 1);
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findPage(eq("teacher"), eq(UserRole.TEACHER), any(UserPageRequest.class)))
				.thenReturn(expectedPage);

		UserPage actualPage = adminUserService.listUsers("teacher", " teacher ", 2, 10);

		assertThat(actualPage.users()).hasSize(1);
		ArgumentCaptor<UserPageRequest> captor = ArgumentCaptor.forClass(UserPageRequest.class);
		verify(userRepository).findPage(eq("teacher"), eq(UserRole.TEACHER), captor.capture());
		assertThat(captor.getValue().page()).isEqualTo(2);
		assertThat(captor.getValue().limit()).isEqualTo(10);
	}

	@Test
	void listsAllRolesWhenRoleFilterIsBlank() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findPage(eq(""), eq(null), any(UserPageRequest.class)))
				.thenReturn(new UserPage(List.of(), 1, 20, 0));

		assertThat(adminUserService.listUsers("", "   ", 1, 20).total()).isZero();
		verify(userRepository).findPage(eq(""), eq(null), any(UserPageRequest.class));
	}

	@Test
	void rejectsInvalidPaginationBeforeQueryingUsers() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));

		assertThatThrownBy(() -> adminUserService.listUsers("", "", 0, 20))
				.isInstanceOf(ApiException.class)
				.hasMessage("Dữ liệu phân trang không hợp lệ.");
		verify(userRepository, never()).findPage(any(), any(), any(UserPageRequest.class));
	}

	@Test
	void rejectsUnknownRoleFilter() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));

		assertThatThrownBy(() -> adminUserService.listUsers("", "PARENT", 1, 20))
				.isInstanceOf(ApiException.class)
				.hasMessage("role không hợp lệ.");
		verify(userRepository, never()).findPage(any(), any(), any(UserPageRequest.class));
	}

	@Test
	void adminCanCreateATeacherAccountWithNormalizedValues() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.existsByEmail("teacher@example.com")).thenReturn(false);
		when(userRepository.save(any(User.class))).thenAnswer(invocation -> withId(invocation.getArgument(0), 42L));

		AdminUserService.CreatedUserData created = adminUserService.createUser(new CreateUserCommand(
				" New Teacher ", " Teacher@Example.COM ", "Teacher05", " teacher ", " IELTS Writing ",
				null, null, null));

		assertThat(created).isEqualTo(new AdminUserService.CreatedUserData(42L, "teacher@example.com", "TEACHER"));
		ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
		verify(userRepository).save(captor.capture());
		assertThat(captor.getValue().specialization()).isEqualTo("IELTS Writing");
		assertThat(captor.getValue().studentCode()).isNull();
	}

	@Test
	void refusesToCreateAnAdminAccountThroughTheAdminUserApi() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));

		assertThatThrownBy(() -> adminUserService.createUser(new CreateUserCommand(
				"Other Admin", "admin2@example.com", "Admin005", "ADMIN", null, null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Vui lòng nhập đầy đủ và đúng định dạng thông tin.");
		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void refusesInvalidEmailOrPasswordWhenCreatingAnAccount() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));

		assertThatThrownBy(() -> adminUserService.createUser(new CreateUserCommand(
				"Student", "not-an-email", "weakpass", "STUDENT", null, null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Vui lòng nhập đầy đủ và đúng định dạng thông tin.");
		verify(userRepository, never()).existsByEmail(any());
		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void refusesDuplicateEmailBeforeCreatingAnAccount() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.existsByEmail("student@example.com")).thenReturn(true);

		assertThatThrownBy(() -> adminUserService.createUser(new CreateUserCommand(
				"Student", "student@example.com", "Student05", "STUDENT", null, null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Email đã được sử dụng.");
		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void convertsAConcurrentDuplicateEmailIntoAConflict() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.existsByEmail("student@example.com")).thenReturn(false, true);
		when(userRepository.save(any(User.class)))
				.thenThrow(new DataIntegrityViolationException("unique constraint violation"));

		assertThatThrownBy(() -> adminUserService.createUser(new CreateUserCommand(
				"Student", "student@example.com", "Student05", "STUDENT", null, null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Email đã được sử dụng.");
	}

	@Test
	void updatesTeacherProfileFieldsForAnAdmin() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.of(user(41L, UserRole.TEACHER)));

		adminUserService.updateUser(41L,
				new UpdateUserCommand("Updated Teacher", "0900000000", "IELTS Writing", null, null, null));

		ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
		verify(userRepository).save(captor.capture());
		assertThat(captor.getValue().fullName()).isEqualTo("Updated Teacher");
		assertThat(captor.getValue().phone()).isEqualTo("0900000000");
		assertThat(captor.getValue().specialization()).isEqualTo("IELTS Writing");
	}

	@Test
	void updatesStudentBaseAndProfileFieldsForAnAdmin() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.of(user(41L, UserRole.STUDENT)));

		adminUserService.updateUser(41L, new UpdateUserCommand(
				" Updated Student ", "", null, " HV0041 ", LocalDate.of(2004, 4, 1), " 0912345678 "));

		ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
		verify(userRepository).save(captor.capture());
		assertThat(captor.getValue().fullName()).isEqualTo("Updated Student");
		assertThat(captor.getValue().phone()).isNull();
		assertThat(captor.getValue().studentCode()).isEqualTo("HV0041");
		assertThat(captor.getValue().parentPhone()).isEqualTo("0912345678");
	}

	@Test
	void rejectsAnAdminUpdateWithoutAnyField() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.of(user(41L, UserRole.STUDENT)));

		assertThatThrownBy(() -> adminUserService.updateUser(41L,
				new UpdateUserCommand(null, null, null, null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không có dữ liệu để cập nhật.");
		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void rejectsAnUpdateForAMissingUser() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(404L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> adminUserService.updateUser(404L,
				new UpdateUserCommand("User", null, null, null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy người dùng.");
		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void locksAnAccountAndRevokesItsRefreshTokens() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.of(user(41L, UserRole.STUDENT)));

		UserStatus status = adminUserService.updateStatus(41L, new UpdateUserStatusCommand("LOCKED"));

		assertThat(status).isEqualTo(UserStatus.LOCKED);
		verify(userRepository).save(any(User.class));
		verify(userRepository).revokeActiveRefreshTokens(41L);
	}

	@Test
	void unlocksAnAccountWithoutRevokingRefreshTokens() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.of(user(41L, UserRole.STUDENT)));

		assertThat(adminUserService.updateStatus(41L, new UpdateUserStatusCommand(" active ")))
				.isEqualTo(UserStatus.ACTIVE);
		verify(userRepository, never()).revokeActiveRefreshTokens(any(Long.class));
	}

	@Test
	void rejectsUnknownAccountStatus() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));

		assertThatThrownBy(() -> adminUserService.updateStatus(41L, new UpdateUserStatusCommand("DISABLED")))
				.isInstanceOf(ApiException.class)
				.hasMessage("status phải là ACTIVE hoặc LOCKED.");
		verify(userRepository, never()).findById(any(Long.class));
	}

	@Test
	void softDeletesAnExistingUser() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.of(user(41L, UserRole.STUDENT)));

		adminUserService.deleteUser(41L);

		verify(userRepository).deleteById(41L);
	}

	@Test
	void returnsForbiddenWhenTheAdminBoundaryRejectsTheCaller() {
		when(currentUserProvider.requireAdmin()).thenThrow(ApiException.forbidden("Bạn không có quyền thực hiện thao tác này."));

		assertThatThrownBy(() -> adminUserService.listUsers("", "", 1, 20))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
	}

	private User user(long id, UserRole role) {
		return new User(id, "User", "user" + id + "@example.com", null, null,
				passwordEncoder.encode("Current05Password"), role, UserStatus.ACTIVE, false,
				role == UserRole.TEACHER ? "IELTS" : null,
				role == UserRole.STUDENT ? "HV" + id : null, null, null);
	}

	private User withId(User source, long id) {
		return new User(id, source.fullName(), source.email(), source.phone(), source.avatarUrl(),
				source.passwordHash(), source.role(), source.status(), source.deleted(), source.specialization(),
				source.studentCode(), source.dateOfBirth(), source.parentPhone());
	}
}
