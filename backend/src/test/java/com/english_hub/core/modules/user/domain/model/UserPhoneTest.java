package com.english_hub.core.modules.user.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.http.HttpStatus;

class UserPhoneTest {

	@ParameterizedTest
	@MethodSource("acceptedPhones")
	void normalizesAndAssignsAcceptedPhones(String input, String expected) {
		User user = user();

		user.updatePhone(input);

		assertThat(user.phone()).isEqualTo(expected);
	}

	@ParameterizedTest
	@MethodSource("overlongPhones")
	void rejectsOverlongPhonesBeforeChangingTheOldValue(String input) {
		User user = user();
		String previous = user.phone();

		assertThatThrownBy(() -> user.updatePhone(input))
				.isInstanceOfSatisfying(ApiException.class, exception ->
						assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
				.hasMessage("Số điện thoại không được vượt quá 20 ký tự.");
		assertThat(user.phone()).isEqualTo(previous);
	}

	@ParameterizedTest
	@MethodSource("invalidFormatPhones")
	void rejectsInvalidFormatPhonesBeforeChangingTheOldValue(String input) {
		User user = user();
		String previous = user.phone();

		assertThatThrownBy(() -> user.updatePhone(input))
				.isInstanceOfSatisfying(ApiException.class, exception ->
						assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
				.hasMessage("Số điện thoại không đúng định dạng.");
		assertThat(user.phone()).isEqualTo(previous);
	}

	private static Stream<Arguments> acceptedPhones() {
		return Stream.of(
				Arguments.of(null, null),
				Arguments.of("", null),
				Arguments.of(" \t\r\n ", null),
				Arguments.of("0900000000", "0900000000"),
				Arguments.of(" 0900000000 ", "0900000000"),
				Arguments.of("+84900000000", "+84900000000"),
				Arguments.of("1".repeat(9), "1".repeat(9)),
				Arguments.of("1".repeat(15), "1".repeat(15)),
				Arguments.of("+" + "1".repeat(14), "+" + "1".repeat(14)));
	}

	private static Stream<String> overlongPhones() {
		return Stream.of("1".repeat(21), "1".repeat(1000), " " + "1".repeat(21) + " ");
	}

	private static Stream<String> invalidFormatPhones() {
		return Stream.of("abcxyz", "090abc123", "12345678", "1".repeat(16),
				"+84 90-12", "Đ".repeat(10), "😀".repeat(10));
	}

	private User user() {
		return new User(12L, "Nguyễn Văn An", "phone@example.test", "0900000000", null, null,
				UserRole.STUDENT, UserStatus.ACTIVE, false, null, null, null, null);
	}
}
