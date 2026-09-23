package com.english_hub.core.modules.assignment.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.assignment.application.command.CreateAssignmentCommand;
import com.english_hub.core.modules.assignment.application.command.UpdateAssignmentCommand;
import com.english_hub.core.modules.assignment.application.command.UpdateAssignmentStatusCommand;
import com.english_hub.core.modules.assignment.domain.model.Assignment;
import com.english_hub.core.modules.assignment.domain.model.AssignmentModuleSummary;
import com.english_hub.core.modules.assignment.domain.model.AssignmentPage;
import com.english_hub.core.modules.assignment.domain.model.AssignmentStatus;
import com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.repository.ClassMemberRepository;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AssignmentServiceTest {

	private static final OffsetDateTime OPEN_AT = OffsetDateTime.parse("2026-09-15T00:00:00Z");
	private static final OffsetDateTime CLOSE_AT = OffsetDateTime.parse("2026-09-20T23:59:00Z");

	@Mock
	private AssignmentRepository assignmentRepository;

	@Mock
	private ClassRepository classRepository;

	@Mock
	private ClassMemberRepository classMemberRepository;

	@Mock
	private CurrentUserProvider currentUserProvider;

	private AssignmentService assignmentService;

	@BeforeEach
	void setUp() {
		assignmentService = new AssignmentService(
				assignmentRepository,
				classRepository,
				classMemberRepository,
				currentUserProvider);
	}

	@Test
	void teacherCanListAssignmentsForOwnedClassWithStatusFilter() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));
		AssignmentPage expected = new AssignmentPage(List.of(assignment(5L, 3L, AssignmentStatus.PUBLISHED)), 1, 20, 1);
		when(assignmentRepository.findPage(eq(3L), eq(AssignmentStatus.PUBLISHED), any())).thenReturn(expected);

		AssignmentPage actual = assignmentService.listAssignments("PUBLISHED", 3L, 1, 20);

		assertThat(actual).isSameAs(expected);
		verify(assignmentRepository).findPage(eq(3L), eq(AssignmentStatus.PUBLISHED), any());
	}

	@Test
	void studentCanListAssignmentsForAClassTheyAttend() {
		givenCaller(user(41L, UserRole.STUDENT));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));
		when(classMemberRepository.existsByClassIdAndStudentId(3L, 41L)).thenReturn(true);
		when(assignmentRepository.findPage(eq(3L), eq(null), any()))
				.thenReturn(new AssignmentPage(List.of(), 1, 20, 0));

		assignmentService.listAssignments(null, 3L, 1, 20);

		verify(assignmentRepository).findPage(eq(3L), eq(null), any());
	}

	@Test
	void adminIsForbiddenFromListingClassAssignments() {
		givenCaller(user(1L, UserRole.ADMIN));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));

		assertApiException(
				() -> assignmentService.listAssignments(null, 3L, 1, 20),
				"Bạn không có quyền thực hiện thao tác này.");
		verify(assignmentRepository, never()).findPage(any(), any(), any());
	}

	@Test
	void teacherCannotListAnotherTeachersClass() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 99L)));

		assertApiException(
				() -> assignmentService.listAssignments(null, 3L, 1, 20),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void rejectsUnknownAssignmentStatusFilter() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));

		assertApiException(
				() -> assignmentService.listAssignments("OPEN", 3L, 1, 20),
				"status không hợp lệ.");
		verify(assignmentRepository, never()).findPage(any(), any(), any());
	}

	@Test
	void studentCannotListAClassTheyDoNotAttend() {
		givenCaller(user(41L, UserRole.STUDENT));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));
		when(classMemberRepository.existsByClassIdAndStudentId(3L, 41L)).thenReturn(false);

		assertApiException(
				() -> assignmentService.listAssignments(null, 3L, 1, 20),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void teacherCreatesDraftAssignmentForOwnedClass() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));
		when(assignmentRepository.save(any(Assignment.class))).thenAnswer(invocation -> {
			Assignment saved = invocation.getArgument(0);
			saved.setId(5L);
			return saved;
		});

		long id = assignmentService.createAssignment(3L, new CreateAssignmentCommand(
				"Weekly Test 1", "Instructions", OPEN_AT, CLOSE_AT, 2));

		assertThat(id).isEqualTo(5L);
		var captor = org.mockito.ArgumentCaptor.forClass(Assignment.class);
		verify(assignmentRepository).save(captor.capture());
		assertThat(captor.getValue().status()).isEqualTo(AssignmentStatus.DRAFT);
		assertThat(captor.getValue().title()).isEqualTo("Weekly Test 1");
	}

	@Test
	void studentCannotCreateAssignment() {
		givenCaller(user(41L, UserRole.STUDENT));

		assertApiException(
				() -> assignmentService.createAssignment(3L, validCreateCommand()),
				"Bạn không có quyền thực hiện thao tác này.");
		verify(assignmentRepository, never()).save(any());
	}

	@Test
	void adminCannotCreateAssignment() {
		givenCaller(user(1L, UserRole.ADMIN));

		assertApiException(
				() -> assignmentService.createAssignment(3L, validCreateCommand()),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void teacherCannotCreateAssignmentForUnassignedClass() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, null)));

		assertApiException(
				() -> assignmentService.createAssignment(3L, validCreateCommand()),
				"Lớp học chưa được gán giáo viên phụ trách, không thể tạo bài tập.");
	}

	@Test
	void rejectsInvalidAssignmentWindowAndSubmissionLimit() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));

		assertApiException(
				() -> assignmentService.createAssignment(3L, new CreateAssignmentCommand(
						"Test", null, CLOSE_AT, OPEN_AT, 2)),
				"Dữ liệu thời gian hoặc số lần nộp không hợp lệ.");
		assertApiException(
				() -> assignmentService.createAssignment(3L, new CreateAssignmentCommand(
						"Test", null, OPEN_AT, CLOSE_AT, 0)),
				"Dữ liệu thời gian hoặc số lần nộp không hợp lệ.");
	}

	@Test
	void teacherCanReadAssignmentDetailWithModuleSummaries() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(assignmentRepository.findById(5L))
				.thenReturn(Optional.of(assignment(5L, 3L, AssignmentStatus.PUBLISHED)));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));
		when(assignmentRepository.findModuleSummaries(5L))
				.thenReturn(List.of(new AssignmentModuleSummary(9L, "READING")));

		AssignmentService.AssignmentDetailResult result = assignmentService.getAssignmentDetail(5L);

		assertThat(result.assignment().id()).isEqualTo(5L);
		assertThat(result.modules()).containsExactly(new AssignmentModuleSummary(9L, "READING"));
	}

	@Test
	void studentCanReadAssignmentDetailWhenTheyAreAClassMember() {
		givenCaller(user(41L, UserRole.STUDENT));
		when(assignmentRepository.findById(5L))
				.thenReturn(Optional.of(assignment(5L, 3L, AssignmentStatus.PUBLISHED)));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));
		when(classMemberRepository.existsByClassIdAndStudentId(3L, 41L)).thenReturn(true);
		when(assignmentRepository.findModuleSummaries(5L)).thenReturn(List.of());

		assertThat(assignmentService.getAssignmentDetail(5L).modules()).isEmpty();
	}

	@Test
	void adminCannotReadAssignmentDetail() {
		givenCaller(user(1L, UserRole.ADMIN));
		when(assignmentRepository.findById(5L))
				.thenReturn(Optional.of(assignment(5L, 3L, AssignmentStatus.PUBLISHED)));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));

		assertApiException(
				() -> assignmentService.getAssignmentDetail(5L),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void teacherCanUpdateAssignmentOwnedByTheirClass() {
		givenCaller(user(10L, UserRole.TEACHER));
		Assignment assignment = assignment(5L, 3L, AssignmentStatus.DRAFT);
		when(assignmentRepository.findById(5L)).thenReturn(Optional.of(assignment));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));

		assignmentService.updateAssignment(5L, new UpdateAssignmentCommand(
				"Updated title", null, null, CLOSE_AT.plusDays(1), null));

		verify(assignmentRepository).save(assignment);
		assertThat(assignment.title()).isEqualTo("Updated title");
		assertThat(assignment.closeAt()).isEqualTo(CLOSE_AT.plusDays(1));
	}

	@Test
	void studentCannotUpdateAssignment() {
		givenCaller(user(41L, UserRole.STUDENT));

		assertApiException(
				() -> assignmentService.updateAssignment(5L, new UpdateAssignmentCommand(
						"Updated", null, null, null, null)),
				"Bạn không có quyền thực hiện thao tác này.");
		verify(assignmentRepository, never()).findById(any());
	}

	@Test
	void teacherCannotUpdateAssignmentOwnedByAnotherTeacher() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(assignmentRepository.findById(5L))
				.thenReturn(Optional.of(assignment(5L, 3L, AssignmentStatus.DRAFT)));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 99L)));

		assertApiException(
				() -> assignmentService.updateAssignment(5L, new UpdateAssignmentCommand(
						"Updated", null, null, null, null)),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void closedAssignmentCannotBeUpdated() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(assignmentRepository.findById(5L))
				.thenReturn(Optional.of(assignment(5L, 3L, AssignmentStatus.CLOSED)));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));

		assertApiException(
				() -> assignmentService.updateAssignment(5L, new UpdateAssignmentCommand(
						"Updated", null, null, null, null)),
				"Không thể sửa bài tập đã đóng.");
		verify(assignmentRepository, never()).save(any());
	}

	@Test
	void teacherSoftDeletesAssignmentOwnedByTheirClass() {
		givenCaller(user(10L, UserRole.TEACHER));
		Assignment assignment = assignment(5L, 3L, AssignmentStatus.DRAFT);
		when(assignmentRepository.findById(5L)).thenReturn(Optional.of(assignment));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));

		assignmentService.deleteAssignment(5L);

		assertThat(assignment.deleted()).isTrue();
		verify(assignmentRepository).save(assignment);
	}

	@Test
	void studentCannotDeleteAssignment() {
		givenCaller(user(41L, UserRole.STUDENT));

		assertApiException(
				() -> assignmentService.deleteAssignment(5L),
				"Bạn không có quyền thực hiện thao tác này.");
		verify(assignmentRepository, never()).findById(any());
	}

	@Test
	void adminCannotDeleteAssignment() {
		givenCaller(user(1L, UserRole.ADMIN));

		assertApiException(
				() -> assignmentService.deleteAssignment(5L),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void teacherCanPublishThenCloseAssignment() {
		givenCaller(user(10L, UserRole.TEACHER));
		Assignment assignment = assignment(5L, 3L, AssignmentStatus.DRAFT);
		when(assignmentRepository.findById(5L)).thenReturn(Optional.of(assignment));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));

		assertThat(assignmentService.updateStatus(5L,
				new UpdateAssignmentStatusCommand("PUBLISHED"))).isEqualTo(AssignmentStatus.PUBLISHED);
		assertThat(assignment.status()).isEqualTo(AssignmentStatus.PUBLISHED);

		assertThat(assignmentService.updateStatus(5L,
				new UpdateAssignmentStatusCommand("CLOSED"))).isEqualTo(AssignmentStatus.CLOSED);
		assertThat(assignment.status()).isEqualTo(AssignmentStatus.CLOSED);
	}

	@Test
	void teacherCannotMoveAssignmentBackwards() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(assignmentRepository.findById(5L))
				.thenReturn(Optional.of(assignment(5L, 3L, AssignmentStatus.PUBLISHED)));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));

		assertApiException(
				() -> assignmentService.updateStatus(5L, new UpdateAssignmentStatusCommand("DRAFT")),
				"Không thể chuyển sang trạng thái này.");
		verify(assignmentRepository, never()).save(any());
	}

	@Test
	void studentCannotChangeAssignmentStatus() {
		givenCaller(user(41L, UserRole.STUDENT));

		assertApiException(
				() -> assignmentService.updateStatus(5L, new UpdateAssignmentStatusCommand("PUBLISHED")),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void adminCannotChangeAssignmentStatus() {
		givenCaller(user(1L, UserRole.ADMIN));

		assertApiException(
				() -> assignmentService.updateStatus(5L, new UpdateAssignmentStatusCommand("PUBLISHED")),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void invalidStatusReturnsTheContractMessage() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(assignmentRepository.findById(5L))
				.thenReturn(Optional.of(assignment(5L, 3L, AssignmentStatus.DRAFT)));
		when(classRepository.findById(3L)).thenReturn(Optional.of(englishClass(3L, 10L)));

		assertApiException(
				() -> assignmentService.updateStatus(5L, new UpdateAssignmentStatusCommand("OPEN")),
				"Không thể chuyển sang trạng thái này.");
	}

	private void givenCaller(User user) {
		when(currentUserProvider.requireActiveUser()).thenReturn(user);
	}

	private CreateAssignmentCommand validCreateCommand() {
		return new CreateAssignmentCommand("Weekly Test 1", null, OPEN_AT, CLOSE_AT, 2);
	}

	private Assignment assignment(Long id, Long classId, AssignmentStatus status) {
		return new Assignment(
				id,
				classId,
				"Weekly Test 1",
				"Instructions",
				OPEN_AT,
				CLOSE_AT,
				2,
				status,
				false,
				null,
				null);
	}

	private EnglishClass englishClass(Long id, Long teacherId) {
		EnglishClass englishClass = new EnglishClass(
				"IELTS 6.5 - K12",
				"Intermediate",
				"Luyện IELTS",
				java.time.LocalDate.of(2026, 9, 15),
				null,
				ClassStatus.ACTIVE,
				teacherId);
		englishClass.setId(id);
		return englishClass;
	}

	private User user(Long id, UserRole role) {
		User user = User.create(
				role.name(),
				role.name().toLowerCase() + "@englishhub.test",
				null,
				null,
				null,
				role,
				UserStatus.ACTIVE,
				null,
				null,
				null,
				null);
		user.setId(id);
		return user;
	}

	private void assertApiException(ThrowingOperation operation, String message) {
		assertThatThrownBy(operation::run)
				.isInstanceOf(ApiException.class)
				.hasMessage(message);
	}

	@FunctionalInterface
	private interface ThrowingOperation {
		void run();
	}
}
