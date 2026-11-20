package com.english_hub.core.modules.classroom.infrastructure.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentEvaluationRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.modules.classroom.ClassTestMessages;
import com.english_hub.core.modules.classroom.infrastructure.mapper.ClassPersistenceMapper;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassMemberJpaRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class ClassJpaAdapterTest {

	@Mock
	private ClassJpaRepository jpaRepository;

	@Mock
	private ClassMemberJpaRepository classMemberJpaRepository;

	@Mock
	private UserRepository userJpaRepository;

	@Mock
	private TeacherProfileRepository teacherProfileRepository;

	@Mock
	private StudentProfileRepository studentProfileRepository;

	@Mock
	private AssignmentRepository assignmentRepository;

	@Mock
	private StudentEvaluationRepository studentEvaluationRepository;

	@Mock
	private ClassPersistenceMapper mapper;

	private ClassJpaAdapter adapter;

	@BeforeEach
	void setUp() {
		adapter = new ClassJpaAdapter(
				jpaRepository,
				classMemberJpaRepository,
				userJpaRepository,
				teacherProfileRepository,
				studentProfileRepository,
				assignmentRepository,
				studentEvaluationRepository,
				mapper);
	}

	@Test
	void returnsTrueForAnActiveTeacher() {
		User activeTeacher = mock(User.class);
		when(teacherProfileRepository.existsById(12L)).thenReturn(true);
		when(userJpaRepository.findByIdAndDeletedFalse(12L)).thenReturn(Optional.of(activeTeacher));
		when(activeTeacher.getStatus()).thenReturn(UserStatus.ACTIVE);

		assertThat(adapter.teacherExists(12L)).isTrue();
	}

	@Test
	void rejectsALockedTeacherWithBadRequestAndTheLockedTeacherMessage() {
		User lockedTeacher = mock(User.class);
		when(teacherProfileRepository.existsById(12L)).thenReturn(true);
		when(userJpaRepository.findByIdAndDeletedFalse(12L)).thenReturn(Optional.of(lockedTeacher));
		when(lockedTeacher.getStatus()).thenReturn(UserStatus.LOCKED);

		assertThatThrownBy(() -> adapter.teacherExists(12L))
				.isInstanceOfSatisfying(ApiException.class, exception -> {
					assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
					assertThat(exception.getMessage()).isEqualTo(ClassTestMessages.LOCKED_TEACHER_MESSAGE);
				});
	}

	@Test
	void returnsFalseWithoutLookingUpAUserWhenTeacherProfileDoesNotExist() {
		when(teacherProfileRepository.existsById(12L)).thenReturn(false);

		assertThat(adapter.teacherExists(12L)).isFalse();

		verify(userJpaRepository, never()).findByIdAndDeletedFalse(12L);
	}

	@Test
	void returnsFalseWhenTheProfileHasNoNonDeletedUser() {
		when(teacherProfileRepository.existsById(12L)).thenReturn(true);
		when(userJpaRepository.findByIdAndDeletedFalse(12L)).thenReturn(Optional.empty());

		assertThat(adapter.teacherExists(12L)).isFalse();
	}
}
