package com.english_hub.core.features.user.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.user.application.command.CreateUserCommand;
import com.english_hub.core.modules.user.application.command.UpdateUserCommand;
import com.english_hub.core.modules.user.application.command.UpdateUserStatusCommand;
import com.english_hub.core.modules.user.application.page.UserPageRequest;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.application.service.AdminUserService;
import com.english_hub.core.modules.user.domain.model.User;
import com.english_hub.core.modules.user.domain.model.UserPage;
import com.english_hub.core.modules.user.domain.repository.UserRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.springframework.context.ApplicationEventPublisher;
import com.english_hub.core.modules.user.domain.event.UserSoftDeletedEvent;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

	private static final String ADMIN_FULL_NAME = "Hoàng Thanh Ngân";
	private static final String ADMIN_EMAIL = "hoang.thanh.ngan@utc-polyglot.edu.vn";
	private static final long CREATED_ADMIN_ID = 43L;

	@Mock
	private UserRepository userRepository;

	@Mock
	private CurrentUserProvider currentUserProvider;

	@Mock
	private ApplicationEventPublisher eventPublisher;

	private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
	private AdminUserService adminUserService;

	@BeforeEach
	void setUp() {
		adminUserService = new AdminUserService(userRepository, currentUserProvider, passwordEncoder, eventPublisher);
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

	@ParameterizedTest
	@CsvSource({"0,20", "-1,20", "1,0", "1,-1", "1,101"})
	void rejectsInvalidPaginationBeforeQueryingUsers(int page, int limit) {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));

		assertThatThrownBy(() -> adminUserService.listUsers("", "", page, limit))
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

	@ParameterizedTest
	@ValueSource(strings = {"ADMIN", " admin "})
	void adminCanCreateAnAdminAccountWithNormalizedRole(String role) {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.existsByEmail(ADMIN_EMAIL)).thenReturn(false);
		when(userRepository.save(any(User.class)))
				.thenAnswer(invocation -> withId(invocation.getArgument(0), CREATED_ADMIN_ID));
		String password = newTestPassword();
		CreateUserCommand request = createCommand(ADMIN_FULL_NAME, ADMIN_EMAIL, password, role);

		AdminUserService.CreatedUserData created = adminUserService.createUser(request);

		assertThat(created.id()).isEqualTo(CREATED_ADMIN_ID);
		assertThat(created.email()).isEqualTo(ADMIN_EMAIL);
		assertThat(created.role()).isEqualTo(UserRole.ADMIN.name());
		ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
		verify(userRepository, times(1)).save(captor.capture());
		User savedUser = captor.getValue();
		assertThat(savedUser.role()).isEqualTo(UserRole.ADMIN);
		assertThat(savedUser.status()).isEqualTo(UserStatus.ACTIVE);
		assertThat(savedUser.passwordHash()).isNotEqualTo(password);
		assertThat(passwordEncoder.matches(password, savedUser.passwordHash())).isTrue();
	}

	@Test
	void refusesDuplicateEmailWhenCreatingAnAdminAccount() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.existsByEmail(ADMIN_EMAIL)).thenReturn(true);
		CreateUserCommand request = createCommand(ADMIN_FULL_NAME, ADMIN_EMAIL, newTestPassword(), "ADMIN");

		assertThatThrownBy(() -> adminUserService.createUser(request))
				.isInstanceOfSatisfying(ApiException.class, exception -> {
					assertThat(exception.getStatus()).isEqualTo(HttpStatus.CONFLICT);
					assertThat(exception.getMessage()).isEqualTo("Email đã được sử dụng.");
				});
		verify(userRepository, never()).save(any(User.class));
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("invalidAdminRequests")
	void refusesInvalidDataWhenCreatingAnAdminAccount(String description, CreateUserCommand request) {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));

		assertThatThrownBy(() -> adminUserService.createUser(request))
				.isInstanceOfSatisfying(ApiException.class, exception ->
						assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void refusesUnknownRoleWhenCreatingAnAccount() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		CreateUserCommand request = createCommand(ADMIN_FULL_NAME, ADMIN_EMAIL, newTestPassword(), "PARENT");

		assertThatThrownBy(() -> adminUserService.createUser(request))
				.isInstanceOfSatisfying(ApiException.class, exception ->
						assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
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
	void rejectsCreateUserWithInvalidFullName() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.existsByEmail("student@example.com")).thenReturn(false);

		assertThatThrownBy(() -> adminUserService.createUser(new CreateUserCommand(
				"Student 123", "student@example.com", "Student05", "STUDENT", null,
				null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Họ và tên không được chứa chữ số.");

		assertThatThrownBy(() -> adminUserService.createUser(new CreateUserCommand(
				"Student<alert>", "student@example.com", "Student05", "STUDENT", null,
				null, null, null)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Họ và tên không được chứa ký tự đặc biệt.");
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
		User target = user(41L, UserRole.STUDENT);
		target.updatePhone("0900000000");
		when(userRepository.findById(41L)).thenReturn(Optional.of(target));

		adminUserService.updateUser(41L, new UpdateUserCommand(
				" Updated Student ", "", null, " HV0041 ", LocalDate.of(2004, 4, 1), " 0912345678 "));

		ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
		verify(userRepository).save(captor.capture());
		assertThat(captor.getValue().fullName()).isEqualTo("Updated Student");
		assertThat(captor.getValue().phone()).isNull();
		assertThat(captor.getValue().studentCode()).isEqualTo("HV0041");
		assertThat(captor.getValue().parentPhone()).isEqualTo("0912345678");
	}

	@ParameterizedTest
	@ValueSource(strings = {"123456789012345678901", " 123456789012345678901 "})
	void rejectsOverlongPhoneBeforeSavingBaseOrProfileChanges(String phone) {
		User target = user(41L, UserRole.TEACHER);
		target.updatePhone("0900000000");
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.of(target));

		assertThatThrownBy(() -> adminUserService.updateUser(41L,
				new UpdateUserCommand("Trần Thị Mai Lan", phone, "Changed specialization", null, null, null)))
				.isInstanceOfSatisfying(ApiException.class, exception ->
						assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
				.hasMessage("Số điện thoại không được vượt quá 20 ký tự.");
		verify(userRepository, never()).save(any(User.class));
		assertThat(target.phone()).isEqualTo("0900000000");
		assertThat(target.specialization()).isEqualTo("IELTS");
	}

	@ParameterizedTest
	@MethodSource("phoneUpdates")
	void savesNormalizedPhoneOrClearsAnExistingPhone(String phone, String expected) {
		User target = user(41L, UserRole.STUDENT);
		target.updatePhone("0900000000");
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.of(target));

		adminUserService.updateUser(41L, new UpdateUserCommand(null, phone, null, null, null, null));

		verify(userRepository).save(target);
		assertThat(target.phone()).isEqualTo(expected);
	}

	@Test
	void nullPhoneKeepsAnExistingPhoneWhileUpdatingAnotherField() {
		User target = user(41L, UserRole.STUDENT);
		target.updatePhone("0900000000");
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.of(target));

		adminUserService.updateUser(41L, new UpdateUserCommand("Trần Thị Mai Lan", null, null, null, null, null));

		verify(userRepository).save(target);
		assertThat(target.phone()).isEqualTo("0900000000");
		assertThat(target.fullName()).isEqualTo("Trần Thị Mai Lan");
	}

	private static Stream<Arguments> phoneUpdates() {
		String boundary = "1".repeat(20);
		return Stream.of(Arguments.of(boundary, boundary), Arguments.of(" " + boundary + " ", boundary),
				Arguments.of("", null), Arguments.of("   ", null));
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

		var order = inOrder(userRepository, eventPublisher);
		order.verify(userRepository).deleteById(41L);
		order.verify(eventPublisher).publishEvent(new UserSoftDeletedEvent(41L));
		verify(userRepository, never()).revokeActiveRefreshTokens(any(Long.class));
	}

	@Test
	void returnsForbiddenWhenTheAdminBoundaryRejectsTheCaller() {
		when(currentUserProvider.requireAdmin()).thenThrow(ApiException.forbidden("Bạn không có quyền thực hiện thao tác này."));

		assertThatThrownBy(() -> adminUserService.listUsers("", "", 1, 20))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void deleteDoesNotPublishWhenCallerIsForbidden() {
		when(currentUserProvider.requireAdmin()).thenThrow(ApiException.forbidden("Forbidden"));
		assertThatThrownBy(() -> adminUserService.deleteUser(41L))
				.isInstanceOfSatisfying(ApiException.class, exception ->
						assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
		verifyNoInteractions(userRepository, eventPublisher);
	}

	@Test
	void deleteDoesNotPublishWhenTargetIsMissing() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.empty());
		assertThatThrownBy(() -> adminUserService.deleteUser(41L))
				.isInstanceOfSatisfying(ApiException.class, exception ->
						assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
		verify(userRepository, never()).deleteById(any());
		verifyNoInteractions(eventPublisher);
	}

	@Test
	void deleteDoesNotPublishWhenPersistenceFails() {
		when(currentUserProvider.requireAdmin()).thenReturn(user(1L, UserRole.ADMIN));
		when(userRepository.findById(41L)).thenReturn(Optional.of(user(41L, UserRole.STUDENT)));
		IllegalStateException failure = new IllegalStateException("Deletion failed");
		doThrow(failure).when(userRepository).deleteById(41L);
		assertThatThrownBy(() -> adminUserService.deleteUser(41L)).isSameAs(failure);
		verifyNoInteractions(eventPublisher);
	}

	private static Stream<Arguments> invalidAdminRequests() {
		String password = newTestPassword();
		return Stream.of(
				Arguments.of("missing full name", createCommand(null, ADMIN_EMAIL, password, "ADMIN")),
				Arguments.of("missing email", createCommand(ADMIN_FULL_NAME, null, password, "ADMIN")),
				Arguments.of("missing password", createCommand(ADMIN_FULL_NAME, ADMIN_EMAIL, null, "ADMIN")),
				Arguments.of("missing role", createCommand(ADMIN_FULL_NAME, ADMIN_EMAIL, password, null)),
				Arguments.of("invalid email", createCommand(
						ADMIN_FULL_NAME, ADMIN_EMAIL.replace("@", "_"), password, "ADMIN")),
				Arguments.of("password too short", createCommand(
						ADMIN_FULL_NAME, ADMIN_EMAIL, password.substring(0, 5), "ADMIN")),
				Arguments.of("password without uppercase", createCommand(
						ADMIN_FULL_NAME, ADMIN_EMAIL, password.toLowerCase(java.util.Locale.ROOT), "ADMIN")),
				Arguments.of("password without digit", createCommand(
						ADMIN_FULL_NAME, ADMIN_EMAIL, password.replaceAll("\\d", ""), "ADMIN")),
				Arguments.of("full name with digit", createCommand(
						ADMIN_FULL_NAME + " 1", ADMIN_EMAIL, password, "ADMIN")),
				Arguments.of("full name with invalid character", createCommand(
						ADMIN_FULL_NAME + "@", ADMIN_EMAIL, password, "ADMIN")));
	}

	private static CreateUserCommand createCommand(String fullName, String email, String password, String role) {
		return new CreateUserCommand(fullName, email, password, role, null, null, null, null);
	}

	private static String newTestPassword() {
		return "Test1!" + UUID.randomUUID();
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
