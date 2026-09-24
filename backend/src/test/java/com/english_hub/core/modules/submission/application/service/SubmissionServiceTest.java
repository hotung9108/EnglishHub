package com.english_hub.core.modules.submission.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.submission.application.service.SubmissionService.AnswerPayload;
import com.english_hub.core.modules.submission.application.service.SubmissionService.AnswerResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.GradingDetailResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.ModuleDetailResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.ModuleEntry;
import com.english_hub.core.modules.submission.application.service.SubmissionService.QuestionDetailResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionDetailResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionListItemResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionListResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionStartResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionModuleDetailResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmitModuleResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmitResult;
import com.english_hub.core.modules.submission.domain.model.Answer;
import com.english_hub.core.modules.submission.domain.model.AssignmentStatus;
import com.english_hub.core.modules.submission.domain.model.AssignmentWindow;
import com.english_hub.core.modules.submission.domain.model.Grading;
import com.english_hub.core.modules.submission.domain.model.GradingDraft;
import com.english_hub.core.modules.submission.domain.model.GradingMethod;
import com.english_hub.core.modules.submission.domain.model.GradingStatus;
import com.english_hub.core.modules.submission.domain.model.ModuleInfo;
import com.english_hub.core.modules.submission.domain.model.ModuleQuestion;
import com.english_hub.core.modules.submission.domain.model.ModuleSkill;
import com.english_hub.core.modules.submission.domain.model.ModuleTaskType;
import com.english_hub.core.modules.submission.domain.model.QuestionDetail;
import com.english_hub.core.modules.submission.domain.model.QuestionType;
import com.english_hub.core.modules.submission.domain.model.Submission;
import com.english_hub.core.modules.submission.domain.model.SubmissionModule;
import com.english_hub.core.modules.submission.domain.model.SubmissionPage;
import com.english_hub.core.modules.submission.domain.model.SubmissionStatus;
import com.english_hub.core.modules.submission.domain.repository.AnswerRepository;
import com.english_hub.core.modules.submission.domain.repository.AssignmentModuleRepository;
import com.english_hub.core.modules.submission.domain.repository.AssignmentWindowRepository;
import com.english_hub.core.modules.submission.domain.repository.ClassTeachingRepository;
import com.english_hub.core.modules.submission.domain.repository.GradingRepository;
import com.english_hub.core.modules.submission.domain.repository.ModuleQuestionRepository;
import com.english_hub.core.modules.submission.domain.repository.StudentClassEnrollmentRepository;
import com.english_hub.core.modules.submission.domain.repository.SubmissionModuleRepository;
import com.english_hub.core.modules.submission.domain.repository.SubmissionRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;

