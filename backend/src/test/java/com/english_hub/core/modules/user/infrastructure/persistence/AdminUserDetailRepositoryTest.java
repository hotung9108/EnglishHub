package com.english_hub.core.modules.user.infrastructure.persistence;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.JpaUserRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.UserPersistenceMapper;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import jakarta.persistence.EntityManager;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserDetailRepositoryTest {

	private static final String MOCK_STUDENT_CODE = "mock-repository-student-code";

	@Mock
	private com.english_hub.core.infrastructure.persistence.repository.UserRepository userJpaRepository;
	@Mock
	private TeacherProfileRepository teacherProfiles;
	@Mock
	private StudentProfileRepository studentProfiles;
	@Mock
	private EntityManager entityManager;

	private JpaUserRepository repository;

	@BeforeEach
	void setUp() {
		repository = new JpaUserRepository(userJpaRepository, teacherProfiles, studentProfiles,
				new UserPersistenceMapper(), entityManager);
	}

	@ParameterizedTest
	@ValueSource(longs = {12L, 13L})
	void findById_whenStudentExists_loadsTheSameIdAndStudentProfile(long id) {
		User source = entity(id);
		StudentProfile profile = new StudentProfile(source, MOCK_STUDENT_CODE, null, null);
		when(userJpaRepository.findByIdAndDeletedFalse(id)).thenReturn(Optional.of(source));
		when(studentProfiles.findById(id)).thenReturn(Optional.of(profile));

		var actual = repository.findById(id).orElseThrow();

		assertThat(actual.id()).isEqualTo(id);
		assertThat(actual.fullName()).isEqualTo(source.getFullName());
		assertThat(actual.email()).isEqualTo(source.getEmail());
		assertThat(actual.role()).isEqualTo(UserRole.STUDENT);
		assertThat(actual.studentCode()).isEqualTo(MOCK_STUDENT_CODE);
		assertThat(actual.specialization()).isNull();
		verifyOnlyReads(id, UserRole.STUDENT);
	}

	@Test
	void findById_whenTeacherExists_loadsOnlyTheTeacherProfile() {
		User source = entity(4L);
		TeacherProfile profile = new TeacherProfile(source, "mock-repository-specialization");
		when(userJpaRepository.findByIdAndDeletedFalse(4L)).thenReturn(Optional.of(source));
		when(teacherProfiles.findById(4L)).thenReturn(Optional.of(profile));

		var actual = repository.findById(4L).orElseThrow();

		assertThat(actual.id()).isEqualTo(4L);
		assertThat(actual.email()).isEqualTo(source.getEmail());
		assertThat(actual.role()).isEqualTo(UserRole.TEACHER);
		assertThat(actual.specialization()).isEqualTo("mock-repository-specialization");
		assertThat(actual.studentCode()).isNull();
		verifyOnlyReads(4L, UserRole.TEACHER);
	}

	@Test
	void findById_whenAdminExists_doesNotReadEitherProfileRepository() {
		when(userJpaRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(entity(1L)));

		var actual = repository.findById(1L).orElseThrow();

		assertThat(actual.id()).isEqualTo(1L);
		assertThat(actual.role()).isEqualTo(UserRole.ADMIN);
		assertThat(actual.studentCode()).isNull();
		assertThat(actual.specialization()).isNull();
		verifyOnlyReads(1L, UserRole.ADMIN);
	}

	@ParameterizedTest
	@ValueSource(longs = {4L, 12L})
	void findById_whenProfileIsMissing_returnsBaseUserWithNullProfileFields(long id) {
		User source = entity(id);
		when(userJpaRepository.findByIdAndDeletedFalse(id)).thenReturn(Optional.of(source));

		var actual = repository.findById(id).orElseThrow();

		assertThat(actual.id()).isEqualTo(id);
		assertThat(actual.fullName()).isEqualTo(source.getFullName());
		assertThat(actual.email()).isEqualTo(source.getEmail());
		assertThat(actual.studentCode()).isNull();
		assertThat(actual.dateOfBirth()).isNull();
		assertThat(actual.parentPhone()).isNull();
		assertThat(actual.specialization()).isNull();
		verifyOnlyReads(id, source.getRole());
	}

	@Test
	void findById_whenTargetDoesNotExist_returnsEmptyWithoutProfileReads() {
		assertFilteredTargetIsAbsent(Long.MAX_VALUE);
	}

	@Test
	void findById_whenDeletedTargetIsFilteredOut_returnsEmptyWithoutProfileReads() {
		assertFilteredTargetIsAbsent(12L);
	}

	@Test
	void findById_whenReadingUserAndProfile_doesNotWriteFlushOrChangeSourceState() {
		User source = entity(12L);
		User before = entity(12L);
		StudentProfile profile = new StudentProfile(source, MOCK_STUDENT_CODE, null, null);
		StudentProfile profileBefore = new StudentProfile(before, MOCK_STUDENT_CODE, null, null);
		when(userJpaRepository.findByIdAndDeletedFalse(12L)).thenReturn(Optional.of(source));
		when(studentProfiles.findById(12L)).thenReturn(Optional.of(profile));

		repository.findById(12L).orElseThrow();

		assertThat(source).usingRecursiveComparison().isEqualTo(before);
		assertThat(profile).usingRecursiveComparison().isEqualTo(profileBefore);
		verifyOnlyReads(12L, UserRole.STUDENT);
	}

	private void assertFilteredTargetIsAbsent(long id) {
		when(userJpaRepository.findByIdAndDeletedFalse(id)).thenReturn(Optional.empty());

		assertThat(repository.findById(id)).isEmpty();

		verify(userJpaRepository).findByIdAndDeletedFalse(id);
		verifyNoMoreInteractions(userJpaRepository);
		verifyNoInteractions(studentProfiles, teacherProfiles, entityManager);
	}

	private void verifyOnlyReads(long id, UserRole role) {
		verify(userJpaRepository).findByIdAndDeletedFalse(id);
		if (role == UserRole.STUDENT) {
			verify(studentProfiles).findById(id);
		} else if (role == UserRole.TEACHER) {
			verify(teacherProfiles).findById(id);
		}
		verifyNoMoreInteractions(userJpaRepository, studentProfiles, teacherProfiles);
		verifyNoInteractions(entityManager);
	}

	private User entity(long id) {
		User source = switch ((int) id) {
			case 1 -> new User("Hoàng Thanh Ngân", "hoang.thanh.ngan@utc-polyglot.edu.vn", null,
					"test-password-hash", UserRole.ADMIN, UserStatus.ACTIVE, false);
			case 4 -> new User("Phạm Diệu Anh", "pham.dieu.anh@gmail.com", null,
					"test-password-hash", UserRole.TEACHER, UserStatus.ACTIVE, false);
			case 12 -> new User("Ngô Thị Phương", "ngo.thi.phuong@gmail.com", null,
					"test-password-hash", UserRole.STUDENT, UserStatus.ACTIVE, false);
			case 13 -> new User("Lý Đức Việt", "ly.duc.viet@gmail.com", null,
					"test-password-hash", UserRole.STUDENT, UserStatus.ACTIVE, false);
			default -> throw new IllegalArgumentException("No snapshot fixture for ID " + id);
		};
		ReflectionTestUtils.setField(source, "id", id);
		return source;
	}
}
