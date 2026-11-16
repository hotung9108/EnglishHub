package com.english_hub.core.modules.user.infrastructure.security;

import com.english_hub.core.modules.user.application.command.ChangePasswordCommand;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.application.service.UserProfileService;
import com.english_hub.core.modules.user.domain.model.User;
import com.english_hub.core.modules.user.domain.repository.UserRepository;
import java.security.SecureRandom;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SecureRandomPasswordGeneratorTest {

	private static final String UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
	private static final String LOWERCASE = "abcdefghjkmnpqrstuvwxyz";
	private static final String DIGITS = "23456789";
	private static final String ALPHABET = UPPERCASE + LOWERCASE + DIGITS;

	@Test
	void defaultConstructorGeneratesSixteenAllowedCharactersWithEveryRequiredGroup() {
		String password = new SecureRandomPasswordGenerator().generate();

		assertValidPassword(password);
		boolean hasExcludedCharacter = password.chars().anyMatch(character ->
				"IOilo01".indexOf(character) >= 0 || Character.isWhitespace(character)
						|| !Character.isLetterOrDigit(character));
		assertThat(hasExcludedCharacter).isFalse();
	}

	@Test
	void tenThousandGeneratedPasswordsMeetThePolicyAndAreDistinctWithinTheSample() {
		SecureRandomPasswordGenerator generator = new SecureRandomPasswordGenerator(new SecureRandom());
		Set<String> passwords = new HashSet<>();

		for (int sample = 0; sample < 10_000; sample++) {
			String password = generator.generate();
			assertValidPassword(password);
			assertThat(passwords.add(password)).as("Distinct password sample").isTrue();
		}
	}

	@Test
	void canChooseTheFirstCharacterOfEveryAlphabetWithoutChangingShufflePositions() {
		SecureRandom random = mock(SecureRandom.class);
		AtomicInteger calls = new AtomicInteger();
		when(random.nextInt(anyInt())).thenAnswer(invocation -> {
			int bound = invocation.getArgument(0);
			return calls.getAndIncrement() < 16 ? 0 : bound - 1;
		});

		String password = new SecureRandomPasswordGenerator(random).generate();

		assertThat(password.equals("Aa2" + "A".repeat(13))).isTrue();
		assertThat(calls.get()).isEqualTo(31);
		assertValidPassword(password);
	}

	@Test
	void canChooseTheLastCharacterOfEveryAlphabetWithoutChangingShufflePositions() {
		SecureRandom random = mock(SecureRandom.class);
		when(random.nextInt(anyInt())).thenAnswer(invocation -> (int) invocation.getArgument(0) - 1);

		String password = new SecureRandomPasswordGenerator(random).generate();

		assertThat(password.equals("Zz9" + "9".repeat(13))).isTrue();
		assertValidPassword(password);
	}

	@Test
	void fisherYatesCanSwapWithTheFirstPositionAndPreservesTheRequiredGroups() {
		SecureRandom random = mock(SecureRandom.class);
		when(random.nextInt(anyInt())).thenReturn(0);

		String password = new SecureRandomPasswordGenerator(random).generate();

		assertThat(password.equals("a2" + "A".repeat(14))).isTrue();
		assertValidPassword(password);
	}

	@Test
	void generatedPasswordIsAcceptedByTheExistingUserProfilePasswordPolicy() {
		User user = mock(User.class);
		UserRepository users = mock(UserRepository.class);
		CurrentUserProvider currentUser = mock(CurrentUserProvider.class);
		PasswordEncoder encoder = new BCryptPasswordEncoder(4);
		SecureRandomPasswordGenerator generator = new SecureRandomPasswordGenerator();
		String currentPassword = generator.generate();
		String newPassword = generator.generate();
		when(currentUser.requireActiveUser()).thenReturn(user);
		when(user.passwordHash()).thenReturn(encoder.encode(currentPassword));
		UserProfileService profiles = new UserProfileService(users, currentUser, encoder);

		profiles.changePassword(new ChangePasswordCommand(currentPassword, newPassword));

		ArgumentCaptor<String> hash = ArgumentCaptor.forClass(String.class);
		verify(user).changePassword(hash.capture());
		verify(users).save(user);
		assertThat(encoder.matches(newPassword, hash.getValue())).isTrue();
	}

	private static void assertValidPassword(String password) {
		assertThat(password.length() == 16).as("Password length").isTrue();
		assertThat(password.chars().allMatch(character -> ALPHABET.indexOf(character) >= 0))
				.as("Password alphabet").isTrue();
		assertThat(password.chars().anyMatch(character -> UPPERCASE.indexOf(character) >= 0))
				.as("Uppercase character").isTrue();
		assertThat(password.chars().anyMatch(character -> LOWERCASE.indexOf(character) >= 0))
				.as("Lowercase character").isTrue();
		assertThat(password.chars().anyMatch(character -> DIGITS.indexOf(character) >= 0))
				.as("Digit character").isTrue();
		assertThat(password.matches("^(?=.*[A-Z])(?=.*\\d).{8,}$"))
				.as("User profile password policy").isTrue();
	}
}