import java.math.BigDecimal;
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

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
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
	private ClassTeachingRepository classTeachingRepository;

	@Mock
	private AnswerRepository answerRepository;

	@Mock
	private ModuleQuestionRepository moduleQuestionRepository;

	@Mock
	private CurrentUserProvider currentUserProvider;

	private static final JsonMapper JSON_READER = new JsonMapper();

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
				classTeachingRepository,
				answerRepository,
				moduleQuestionRepository,
				currentUserProvider,
				JSON_READER);
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

	@Test
	void getByIdReturnsOwnSubmissionWithModulesAndGradings() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(88L)).thenReturn(Optional.of(submission));

		SubmissionModule quizModule = module(9L);
		quizModule.setId(150L);
		SubmissionModule essayModule = module(10L);
		essayModule.setId(151L);
		when(submissionModuleRepository.findBySubmissionIds(List.of(88L)))
				.thenReturn(List.of(essayModule, quizModule));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L)).thenReturn(List.of(
				new ModuleInfo(9L, 5L, ModuleSkill.READING, ModuleTaskType.QUIZ, 2),
				new ModuleInfo(10L, 5L, ModuleSkill.WRITING, ModuleTaskType.ESSAY, 1)));
		Grading quizGrading = grading(150L, GradingMethod.AUTO, GradingStatus.PENDING);
		quizGrading.setId(77L);
		when(gradingRepository.findBySubmissionModuleIds(List.of(151L, 150L)))
				.thenReturn(List.of(quizGrading));

		SubmissionDetailResult result = submissionService.getById(88L);

		assertThat(result.id()).isEqualTo(88L);
		assertThat(result.assignmentId()).isEqualTo(5L);
		assertThat(result.studentId()).isEqualTo(41L);
		assertThat(result.status()).isEqualTo(SubmissionStatus.IN_PROGRESS);
		assertThat(result.modules()).extracting(ModuleDetailResult::moduleId).containsExactly(10L, 9L);
		assertThat(result.modules()).extracting(ModuleDetailResult::submissionModuleId).containsExactly(151L, 150L);
		assertThat(result.modules().getFirst().grading()).isNull();
		assertThat(result.modules().get(1).grading()).isNotNull();
		GradingDetailResult grading = result.modules().get(1).grading();
		assertThat(grading.id()).isEqualTo(77L);
		assertThat(grading.method()).isEqualTo(GradingMethod.AUTO);
		assertThat(grading.status()).isEqualTo(GradingStatus.PENDING);
	}

	@Test
	void getByIdRejectsAnotherStudentsSubmission() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(42L));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(88L)).thenReturn(Optional.of(submission));

		assertThatThrownBy(() -> submissionService.getById(88L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void getByIdReturnsNotFoundForUnknownSubmission() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		when(submissionRepository.findById(404L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> submissionService.getById(404L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy lượt làm bài.");
	}

	@Test
	void getByIdTeacherOfTheClassCanRead() {
		when(currentUserProvider.requireActiveUser()).thenReturn(teacher(7L));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(88L)).thenReturn(Optional.of(submission));
		when(assignmentWindowRepository.findWindowById(5L)).thenReturn(Optional.of(window(5L, open(), close(), 2)));
		when(classTeachingRepository.isTeacherOfClass(7L, 3L)).thenReturn(true);
		when(submissionModuleRepository.findBySubmissionIds(List.of(88L))).thenReturn(List.of());
		when(assignmentModuleRepository.findModulesByAssignmentId(5L)).thenReturn(List.of());
		when(gradingRepository.findBySubmissionModuleIds(List.of())).thenReturn(List.of());

		SubmissionDetailResult result = submissionService.getById(88L);

		assertThat(result.id()).isEqualTo(88L);
		assertThat(result.modules()).isEmpty();
	}

	@Test
	void getByIdRejectsTeacherWhoDoesNotTeachTheClass() {
		when(currentUserProvider.requireActiveUser()).thenReturn(teacher(8L));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(88L)).thenReturn(Optional.of(submission));
		when(assignmentWindowRepository.findWindowById(5L)).thenReturn(Optional.of(window(5L, open(), close(), 2)));
		when(classTeachingRepository.isTeacherOfClass(8L, 3L)).thenReturn(false);

		assertThatThrownBy(() -> submissionService.getById(88L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void getByIdAdminCanReadAnySubmission() {
		when(currentUserProvider.requireActiveUser()).thenReturn(admin(1L));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(88L)).thenReturn(Optional.of(submission));
		when(submissionModuleRepository.findBySubmissionIds(List.of(88L))).thenReturn(List.of());
		when(assignmentModuleRepository.findModulesByAssignmentId(5L)).thenReturn(List.of());
		when(gradingRepository.findBySubmissionModuleIds(List.of())).thenReturn(List.of());

		SubmissionDetailResult result = submissionService.getById(88L);

		assertThat(result.studentId()).isEqualTo(41L);
	}

	@Test
	void listForcesStudentScopeAndEnrichesResults() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findPage(any(), any())).thenReturn(new SubmissionPage(List.of(submission), 1, 20, 1));
		SubmissionModule quizModule = new SubmissionModule(88L, 9L, SubmissionStatus.IN_PROGRESS);
		quizModule.setId(150L);
		SubmissionModule essayModule = new SubmissionModule(88L, 10L, SubmissionStatus.IN_PROGRESS);
		essayModule.setId(151L);
		when(submissionModuleRepository.findBySubmissionIds(List.of(88L)))
				.thenReturn(List.of(quizModule, essayModule));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L)).thenReturn(List.of(
				new ModuleInfo(9L, 5L, ModuleSkill.READING, ModuleTaskType.QUIZ, 1),
				new ModuleInfo(10L, 5L, ModuleSkill.WRITING, ModuleTaskType.ESSAY, 2)));
		Grading quizGrading = grading(150L, GradingMethod.AUTO, GradingStatus.COMPLETED);
		quizGrading.setFinalScore(BigDecimal.valueOf(8));
		quizGrading.setMaxScoreSnapshot(BigDecimal.TEN);
		when(gradingRepository.findBySubmissionModuleIds(List.of(150L, 151L)))
				.thenReturn(List.of(quizGrading));

		SubmissionListResult result = submissionService.list(null, null, null, 1, 20);

		assertThat(result.page()).isEqualTo(1);
		assertThat(result.limit()).isEqualTo(20);
		assertThat(result.total()).isEqualTo(1);
		SubmissionListItemResult item = result.data().getFirst();
		assertThat(item.id()).isEqualTo(88L);
		assertThat(item.studentId()).isEqualTo(41L);
		assertThat(item.modules()).hasSize(2);
		assertThat(item.modules().getFirst().grading().status()).isEqualTo(GradingStatus.COMPLETED);
		assertThat(item.modules().getFirst().grading().finalScore()).isEqualByComparingTo("8");
		assertThat(item.modules().get(1).grading()).isNull();
		verify(submissionRepository).findPage(
				argThat(filter -> filter.studentId().equals(41L) && filter.assignmentId() == null),
				argThat(request -> request.page() == 1 && request.limit() == 20));
	}

	@Test
	void listRejectsAStudentRequestingAnotherStudentsSubmissions() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));

		assertThatThrownBy(() -> submissionService.list(null, 42L, null, 1, 20))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void listAllowsAStudentToPassTheirOwnStudentId() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findPage(any(), any())).thenReturn(new SubmissionPage(List.of(submission), 1, 20, 1));
		when(submissionModuleRepository.findBySubmissionIds(List.of(88L))).thenReturn(List.of());
		when(assignmentModuleRepository.findModulesByAssignmentId(5L)).thenReturn(List.of());
		when(gradingRepository.findBySubmissionModuleIds(List.of())).thenReturn(List.of());

		SubmissionListResult result = submissionService.list(null, 41L, null, 1, 20);

		assertThat(result.total()).isEqualTo(1);
	}

	@Test
	void listTeacherRequiresAnAssignmentId() {
		when(currentUserProvider.requireActiveUser()).thenReturn(teacher(7L));

		assertThatThrownBy(() -> submissionService.list(null, null, null, 1, 20))
				.isInstanceOf(ApiException.class)
				.hasMessage("assignmentId là bắt buộc đối với giáo viên.");
	}

	@Test
	void listTeacherCanFilterByTheirOwnAssignment() {
		when(currentUserProvider.requireActiveUser()).thenReturn(teacher(7L));
		when(assignmentWindowRepository.findWindowById(5L)).thenReturn(Optional.of(window(5L, open(), close(), 2)));
		when(classTeachingRepository.isTeacherOfClass(7L, 3L)).thenReturn(true);
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findPage(any(), any())).thenReturn(new SubmissionPage(List.of(submission), 1, 20, 1));
		when(submissionModuleRepository.findBySubmissionIds(List.of(88L))).thenReturn(List.of());
		when(assignmentModuleRepository.findModulesByAssignmentId(5L)).thenReturn(List.of());
		when(gradingRepository.findBySubmissionModuleIds(List.of())).thenReturn(List.of());

		SubmissionListResult result = submissionService.list(5L, null, null, 1, 20);

		assertThat(result.total()).isEqualTo(1);
		verify(submissionRepository).findPage(
				argThat(filter -> filter.assignmentId().equals(5L) && filter.studentId() == null),
				argThat(request -> request.page() == 1 && request.limit() == 20));
	}

	@Test
	void listRejectsTeacherForAnAssignmentOutsideTheirClass() {
		when(currentUserProvider.requireActiveUser()).thenReturn(teacher(8L));
		when(assignmentWindowRepository.findWindowById(5L)).thenReturn(Optional.of(window(5L, open(), close(), 2)));
		when(classTeachingRepository.isTeacherOfClass(8L, 3L)).thenReturn(false);

		assertThatThrownBy(() -> submissionService.list(5L, null, null, 1, 20))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void listAdminCanListWithoutScoping() {
		when(currentUserProvider.requireActiveUser()).thenReturn(admin(1L));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findPage(any(), any())).thenReturn(new SubmissionPage(List.of(submission), 1, 20, 1));
		when(submissionModuleRepository.findBySubmissionIds(List.of(88L))).thenReturn(List.of());
		when(assignmentModuleRepository.findModulesByAssignmentId(5L)).thenReturn(List.of());
		when(gradingRepository.findBySubmissionModuleIds(List.of())).thenReturn(List.of());

		SubmissionListResult result = submissionService.list(null, null, null, 1, 20);

		assertThat(result.total()).isEqualTo(1);
	}

	@Test
	void listForwardsAssignmentAndStatusFilters() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findPage(any(), any())).thenReturn(new SubmissionPage(List.of(submission), 2, 10, 1));
		when(submissionModuleRepository.findBySubmissionIds(List.of(88L))).thenReturn(List.of());
		when(assignmentModuleRepository.findModulesByAssignmentId(5L)).thenReturn(List.of());
		when(gradingRepository.findBySubmissionModuleIds(List.of())).thenReturn(List.of());

		SubmissionListResult result = submissionService.list(5L, 41L, "IN_PROGRESS", 2, 10);

		assertThat(result.page()).isEqualTo(2);
		verify(submissionRepository).findPage(
				argThat(filter -> filter.assignmentId().equals(5L)
						&& filter.studentId().equals(41L)
						&& filter.status() == SubmissionStatus.IN_PROGRESS),
				argThat(request -> request.page() == 2 && request.limit() == 10));
	}

	@Test
	void listRejectsAnInvalidPagination() {
		assertThatThrownBy(() -> submissionService.list(null, null, null, 0, 20))
				.isInstanceOf(ApiException.class)
				.hasMessage("Dữ liệu không hợp lệ.");
		assertThatThrownBy(() -> submissionService.list(null, null, null, 1, 101))
				.isInstanceOf(ApiException.class)
				.hasMessage("Dữ liệu không hợp lệ.");
	}

	@Test
	void listRejectsAnInvalidStatusFilter() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));

		assertThatThrownBy(() -> submissionService.list(null, null, "INVALID_STATUS", 1, 20))
				.isInstanceOf(ApiException.class)
				.hasMessage("status không hợp lệ.");
	}

	@Test
	void submitsQuizAnswersAndFlipsTheModuleToSubmitted() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule quizModule = module(9L);
		quizModule.setId(100L);
		when(submissionModuleRepository.findById(100L)).thenReturn(Optional.of(quizModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(9L, ModuleTaskType.QUIZ)));
		when(moduleQuestionRepository.findByModuleId(9L)).thenReturn(List.of(
				new ModuleQuestion(21L, 9L, QuestionType.MULTIPLE_CHOICE, BigDecimal.ONE, 1),
				new ModuleQuestion(22L, 9L, QuestionType.MULTIPLE_CHOICE, BigDecimal.ONE, 2)));
		when(answerRepository.bulkCreate(eq(100L), anyList())).thenAnswer(invocation -> {
			List<Answer> incoming = invocation.getArgument(1);
			return incoming.stream().map(answer -> {
				Answer saved = new Answer(answer.getSubmissionModuleId(), answer.getQuestionId(), answer.getContent());
				saved.setId(answer.getQuestionId() * 15);
				return saved;
			}).toList();
		});

		SubmitModuleResult result = submissionService.submitModule(100L, List.of(
				new AnswerPayload(21L, multipleChoice(1)),
				new AnswerPayload(22L, multipleChoice(3))));

		assertThat(result.message()).isEqualTo("Đã nộp phần làm bài.");
		assertThat(result.submissionModuleId()).isEqualTo(100L);
		assertThat(result.status()).isEqualTo(SubmissionStatus.SUBMITTED);
		assertThat(result.answers()).hasSize(2);
		AnswerResult first = result.answers().get(0);
		assertThat(first.id()).isEqualTo(21L * 15);
		assertThat(first.questionId()).isEqualTo(21L);
		assertThat(first.content().get("selectedOptionIds").get(0).asInt()).isEqualTo(1);
		verify(submissionModuleRepository).save(argThat(saved ->
				saved.getId() == 100L && saved.getStatus() == SubmissionStatus.SUBMITTED));
	}

	@Test
	void submitsShortAnswerForARewriteModule() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule rewriteModule = module(10L);
		rewriteModule.setId(101L);
		when(submissionModuleRepository.findById(101L)).thenReturn(Optional.of(rewriteModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(10L, ModuleTaskType.REWRITE)));
		when(moduleQuestionRepository.findByModuleId(10L))
				.thenReturn(List.of(new ModuleQuestion(30L, 10L, QuestionType.SHORT_ANSWER, BigDecimal.ONE, 1)));
		when(answerRepository.bulkCreate(eq(101L), anyList())).thenAnswer(invocation -> {
			List<Answer> incoming = invocation.getArgument(1);
			return incoming.stream().map(answer -> {
				Answer saved = new Answer(answer.getSubmissionModuleId(), answer.getQuestionId(), answer.getContent());
				saved.setId(30L * 15);
				return saved;
			}).toList();
		});

		SubmitModuleResult result = submissionService.submitModule(101L,
				List.of(new AnswerPayload(30L, shortAnswer("The answer is..."))));

		assertThat(result.status()).isEqualTo(SubmissionStatus.SUBMITTED);
		assertThat(result.answers()).hasSize(1);
		assertThat(result.answers().get(0).content().path("text").asString()).isEqualTo("The answer is...");
	}

	@Test
	void submitModuleRejectsANonStudentCaller() {
		when(currentUserProvider.requireActiveUser()).thenReturn(teacher(8L));

		assertThatThrownBy(() -> submissionService.submitModule(100L, null))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void submitModuleRejectsAnUnknownModule() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		when(submissionModuleRepository.findById(500L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> submissionService.submitModule(500L, List.of()))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy phần làm bài hoặc câu hỏi.");
	}

	@Test
	void submitModuleRejectsAnAlreadySubmittedModule() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule closed = module(9L);
		closed.setId(100L);
		closed.setStatus(SubmissionStatus.SUBMITTED);
		when(submissionModuleRepository.findById(100L)).thenReturn(Optional.of(closed));

		assertThatThrownBy(() -> submissionService.submitModule(100L, List.of(
						new AnswerPayload(21L, multipleChoice(1)))))
				.isInstanceOf(ApiException.class)
				.hasMessage("Phần làm bài này đã được nộp.");
	}

	@Test
	void submitModuleRejectsAnotherStudentsModule() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule quizModule = module(9L);
		quizModule.setId(100L);
		when(submissionModuleRepository.findById(100L)).thenReturn(Optional.of(quizModule));
		Submission foreign = submission(5L, 99L, 1);
		foreign.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(foreign));

		assertThatThrownBy(() -> submissionService.submitModule(100L, null))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void submitModuleRejectsAMissingSubmission() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule quizModule = module(9L);
		quizModule.setId(100L);
		when(submissionModuleRepository.findById(100L)).thenReturn(Optional.of(quizModule));
		when(submissionRepository.findById(5L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> submissionService.submitModule(100L, null))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy phần làm bài hoặc câu hỏi.");
	}

	@Test
	void submitModuleRejectsMissingOrEmptyAnswers() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule quizModule = module(9L);
		quizModule.setId(100L);
		when(submissionModuleRepository.findById(100L)).thenReturn(Optional.of(quizModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(9L, ModuleTaskType.QUIZ)));

		assertThatThrownBy(() -> submissionService.submitModule(100L, null))
				.isInstanceOf(ApiException.class)
				.hasMessage("Nội dung câu trả lời không hợp lệ.");
		assertThatThrownBy(() -> submissionService.submitModule(100L, List.of()))
				.isInstanceOf(ApiException.class)
				.hasMessage("Nội dung câu trả lời không hợp lệ.");
	}

	@Test
	void submitModuleRejectsAnAnswerWithoutQuestionIdOrContent() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule quizModule = module(9L);
		quizModule.setId(100L);
		when(submissionModuleRepository.findById(100L)).thenReturn(Optional.of(quizModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(9L, ModuleTaskType.QUIZ)));
		when(moduleQuestionRepository.findByModuleId(9L)).thenReturn(List.of(
				new ModuleQuestion(21L, 9L, QuestionType.MULTIPLE_CHOICE, BigDecimal.ONE, 1)));

		assertThatThrownBy(() -> submissionService.submitModule(100L,
						List.of(new AnswerPayload(null, multipleChoice(1)))))
				.isInstanceOf(ApiException.class)
				.hasMessage("Nội dung câu trả lời không hợp lệ.");
		assertThatThrownBy(() -> submissionService.submitModule(100L,
						List.of(new AnswerPayload(21L, null))))
				.isInstanceOf(ApiException.class)
				.hasMessage("Nội dung câu trả lời không hợp lệ.");
	}

	@Test
	void submitModuleRejectsDuplicateQuestionIds() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule quizModule = module(9L);
		quizModule.setId(100L);
		when(submissionModuleRepository.findById(100L)).thenReturn(Optional.of(quizModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(9L, ModuleTaskType.QUIZ)));
		when(moduleQuestionRepository.findByModuleId(9L)).thenReturn(List.of(
				new ModuleQuestion(21L, 9L, QuestionType.MULTIPLE_CHOICE, BigDecimal.ONE, 1)));

		assertThatThrownBy(() -> submissionService.submitModule(100L, List.of(
						new AnswerPayload(21L, multipleChoice(1)),
						new AnswerPayload(21L, multipleChoice(2)))))
				.isInstanceOf(ApiException.class)
				.hasMessage("Nội dung câu trả lời không hợp lệ.");
	}

	@Test
	void submitModuleRejectsAnUnknownQuestion() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule quizModule = module(9L);
		quizModule.setId(100L);
		when(submissionModuleRepository.findById(100L)).thenReturn(Optional.of(quizModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(9L, ModuleTaskType.QUIZ)));
		when(moduleQuestionRepository.findByModuleId(9L)).thenReturn(List.of(
				new ModuleQuestion(21L, 9L, QuestionType.MULTIPLE_CHOICE, BigDecimal.ONE, 1)));

		assertThatThrownBy(() -> submissionService.submitModule(100L,
						List.of(new AnswerPayload(999L, multipleChoice(1)))))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy phần làm bài hoặc câu hỏi.");
	}

	@Test
	void submitModuleRejectsWrongContentShapeForQuiz() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule quizModule = module(9L);
		quizModule.setId(100L);
		when(submissionModuleRepository.findById(100L)).thenReturn(Optional.of(quizModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(9L, ModuleTaskType.QUIZ)));
		when(moduleQuestionRepository.findByModuleId(9L)).thenReturn(List.of(
				new ModuleQuestion(21L, 9L, QuestionType.MULTIPLE_CHOICE, BigDecimal.ONE, 1)));

		assertThatThrownBy(() -> submissionService.submitModule(100L,
						List.of(new AnswerPayload(21L, shortAnswer("no selections")))))
				.isInstanceOf(ApiException.class)
				.hasMessage("Nội dung câu trả lời không hợp lệ.");
		assertThatThrownBy(() -> submissionService.submitModule(100L,
						List.of(new AnswerPayload(21L, plainObject()))))
				.isInstanceOf(ApiException.class)
				.hasMessage("Nội dung câu trả lời không hợp lệ.");
	}

	@Test
	void submitModuleRejectsWrongContentShapeForShortAnswer() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule rewriteModule = module(10L);
		rewriteModule.setId(101L);
		when(submissionModuleRepository.findById(101L)).thenReturn(Optional.of(rewriteModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(10L, ModuleTaskType.REWRITE)));
		when(moduleQuestionRepository.findByModuleId(10L))
				.thenReturn(List.of(new ModuleQuestion(30L, 10L, QuestionType.SHORT_ANSWER, BigDecimal.ONE, 1)));

		assertThatThrownBy(() -> submissionService.submitModule(101L,
						List.of(new AnswerPayload(30L, multipleChoice(1)))))
				.isInstanceOf(ApiException.class)
				.hasMessage("Nội dung câu trả lời không hợp lệ.");
		assertThatThrownBy(() -> submissionService.submitModule(101L,
						List.of(new AnswerPayload(30L, shortAnswer("   ")))))
				.isInstanceOf(ApiException.class)
				.hasMessage("Nội dung câu trả lời không hợp lệ.");
	}

	@Test
	void submitModuleRejectsAnEssayModuleForNow() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule essayModule = module(11L);
		essayModule.setId(102L);
		when(submissionModuleRepository.findById(102L)).thenReturn(Optional.of(essayModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(11L, ModuleTaskType.ESSAY)));

		assertThatThrownBy(() -> submissionService.submitModule(102L, List.of()))
				.isInstanceOf(ApiException.class)
				.hasMessage("Loại phần làm bài này chưa được hỗ trợ.");
	}

	@Test
	void submitLocksTheSubmissionAndFlipsInProgressModules() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(88L)).thenReturn(Optional.of(submission));

		SubmissionModule quizModule = module(9L);
		quizModule.setId(150L);
		SubmissionModule essayModule = module(10L);
		essayModule.setId(151L);
		essayModule.setStatus(SubmissionStatus.SUBMITTED);
		when(submissionModuleRepository.findBySubmissionId(88L))
				.thenReturn(List.of(quizModule, essayModule));

		SubmitResult result = submissionService.submit(88L);

		assertThat(result.message()).isEqualTo("Nộp bài thành công.");
		assertThat(result.status()).isEqualTo(SubmissionStatus.SUBMITTED);
		assertThat(result.submittedAt()).isNotNull();

		ArgumentCaptor<Submission> submissionCaptor = ArgumentCaptor.forClass(Submission.class);
		verify(submissionRepository).save(submissionCaptor.capture());
		Submission savedSubmission = submissionCaptor.getValue();
		assertThat(savedSubmission.getStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
		assertThat(savedSubmission.getSubmittedAt()).isNotNull();

		ArgumentCaptor<SubmissionModule> moduleCaptor = ArgumentCaptor.forClass(SubmissionModule.class);
		verify(submissionModuleRepository).save(moduleCaptor.capture());
		SubmissionModule savedModule = moduleCaptor.getValue();
		assertThat(savedModule.getId()).isEqualTo(150L);
		assertThat(savedModule.getStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
		verify(submissionModuleRepository, never()).save(argThat(other -> other.getId() == 151L));

		verify(gradingRepository, never()).save(any());
		verify(gradingRepository, never()).bulkCreate(anyList());
	}

	@Test
	void submitWithNoModulesStillLocksTheSubmission() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(88L)).thenReturn(Optional.of(submission));
		when(submissionModuleRepository.findBySubmissionId(88L)).thenReturn(List.of());

		SubmitResult result = submissionService.submit(88L);

		assertThat(result.status()).isEqualTo(SubmissionStatus.SUBMITTED);
		ArgumentCaptor<Submission> captor = ArgumentCaptor.forClass(Submission.class);
		verify(submissionRepository).save(captor.capture());
		assertThat(captor.getValue().getStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
		verify(submissionModuleRepository, never()).save(any());
	}

	@Test
	void submitRejectsANonStudentCaller() {
		when(currentUserProvider.requireActiveUser()).thenReturn(teacher(7L));

		assertThatThrownBy(() -> submissionService.submit(88L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
		verify(submissionRepository, never()).findById(org.mockito.ArgumentMatchers.anyLong());
	}

	@Test
	void submitReturnsNotFoundForUnknownSubmission() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		when(submissionRepository.findById(200L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> submissionService.submit(200L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy lượt làm bài.");
		verify(submissionRepository, never()).save(any());
	}

	@Test
	void submitRejectsAnotherStudentsSubmission() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		Submission foreign = submission(5L, 99L, 1);
		foreign.setId(88L);
		when(submissionRepository.findById(88L)).thenReturn(Optional.of(foreign));

		assertThatThrownBy(() -> submissionService.submit(88L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
		verify(submissionRepository, never()).save(any());
	}

	@Test
	void submitRejectsAnAlreadySubmittedSubmission() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		Submission submitted = submission(5L, 41L, 1);
		submitted.setId(88L);
		submitted.setStatus(SubmissionStatus.SUBMITTED);
		when(submissionRepository.findById(88L)).thenReturn(Optional.of(submitted));

		assertThatThrownBy(() -> submissionService.submit(88L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bài làm này đã được nộp.");
		verify(submissionRepository, never()).save(any());
	}

	@Test
	void submitRejectsAnAlreadyGradedSubmission() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		Submission graded = submission(5L, 41L, 1);
		graded.setId(88L);
		graded.setStatus(SubmissionStatus.GRADED);
		when(submissionRepository.findById(88L)).thenReturn(Optional.of(graded));

		assertThatThrownBy(() -> submissionService.submit(88L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bài làm này đã được nộp.");
		verify(submissionRepository, never()).save(any());
	}

	@Test
	void getModuleDetailHidesCorrectAnswersUntilGraded() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule quizModule = module(9L);
		quizModule.setId(150L);
		when(submissionModuleRepository.findById(150L)).thenReturn(Optional.of(quizModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(9L, ModuleTaskType.QUIZ)));
		Grading quizGrading = grading(150L, GradingMethod.AUTO, GradingStatus.PENDING);
		quizGrading.setId(77L);
		when(gradingRepository.findBySubmissionModuleId(150L)).thenReturn(List.of(quizGrading));
		when(moduleQuestionRepository.findDetailsByModuleId(9L))
				.thenReturn(List.of(questionDetail(21L)));
		Answer answer = new Answer(150L, 21L, "{\"selectedOptionIds\":[1]}");
		answer.setId(340L);
		when(answerRepository.findBySubmissionModuleId(150L)).thenReturn(List.of(answer));

		SubmissionModuleDetailResult result = submissionService.getModuleDetail(150L);

		assertThat(result.id()).isEqualTo(150L);
		assertThat(result.moduleId()).isEqualTo(9L);
		assertThat(result.skill()).isEqualTo(ModuleSkill.READING);
		assertThat(result.taskType()).isEqualTo(ModuleTaskType.QUIZ);
		assertThat(result.status()).isEqualTo(SubmissionStatus.IN_PROGRESS);
		assertThat(result.grading()).isNotNull();
		assertThat(result.grading().id()).isEqualTo(77L);
		assertThat(result.grading().method()).isEqualTo(GradingMethod.AUTO);
		assertThat(result.grading().status()).isEqualTo(GradingStatus.PENDING);
		QuestionDetailResult question = result.questions().getFirst();
		assertThat(question.id()).isEqualTo(21L);
		assertThat(question.content()).isEqualTo("Which word best describes...?");
		assertThat(question.questionType()).isEqualTo(QuestionType.MULTIPLE_CHOICE);
		assertThat(question.score()).isEqualByComparingTo("1");
		assertThat(question.orderIndex()).isEqualTo(1);
		assertThat(question.correctAnswer()).isNull();
		AnswerResult answerResult = result.answers().getFirst();
		assertThat(answerResult.id()).isEqualTo(340L);
		assertThat(answerResult.questionId()).isEqualTo(21L);
		assertThat(answerResult.content().get("selectedOptionIds").get(0).asInt()).isEqualTo(1);
	}

	@Test
	void getModuleDetailRevealsCorrectAnswersWhenGraded() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule gradedModule = module(9L);
		gradedModule.setId(150L);
		gradedModule.setStatus(SubmissionStatus.GRADED);
		when(submissionModuleRepository.findById(150L)).thenReturn(Optional.of(gradedModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(9L, ModuleTaskType.QUIZ)));
		when(gradingRepository.findBySubmissionModuleId(150L)).thenReturn(List.of());
		when(moduleQuestionRepository.findDetailsByModuleId(9L))
				.thenReturn(List.of(questionDetail(21L)));
		when(answerRepository.findBySubmissionModuleId(150L)).thenReturn(List.of());

		SubmissionModuleDetailResult result = submissionService.getModuleDetail(150L);

		assertThat(result.status()).isEqualTo(SubmissionStatus.GRADED);
		JsonNode correctAnswer = result.questions().getFirst().correctAnswer();
		assertThat(correctAnswer).isNotNull();
		assertThat(correctAnswer.get("options").get(0).get("id").asInt()).isEqualTo(1);
		assertThat(correctAnswer.get("options").get(0).get("is_correct").asBoolean()).isTrue();
	}

	@Test
	void getModuleDetailKeepsCorrectAnswerHiddenWhenSubmitted() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule submittedModule = module(9L);
		submittedModule.setId(150L);
		submittedModule.setStatus(SubmissionStatus.SUBMITTED);
		when(submissionModuleRepository.findById(150L)).thenReturn(Optional.of(submittedModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(9L, ModuleTaskType.QUIZ)));
		when(gradingRepository.findBySubmissionModuleId(150L)).thenReturn(List.of());
		when(moduleQuestionRepository.findDetailsByModuleId(9L))
				.thenReturn(List.of(questionDetail(21L)));
		when(answerRepository.findBySubmissionModuleId(150L)).thenReturn(List.of());

		SubmissionModuleDetailResult result = submissionService.getModuleDetail(150L);

		assertThat(result.status()).isEqualTo(SubmissionStatus.SUBMITTED);
		assertThat(result.questions().getFirst().correctAnswer()).isNull();
	}

	@Test
	void getModuleDetailReturnsNullGradingWhenAbsent() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule quizModule = module(9L);
		quizModule.setId(150L);
		when(submissionModuleRepository.findById(150L)).thenReturn(Optional.of(quizModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(9L, ModuleTaskType.QUIZ)));
		when(gradingRepository.findBySubmissionModuleId(150L)).thenReturn(List.of());
		when(moduleQuestionRepository.findDetailsByModuleId(9L)).thenReturn(List.of());
		when(answerRepository.findBySubmissionModuleId(150L)).thenReturn(List.of());

		SubmissionModuleDetailResult result = submissionService.getModuleDetail(150L);

		assertThat(result.grading()).isNull();
		assertThat(result.questions()).isEmpty();
		assertThat(result.answers()).isEmpty();
	}

	@Test
	void getModuleDetailReturnsEmptyQuestionsAndAnswersForEssay() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule essayModule = module(10L);
		essayModule.setId(151L);
		when(submissionModuleRepository.findById(151L)).thenReturn(Optional.of(essayModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(10L, ModuleTaskType.ESSAY)));
		Grading essayGrading = grading(151L, GradingMethod.TEACHER_MANUAL, GradingStatus.PENDING);
		essayGrading.setId(78L);
		when(gradingRepository.findBySubmissionModuleId(151L)).thenReturn(List.of(essayGrading));
		when(moduleQuestionRepository.findDetailsByModuleId(10L)).thenReturn(List.of());
		when(answerRepository.findBySubmissionModuleId(151L)).thenReturn(List.of());

		SubmissionModuleDetailResult result = submissionService.getModuleDetail(151L);

		assertThat(result.taskType()).isEqualTo(ModuleTaskType.ESSAY);
		assertThat(result.questions()).isEmpty();
		assertThat(result.answers()).isEmpty();
		assertThat(result.grading().method()).isEqualTo(GradingMethod.TEACHER_MANUAL);
	}

	@Test
	void getModuleDetailRejectsAnotherStudentsModule() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule quizModule = module(9L);
		quizModule.setId(150L);
		when(submissionModuleRepository.findById(150L)).thenReturn(Optional.of(quizModule));
		Submission foreign = submission(5L, 99L, 1);
		foreign.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(foreign));

		assertThatThrownBy(() -> submissionService.getModuleDetail(150L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void getModuleDetailAllowsTheClassTeacher() {
		when(currentUserProvider.requireActiveUser()).thenReturn(teacher(7L));
		SubmissionModule quizModule = module(9L);
		quizModule.setId(150L);
		when(submissionModuleRepository.findById(150L)).thenReturn(Optional.of(quizModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentWindowRepository.findWindowById(5L)).thenReturn(Optional.of(window(5L, open(), close(), 2)));
		when(classTeachingRepository.isTeacherOfClass(7L, 3L)).thenReturn(true);
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(9L, ModuleTaskType.REWRITE)));
		when(gradingRepository.findBySubmissionModuleId(150L)).thenReturn(List.of());
		when(moduleQuestionRepository.findDetailsByModuleId(9L)).thenReturn(List.of());
		when(answerRepository.findBySubmissionModuleId(150L)).thenReturn(List.of());

		SubmissionModuleDetailResult result = submissionService.getModuleDetail(150L);

		assertThat(result.moduleId()).isEqualTo(9L);
	}

	@Test
	void getModuleDetailRejectsATeacherWhoDoesNotTeachTheClass() {
		when(currentUserProvider.requireActiveUser()).thenReturn(teacher(8L));
		SubmissionModule quizModule = module(9L);
		quizModule.setId(150L);
		when(submissionModuleRepository.findById(150L)).thenReturn(Optional.of(quizModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentWindowRepository.findWindowById(5L)).thenReturn(Optional.of(window(5L, open(), close(), 2)));
		when(classTeachingRepository.isTeacherOfClass(8L, 3L)).thenReturn(false);

		assertThatThrownBy(() -> submissionService.getModuleDetail(150L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void getModuleDetailAllowsAnAdmin() {
		when(currentUserProvider.requireActiveUser()).thenReturn(admin(1L));
		SubmissionModule quizModule = module(9L);
		quizModule.setId(150L);
		when(submissionModuleRepository.findById(150L)).thenReturn(Optional.of(quizModule));
		Submission submission = submission(5L, 41L, 1);
		submission.setId(88L);
		when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
		when(assignmentModuleRepository.findModulesByAssignmentId(5L))
				.thenReturn(List.of(moduleInfo(9L, ModuleTaskType.QUIZ)));
		when(gradingRepository.findBySubmissionModuleId(150L)).thenReturn(List.of());
		when(moduleQuestionRepository.findDetailsByModuleId(9L)).thenReturn(List.of());
		when(answerRepository.findBySubmissionModuleId(150L)).thenReturn(List.of());

		SubmissionModuleDetailResult result = submissionService.getModuleDetail(150L);

		assertThat(result.id()).isEqualTo(150L);
	}

	@Test
	void getModuleDetailReturnsNotFoundForUnknownModule() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		when(submissionModuleRepository.findById(650L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> submissionService.getModuleDetail(650L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy phần làm bài.");
	}

	@Test
	void getModuleDetailReturnsNotFoundWhenParentSubmissionIsMissing() {
		when(currentUserProvider.requireActiveUser()).thenReturn(student(41L));
		SubmissionModule quizModule = module(9L);
		quizModule.setId(150L);
		when(submissionModuleRepository.findById(150L)).thenReturn(Optional.of(quizModule));
		when(submissionRepository.findById(5L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> submissionService.getModuleDetail(150L))
				.isInstanceOf(ApiException.class)
				.hasMessage("Không tìm thấy phần làm bài.");
	}

	private QuestionDetail questionDetail(Long id) {
		return new QuestionDetail(
				id,
				9L,
				QuestionType.MULTIPLE_CHOICE,
				BigDecimal.ONE,
				1,
				"Which word best describes...?",
				"{\"options\":[{\"id\":1,\"content\":\"Option A\",\"is_correct\":true},"
						+ "{\"id\":2,\"content\":\"Option B\",\"is_correct\":false}]}");
	}

	private ModuleInfo moduleInfo(Long moduleId, ModuleTaskType taskType) {
		return new ModuleInfo(moduleId, 5L, ModuleSkill.READING, taskType, 1);
	}

	private JsonNode multipleChoice(int optionId) {
		tools.jackson.databind.node.ObjectNode node = JSON_READER.createObjectNode();
		node.putArray("selectedOptionIds").add(optionId);
		return node;
	}

	private JsonNode shortAnswer(String text) {
		return JSON_READER.createObjectNode().put("text", text);
	}

	private JsonNode plainObject() {
		return JSON_READER.createObjectNode();
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

	private Grading grading(Long submissionModuleId, GradingMethod method, GradingStatus status) {
		return new Grading(submissionModuleId, method, status, null, null, null, null);
	}

	private User student(long id) {
		return new User(id, "Học viên", "student@example.com", null, null, "hash", UserRole.STUDENT, UserStatus.ACTIVE, false,
				null, "HV00" + id, null, null);
	}

	private User teacher(long id) {
		return new User(id, "Giáo viên", "teacher@example.com", null, null, "hash", UserRole.TEACHER, UserStatus.ACTIVE, false,
				"IELTS", null, null, null);
	}

	private User admin(long id) {
		return new User(id, "Quản trị", "admin@example.com", null, null, "hash", UserRole.ADMIN, UserStatus.ACTIVE, false,
				null, null, null, null);
	}
}