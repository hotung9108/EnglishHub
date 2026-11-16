package com.english_hub.core.modules.user.infrastructure.security;

import com.english_hub.core.modules.user.application.port.PasswordGenerator;
import java.security.SecureRandom;
import org.springframework.stereotype.Component;

@Component
public class SecureRandomPasswordGenerator implements PasswordGenerator {

	private static final int PASSWORD_LENGTH = 16;
	private static final String UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
	private static final String LOWERCASE = "abcdefghjkmnpqrstuvwxyz";
	private static final String DIGITS = "23456789";
	private static final String ALPHABET = UPPERCASE + LOWERCASE + DIGITS;

	private final SecureRandom random;

	public SecureRandomPasswordGenerator() {
		this(new SecureRandom());
	}

	public SecureRandomPasswordGenerator(SecureRandom random) {
		this.random = random;
	}

	@Override
	public String generate() {
		char[] password = new char[PASSWORD_LENGTH];
		password[0] = choose(UPPERCASE);
		password[1] = choose(LOWERCASE);
		password[2] = choose(DIGITS);
		for (int index = 3; index < password.length; index++) {
			password[index] = choose(ALPHABET);
		}
		for (int index = password.length - 1; index > 0; index--) {
			int swapIndex = random.nextInt(index + 1);
			char character = password[index];
			password[index] = password[swapIndex];
			password[swapIndex] = character;
		}
		return new String(password);
	}

	private char choose(String alphabet) {
		return alphabet.charAt(random.nextInt(alphabet.length()));
	}
}
