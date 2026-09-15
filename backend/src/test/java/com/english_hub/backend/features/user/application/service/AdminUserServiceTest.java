package com.english_hub.backend.features.user.application.service;

import com.english_hub.backend.common.ApiException;
import com.english_hub.backend.features.user.application.command.CreateUserCommand;
import com.english_hub.backend.features.user.application.command.UpdateUserCommand;
import com.english_hub.backend.features.user.application.command.UpdateUserStatusCommand;
import com.english_hub.backend.features.user.application.port.CurrentUserProvider;
import com.english_hub.backend.features.user.domain.model.User;
import com.english_hub.backend.features.user.domain.model.UserPage;
import com.english_hub.backend.features.user.domain.model.UserRole;
import com.english_hub.backend.features.user.domain.model.UserStatus;
import com.english_hub.backend.features.user.domain.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
	void adminCanCreateAStudentAccountAndItsProfile() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.existsByEmail("student@example.com")).thenReturn(false);
		when(userRepository.create(eq("New Student"), eq("student@example.com"), any(String.class), eq(UserRole.STUDENT)))
				.thenReturn(41L);

		AdminUserService.CreatedUserData created = adminUserService.createUser(new CreateUserCommand(
				"New Student", "student@example.com", "Student05", "STUDENT", null,
				"HV0012", LocalDate.of(2005, 3, 10), "0912345678"));

		assertThat(created.id()).isEqualTo(41L);
		assertThat(created.role()).isEqualTo("STUDENT");
		verify(userRepository).createStudentProfile(41L, "HV0012", LocalDate.of(2005, 3, 10), "0912345678");
	}

	@Test
	void adminCanListUsersWithRoleAndPaginationFilters() {
		UserPage expectedPage = new UserPage(List.of(user(41L, UserRole.TEACHER)), 2, 10, 1);
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findPage("teacher", UserRole.TEACHER, 2, 10)).thenReturn(expectedPage);

		UserPage actualPage = adminUserService.listUsers("teacher", " teacher ", 2, 10);

		assertThat(actualPage).isEqualTo(expectedPage);
		verify(userRepository).findPage("teacher", UserRole.TEACHER, 2, 10);
	}

	@Test
	void listsAllRolesWhenRoleFilterIsBlank() {
		UserPage expectedPage = new UserPage(List.of(), 1, 20, 0);
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findPage("", null, 1, 20)).thenReturn(expectedPage);

		assertThat(adminUserService.listUsers("", "   ", 1, 20)).isEqualTo(expectedPage);
		verify(userRepository).findPage("", null, 1, 20);
	}

	@Test
	void rejectsInvalidPaginationBeforeQueryingUsers() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));

		assertThatThrownBy(() -> adminUserService.listUsers("", "", 0, 20))
				.isInstanceOf(ApiException.class)
				.hasMessage("Dữ liệu phân trang không hợp lệ.");
		verify(userRepository, never()).findPage(any(String.class), any(), any(Integer.class), any(Integer.class));
	}

	@Test
	void rejectsUnknownRoleFilter() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));

		assertThatThrownBy(() -> adminUserService.listUsers("", "PARENT", 1, 20))
				.isInstanceOf(ApiException.class)
				.hasMessage("role không hợp lệ.");
		verify(userRepository, never()).findPage(any(String.class), any(), any(Integer.class), any(Integer.class));
	}

	@Test
	void adminCanCreateATeacherAccountWithNormalizedValues() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.existsByEmail("teacher@example.com")).thenReturn(false);
		when(userRepository.create(
				eq("New Teacher"),
				eq("teacher@example.com"),
				any(String.class),
				eq(UserRole.TEACHER))).thenReturn(42L);

		AdminUserService.CreatedUserData created = adminUserService.createUser(new CreateUserCommand(
				" New Teacher ", " Teacher@Example.COM ", "Teacher05", " teacher ", " IELTS Writing ",
				null, null, null));

		assertThat(created).isEqualTo(new AdminUserService.CreatedUserData(42L, "teacher@example.com", "TEACHER"));
		verify(userRepository).createTeacherProfile(42L, "IELTS Writing");
		verify(userRepository, never()).createStudentProfile(any(Long.class), any(), any(), any());
	}

	@Test
	void refusesToCreateAnAdminAccountThroughTheAdminUserApi() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));

		assertThatThrownBy(() -> adminUserService.createUser(new CreateUserCommand(
				"Other Admin", "admin2@example.com", "Admin005", "ADMIN", null, null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Vui lòng nhập đầy đủ và đúng định dạng thông tin.");
		verify(userRepository, never()).create(any(String.class), any(String.class), any(String.class), any(UserRole.class));
	}

	@Test
	void refusesInvalidEmailOrPasswordWhenCreatingAnAccount() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));

		assertThatThrownBy(() -> adminUserService.createUser(new CreateUserCommand(
				"Student", "not-an-email", "weakpass", "STUDENT", null, null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Vui lòng nhập đầy đủ và đúng định dạng thông tin.");
		verify(userRepository, never()).existsByEmail(any(String.class));
		verify(userRepository, never()).create(any(String.class), any(String.class), any(String.class), any(UserRole.class));
	}

	@Test
	void refusesDuplicateEmailBeforeCreatingAnAccount() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.existsByEmail("student@example.com")).thenReturn(true);

		assertThatThrownBy(() -> adminUserService.createUser(new CreateUserCommand(
				"Student", "student@example.com", "Student05", "STUDENT", null, null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Email đã được sử dụng.");
		verify(userRepository, never()).create(any(String.class), any(String.class), any(String.class), any(UserRole.class));
	}

	@Test
	void convertsAConcurrentDuplicateEmailIntoAConflict() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.existsByEmail("student@example.com")).thenReturn(false, true);
		when(userRepository.create(
				eq("Student"), eq("student@example.com"), any(String.class), eq(UserRole.STUDENT)))
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

		verify(userRepository).updateBase(41L, Map.of("full_name", "Updated Teacher", "phone", "0900000000"));
		verify(userRepository).updateTeacherProfile(41L, "IELTS Writing");
	}

	@Test
	void updatesStudentBaseAndProfileFieldsForAnAdmin() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.of(user(41L, UserRole.STUDENT)));

		adminUserService.updateUser(41L, new UpdateUserCommand(
				" Updated Student ", "", null, " HV0041 ", LocalDate.of(2004, 4, 1), " 0912345678 "));

		Map<String, Object> expectedBaseUpdates = new LinkedHashMap<>();
		expectedBaseUpdates.put("full_name", "Updated Student");
		expectedBaseUpdates.put("phone", null);
		verify(userRepository).updateBase(41L, expectedBaseUpdates);
		Map<String, Object> expectedProfileUpdates = new LinkedHashMap<>();
		expectedProfileUpdates.put("student_code", "HV0041");
		expectedProfileUpdates.put("date_of_birth", LocalDate.of(2004, 4, 1));
		expectedProfileUpdates.put("parent_phone", "0912345678");
		verify(userRepository).updateStudentProfile(41L, expectedProfileUpdates);
	}

	@Test
	void rejectsAnAdminUpdateWithoutAnyField() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.of(user(41L, UserRole.STUDENT)));

		assertThatThrownBy(() -> adminUserService.updateUser(41L,
				new UpdateUserCommand(null, null, null, null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không có dữ liệu để cập nhật.");
		verify(userRepository, never()).updateBase(any(Long.class), any(Map.class));
		verify(userRepository, never()).updateStudentProfile(any(Long.class), any(Map.class));
	}

	@Test
	void rejectsAnUpdateForAMissingUser() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(404L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> adminUserService.updateUser(404L,
				new UpdateUserCommand("User", null, null, null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy người dùng.");
		verify(userRepository, never()).updateBase(any(Long.class), any(Map.class));
	}

	@Test
	void locksAnAccountAndRevokesItsRefreshTokens() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.of(user(41L, UserRole.STUDENT)));
		when(userRepository.updateStatus(41L, UserStatus.LOCKED)).thenReturn(1);

		UserStatus status = adminUserService.updateStatus(41L, new UpdateUserStatusCommand("LOCKED"));

		assertThat(status).isEqualTo(UserStatus.LOCKED);
		verify(userRepository).revokeActiveRefreshTokens(41L);
	}

	@Test
	void unlocksAnAccountWithoutRevokingRefreshTokens() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.of(user(41L, UserRole.STUDENT)));
		when(userRepository.updateStatus(41L, UserStatus.ACTIVE)).thenReturn(1);

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
		when(userRepository.markDeleted(41L)).thenReturn(1);

		adminUserService.deleteUser(41L);

		verify(userRepository).markDeleted(41L);
	}

	@Test
	void rejectsSoftDeleteWhenTheUserDisappearedBeforeTheUpdate() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.of(user(41L, UserRole.STUDENT)));
		when(userRepository.markDeleted(41L)).thenReturn(0);

		assertThatThrownBy(() -> adminUserService.deleteUser(41L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy người dùng.");
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
}
