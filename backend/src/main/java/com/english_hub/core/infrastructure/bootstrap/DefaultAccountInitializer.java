package com.english_hub.core.infrastructure.bootstrap;

import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;

@Component
@Order(100)
@ConditionalOnProperty(name = "app.seed.default-accounts.enabled", havingValue = "true", matchIfMissing = true)
public class DefaultAccountInitializer implements ApplicationRunner {

	private static final Logger LOGGER = LoggerFactory.getLogger(DefaultAccountInitializer.class);

	private final UserRepository userRepository;
	private final TeacherProfileRepository teacherProfileRepository;
	private final StudentProfileRepository studentProfileRepository;
	private final PasswordEncoder passwordEncoder;
	private final Environment environment;

	@Value("${app.seed.admin.email}")
	private String adminEmail;

	@Value("${app.seed.admin.password}")
	private String adminPassword;

	@Value("${app.seed.admin.name}")
	private String adminName;

	@Value("${app.seed.teacher.email}")
	private String teacherEmail;

	@Value("${app.seed.teacher.password}")
	private String teacherPassword;

	@Value("${app.seed.teacher.name}")
	private String teacherName;

	@Value("${app.seed.teacher.specialization:Tiếng Anh giao tiếp & Luyện thi}")
	private String teacherSpecialization;

	@Value("${app.seed.student.email}")
	private String studentEmail;

	@Value("${app.seed.student.password}")
	private String studentPassword;

	@Value("${app.seed.student.name}")
	private String studentName;

	@Value("${app.seed.student.code:SV999999}")
	private String studentCode;

	@Value("${app.seed.include-demo-accounts:}")
	private String includeDemoAccountsOverride;

	public DefaultAccountInitializer(
			UserRepository userRepository,
			TeacherProfileRepository teacherProfileRepository,
			StudentProfileRepository studentProfileRepository,
			PasswordEncoder passwordEncoder,
			Environment environment) {
		this.userRepository = userRepository;
		this.teacherProfileRepository = teacherProfileRepository;
		this.studentProfileRepository = studentProfileRepository;
		this.passwordEncoder = passwordEncoder;
		this.environment = environment;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		initializeAdmin();

		if (shouldIncludeDemoAccounts()) {
			initializeTeacher();
			initializeStudent();
		} else {
			LOGGER.info("[DefaultAccountInitializer] Demo accounts (teacher/student) are disabled in current environment.");
		}
	}

	private void initializeAdmin() {
		if (userRepository.existsByEmailIgnoreCase(adminEmail)) {
			LOGGER.info("[DefaultAccountInitializer] Admin account '{}' already exists. Skipping initialization.", adminEmail);
			return;
		}

		User admin = new User(
				adminName,
				adminEmail,
				null,
				passwordEncoder.encode(adminPassword),
				UserRole.ADMIN,
				UserStatus.ACTIVE,
				false);
		userRepository.saveAndFlush(admin);
		LOGGER.info("[DefaultAccountInitializer] Created default Admin account: {}", adminEmail);
	}

	private void initializeTeacher() {
		User teacherUser = userRepository.findByEmailIgnoreCase(teacherEmail)
				.orElseGet(() -> {
					User created = new User(
							teacherName,
							teacherEmail,
							null,
							passwordEncoder.encode(teacherPassword),
							UserRole.TEACHER,
							UserStatus.ACTIVE,
							false);
					User saved = userRepository.saveAndFlush(created);
					LOGGER.info("[DefaultAccountInitializer] Created default Teacher account: {}", teacherEmail);
					return saved;
				});

		if (!teacherProfileRepository.existsById(teacherUser.getId())) {
			TeacherProfile profile = new TeacherProfile(teacherUser, teacherSpecialization);
			teacherProfileRepository.saveAndFlush(profile);
			LOGGER.info("[DefaultAccountInitializer] Created TeacherProfile for user ID: {}", teacherUser.getId());
		}
	}

	private void initializeStudent() {
		User studentUser = userRepository.findByEmailIgnoreCase(studentEmail)
				.orElseGet(() -> {
					User created = new User(
							studentName,
							studentEmail,
							null,
							passwordEncoder.encode(studentPassword),
							UserRole.STUDENT,
							UserStatus.ACTIVE,
							false);
					User saved = userRepository.saveAndFlush(created);
					LOGGER.info("[DefaultAccountInitializer] Created default Student account: {}", studentEmail);
					return saved;
				});

		if (!studentProfileRepository.existsById(studentUser.getId())) {
			StudentProfile profile = new StudentProfile(studentUser, studentCode, null, null);
			studentProfileRepository.saveAndFlush(profile);
			LOGGER.info("[DefaultAccountInitializer] Created StudentProfile for user ID: {}", studentUser.getId());
		}
	}

	boolean shouldIncludeDemoAccounts() {
		if (includeDemoAccountsOverride != null && !includeDemoAccountsOverride.isBlank()) {
			return Boolean.parseBoolean(includeDemoAccountsOverride.trim());
		}

		Set<String> activeProfiles = Arrays.stream(environment.getActiveProfiles())
				.map(String::toLowerCase)
				.collect(Collectors.toSet());

		// In dev or staging profiles, always include demo accounts
		if (activeProfiles.contains("dev") || activeProfiles.contains("staging")) {
			return true;
		}

		// In pure prod profile, exclude demo accounts
		if (activeProfiles.contains("prod")) {
			return false;
		}

		// Default fallback (e.g. local without explicit profile) -> include
		return true;
	}
}
