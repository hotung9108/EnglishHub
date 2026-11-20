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
import com.english_hub.core.modules.assignment.domain.repository.AssignmentAttemptCountRepository;
import com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository;
import com.english_hub.core.modules.classroom.domain.model.ClassAccess;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
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
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class AssignmentServiceTest {

	private static final OffsetDateTime OPEN_AT = OffsetDateTime.parse("2026-09-15T00:00:00Z");
	private static final OffsetDateTime CLOSE_AT = OffsetDateTime.parse("2026-09-20T23:59:00Z");
	private static final OffsetDateTime REOPEN_NOW = OPEN_AT.plusDays(2);

	@Mock
	private AssignmentRepository assignmentRepository;

	@Mock
	private ClassRepository classRepository;

	@Mock
	private CurrentUserProvider currentUserProvider;

	@Mock
	private AssignmentAttemptCountRepository attemptCountRepository;

	private AssignmentService assignmentService;

	@BeforeEach
	void setUp() {
		assignmentService = new AssignmentService(
				assignmentRepository,
				classRepository,
				currentUserProvider,
				attemptCountRepository);
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
		when(assignmentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(assignment));
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
	void rejectsUpdateWhenAssignmentLockCannotBeAcquired() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(assignmentRepository.findByIdForUpdate(5L))
				.thenThrow(new PessimisticLockingFailureException("Lock timeout"));

		ApiException exception = assertApiException(
				() -> assignmentService.updateAssignment(5L, new UpdateAssignmentCommand(null, null, null, null, 1)),
				"Tài nguyên đang được cập nhật, vui lòng thử lại.");
		assertThat(exception.getStatus()).isEqualTo(HttpStatus.CONFLICT);
		verifyNoInteractions(attemptCountRepository);
		verify(assignmentRepository, never()).save(any());
	}

	@Test
	void teacherCanUpdateMaxSubmissionsAndReturnsSavedValue() {
		givenCaller(user(10L, UserRole.TEACHER));
		Assignment assignment = assignment(5L, 3L, AssignmentStatus.DRAFT);
		when(assignmentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(assignment));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
		when(assignmentRepository.save(assignment)).thenAnswer(invocation -> invocation.getArgument(0));

		AssignmentService.AssignmentUpdateResult result = assignmentService.updateAssignment(
				5L,
				new UpdateAssignmentCommand(null, null, null, null, 3));

		assertThat(result.maxSubmissions()).isEqualTo(3);
		assertThat(assignment.maxSubmissions()).isEqualTo(3);
		verify(assignmentRepository).save(assignment);
		verifyNoInteractions(attemptCountRepository);
	}

	@ParameterizedTest
	@CsvSource(value = {"3, 1, 2", "null, 1, 2"}, nullValues = "null")
	void rejectsCapBelowHighestAttemptCountWithoutChangingAssignment(Integer currentCap, int requestedCap, long highest) {
		Assignment assignment = assignmentWithCap(currentCap);
		givenOwnedAssignment(assignment);
		when(attemptCountRepository.findHighestAttemptCount(assignment.id())).thenReturn(highest);

		ApiException exception = assertApiException(
				() -> assignmentService.updateAssignment(assignment.id(),
						new UpdateAssignmentCommand("Updated", "New instructions", null, CLOSE_AT.plusDays(1), requestedCap)),
				"Số lần nộp tối đa không được nhỏ hơn số lượt đã làm cao nhất của học viên (%d lượt).".formatted(highest));

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
		assertThat(assignment).usingRecursiveComparison().isEqualTo(assignmentWithCap(currentCap));
		verify(assignmentRepository, never()).save(any());
	}

	@ParameterizedTest
	@CsvSource(value = {"3, 2, 2", "3, 1, 0", "null, 2, 2"}, nullValues = "null")
	void savesLowerOrNewCapWhenItCoversTheHighestAttemptCount(Integer currentCap, int requestedCap, long highest) {
		Assignment assignment = assignmentWithCap(currentCap);
		givenOwnedAssignment(assignment);
		when(attemptCountRepository.findHighestAttemptCount(assignment.id())).thenReturn(highest);
		when(assignmentRepository.save(assignment)).thenReturn(assignment);

		AssignmentService.AssignmentUpdateResult result = assignmentService.updateAssignment(assignment.id(),
				new UpdateAssignmentCommand(null, null, null, null, requestedCap));

		assertThat(result.maxSubmissions()).isEqualTo(requestedCap);
		assertThat(assignment.maxSubmissions()).isEqualTo(requestedCap);
		verify(assignmentRepository).save(assignment);
	}

	@ParameterizedTest
	@CsvSource(value = {"2, 2, 2", "2, 3, 3", "2, null, 2", "null, null, null"}, nullValues = "null")
	void updatesWithoutCountingAttemptsWhenCapDoesNotDecrease(Integer currentCap, Integer requestedCap, Integer expectedCap) {
		Assignment assignment = assignmentWithCap(currentCap);
		givenOwnedAssignment(assignment);
		when(assignmentRepository.save(assignment)).thenReturn(assignment);

		AssignmentService.AssignmentUpdateResult result = assignmentService.updateAssignment(assignment.id(),
				new UpdateAssignmentCommand("Updated title", null, null, null, requestedCap));

		assertThat(result.maxSubmissions()).isEqualTo(expectedCap);
		assertThat(assignment.maxSubmissions()).isEqualTo(expectedCap);
		assertThat(assignment.title()).isEqualTo("Updated title");
		verifyNoInteractions(attemptCountRepository);
	}

	@ParameterizedTest
	@ValueSource(ints = {0, -1})
	void rejectsNonPositiveCapBeforeCountingAttempts(int requestedCap) {
		Assignment assignment = assignmentWithCap(2);
		givenOwnedAssignment(assignment);

		ApiException exception = assertApiException(
				() -> assignmentService.updateAssignment(assignment.id(),
						new UpdateAssignmentCommand(null, null, null, null, requestedCap)),
				"Dữ liệu thời gian hoặc số lần nộp không hợp lệ.");

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
		assertThat(assignment.maxSubmissions()).isEqualTo(2);
		verifyNoInteractions(attemptCountRepository);
		verify(assignmentRepository, never()).save(any());
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
		when(assignmentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(assignment));
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
		verify(assignmentRepository, never()).findByIdForUpdate(any());
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
		when(assignmentRepository.findByIdForUpdate(5L))
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
		when(assignmentRepository.findByIdForUpdate(5L))
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
		when(assignmentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(assignment));
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
		verify(assignmentRepository, never()).findByIdForUpdate(any());
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
	void teacherCanPublishThenCloseAssignmentWithDefaultClock() {
		givenCaller(user(10L, UserRole.TEACHER));
		Assignment assignment = assignment(5L, 3L, AssignmentStatus.DRAFT);
		when(assignmentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(assignment));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));

		assertThat(assignmentService.updateStatus(5L,
				new UpdateAssignmentStatusCommand("PUBLISHED", null))).isEqualTo(AssignmentStatus.PUBLISHED);
		assertThat(assignment.status()).isEqualTo(AssignmentStatus.PUBLISHED);

		assertThat(assignmentService.updateStatus(5L,
				new UpdateAssignmentStatusCommand("CLOSED", null))).isEqualTo(AssignmentStatus.CLOSED);
		assertThat(assignment.status()).isEqualTo(AssignmentStatus.CLOSED);
	}

	@ParameterizedTest
	@CsvSource({
			"DRAFT, DRAFT", "DRAFT, CLOSED",
			"PUBLISHED, DRAFT", "PUBLISHED, PUBLISHED",
			"CLOSED, DRAFT", "CLOSED, CLOSED"
	})
	void rejectsInvalidAssignmentStatusTransition(AssignmentStatus current, String target) {
		Assignment assignment = assignment(5L, 3L, current);
		givenOwnedAssignment(assignment);

		ApiException exception = assertApiException(
				() -> assignmentService.updateStatus(5L, new UpdateAssignmentStatusCommand(target, null)),
				"Không thể chuyển sang trạng thái này.");

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
		assertThat(assignment.status()).isEqualTo(current);
		assertThat(assignment.closeAt()).isEqualTo(CLOSE_AT);
		verify(assignmentRepository, never()).save(any());
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("validReopenDeadlines")
	void reopensAssignmentAndSavesEffectiveDeadline(String scenario, OffsetDateTime storedCloseAt,
			OffsetDateTime requestedCloseAt, OffsetDateTime expectedCloseAt) {
		Assignment assignment = closedAssignmentWithWindow(OPEN_AT, storedCloseAt);
		givenOwnedAssignment(assignment);

		AssignmentStatus status = serviceWithFixedClock().updateStatus(
				5L, new UpdateAssignmentStatusCommand("PUBLISHED", requestedCloseAt));

		assertThat(status).isEqualTo(AssignmentStatus.PUBLISHED);
		assertThat(assignment.status()).isEqualTo(AssignmentStatus.PUBLISHED);
		assertThat(assignment.closeAt()).isEqualTo(expectedCloseAt);
		assertThat(assignment.openAt()).isEqualTo(OPEN_AT);
		verify(assignmentRepository).save(assignment);
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("invalidReopenDeadlines")
	void rejectsInvalidReopenDeadlineWithoutSaving(String scenario, OffsetDateTime openAt, OffsetDateTime storedCloseAt,
			OffsetDateTime requestedCloseAt, String message) {
		Assignment assignment = closedAssignmentWithWindow(openAt, storedCloseAt);
		givenOwnedAssignment(assignment);
		AssignmentService service = serviceWithFixedClock();

		ApiException exception = assertApiException(
				() -> service.updateStatus(5L, new UpdateAssignmentStatusCommand("PUBLISHED", requestedCloseAt)), message);

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
		assertThat(assignment.status()).isEqualTo(AssignmentStatus.CLOSED);
		assertThat(assignment.closeAt()).isEqualTo(storedCloseAt);
		verify(assignmentRepository, never()).save(any());
	}

	@ParameterizedTest
	@CsvSource({"DRAFT, PUBLISHED", "PUBLISHED, PUBLISHED", "PUBLISHED, CLOSED", "CLOSED, DRAFT"})
	void rejectsDeadlineOnTransitionsOtherThanReopen(AssignmentStatus current, String target) {
		Assignment assignment = assignment(5L, 3L, current);
		givenOwnedAssignment(assignment);

		ApiException exception = assertApiException(
				() -> assignmentService.updateStatus(5L, new UpdateAssignmentStatusCommand(target, CLOSE_AT.plusDays(1))),
				"Chỉ được cập nhật hạn nộp khi mở lại bài tập.");

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
		assertThat(assignment.status()).isEqualTo(current);
		assertThat(assignment.closeAt()).isEqualTo(CLOSE_AT);
		verify(assignmentRepository, never()).save(any());
	}

	@Test
	void cannotReopenMissingAssignment() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(assignmentRepository.findByIdForUpdate(5L)).thenReturn(Optional.empty());

		ApiException exception = assertApiException(
				() -> assignmentService.updateStatus(5L, new UpdateAssignmentStatusCommand("PUBLISHED", null)),
				"Không tìm thấy bài tập.");

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
		verifyNoInteractions(classRepository);
		verify(assignmentRepository, never()).save(any());
	}

	@Test
	void teacherCannotReopenAssignmentOwnedByAnotherTeacher() {
		givenCaller(user(10L, UserRole.TEACHER));
		Assignment assignment = assignment(5L, 3L, AssignmentStatus.CLOSED);
		when(assignmentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(assignment));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 99L, false)));

		ApiException exception = assertApiException(
				() -> assignmentService.updateStatus(5L, new UpdateAssignmentStatusCommand("PUBLISHED", null)),
				"Bạn không có quyền thực hiện thao tác này.");

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
		assertThat(assignment.status()).isEqualTo(AssignmentStatus.CLOSED);
		verify(assignmentRepository, never()).save(any());
	}

	@Test
	void studentCannotChangeAssignmentStatus() {
		givenCaller(user(41L, UserRole.STUDENT));

		ApiException exception = assertApiException(
				() -> assignmentService.updateStatus(5L, new UpdateAssignmentStatusCommand("PUBLISHED", null)),
				"Bạn không có quyền thực hiện thao tác này.");
		assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
		verifyNoInteractions(classRepository, assignmentRepository);
	}

	@Test
	void adminCannotChangeAssignmentStatus() {
		givenCaller(user(1L, UserRole.ADMIN));

		ApiException exception = assertApiException(
				() -> assignmentService.updateStatus(5L, new UpdateAssignmentStatusCommand("PUBLISHED", null)),
				"Bạn không có quyền thực hiện thao tác này.");

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
		verifyNoInteractions(classRepository, assignmentRepository);
	}

	@ParameterizedTest
	@NullAndEmptySource
	@ValueSource(strings = {"OPEN"})
	void invalidStatusReturnsTheContractMessage(String target) {
		givenOwnedAssignment(assignment(5L, 3L, AssignmentStatus.DRAFT));

		ApiException exception = assertApiException(
				() -> assignmentService.updateStatus(5L, new UpdateAssignmentStatusCommand(target, null)),
				"Không thể chuyển sang trạng thái này.");

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
		verify(assignmentRepository, never()).save(any());
	}

	private static Stream<Arguments> validReopenDeadlines() {
		OffsetDateTime newCloseAt = CLOSE_AT.plusDays(1);
		OffsetDateTime nextNanosecond = REOPEN_NOW.plusNanos(1);
		return Stream.of(
				Arguments.of("extend expired deadline", REOPEN_NOW.minusDays(1), newCloseAt, newCloseAt),
				Arguments.of("keep future deadline", CLOSE_AT, null, CLOSE_AT),
				Arguments.of("deadline just after now", CLOSE_AT, nextNanosecond, nextNanosecond));
	}

	private static Stream<Arguments> invalidReopenDeadlines() {
		String notFuture = "Hạn nộp khi mở lại phải sau thời điểm hiện tại.";
		String notAfterOpen = "Hạn nộp phải sau thời điểm mở bài.";
		return Stream.of(
				Arguments.of("expired stored deadline", OPEN_AT, REOPEN_NOW.minusDays(1), null, notFuture),
				Arguments.of("new deadline equals now", OPEN_AT, CLOSE_AT, REOPEN_NOW, notFuture),
				Arguments.of("new deadline before now", OPEN_AT, CLOSE_AT, REOPEN_NOW.minusNanos(1), notFuture),
				Arguments.of("new deadline equals openAt", OPEN_AT, CLOSE_AT, OPEN_AT, notAfterOpen),
				Arguments.of("new deadline before openAt", OPEN_AT, CLOSE_AT, OPEN_AT.minusDays(1), notAfterOpen),
				Arguments.of("new deadline after now but before future openAt",
						REOPEN_NOW.plusDays(2), CLOSE_AT, REOPEN_NOW.plusDays(1), notAfterOpen));
	}

	private AssignmentService serviceWithFixedClock() {
		Clock clock = Clock.fixed(REOPEN_NOW.toInstant(), ZoneOffset.UTC);
		return new AssignmentService(assignmentRepository, classRepository, currentUserProvider, attemptCountRepository, clock);
	}

	private Assignment assignmentWithCap(Integer cap) {
		Assignment assignment = assignment(5L, 3L, AssignmentStatus.PUBLISHED);
		assignment.updateDetails(assignment.title(), assignment.description(), OPEN_AT, CLOSE_AT, cap);
		return assignment;
	}

	private void givenOwnedAssignment(Assignment assignment) {
		givenCaller(user(10L, UserRole.TEACHER));
		when(assignmentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(assignment));
		when(classRepository.findAccess(3L, 10L)).thenReturn(Optional.of(new ClassAccess(3L, 10L, false)));
	}

	private Assignment closedAssignmentWithWindow(OffsetDateTime openAt, OffsetDateTime closeAt) {
		Assignment assignment = assignment(5L, 3L, AssignmentStatus.CLOSED);
		assignment.updateDetails(assignment.title(), assignment.description(), openAt, closeAt, assignment.maxSubmissions());
		return assignment;
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
