package com.english_hub.core.modules.user.domain.model;

import com.english_hub.core.common.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FullNameValidatorTest {

	@ParameterizedTest
	@ValueSource(strings = {
			"Nguyễn Văn A",
			"Trần Thị Mai Lan",
			"Đoàn Thái Sơn",
			"Võ Ê Vo",
			"Lê Thị Mỹ Duyên",
			"Ngô Bảo Châu",
			"Phan Đình Phùng",
			"John Doe",
			"Jean-Luc Picard",
			"Shaquille O'Neal",
			"d'Artagnan",
			"René Descartes",
			"Marie-Curie",
			"Mary Jane Watson"
	})
	void acceptsValidVietnameseAndInternationalNames(String validName) {
		String normalized = FullNameValidator.validateAndNormalize(validName);
		assertThat(normalized).isEqualTo(validName);
		assertThat(FullNameValidator.isValid(validName)).isTrue();
	}

	@Test
	void trimsAndCollapsesConsecutiveSpaces() {
		String input = "   Nguyễn   Văn    A   ";
		String normalized = FullNameValidator.validateAndNormalize(input);
		assertThat(normalized).isEqualTo("Nguyễn Văn A");
	}

	@Test
	void rejectsNullOrEmptyName() {
		assertThatThrownBy(() -> FullNameValidator.validateAndNormalize(null))
				.isInstanceOf(ApiException.class)
				.hasMessage("Họ và tên không được để trống.");

		assertThatThrownBy(() -> FullNameValidator.validateAndNormalize("   "))
				.isInstanceOf(ApiException.class)
				.hasMessage("Họ và tên không được để trống.");

		assertThat(FullNameValidator.isValid(null)).isFalse();
		assertThat(FullNameValidator.isValid("")).isFalse();
		assertThat(FullNameValidator.isValid("   ")).isFalse();
	}

	@Test
	void rejectsNameThatIsTooShort() {
		assertThatThrownBy(() -> FullNameValidator.validateAndNormalize("A"))
				.isInstanceOf(ApiException.class)
				.hasMessage("Họ và tên phải có ít nhất 2 ký tự.");

		assertThat(FullNameValidator.isValid("A")).isFalse();
	}

	@Test
	void rejectsNameThatIsTooLong() {
		String tooLong = "A".repeat(FullNameValidator.MAX_LENGTH + 1);
		assertThatThrownBy(() -> FullNameValidator.validateAndNormalize(tooLong))
				.isInstanceOf(ApiException.class)
				.hasMessage("Họ và tên không được vượt quá 50 ký tự.");

		assertThat(FullNameValidator.isValid(tooLong)).isFalse();
	}

	@ParameterizedTest
	@ValueSource(strings = {
			"Nguyen Van 123",
			"Student 01",
			"Lan 2",
			"99 Nguyen"
	})
	void rejectsNamesContainingDigits(String nameWithDigits) {
		assertThatThrownBy(() -> FullNameValidator.validateAndNormalize(nameWithDigits))
				.isInstanceOf(ApiException.class)
				.hasMessage("Họ và tên không được chứa chữ số.");

		assertThat(FullNameValidator.isValid(nameWithDigits)).isFalse();
	}

	@ParameterizedTest
	@ValueSource(strings = {
			"Nguyen <script>",
			"Tran & Lan",
			"User@EnglishHub",
			"Nguyen $ Son",
			"Mai #Tag",
			"John (Admin)",
			"Nguyen_Van_A",
			"Tran.Van.B",
			"Pham+Hung",
			"Hoang*Minh",
			"Doan%Thanh",
			"Vo!Thao"
	})
	void rejectsNamesWithSpecialCharactersOrHtml(String nameWithSpecialChars) {
		assertThatThrownBy(() -> FullNameValidator.validateAndNormalize(nameWithSpecialChars))
				.isInstanceOf(ApiException.class)
				.hasMessage("Họ và tên không được chứa ký tự đặc biệt.");

		assertThat(FullNameValidator.isValid(nameWithSpecialChars)).isFalse();
	}

	@ParameterizedTest
	@ValueSource(strings = {
			"-Nguyen Van A",
			"Nguyen Van A-",
			"'Nguyen Van A",
			"Nguyen Van A'",
			"Nguyen--Van A",
			"Nguyen''Van A"
	})
	void rejectsMalformedSeparatorPlacement(String malformedName) {
		assertThatThrownBy(() -> FullNameValidator.validateAndNormalize(malformedName))
				.isInstanceOf(ApiException.class)
				.hasMessage("Họ và tên không đúng định dạng.");

		assertThat(FullNameValidator.isValid(malformedName)).isFalse();
	}
}
