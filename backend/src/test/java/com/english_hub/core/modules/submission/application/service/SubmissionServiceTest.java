package com.english_hub.core.modules.submission.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.submission.application.service.SubmissionService.ModuleEntry;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionStartResult;
import com.english_hub.core.modules.submission.domain.model.AssignmentStatus;
import com.english_hub.core.modules.submission.domain.model.AssignmentWindow;
import com.english_hub.core.modules.submission.domain.model.GradingDraft;
import com.english_hub.core.modules.submission.domain.model.GradingMethod;
import com.english_hub.core.modules.submission.domain.model.ModuleInfo;
import com.english_hub.core.modules.submission.domain.model.ModuleSkill;
import com.english_hub.core.modules.submission.domain.model.ModuleTaskType;
import com.english_hub.core.modules.submission.domain.model.Submission;
import com.english_hub.core.modules.submission.domain.model.SubmissionModule;
import com.english_hub.core.modules.submission.domain.model.SubmissionStatus;
import com.english_hub.core.modules.submission.domain.repository.AssignmentModuleRepository;
import com.english_hub.core.modules.submission.domain.repository.AssignmentWindowRepository;
import com.english_hub.core.modules.submission.domain.repository.GradingRepository;
import com.english_hub.core.modules.submission.domain.repository.StudentClassEnrollmentRepository;
import com.english_hub.core.modules.submission.domain.repository.SubmissionModuleRepository;
import com.english_hub.core.modules.submission.domain.repository.SubmissionRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubmissionServiceTest {

	@Mock
	private SubmissionRepository submissionRepository;

	@Mock
	private SubmissionModuleRepository submissionModuleRepository;

	@Mock
	private GradingRepository gradingRepository;

	@Mock
	private AssignmentWindowRepository assignmentWindowRepository;

	@Mock
	private AssignmentModuleRepository assignmentModuleRepository;

	@Mock
	private StudentClassEnrollmentRepository studentClassEnrollmentRepository;

	@Mock
	private CurrentUserProvider currentUserProvider;

	private SubmissionService submissionService;

	@BeforeEach
	void setUp() {
		submissionService = new SubmissionService(
				submissionRepository,
				submissionModuleRepository,
				gradingRepository,
				assignmentWindowRepository,
				assignmentModuleRepository,
				studentClassEnrollmentRepository,
				currentUserProvider);
	}

	@Test
	void createsFirstAttemptWithModulesAndGradings() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		when(assignmentWindowRepository.findWindowById(5L)).thenReturn(Optional.of(window(5L, open(), close(), 2)));
		when(studentClassEnrollmentRepository.isStudentInClass(41L, 3L)).thenReturn(true);
		when(submissionRepository.countByAssignmentIdAndStudentId(5L, 41L)).thenReturn(0L);

		Submission submission = submission(5L, 41L, 1);
		submission.setId(10L);
		when(submissionRepository.create(5L, 41L, 1)).thenReturn(submission);

		when(assignmentModuleRepository.findModulesByAssignmentId(5L)).thenReturn(List.of(
				new ModuleInfo(9L, 5L, ModuleSkill.READING, ModuleTaskType.QUIZ, 1),
				new ModuleInfo(10L, 5L, ModuleSkill.WRITING, ModuleTaskType.ESSAY, 2)));

		SubmissionModule quizModule = module(9L);
		quizModule.setId(100L);
		SubmissionModule essayModule = module(10L);
		essayModule.setId(101L);
		when(submissionModuleRepository.bulkCreate(10L, List.of(9L, 10L)))
				.thenReturn(List.of(quizModule, essayModule));

		SubmissionStartResult result = submissionService.startAttempt(5L);

		assertThat(result.submissionId()).isEqualTo(10L);
		assertThat(result.assignmentId()).isEqualTo(5L);
		assertThat(result.attemptNumber()).isEqualTo(1);
		assertThat(result.status()).isEqualTo(SubmissionStatus.IN_PROGRESS);
		assertThat(result.createdAt()).isNotNull();
		assertThat(result.modules()).hasSize(2);
		assertThat(result.modules()).extracting(ModuleEntry::moduleId).containsExactly(9L, 10L);
		assertThat(result.modules()).extracting(ModuleEntry::submissionModuleId).containsExactly(100L, 101L);
		assertThat(result.modules()).extracting(ModuleEntry::skill).containsExactly(ModuleSkill.READING, ModuleSkill.WRITING);
		assertThat(result.modules()).extracting(ModuleEntry::status).containsOnly(SubmissionStatus.IN_PROGRESS);

		@SuppressWarnings("unchecked")
		ArgumentCaptor<List<GradingDraft>> draftsCaptor = ArgumentCaptor.forClass(List.class);
		verify(gradingRepository).bulkCreate(draftsCaptor.capture());
		List<GradingDraft> drafts = draftsCaptor.getValue();
		assertThat(drafts).hasSize(2);
		assertThat(drafts).extracting(GradingDraft::submissionModuleId).containsExactly(100L, 101L);
		assertThat(drafts).extracting(GradingDraft::method)
				.containsExactly(GradingMethod.AUTO, GradingMethod.TEACHER_MANUAL);
	}

	@Test
	void incrementsTheAttemptNumberOnASecondAttempt() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		when(assignmentWindowRepository.findWindowById(5L)).thenReturn(Optional.of(window(5L, open(), close(), 2)));
		when(studentClassEnrollmentRepository.isStudentInClass(41L, 3L)).thenReturn(true);
		when(submissionRepository.countByAssignmentIdAndStudentId(5L, 41L)).thenReturn(1L);

		Submission submission = submission(5L, 41L, 2);
		submission.setId(11L);
		when(submissionRepository.create(5L, 41L, 2)).thenReturn(submission);
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(new ModuleInfo(9L, 5L, ModuleSkill.READING, ModuleTaskType.QUIZ, 1)));
		SubmissionModule firstModule = module(9L);
		firstModule.setId(102L);
		when(submissionModuleRepository.bulkCreate(11L, List.of(9L)))
				.thenReturn(List.of(firstModule));

		SubmissionStartResult result = submissionService.startAttempt(5L);

		assertThat(result.attemptNumber()).isEqualTo(2);
		verify(submissionRepository).create(5L, 41L, 2);
	}

	@Test
	void rejectsAnAssignmentThatIsNotPublished() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		when(assignmentWindowRepository.findWindowById(5L))
				.thenReturn(Optional.of(new AssignmentWindow(5L, 3L, AssignmentStatus.DRAFT, open(), close(), 2, false)));
		when(studentClassEnrollmentRepository.isStudentInClass(41L, 3L)).thenReturn(true);

		assertThatThrownBy(() -> submissionService.startAttempt(5L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không thể bắt đầu làm bài tập này lúc này.");
		verify(submissionRepository, never()).create(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyInt());
	}

	@Test
	void rejectsAnAssignmentThatIsNotOpenYet() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		when(assignmentWindowRepository.findWindowById(5L))
				.thenReturn(Optional.of(window(5L, OffsetDateTime.now().plusMinutes(30), close(), 2)));
		when(studentClassEnrollmentRepository.isStudentInClass(41L, 3L)).thenReturn(true);

		assertThatThrownBy(() -> submissionService.startAttempt(5L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không thể bắt đầu làm bài tập này lúc này.");
	}

	@Test
	void rejectsAnAssignmentThatIsAlreadyClosed() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		when(assignmentWindowRepository.findWindowById(5L))
				.thenReturn(Optional.of(window(5L, open(), OffsetDateTime.now().minusMinutes(5), 2)));
		when(studentClassEnrollmentRepository.isStudentInClass(41L, 3L)).thenReturn(true);

		assertThatThrownBy(() -> submissionService.startAttempt(5L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không thể bắt đầu làm bài tập này lúc này.");
	}

	@Test
	void rejectsWhenTheSubmissionLimitIsReached() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		when(assignmentWindowRepository.findWindowById(5L)).thenReturn(Optional.of(window(5L, open(), close(), 1)));
		when(studentClassEnrollmentRepository.isStudentInClass(41L, 3L)).thenReturn(true);
		when(submissionRepository.countByAssignmentIdAndStudentId(5L, 41L)).thenReturn(1L);

		assertThatThrownBy(() -> submissionService.startAttempt(5L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không thể bắt đầu làm bài tập này lúc này.");
		verify(submissionRepository, never()).create(
				org.mockito.ArgumentMatchers.anyLong(),
				org.mockito.ArgumentMatchers.anyLong(),
				org.mockito.ArgumentMatchers.anyInt());
	}

	@Test
	void allowsUnlimitedAttemptsWhenMaxSubmissionsIsNull() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		when(assignmentWindowRepository.findWindowById(5L))
				.thenReturn(Optional.of(new AssignmentWindow(5L, 3L, AssignmentStatus.PUBLISHED, open(), close(), null, false)));
		when(studentClassEnrollmentRepository.isStudentInClass(41L, 3L)).thenReturn(true);
		when(submissionRepository.countByAssignmentIdAndStudentId(5L, 41L)).thenReturn(99L);

		Submission submission = submission(5L, 41L, 100);
		submission.setId(12L);
		when(submissionRepository.create(5L, 41L, 100)).thenReturn(submission);
		when(assignmentModuleRepository.findModulesByAssignmentId(5L)).thenReturn(List.of());
		when(submissionModuleRepository.bulkCreate(12L, List.of())).thenReturn(List.of());

		SubmissionStartResult result = submissionService.startAttempt(5L);

		assertThat(result.attemptNumber()).isEqualTo(100);
	}

	@Test
	void rejectsAnUnknownAssignment() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		when(assignmentWindowRepository.findWindowById(404L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> submissionService.startAttempt(404L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy bài tập.");
	}

	@Test
	void rejectsASoftDeletedAssignment() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		when(assignmentWindowRepository.findWindowById(5L))
				.thenReturn(Optional.of(new AssignmentWindow(5L, 3L, AssignmentStatus.PUBLISHED, open(), close(), 2, true)));

		assertThatThrownBy(() -> submissionService.startAttempt(5L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy bài tập.");
	}

	@Test
	void rejectsANonStudentCaller() {
		when(currentUserProvider.requireActiveUser()).thenReturn(teacher(7L));

		assertThatThrownBy(() -> submissionService.startAttempt(5L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
		verify(assignmentWindowRepository, never()).findWindowById(org.mockito.ArgumentMatchers.anyLong());
	}

	@Test
	void rejectsAStudentWhoIsNotInTheAssignmentsClass() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(42L));
		when(assignmentWindowRepository.findWindowById(5L)).thenReturn(Optional.of(window(5L, open(), close(), 2)));
		when(studentClassEnrollmentRepository.isStudentInClass(42L, 3L)).thenReturn(false);

		assertThatThrownBy(() -> submissionService.startAttempt(5L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
		verify(submissionRepository, never()).countByAssignmentIdAndStudentId(
				org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyLong());
	}

	private AssignmentWindow window(
			Long assignmentId, OffsetDateTime openAt, OffsetDateTime closeAt, Integer maxSubmissions) {
		return new AssignmentWindow(assignmentId, 3L, AssignmentStatus.PUBLISHED, openAt, closeAt, maxSubmissions, false);
	}

	private OffsetDateTime open() {
		return OffsetDateTime.now().minusHours(1);
	}

	private OffsetDateTime close() {
		return OffsetDateTime.now().plusHours(48);
	}

	private Submission submission(Long assignmentId, Long studentId, int attemptNumber) {
		Submission submission = new Submission(assignmentId, studentId, attemptNumber, null, SubmissionStatus.IN_PROGRESS);
		submission.setCreatedAt(Instant.parse("2026-09-22T08:00:00Z"));
		return submission;
	}

	private SubmissionModule module(Long moduleId) {
		return new SubmissionModule(5L, moduleId, SubmissionStatus.IN_PROGRESS);
	}

	private User student(long id) {
		return new User(id, "Học viên", "student@example.com", null, null, "hash", UserRole.STUDENT, UserStatus.ACTIVE, false,
				null, "HV00" + id, null, null);
	}

	private User teacher(long id) {
		return new User(id, "Giáo viên", "teacher@example.com", null, null, "hash", UserRole.TEACHER, UserStatus.ACTIVE, false,
				"IELTS", null, null, null);
	}
}