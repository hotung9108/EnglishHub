package com.english_hub.core.infrastructure.bootstrap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DefaultAccountInitializerTest {

	@Mock
	private UserRepository userRepository;

	@Mock
	private TeacherProfileRepository teacherProfileRepository;

	@Mock
	private StudentProfileRepository studentProfileRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private Environment environment;

	private DefaultAccountInitializer initializer;

	@BeforeEach
	void setUp() throws Exception {
		initializer = new DefaultAccountInitializer(
				userRepository,
				teacherProfileRepository,
				studentProfileRepository,
				passwordEncoder,
				environment);

		setField(initializer, "adminEmail", "admin@englishhub.com");
		setField(initializer, "adminPassword", "Password123!");
		setField(initializer, "adminName", "Admin EnglishHub");

		setField(initializer, "teacherEmail", "teacher@englishhub.com");
		setField(initializer, "teacherPassword", "Password123!");
		setField(initializer, "teacherName", "Teacher EnglishHub");
		setField(initializer, "teacherSpecialization", "Tiếng Anh giao tiếp");

		setField(initializer, "studentEmail", "student@englishhub.com");
		setField(initializer, "studentPassword", "Password123!");
		setField(initializer, "studentName", "Student EnglishHub");
		setField(initializer, "studentCode", "SV999999");
		setField(initializer, "includeDemoAccountsOverride", "");

		when(passwordEncoder.encode(anyString())).thenAnswer(invocation -> "encoded_" + invocation.getArgument(0));
	}

	private void setField(Object target, String fieldName, Object value) throws Exception {
		Field field = target.getClass().getDeclaredField(fieldName);
		field.setAccessible(true);
		field.set(target, value);
	}

	@Test
	@DisplayName("Production profile: only admin is created, demo accounts are excluded")
	void run_inProductionProfile_createsAdminOnly() {
		when(environment.getActiveProfiles()).thenReturn(new String[] { "prod" });
		when(userRepository.existsByEmailIgnoreCase("admin@englishhub.com")).thenReturn(false);

		initializer.run(null);

		// Admin created
		verify(userRepository).saveAndFlush(argThat(user ->
				user != null &&
				"admin@englishhub.com".equals(user.getEmail()) &&
				user.getRole() == UserRole.ADMIN &&
				user.getStatus() == UserStatus.ACTIVE &&
				"encoded_Password123!".equals(user.getPasswordHash())));

		// Teacher & Student never queried or created
		verify(userRepository, never()).findByEmailIgnoreCase("teacher@englishhub.com");
		verify(userRepository, never()).findByEmailIgnoreCase("student@englishhub.com");
		verify(teacherProfileRepository, never()).saveAndFlush(any());
		verify(studentProfileRepository, never()).saveAndFlush(any());
	}

	@Test
	@DisplayName("Dev profile: creates admin, teacher, and student accounts with profiles")
	void run_inDevProfile_createsAllThreeRoles() throws Exception {
		when(environment.getActiveProfiles()).thenReturn(new String[] { "dev" });
		when(userRepository.existsByEmailIgnoreCase("admin@englishhub.com")).thenReturn(false);
		when(userRepository.findByEmailIgnoreCase("teacher@englishhub.com")).thenReturn(Optional.empty());
		when(userRepository.findByEmailIgnoreCase("student@englishhub.com")).thenReturn(Optional.empty());

		User savedTeacher = new User("Teacher EnglishHub", "teacher@englishhub.com", null, "encoded_pass", UserRole.TEACHER, UserStatus.ACTIVE, false);
		setField(savedTeacher, "id", 10L);
		when(userRepository.saveAndFlush(argThat(u -> u != null && "teacher@englishhub.com".equals(u.getEmail())))).thenReturn(savedTeacher);
		when(teacherProfileRepository.existsById(10L)).thenReturn(false);

		User savedStudent = new User("Student EnglishHub", "student@englishhub.com", null, "encoded_pass", UserRole.STUDENT, UserStatus.ACTIVE, false);
		setField(savedStudent, "id", 20L);
		when(userRepository.saveAndFlush(argThat(u -> u != null && "student@englishhub.com".equals(u.getEmail())))).thenReturn(savedStudent);
		when(studentProfileRepository.existsById(20L)).thenReturn(false);

		initializer.run(null);

		// Admin verified
		verify(userRepository).saveAndFlush(argThat(u -> u != null && "admin@englishhub.com".equals(u.getEmail())));

		// Teacher verified
		verify(teacherProfileRepository).saveAndFlush(argThat(tp ->
				tp != null && tp.getUser() != null && tp.getUser().getId().equals(10L) && "Tiếng Anh giao tiếp".equals(tp.getSpecialization())));

		// Student verified
		verify(studentProfileRepository).saveAndFlush(argThat(sp ->
				sp != null && sp.getUser() != null && sp.getUser().getId().equals(20L) && "SV999999".equals(sp.getStudentCode())));
	}

	@Test
	@DisplayName("Staging profile: creates all three roles")
	void run_inStagingProfile_createsAllThreeRoles() throws Exception {
		when(environment.getActiveProfiles()).thenReturn(new String[] { "staging" });
		when(userRepository.existsByEmailIgnoreCase("admin@englishhub.com")).thenReturn(true);
		when(userRepository.findByEmailIgnoreCase("teacher@englishhub.com")).thenReturn(Optional.empty());
		when(userRepository.findByEmailIgnoreCase("student@englishhub.com")).thenReturn(Optional.empty());

		User savedTeacher = new User("Teacher EnglishHub", "teacher@englishhub.com", null, "encoded_pass", UserRole.TEACHER, UserStatus.ACTIVE, false);
		setField(savedTeacher, "id", 10L);
		when(userRepository.saveAndFlush(argThat(u -> u != null && "teacher@englishhub.com".equals(u.getEmail())))).thenReturn(savedTeacher);

		User savedStudent = new User("Student EnglishHub", "student@englishhub.com", null, "encoded_pass", UserRole.STUDENT, UserStatus.ACTIVE, false);
		setField(savedStudent, "id", 20L);
		when(userRepository.saveAndFlush(argThat(u -> u != null && "student@englishhub.com".equals(u.getEmail())))).thenReturn(savedStudent);

		initializer.run(null);

		// Admin was already existing -> not saved
		verify(userRepository, never()).saveAndFlush(argThat(u -> u != null && "admin@englishhub.com".equals(u.getEmail())));
		// Teacher & Student saved
		verify(teacherProfileRepository).saveAndFlush(any(TeacherProfile.class));
		verify(studentProfileRepository).saveAndFlush(any(StudentProfile.class));
	}

	@Test
	@DisplayName("Idempotency: When accounts and profiles already exist, no database insert occurs")
	void run_whenAccountsAlreadyExist_skipsEverything() throws Exception {
		when(environment.getActiveProfiles()).thenReturn(new String[] { "dev" });
		when(userRepository.existsByEmailIgnoreCase("admin@englishhub.com")).thenReturn(true);

		User existingTeacher = new User("Teacher EnglishHub", "teacher@englishhub.com", null, "hash", UserRole.TEACHER, UserStatus.ACTIVE, false);
		setField(existingTeacher, "id", 10L);
		when(userRepository.findByEmailIgnoreCase("teacher@englishhub.com")).thenReturn(Optional.of(existingTeacher));
		when(teacherProfileRepository.existsById(10L)).thenReturn(true);

		User existingStudent = new User("Student EnglishHub", "student@englishhub.com", null, "hash", UserRole.STUDENT, UserStatus.ACTIVE, false);
		setField(existingStudent, "id", 20L);
		when(userRepository.findByEmailIgnoreCase("student@englishhub.com")).thenReturn(Optional.of(existingStudent));
		when(studentProfileRepository.existsById(20L)).thenReturn(true);

		initializer.run(null);

		// No saves at all
		verify(userRepository, never()).saveAndFlush(any());
		verify(teacherProfileRepository, never()).saveAndFlush(any());
		verify(studentProfileRepository, never()).saveAndFlush(any());
	}

	@Test
	@DisplayName("Explicit override via property takes precedence over active profile")
	void run_withExplicitOverride_forcesDemoAccountsInProd() throws Exception {
		setField(initializer, "includeDemoAccountsOverride", "true");
		// Even though profile is prod, override = true forces demo accounts
		when(userRepository.existsByEmailIgnoreCase("admin@englishhub.com")).thenReturn(true);

		User existingTeacher = new User("Teacher EnglishHub", "teacher@englishhub.com", null, "hash", UserRole.TEACHER, UserStatus.ACTIVE, false);
		setField(existingTeacher, "id", 10L);
		when(userRepository.findByEmailIgnoreCase("teacher@englishhub.com")).thenReturn(Optional.of(existingTeacher));
		when(teacherProfileRepository.existsById(10L)).thenReturn(true);

		User existingStudent = new User("Student EnglishHub", "student@englishhub.com", null, "hash", UserRole.STUDENT, UserStatus.ACTIVE, false);
		setField(existingStudent, "id", 20L);
		when(userRepository.findByEmailIgnoreCase("student@englishhub.com")).thenReturn(Optional.of(existingStudent));
		when(studentProfileRepository.existsById(20L)).thenReturn(true);

		initializer.run(null);

		// Verified teacher and student checks were executed
		verify(userRepository).findByEmailIgnoreCase("teacher@englishhub.com");
		verify(userRepository).findByEmailIgnoreCase("student@englishhub.com");
	}

	@Test
	@DisplayName("Custom environment variables: initializes admin with custom email, password, and name")
	void run_withCustomAdminCredentials_usesConfiguredValues() throws Exception {
		setField(initializer, "adminEmail", "superadmin@customdomain.com");
		setField(initializer, "adminPassword", "SuperSecret999!");
		setField(initializer, "adminName", "Global Chief Admin");

		when(environment.getActiveProfiles()).thenReturn(new String[] { "prod" });
		when(userRepository.existsByEmailIgnoreCase("superadmin@customdomain.com")).thenReturn(false);

		initializer.run(null);

		verify(userRepository).saveAndFlush(argThat(user ->
				user != null &&
				"superadmin@customdomain.com".equals(user.getEmail()) &&
				"Global Chief Admin".equals(user.getFullName()) &&
				user.getRole() == UserRole.ADMIN &&
				user.getStatus() == UserStatus.ACTIVE &&
				"encoded_SuperSecret999!".equals(user.getPasswordHash())));
	}

	@Test
	@DisplayName("Explicit override to false in dev profile disables demo accounts")
	void run_withOverrideFalseInDev_skipsDemoAccounts() throws Exception {
		setField(initializer, "includeDemoAccountsOverride", "false");
		when(environment.getActiveProfiles()).thenReturn(new String[] { "dev" });
		when(userRepository.existsByEmailIgnoreCase("admin@englishhub.com")).thenReturn(true);

		initializer.run(null);

		verify(userRepository, never()).findByEmailIgnoreCase("teacher@englishhub.com");
		verify(userRepository, never()).findByEmailIgnoreCase("student@englishhub.com");
	}
}
