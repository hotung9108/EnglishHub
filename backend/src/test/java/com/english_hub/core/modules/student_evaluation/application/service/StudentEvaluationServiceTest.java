package com.english_hub.core.modules.student_evaluation.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.model.TeacherInfo;
import com.english_hub.core.modules.classroom.domain.repository.ClassMemberRepository;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.student_evaluation.application.command.CreateStudentEvaluationCommand;
import com.english_hub.core.modules.student_evaluation.application.command.UpdateStudentEvaluationCommand;
import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluation;
import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluationFilter;
import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluationPage;
import com.english_hub.core.modules.student_evaluation.domain.repository.StudentEvaluationRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class StudentEvaluationServiceTest {

	private static final long STUDENT_ID = 31L;
	private static final long TEACHER_ID = 41L;
	private static final long CLASS_ID = 51L;
	private static final long EVALUATION_ID = 61L;

	@Mock
	private StudentEvaluationRepository studentEvaluationRepository;

	@Mock
	private ClassRepository classRepository;

	@Mock
	private ClassMemberRepository classMemberRepository;

	@Mock
	private CurrentUserProvider currentUserProvider;

	private StudentEvaluationService service;

	@BeforeEach
	void setUp() {
		service = new StudentEvaluationService(
				studentEvaluationRepository,
				classRepository,
				classMemberRepository,
				currentUserProvider);
	}

	@Test
	void teacherCanListAnyStudentWithOptionalClassFilterAndTeacherName() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(TEACHER_ID, UserRole.TEACHER));
		when(classRepository.studentExists(STUDENT_ID)).thenReturn(true);
		StudentEvaluation evaluation = evaluation(EVALUATION_ID, STUDENT_ID, TEACHER_ID, CLASS_ID, "Good work.");
		when(studentEvaluationRepository.findPage(new StudentEvaluationFilter(STUDENT_ID, CLASS_ID), 2, 5))
				.thenReturn(new StudentEvaluationPage(List.of(evaluation), 2, 5, 7));
		when(classRepository.findTeacher(TEACHER_ID)).thenReturn(Optional.of(new TeacherInfo(TEACHER_ID, "Teacher A")));

		StudentEvaluationPage result = service.listForStudent(STUDENT_ID, CLASS_ID, 2, 5);

		assertThat(result.getContent()).containsExactly(evaluation.withTeacherName("Teacher A"));
		assertThat(result.getPage()).isEqualTo(2);
		assertThat(result.getSize()).isEqualTo(5);
		assertThat(result.getTotalElements()).isEqualTo(7);
		verify(studentEvaluationRepository).findPage(new StudentEvaluationFilter(STUDENT_ID, CLASS_ID), 2, 5);
	}

	@Test
	void studentCanOnlyListTheirOwnEvaluations() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(STUDENT_ID, UserRole.STUDENT));

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.listForStudent(STUDENT_ID + 1, null, 1, 20));

		assertApiException(exception, HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");
		verifyNoInteractions(studentEvaluationRepository, classRepository);
	}

	@Test
	void adminCannotListStudentEvaluations() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(1L, UserRole.ADMIN));

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.listForStudent(STUDENT_ID, null, 1, 20));

		assertApiException(exception, HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");
		verifyNoInteractions(studentEvaluationRepository, classRepository);
	}

	@Test
	void listingReturnsNotFoundWhenStudentDoesNotExist() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(TEACHER_ID, UserRole.TEACHER));
		when(classRepository.studentExists(STUDENT_ID)).thenReturn(false);

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.listForStudent(STUDENT_ID, null, 1, 20));

		assertApiException(exception, HttpStatus.NOT_FOUND, "Không tìm thấy học viên.");
		verifyNoInteractions(studentEvaluationRepository);
	}

	@Test
	void createStoresTheCurrentTeacherAsAuthorWhenStudentIsCurrentlyAMember() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(TEACHER_ID, UserRole.TEACHER));
		when(classRepository.findById(CLASS_ID)).thenReturn(Optional.of(englishClass(TEACHER_ID)));
		when(classRepository.studentExists(STUDENT_ID)).thenReturn(true);
		when(classMemberRepository.existsByClassIdAndStudentId(CLASS_ID, STUDENT_ID)).thenReturn(true);
		when(studentEvaluationRepository.save(any())).thenAnswer(invocation -> {
			StudentEvaluation source = invocation.getArgument(0);
			return new StudentEvaluation(
					EVALUATION_ID,
					source.studentId(),
					source.teacherId(),
					source.classId(),
					source.teacherName(),
					source.content(),
					Instant.parse("2026-09-26T10:00:00Z"));
		});

		Long id = service.createForStudent(
				STUDENT_ID,
				new CreateStudentEvaluationCommand(CLASS_ID, "Good progress."));

		assertThat(id).isEqualTo(EVALUATION_ID);
		verify(studentEvaluationRepository).save(new StudentEvaluation(
				null, STUDENT_ID, TEACHER_ID, CLASS_ID, "User 41", "Good progress.", null));
	}

	@Test
	void createRejectsBlankContentWithContractMessage() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(TEACHER_ID, UserRole.TEACHER));

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.createForStudent(
						STUDENT_ID, new CreateStudentEvaluationCommand(CLASS_ID, "   ")));

		assertApiException(exception, HttpStatus.BAD_REQUEST, "Nội dung đánh giá không được để trống.");
		verifyNoInteractions(classRepository, classMemberRepository, studentEvaluationRepository);
	}

	@Test
	void createRejectsTeacherWhoDoesNotCurrentlyTeachTheClass() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(TEACHER_ID, UserRole.TEACHER));
		when(classRepository.findById(CLASS_ID)).thenReturn(Optional.of(englishClass(TEACHER_ID + 1)));
		when(classRepository.studentExists(STUDENT_ID)).thenReturn(true);

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.createForStudent(STUDENT_ID, new CreateStudentEvaluationCommand(CLASS_ID, "Text")));

		assertApiException(exception, HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");
		verify(classMemberRepository, never()).existsByClassIdAndStudentId(any(), any());
		verifyNoInteractions(studentEvaluationRepository);
	}

	@Test
	void createRejectsStudentWhoIsNotCurrentlyInTheClass() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(TEACHER_ID, UserRole.TEACHER));
		when(classRepository.findById(CLASS_ID)).thenReturn(Optional.of(englishClass(TEACHER_ID)));
		when(classRepository.studentExists(STUDENT_ID)).thenReturn(true);
		when(classMemberRepository.existsByClassIdAndStudentId(CLASS_ID, STUDENT_ID)).thenReturn(false);

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.createForStudent(STUDENT_ID, new CreateStudentEvaluationCommand(CLASS_ID, "Text")));

		assertApiException(exception, HttpStatus.BAD_REQUEST, "Học viên không thuộc lớp học này.");
		verifyNoInteractions(studentEvaluationRepository);
	}

	@Test
	void createReturnsCombinedNotFoundWhenStudentOrClassDoesNotExist() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(TEACHER_ID, UserRole.TEACHER));
		when(classRepository.findById(CLASS_ID)).thenReturn(Optional.empty());

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.createForStudent(STUDENT_ID, new CreateStudentEvaluationCommand(CLASS_ID, "Text")));

		assertApiException(exception, HttpStatus.NOT_FOUND, "Không tìm thấy học viên hoặc lớp học.");
		verifyNoInteractions(classMemberRepository, studentEvaluationRepository);
	}

	@Test
	void getByIdAllowsStudentToReadTheirOwnEvaluation() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(STUDENT_ID, UserRole.STUDENT));
		StudentEvaluation evaluation = evaluation(EVALUATION_ID, STUDENT_ID, TEACHER_ID, CLASS_ID, "Own evaluation.");
		when(studentEvaluationRepository.findById(EVALUATION_ID)).thenReturn(Optional.of(evaluation));

		assertThat(service.getById(EVALUATION_ID)).isEqualTo(evaluation);
	}

	@Test
	void getByIdRejectsStudentReadingAnotherStudentsEvaluation() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(STUDENT_ID, UserRole.STUDENT));
		when(studentEvaluationRepository.findById(EVALUATION_ID))
				.thenReturn(Optional.of(evaluation(EVALUATION_ID, STUDENT_ID + 1, TEACHER_ID, CLASS_ID, "Text")));

		ApiException exception = assertThrows(ApiException.class, () -> service.getById(EVALUATION_ID));

		assertApiException(exception, HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void getByIdReturnsNotFoundWhenEvaluationDoesNotExist() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(TEACHER_ID, UserRole.TEACHER));
		when(studentEvaluationRepository.findById(EVALUATION_ID)).thenReturn(Optional.empty());

		ApiException exception = assertThrows(ApiException.class, () -> service.getById(EVALUATION_ID));

		assertApiException(exception, HttpStatus.NOT_FOUND, "Không tìm thấy đánh giá.");
	}

	@Test
	void updateChangesContentWhenCurrentTeacherIsTheAuthor() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(TEACHER_ID, UserRole.TEACHER));
		when(studentEvaluationRepository.findById(EVALUATION_ID))
				.thenReturn(Optional.of(evaluation(EVALUATION_ID, STUDENT_ID, TEACHER_ID, CLASS_ID, "Old text.")));

		service.update(EVALUATION_ID, new UpdateStudentEvaluationCommand("New text."));

		verify(studentEvaluationRepository).save(evaluation(
				EVALUATION_ID, STUDENT_ID, TEACHER_ID, CLASS_ID, "New text."));
	}

	@Test
	void updateRejectsEmptyContentWithContractMessage() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(TEACHER_ID, UserRole.TEACHER));

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.update(EVALUATION_ID, new UpdateStudentEvaluationCommand("  ")));

		assertApiException(exception, HttpStatus.BAD_REQUEST, "Nội dung đánh giá không được để trống.");
		verifyNoInteractions(studentEvaluationRepository);
	}

	@Test
	void updateReturnsNotFoundBeforeOwnershipCheck() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(TEACHER_ID, UserRole.TEACHER));
		when(studentEvaluationRepository.findById(EVALUATION_ID)).thenReturn(Optional.empty());

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.update(EVALUATION_ID, new UpdateStudentEvaluationCommand("New text.")));

		assertApiException(exception, HttpStatus.NOT_FOUND, "Không tìm thấy đánh giá.");
		verify(studentEvaluationRepository, never()).save(any());
	}

	@Test
	void updateRejectsTeacherOtherThanOriginalAuthor() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(TEACHER_ID + 1, UserRole.TEACHER));
		when(studentEvaluationRepository.findById(EVALUATION_ID))
				.thenReturn(Optional.of(evaluation(EVALUATION_ID, STUDENT_ID, TEACHER_ID, CLASS_ID, "Old text.")));

		ApiException exception = assertThrows(
				ApiException.class,
				() -> service.update(EVALUATION_ID, new UpdateStudentEvaluationCommand("New text.")));

		assertApiException(exception, HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");
		verify(studentEvaluationRepository, never()).save(any());
	}

	@Test
	void deleteRemovesEvaluationWhenCurrentTeacherIsTheAuthor() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(TEACHER_ID, UserRole.TEACHER));
		when(studentEvaluationRepository.findById(EVALUATION_ID))
				.thenReturn(Optional.of(evaluation(EVALUATION_ID, STUDENT_ID, TEACHER_ID, CLASS_ID, "Text")));

		service.delete(EVALUATION_ID);

		verify(studentEvaluationRepository).deleteById(EVALUATION_ID);
	}

	@Test
	void deleteRejectsTeacherOtherThanOriginalAuthor() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(TEACHER_ID + 1, UserRole.TEACHER));
		when(studentEvaluationRepository.findById(EVALUATION_ID))
				.thenReturn(Optional.of(evaluation(EVALUATION_ID, STUDENT_ID, TEACHER_ID, CLASS_ID, "Text")));

		ApiException exception = assertThrows(ApiException.class, () -> service.delete(EVALUATION_ID));

		assertApiException(exception, HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");
		verify(studentEvaluationRepository, never()).deleteById(any());
	}

	private User user(long id, UserRole role) {
		return new User(
				id,
				"User " + id,
				"user" + id + "@test.local",
				null,
				null,
				"test-hash",
				role,
				UserStatus.ACTIVE,
				false,
				null,
				null,
				null,
				null);
	}

	private EnglishClass englishClass(long teacherId) {
		EnglishClass englishClass = new EnglishClass();
		englishClass.setTeacherId(teacherId);
		return englishClass;
	}

	private StudentEvaluation evaluation(
			Long id,
			Long studentId,
			Long teacherId,
			Long classId,
			String content) {
		return new StudentEvaluation(
				id,
				studentId,
				teacherId,
				classId,
				null,
				content,
				Instant.parse("2026-09-26T10:00:00Z"));
	}

	private void assertApiException(ApiException exception, HttpStatus status, String message) {
		assertThat(exception.getStatus()).isEqualTo(status);
		assertThat(exception.getMessage()).isEqualTo(message);
	}
}
