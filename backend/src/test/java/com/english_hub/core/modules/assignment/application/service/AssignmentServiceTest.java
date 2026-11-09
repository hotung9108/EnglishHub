package com.english_hub.core.modules.assignment.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.assignment.application.command.CreateAssignmentCommand;
import com.english_hub.core.modules.assignment.application.command.UpdateAssignmentCommand;
import com.english_hub.core.modules.assignment.application.command.UpdateAssignmentStatusCommand;
import com.english_hub.core.modules.assignment.application.page.AssignmentPageRequest;
import com.english_hub.core.modules.assignment.application.service.AssignmentService.AssignmentListResult;
import com.english_hub.core.modules.assignment.domain.model.Assignment;
import com.english_hub.core.modules.assignment.domain.model.AssignmentModuleSummary;
import com.english_hub.core.modules.assignment.domain.model.AssignmentPage;
import com.english_hub.core.modules.assignment.domain.model.AssignmentStatus;
import com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository;
import com.english_hub.core.modules.classroom.domain.model.ClassAccess;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class AssignmentServiceTest {

	private static final OffsetDateTime OPEN_AT = OffsetDateTime.parse("2026-09-15T00:00:00Z");
	private static final OffsetDateTime CLOSE_AT = OffsetDateTime.parse("2026-09-20T23:59:00Z");

	@Mock
	private AssignmentRepository assignmentRepository;

	@Mock
	private ClassRepository classRepository;

	@Mock
	private CurrentUserProvider currentUserProvider;

	private AssignmentService assignmentService;

	@BeforeEach
	void setUp() {
		assignmentService = new AssignmentService(
				assignmentRepository,
				classRepository,
				currentUserProvider);
	}

	@Test
	void teacherCanListAssignmentsForOwnedClassWithStatusFilter() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
		AssignmentPage expected = new AssignmentPage(List.of(assignment(5L, 3L, AssignmentStatus.PUBLISHED)), 1, 20, 1);
		when(assignmentRepository.findPage(eq(3L), eq(AssignmentStatus.PUBLISHED), any())).thenReturn(expected);
		when(assignmentRepository.findSkillsByAssignmentIds(List.of(5L)))
				.thenReturn(Map.of(5L, List.of(ModuleSkill.READING)));

		AssignmentListResult actual = assignmentService.listAssignments("PUBLISHED", 3L, 1, 20);

		assertThat(actual.assignmentPage()).isSameAs(expected);
		assertThat(actual.skillsFor(5L)).containsExactly(ModuleSkill.READING);
		verify(assignmentRepository).findPage(eq(3L), eq(AssignmentStatus.PUBLISHED), any());
	}

	@Test
	void listAssignmentsLoadsSkillsInOneBatchForCurrentPage() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
		AssignmentPage page = new AssignmentPage(List.of(
				assignment(6L, 3L, AssignmentStatus.PUBLISHED),
				assignment(5L, 3L, AssignmentStatus.PUBLISHED)), 2, 2, 5);
		when(assignmentRepository.findPage(eq(3L), eq(AssignmentStatus.PUBLISHED), any())).thenReturn(page);
		Map<Long, List<ModuleSkill>> skills = Map.of(
				6L, List.of(ModuleSkill.READING, ModuleSkill.WRITING),
				5L, List.of(ModuleSkill.LISTENING));
		when(assignmentRepository.findSkillsByAssignmentIds(List.of(6L, 5L))).thenReturn(skills);

		AssignmentListResult result = assignmentService.listAssignments("PUBLISHED", 3L, 2, 2);

		assertThat(result.skillsByAssignmentId()).isEqualTo(skills);
		assertThat(result.skillsFor(6L)).containsExactly(ModuleSkill.READING, ModuleSkill.WRITING);
		assertThat(result.skillsFor(5L)).containsExactly(ModuleSkill.LISTENING);
		verify(assignmentRepository, times(1)).findSkillsByAssignmentIds(List.of(6L, 5L));
		verify(assignmentRepository, never()).findModuleSummaries(any());
	}

	@Test
	void emptyPageDoesNotLoadSkills() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
		AssignmentPage page = new AssignmentPage(List.of(), 3, 2, 4);
		when(assignmentRepository.findPage(eq(3L), eq(null), any())).thenReturn(page);

		AssignmentListResult result = assignmentService.listAssignments(null, 3L, 3, 2);

		assertThat(result.assignmentPage()).isSameAs(page);
		assertThat(result.skillsByAssignmentId()).isEmpty();
		verify(assignmentRepository, never()).findSkillsByAssignmentIds(any());
		verify(assignmentRepository, never()).findModuleSummaries(any());
	}

	@Test
	void assignmentWithoutModulesHasEmptySkills() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
		AssignmentPage page = new AssignmentPage(
				List.of(assignment(5L, 3L, AssignmentStatus.DRAFT)), 1, 20, 1);
		when(assignmentRepository.findPage(eq(3L), eq(null), any())).thenReturn(page);
		when(assignmentRepository.findSkillsByAssignmentIds(List.of(5L))).thenReturn(Map.of());

		AssignmentListResult result = assignmentService.listAssignments(null, 3L, 1, 20);

		assertThat(result.skillsFor(5L)).isNotNull().isEmpty();
	}

	@Test
	void listAssignmentsPreservesPageMetadata() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
		AssignmentPage page = new AssignmentPage(
				List.of(assignment(5L, 3L, AssignmentStatus.PUBLISHED)), 2, 1, 7);
		when(assignmentRepository.findPage(eq(3L), eq(null), any())).thenReturn(page);
		when(assignmentRepository.findSkillsByAssignmentIds(List.of(5L))).thenReturn(Map.of());

		AssignmentListResult result = assignmentService.listAssignments(null, 3L, 2, 1);

		assertThat(result.assignmentPage()).isSameAs(page);
		assertThat(result.assignmentPage().page()).isEqualTo(2);
		assertThat(result.assignmentPage().limit()).isEqualTo(1);
		assertThat(result.assignmentPage().total()).isEqualTo(7);
	}

	@ParameterizedTest
	@NullAndEmptySource
	@ValueSource(strings = {" ", "   "})
	void studentCanListAssignmentsForAClassTheyAttend(String status) {
		givenCaller(user(41L, UserRole.STUDENT));
		when(classRepository.findAccess(3L, 41L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, true)));
		AssignmentPage page = new AssignmentPage(List.of(
				assignment(6L, 3L, AssignmentStatus.PUBLISHED),
				assignment(5L, 3L, AssignmentStatus.CLOSED)), 2, 2, 3);
		when(assignmentRepository.findPageExcludingDraft(eq(3L), any())).thenReturn(page);
		Map<Long, List<ModuleSkill>> skills = Map.of(
				6L, List.of(ModuleSkill.READING),
				5L, List.of(ModuleSkill.LISTENING));
		when(assignmentRepository.findSkillsByAssignmentIds(List.of(6L, 5L))).thenReturn(skills);

		AssignmentListResult result = assignmentService.listAssignments(status, 3L, 2, 2);

		assertThat(result.assignmentPage()).isSameAs(page);
		assertThat(result.skillsByAssignmentId()).isEqualTo(skills);
		var pageCaptor = org.mockito.ArgumentCaptor.forClass(AssignmentPageRequest.class);
		verify(assignmentRepository).findPageExcludingDraft(eq(3L), pageCaptor.capture());
		assertThat(pageCaptor.getValue().page()).isEqualTo(2);
		assertThat(pageCaptor.getValue().limit()).isEqualTo(2);
		verify(assignmentRepository, never()).findPage(any(), any(), any());
		verify(assignmentRepository, times(1)).findSkillsByAssignmentIds(List.of(6L, 5L));
		verify(assignmentRepository, never()).findModuleSummaries(any());
	}

	@ParameterizedTest
	@ValueSource(strings = {"DRAFT", "draft", " Draft ", " draft "})
	void studentCannotFilterDraftAssignments(String status) {
		givenCaller(user(41L, UserRole.STUDENT));
		when(classRepository.findAccess(3L, 41L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, true)));

		ApiException exception = assertApiException(
				() -> assignmentService.listAssignments(status, 3L, 1, 20),
				"Bạn không có quyền thực hiện thao tác này.");

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
		verifyNoInteractions(assignmentRepository);
	}

	@ParameterizedTest
	@EnumSource(value = AssignmentStatus.class, names = {"PUBLISHED", "CLOSED"})
	void studentCanFilterPublishedAndClosedAssignments(AssignmentStatus status) {
		givenCaller(user(41L, UserRole.STUDENT));
		when(classRepository.findAccess(3L, 41L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, true)));
		AssignmentPage page = new AssignmentPage(List.of(assignment(5L, 3L, status)), 1, 20, 1);
		when(assignmentRepository.findPage(eq(3L), eq(status), any())).thenReturn(page);
		when(assignmentRepository.findSkillsByAssignmentIds(List.of(5L))).thenReturn(Map.of());

		AssignmentListResult result = assignmentService.listAssignments(status.name(), 3L, 1, 20);

		assertThat(result.assignmentPage()).isSameAs(page);
		verify(assignmentRepository).findPage(eq(3L), eq(status), any());
		verify(assignmentRepository, never()).findPageExcludingDraft(any(), any());
	}

	@ParameterizedTest
	@MethodSource("listValidationCases")
	void listValidationOrderIsPreserved(UserRole role, String status, int page, int limit, String message) {
		long callerId = role == UserRole.STUDENT ? 41L : 10L;
		givenCaller(user(callerId, role));
		when(classRepository.findAccess(3L, callerId))
				.thenReturn(Optional.of(new ClassAccess(3L, 10L, role == UserRole.STUDENT)));

		ApiException exception = assertApiException(
				() -> assignmentService.listAssignments(status, 3L, page, limit), message);

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
		verifyNoInteractions(assignmentRepository);
	}

	@ParameterizedTest
	@CsvSource({"true, DRAFT", "true, OPEN", "false, DRAFT", "false, OPEN"})
	void classAccessPrecedesListValidation(boolean classExists, String status) {
		givenCaller(user(41L, UserRole.STUDENT));
		Optional<ClassAccess> access = classExists
				? Optional.of(new ClassAccess(3L, 10L, false))
				: Optional.empty();
		when(classRepository.findAccess(3L, 41L)).thenReturn(access);
		String message = classExists ? "Bạn không có quyền thực hiện thao tác này." : "Không tìm thấy lớp học.";

		ApiException exception = assertApiException(
				() -> assignmentService.listAssignments(status, 3L, 0, 0), message);

		assertThat(exception.getStatus()).isEqualTo(classExists ? HttpStatus.FORBIDDEN : HttpStatus.NOT_FOUND);
		verifyNoInteractions(assignmentRepository);
	}

	@Test
	void teacherCanFilterDraftAssignments() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
		AssignmentPage page = new AssignmentPage(List.of(assignment(5L, 3L, AssignmentStatus.DRAFT)), 1, 20, 1);
		when(assignmentRepository.findPage(eq(3L), eq(AssignmentStatus.DRAFT), any())).thenReturn(page);
		when(assignmentRepository.findSkillsByAssignmentIds(List.of(5L))).thenReturn(Map.of());

		AssignmentListResult result = assignmentService.listAssignments("DRAFT", 3L, 1, 20);

		assertThat(result.assignmentPage()).isSameAs(page);
		verify(assignmentRepository).findPage(eq(3L), eq(AssignmentStatus.DRAFT), any());
		verify(assignmentRepository, never()).findPageExcludingDraft(any(), any());
	}

	@Test
	void emptyStudentPageDoesNotLoadSkills() {
		givenCaller(user(41L, UserRole.STUDENT));
		when(classRepository.findAccess(3L, 41L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, true)));
		AssignmentPage page = new AssignmentPage(List.of(), 1, 20, 0);
		when(assignmentRepository.findPageExcludingDraft(eq(3L), any())).thenReturn(page);

		AssignmentListResult result = assignmentService.listAssignments(null, 3L, 1, 20);

		assertThat(result.assignmentPage()).isSameAs(page);
		assertThat(result.skillsByAssignmentId()).isEmpty();
		verify(assignmentRepository, never()).findSkillsByAssignmentIds(any());
		verify(assignmentRepository, never()).findModuleSummaries(any());
		verify(assignmentRepository, never()).findPage(any(), any(), any());
	}

	@Test
	void adminCanListClassAssignmentsWithAllStatuses() {
		givenCaller(user(1L, UserRole.ADMIN));
		when(classRepository.findAccess(3L, 1L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
		AssignmentPage page = new AssignmentPage(List.of(
				assignment(7L, 3L, AssignmentStatus.DRAFT),
				assignment(6L, 3L, AssignmentStatus.PUBLISHED),
				assignment(5L, 3L, AssignmentStatus.CLOSED)), 1, 20, 3);
		when(assignmentRepository.findPage(eq(3L), eq(null), any())).thenReturn(page);
		when(assignmentRepository.findSkillsByAssignmentIds(List.of(7L, 6L, 5L))).thenReturn(Map.of());

		AssignmentListResult result = assignmentService.listAssignments(null, 3L, 1, 20);

		assertThat(result.assignmentPage()).isSameAs(page);
		assertThat(result.assignmentPage().assignments()).extracting(Assignment::status)
				.containsExactly(AssignmentStatus.DRAFT, AssignmentStatus.PUBLISHED, AssignmentStatus.CLOSED);
		verify(assignmentRepository).findPage(eq(3L), eq(null), any());
	}

	@Test
	void adminCanListAnEmptyClass() {
		givenCaller(user(1L, UserRole.ADMIN));
		when(classRepository.findAccess(3L, 1L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
		when(assignmentRepository.findPage(eq(3L), eq(null), any()))
				.thenReturn(new AssignmentPage(List.of(), 1, 20, 0));

		AssignmentListResult result = assignmentService.listAssignments(null, 3L, 1, 20);

		assertThat(result.assignmentPage().assignments()).isEmpty();
		assertThat(result.assignmentPage().total()).isZero();
		assertThat(result.skillsByAssignmentId()).isEmpty();
		verify(assignmentRepository, never()).findSkillsByAssignmentIds(any());
	}

	@ParameterizedTest(name = "admin reads {0} class with teacher {1}")
	@CsvSource({"ACTIVE, 10", "COMPLETED, 10", "CANCELLED, 10", "ACTIVE,"})
	void adminCanListClassesRegardlessOfStatusOrTeacher(ClassStatus status, Long teacherId) {
		EnglishClass englishClass = new EnglishClass(
				"Assignment class", "Intermediate", null, OPEN_AT.toLocalDate(), null, status, teacherId);
		englishClass.setId(3L);
		givenCaller(user(1L, UserRole.ADMIN));
		when(classRepository.findAccess(englishClass.getId(), 1L)).thenReturn(Optional.of(
				new ClassAccess(englishClass.getId(), englishClass.getTeacherId(), false)));
		when(assignmentRepository.findPage(eq(3L), eq(null), any()))
				.thenReturn(new AssignmentPage(List.of(), 1, 20, 0));

		AssignmentListResult result = assignmentService.listAssignments(null, 3L, 1, 20);

		assertThat(result.assignmentPage().assignments()).isEmpty();
		verify(classRepository).findAccess(3L, 1L);
		verify(assignmentRepository).findPage(eq(3L), eq(null), any());
	}

	@ParameterizedTest
	@EnumSource(AssignmentStatus.class)
	void adminCanFilterClassAssignmentsByStatus(AssignmentStatus status) {
		givenCaller(user(1L, UserRole.ADMIN));
		when(classRepository.findAccess(3L, 1L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
		AssignmentPage page = new AssignmentPage(List.of(assignment(5L, 3L, status)), 1, 20, 1);
		when(assignmentRepository.findPage(eq(3L), eq(status), any())).thenReturn(page);
		when(assignmentRepository.findSkillsByAssignmentIds(List.of(5L))).thenReturn(Map.of());

		AssignmentListResult result = assignmentService.listAssignments(status.name(), 3L, 1, 20);

		assertThat(result.assignmentPage()).isSameAs(page);
		verify(assignmentRepository).findPage(eq(3L), eq(status), any());
	}

	@Test
	void adminGetsNotFoundForAnAbsentClass() {
		givenCaller(user(1L, UserRole.ADMIN));
		when(classRepository.findAccess(3L, 1L)).thenReturn(Optional.empty());

		ApiException exception = assertThrows(ApiException.class,
				() -> assignmentService.listAssignments(null, 3L, 1, 20));

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
		assertThat(exception).hasMessage("Không tìm thấy lớp học.");
		verifyNoInteractions(assignmentRepository);
	}

	@ParameterizedTest(name = "admin account {0} is rejected before class access")
	@ValueSource(strings = {"LOCKED", "SOFT_DELETED"})
	void inactiveAdminCannotListClassAssignments(String accountState) {
		when(currentUserProvider.requireActiveUser())
				.thenThrow(ApiException.unauthorized("Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."));

		ApiException exception = assertThrows(ApiException.class,
				() -> assignmentService.listAssignments(null, 3L, 1, 20));

		assertThat(exception.getStatus()).as(accountState).isEqualTo(HttpStatus.UNAUTHORIZED);
		verifyNoInteractions(classRepository, assignmentRepository);
	}

	@Test
	void teacherCannotListAnotherTeachersClass() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 99L, false)));

		assertApiException(
				() -> assignmentService.listAssignments(null, 3L, 1, 20),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void rejectsUnknownAssignmentStatusFilter() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));

		assertApiException(
				() -> assignmentService.listAssignments("OPEN", 3L, 1, 20),
				"status không hợp lệ.");
		verify(assignmentRepository, never()).findPage(any(), any(), any());
	}

	@Test
	void studentCannotListAClassTheyDoNotAttend() {
		givenCaller(user(41L, UserRole.STUDENT));
		when(classRepository.findAccess(3L, 41L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));

		assertApiException(
				() -> assignmentService.listAssignments(null, 3L, 1, 20),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void teacherCreatesDraftAssignmentForOwnedClass() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
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

		ApiException exception = assertApiException(
				() -> assignmentService.createAssignment(3L, validCreateCommand()),
				"Bạn không có quyền thực hiện thao tác này.");

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
		verifyNoInteractions(classRepository, assignmentRepository);
	}

	@Test
	void teacherCannotCreateAssignmentForUnassignedClass() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, null, false)));

		assertApiException(
				() -> assignmentService.createAssignment(3L, validCreateCommand()),
				"Lớp học chưa được gán giáo viên phụ trách, không thể tạo bài tập.");
	}

	@Test
	void rejectsInvalidAssignmentWindowAndSubmissionLimit() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));

		assertApiException(
				() -> assignmentService.createAssignment(3L, new CreateAssignmentCommand(
						"Test", null, CLOSE_AT, OPEN_AT, 2)),
				"Dữ liệu thời gian hoặc số lần nộp không hợp lệ.");
		assertApiException(
				() -> assignmentService.createAssignment(3L, new CreateAssignmentCommand(
						"Test", null, OPEN_AT, CLOSE_AT, 0)),
				"Dữ liệu thời gian hoặc số lần nộp không hợp lệ.");
	}

	@ParameterizedTest
	@EnumSource(AssignmentStatus.class)
	void teacherCanReadAssignmentDetailWithModuleSummaries(AssignmentStatus status) {
		givenCaller(user(10L, UserRole.TEACHER));
		when(assignmentRepository.findById(5L))
				.thenReturn(Optional.of(assignment(5L, 3L, status)));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
		when(assignmentRepository.findModuleSummaries(5L))
				.thenReturn(List.of(new AssignmentModuleSummary(9L, "READING")));

		AssignmentService.AssignmentDetailResult result = assignmentService.getAssignmentDetail(5L);

		assertThat(result.assignment().id()).isEqualTo(5L);
		assertThat(result.modules()).containsExactly(new AssignmentModuleSummary(9L, "READING"));
	}

	@ParameterizedTest
	@EnumSource(value = AssignmentStatus.class, names = {"PUBLISHED", "CLOSED"})
	void studentCanReadAssignmentDetailWhenTheyAreAClassMember(AssignmentStatus status) {
		givenCaller(user(41L, UserRole.STUDENT));
		when(assignmentRepository.findById(5L))
				.thenReturn(Optional.of(assignment(5L, 3L, status)));
		when(classRepository.findAccess(3L, 41L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, true)));
		when(assignmentRepository.findModuleSummaries(5L)).thenReturn(List.of());

		assertThat(assignmentService.getAssignmentDetail(5L).modules()).isEmpty();
	}

	@Test
	void studentCannotReadDraftAssignmentDetail() {
		givenCaller(user(41L, UserRole.STUDENT));
		when(assignmentRepository.findById(5L)).thenReturn(Optional.of(assignment(5L, 3L, AssignmentStatus.DRAFT)));
		when(classRepository.findAccess(3L, 41L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, true)));

		ApiException exception = assertApiException(
				() -> assignmentService.getAssignmentDetail(5L), "Bạn không có quyền thực hiện thao tác này.");

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
		verify(assignmentRepository, never()).findModuleSummaries(any());
	}

	@ParameterizedTest
	@ValueSource(strings = {"MISSING", "DELETED", "OUTSIDE_CLASS"})
	void assignmentDetailLookupErrorsArePreserved(String scenario) {
		givenCaller(user(41L, UserRole.STUDENT));
		boolean outsideClass = "OUTSIDE_CLASS".equals(scenario);
		if (outsideClass) {
			when(assignmentRepository.findById(5L)).thenReturn(Optional.of(assignment(5L, 3L, AssignmentStatus.DRAFT)));
			when(classRepository.findAccess(3L, 41L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
		} else {
			// The repository port returns empty for both absent and soft-deleted assignments.
			when(assignmentRepository.findById(5L)).thenReturn(Optional.empty());
		}
		String message = outsideClass ? "Bạn không có quyền thực hiện thao tác này." : "Không tìm thấy bài tập.";

		ApiException exception = assertApiException(() -> assignmentService.getAssignmentDetail(5L), message);

		assertThat(exception.getStatus()).isEqualTo(outsideClass ? HttpStatus.FORBIDDEN : HttpStatus.NOT_FOUND);
		verify(assignmentRepository, never()).findModuleSummaries(any());
		if (!outsideClass) {
			verifyNoInteractions(classRepository);
		}
	}

	@Test
	void adminCannotReadAssignmentDetail() {
		givenCaller(user(1L, UserRole.ADMIN));
		when(assignmentRepository.findById(5L))
				.thenReturn(Optional.of(assignment(5L, 3L, AssignmentStatus.PUBLISHED)));
		when(classRepository.findAccess(3L, 1L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));

		assertApiException(
				() -> assignmentService.getAssignmentDetail(5L),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void teacherCanUpdateAssignmentOwnedByTheirClass() {
		givenCaller(user(10L, UserRole.TEACHER));
		Assignment assignment = assignment(5L, 3L, AssignmentStatus.DRAFT);
		when(assignmentRepository.findById(5L)).thenReturn(Optional.of(assignment));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
		when(assignmentRepository.save(assignment)).thenAnswer(invocation -> invocation.getArgument(0));

		AssignmentService.AssignmentUpdateResult result = assignmentService.updateAssignment(
				5L,
				new UpdateAssignmentCommand("Updated title", null, null, CLOSE_AT.plusDays(1), null));

		verify(assignmentRepository).save(assignment);
		assertThat(result.maxSubmissions()).isEqualTo(2);
		assertThat(assignment.title()).isEqualTo("Updated title");
		assertThat(assignment.closeAt()).isEqualTo(CLOSE_AT.plusDays(1));
	}

	@Test
	void teacherCanUpdateMaxSubmissionsAndReturnsSavedValue() {
		givenCaller(user(10L, UserRole.TEACHER));
		Assignment assignment = assignment(5L, 3L, AssignmentStatus.DRAFT);
		when(assignmentRepository.findById(5L)).thenReturn(Optional.of(assignment));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
		when(assignmentRepository.save(assignment)).thenAnswer(invocation -> invocation.getArgument(0));

		AssignmentService.AssignmentUpdateResult result = assignmentService.updateAssignment(
				5L,
				new UpdateAssignmentCommand(null, null, null, null, 3));

		assertThat(result.maxSubmissions()).isEqualTo(3);
		assertThat(assignment.maxSubmissions()).isEqualTo(3);
		verify(assignmentRepository).save(assignment);
	}

	@Test
	void returnsMaxSubmissionsFromSavedAssignment() {
		givenCaller(user(10L, UserRole.TEACHER));
		Assignment assignment = assignment(5L, 3L, AssignmentStatus.DRAFT);
		Assignment savedAssignment = assignment(5L, 3L, AssignmentStatus.DRAFT);
		savedAssignment.updateDetails(
				savedAssignment.title(),
				savedAssignment.description(),
				savedAssignment.openAt(),
				savedAssignment.closeAt(),
				5);
		when(assignmentRepository.findById(5L)).thenReturn(Optional.of(assignment));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
		when(assignmentRepository.save(assignment)).thenReturn(savedAssignment);

		AssignmentService.AssignmentUpdateResult result = assignmentService.updateAssignment(
				5L,
				new UpdateAssignmentCommand(null, null, null, null, 3));

		assertThat(savedAssignment).isNotSameAs(assignment);
		assertThat(assignment.maxSubmissions()).isEqualTo(3);
		assertThat(result.maxSubmissions()).isEqualTo(5);
		verify(assignmentRepository).save(assignment);
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
	void adminCannotUpdateAssignment() {
		givenCaller(user(1L, UserRole.ADMIN));

		ApiException exception = assertThrows(ApiException.class,
				() -> assignmentService.updateAssignment(5L,
						new UpdateAssignmentCommand("Updated", null, null, null, null)));

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
		verifyNoInteractions(classRepository, assignmentRepository);
	}

	@Test
	void teacherCannotUpdateAssignmentOwnedByAnotherTeacher() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(assignmentRepository.findById(5L))
				.thenReturn(Optional.of(assignment(5L, 3L, AssignmentStatus.DRAFT)));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 99L, false)));

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
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));

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
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));

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

		ApiException exception = assertApiException(
				() -> assignmentService.deleteAssignment(5L),
				"Bạn không có quyền thực hiện thao tác này.");

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
		verifyNoInteractions(classRepository, assignmentRepository);
	}

	@Test
	void teacherCanPublishThenCloseAssignment() {
		givenCaller(user(10L, UserRole.TEACHER));
		Assignment assignment = assignment(5L, 3L, AssignmentStatus.DRAFT);
		when(assignmentRepository.findById(5L)).thenReturn(Optional.of(assignment));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));

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
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));

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

		ApiException exception = assertApiException(
				() -> assignmentService.updateStatus(5L, new UpdateAssignmentStatusCommand("PUBLISHED")),
				"Bạn không có quyền thực hiện thao tác này.");

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
		verifyNoInteractions(classRepository, assignmentRepository);
	}

	@Test
	void invalidStatusReturnsTheContractMessage() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(assignmentRepository.findById(5L))
				.thenReturn(Optional.of(assignment(5L, 3L, AssignmentStatus.DRAFT)));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));

		assertApiException(
				() -> assignmentService.updateStatus(5L, new UpdateAssignmentStatusCommand("OPEN")),
				"Không thể chuyển sang trạng thái này.");
	}

	private static Stream<Arguments> listValidationCases() {
		String invalidData = "Dữ liệu không hợp lệ.";
		String invalidStatus = "status không hợp lệ.";
		return Stream.of(
				Arguments.of(UserRole.STUDENT, "DRAFT", 0, 20, invalidData),
				Arguments.of(UserRole.STUDENT, "DRAFT", 1, 0, invalidData),
				Arguments.of(UserRole.STUDENT, "DRAFT", 1, 101, invalidData),
				Arguments.of(UserRole.STUDENT, "OPEN", 1, 20, invalidStatus),
				Arguments.of(UserRole.STUDENT, "OPEN", 0, 20, invalidStatus),
				Arguments.of(UserRole.STUDENT, "OPEN", 1, 0, invalidStatus),
				Arguments.of(UserRole.STUDENT, "OPEN", 0, 0, invalidStatus),
				Arguments.of(UserRole.TEACHER, "OPEN", 0, 0, invalidStatus),
				Arguments.of(UserRole.ADMIN, "OPEN", 0, 0, invalidStatus),
				Arguments.of(UserRole.STUDENT, null, 0, 20, invalidData),
				Arguments.of(UserRole.STUDENT, null, 1, 0, invalidData),
				Arguments.of(UserRole.STUDENT, "", 0, 20, invalidData),
				Arguments.of(UserRole.STUDENT, "", 1, 0, invalidData),
				Arguments.of(UserRole.STUDENT, "   ", 0, 20, invalidData),
				Arguments.of(UserRole.STUDENT, "   ", 1, 0, invalidData));
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

	private ApiException assertApiException(ThrowingOperation operation, String message) {
		ApiException exception = assertThrows(ApiException.class, operation::run);
		assertThat(exception).hasMessage(message);
		return exception;
	}

	@FunctionalInterface
	private interface ThrowingOperation {
		void run();
	}
}
