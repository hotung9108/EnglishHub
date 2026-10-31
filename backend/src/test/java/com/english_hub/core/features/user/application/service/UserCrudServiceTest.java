package com.english_hub.core.features.user.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.user.application.dto.UserDto;
import com.english_hub.core.modules.user.application.mapper.UserMapper;
import com.english_hub.core.modules.user.application.service.UserCrudService;
import com.english_hub.core.modules.user.domain.model.User;
import com.english_hub.core.modules.user.domain.repository.UserRepository;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserCrudServiceTest {

	@Mock
	private UserRepository repository;
	@Mock
	private PasswordEncoder encoder;

	private UserCrudService service;
	private User existing;

	@BeforeEach
	void setUp() {
		service = new UserCrudService(repository, new UserMapper(), encoder);
		existing = new User(12L, "Nguyễn Văn An", "crud@example.test", "0900000000",
				"https://example.test/old-avatar.png", null, UserRole.STUDENT, UserStatus.ACTIVE,
				false, null, null, null, null);
		when(repository.findById(12L)).thenReturn(Optional.of(existing));
	}

	@ParameterizedTest
	@ValueSource(strings = {"123456789012345678901", " 123456789012345678901 "})
	void rejectsOverlongPhoneBeforeSavingAnyProvidedChanges(String phone) {
		UserDto request = new UserDto();
		request.setFullName("Trần Thị Mai Lan");
		request.setPhone(phone);
		request.setAvatarUrl("https://example.test/new-avatar.png");

		assertThatThrownBy(() -> service.update(12L, request))
				.isInstanceOfSatisfying(ApiException.class, exception ->
						assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
				.hasMessage("Số điện thoại không được vượt quá 20 ký tự.");
		verify(repository, never()).save(any(User.class));
		assertThat(existing.phone()).isEqualTo("0900000000");
		assertThat(existing.avatarUrl()).isEqualTo("https://example.test/old-avatar.png");
	}

	@ParameterizedTest
	@MethodSource("phoneUpdates")
	void savesNormalizedPhoneOrClearsAnExistingPhone(String phone, String expected) {
		UserDto request = new UserDto();
		request.setPhone(phone);
		when(repository.save(any(User.class))).thenAnswer(call -> call.getArgument(0, User.class));

		UserDto response = service.update(12L, request);

		verify(repository).save(existing);
		assertThat(response.getPhone()).isEqualTo(expected);
		assertThat(existing.phone()).isEqualTo(expected);
	}

	@Test
	void nullPhoneKeepsAnExistingPhoneWhileUpdatingAnotherField() {
		UserDto request = new UserDto();
		request.setFullName("Trần Thị Mai Lan");
		request.setPhone(null);
		when(repository.save(any(User.class))).thenAnswer(call -> call.getArgument(0, User.class));

		UserDto response = service.update(12L, request);

		assertThat(response.getPhone()).isEqualTo("0900000000");
		assertThat(response.getFullName()).isEqualTo("Trần Thị Mai Lan");
		verify(repository).save(existing);
	}

	@Test
	void nullPhoneAloneDoesNotClearThePhoneOrSave() {
		UserDto request = new UserDto();
		request.setPhone(null);

		assertThatThrownBy(() -> service.update(12L, request))
				.isInstanceOfSatisfying(ApiException.class, exception ->
						assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
				.hasMessage("Không có dữ liệu để cập nhật.");
		verify(repository, never()).save(any(User.class));
		assertThat(existing.phone()).isEqualTo("0900000000");
	}

	private static Stream<Arguments> phoneUpdates() {
		String boundary = "1".repeat(20);
		return Stream.of(Arguments.of(boundary, boundary), Arguments.of(" " + boundary + " ", boundary),
				Arguments.of("", null), Arguments.of("   ", null));
	}
}
