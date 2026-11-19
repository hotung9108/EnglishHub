package com.english_hub.core.modules.report.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.modules.report.application.model.StudentOverallScoreResponse;
import com.english_hub.core.modules.report.domain.model.ReportStudentAttemptScore;
import com.english_hub.core.modules.report.domain.model.ReportStudentIdentity;
import com.english_hub.core.modules.report.domain.model.ReportStudentSkillScore;
import com.english_hub.core.modules.report.domain.repository.ReportRepository;
import com.english_hub.core.modules.submission.domain.repository.ClassTeachingRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class ReportServiceOverallTest {
	private static final long STUDENT_ID = 30L;
	private static final long CLASS_ID = 2L;
	private static final long TEACHER_ID = 4L;

	@Mock
	private ReportRepository reports;

	@Mock
	private CurrentUserProvider currentUserProvider;

	@Mock
	private ClassTeachingRepository classTeachingRepository;

	@Mock
	private ReportResponseBuilder responseBuilder;

	private ReportService service;

	@BeforeEach
	void setUp() {
		ReportCalculator calculator = new ReportCalculator();
		service = new ReportService(
				reports, currentUserProvider, classTeachingRepository, calculator, responseBuilder);
	}

	@Test
	void adminCanRequestOverallWithoutClassIdAndNoAttemptsReturnNullScore() throws Exception {
		givenStudent();
		givenUser(1L, UserRole.ADMIN);
		when(reports.findStudentAttemptScores(STUDENT_ID, null, null, null)).thenReturn(List.of());

		StudentOverallScoreResponse response = service.overallScore(STUDENT_ID, null);

		assertThat(response.overallScore()).isNull();
		assertThat(response.limitedData()).isTrue();
		assertThat(response.completedSkillCount()).isZero();
		assertThat(response.missingSkills()).containsExactly(ModuleSkill.values());
		String json = new ObjectMapper().writeValueAsString(response);
		assertThat(new ObjectMapper().readTree(json).get("overallScore").isNull()).isTrue();
		verify(reports).findStudentAttemptScores(STUDENT_ID, null, null, null);
		verifyNoInteractions(classTeachingRepository);
	}

	@Test
	void adminCanRequestOverallForAnExistingClass() {
		givenStudent();
		givenUser(1L, UserRole.ADMIN);
		when(reports.classExists(CLASS_ID)).thenReturn(true);
		when(reports.findStudentAttemptScores(STUDENT_ID, CLASS_ID, null, null)).thenReturn(List.of());

		StudentOverallScoreResponse response = service.overallScore(STUDENT_ID, CLASS_ID);

		assertThat(response.overallScore()).isNull();
		verify(reports).classExists(CLASS_ID);
		verify(reports).findStudentAttemptScores(STUDENT_ID, CLASS_ID, null, null);
	}

	@Test
	void teacherCanRequestOverallForAClassTheyTeach() {
		givenStudent();
		givenUser(TEACHER_ID, UserRole.TEACHER);
		when(reports.classExists(CLASS_ID)).thenReturn(true);
		when(classTeachingRepository.isTeacherOfClass(TEACHER_ID, CLASS_ID)).thenReturn(true);
		when(reports.findStudentAttemptScores(STUDENT_ID, CLASS_ID, null, null))
				.thenReturn(List.of(attempt(11, 101, "8", "10", 1)));
		when(reports.findStudentSkillScores(STUDENT_ID, CLASS_ID, null, null))
				.thenReturn(List.of(skill(11, ModuleSkill.READING, "8", "10")));

		StudentOverallScoreResponse response = service.overallScore(STUDENT_ID, CLASS_ID);

		assertThat(response.overallScore()).isEqualByComparingTo("8.0");
		assertThat(response.completedSkillCount()).isEqualTo(1);
		assertThat(response.limitedData()).isTrue();
		verify(classTeachingRepository).isTeacherOfClass(TEACHER_ID, CLASS_ID);
	}

	@Test
	void teacherMustProvideClassId() {
		givenStudent();
		givenUser(TEACHER_ID, UserRole.TEACHER);

		ApiException exception = assertThrows(
				ApiException.class, () -> service.overallScore(STUDENT_ID, null));

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
		verifyNoInteractions(classTeachingRepository);
	}

	@Test
	void classNotFoundReturnsNotFound() {
		givenStudent();
		when(reports.classExists(CLASS_ID)).thenReturn(false);

		ApiException exception = assertThrows(
				ApiException.class, () -> service.overallScore(STUDENT_ID, CLASS_ID));

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
		verifyNoInteractions(currentUserProvider, classTeachingRepository);
	}

	@Test
	void teacherCannotRequestOverallForAClassTheyDoNotTeach() {
		givenStudent();
		givenUser(TEACHER_ID, UserRole.TEACHER);
		when(reports.classExists(CLASS_ID)).thenReturn(true);
		when(classTeachingRepository.isTeacherOfClass(TEACHER_ID, CLASS_ID)).thenReturn(false);

		ApiException exception = assertThrows(
				ApiException.class, () -> service.overallScore(STUDENT_ID, CLASS_ID));

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
		verify(reports, org.mockito.Mockito.never())
				.findStudentAttemptScores(STUDENT_ID, CLASS_ID, null, null);
	}

	@Test
	void missingStudentReturnsNotFound() {
		when(reports.findStudent(STUDENT_ID)).thenReturn(null);

		ApiException exception = assertThrows(
				ApiException.class, () -> service.overallScore(STUDENT_ID, null));

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
		verifyNoInteractions(currentUserProvider, classTeachingRepository);
	}

	@Test
	void nonStudentTargetReturnsNotFound() {
		when(reports.findStudent(STUDENT_ID)).thenReturn(null);

		ApiException exception = assertThrows(
				ApiException.class, () -> service.overallScore(STUDENT_ID, null));

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void softDeletedStudentTargetReturnsNotFound() {
		when(reports.findStudent(STUDENT_ID)).thenReturn(null);

		ApiException exception = assertThrows(
				ApiException.class, () -> service.overallScore(STUDENT_ID, null));

		assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void studentWhoLeftClassCanStillReadHistoricalOverall() {
		givenStudent();
		givenUser(TEACHER_ID, UserRole.TEACHER);
		when(reports.classExists(CLASS_ID)).thenReturn(true);
		when(classTeachingRepository.isTeacherOfClass(TEACHER_ID, CLASS_ID)).thenReturn(true);
		when(reports.findStudentAttemptScores(STUDENT_ID, CLASS_ID, null, null))
				.thenReturn(List.of(attempt(11, 101, "8", "10", 1)));
		when(reports.findStudentSkillScores(STUDENT_ID, CLASS_ID, null, null))
				.thenReturn(List.of(skill(11, ModuleSkill.READING, "8", "10")));

		StudentOverallScoreResponse response = service.overallScore(STUDENT_ID, CLASS_ID);

		assertThat(response.overallScore()).isEqualByComparingTo("8.0");
		verify(reports).findStudentAttemptScores(STUDENT_ID, CLASS_ID, null, null);
	}

	@Test
	void multipleAttemptsUseTheBestTotalAttemptForOverall() {
		givenStudent();
		givenUser(1L, UserRole.ADMIN);
		ReportStudentAttemptScore attemptA = attempt(11, 101, "38", "50", 4);
		ReportStudentAttemptScore attemptB = attempt(12, 101, "34", "50", 4);
		when(reports.findStudentAttemptScores(STUDENT_ID, null, null, null))
				.thenReturn(List.of(attemptA, attemptB));
		when(reports.findStudentSkillScores(STUDENT_ID, null, null, null)).thenReturn(List.of(
				skill(11, ModuleSkill.WRITING, "20", "20"),
				skill(11, ModuleSkill.SPEAKING, "6", "10"),
				skill(11, ModuleSkill.READING, "6", "10"),
				skill(11, ModuleSkill.LISTENING, "6", "10"),
				skill(12, ModuleSkill.WRITING, "10", "20"),
				skill(12, ModuleSkill.SPEAKING, "8", "10"),
				skill(12, ModuleSkill.READING, "8", "10"),
				skill(12, ModuleSkill.LISTENING, "8", "10")));

		StudentOverallScoreResponse response = service.overallScore(STUDENT_ID, null);

		assertThat(response.overallScore()).isEqualByComparingTo("7.0");
		assertThat(response.limitedData()).isFalse();
		assertThat(response.completedSkillCount()).isEqualTo(4);
		assertThat(response.missingSkills()).isEmpty();
		verify(reports).findStudentSkillScores(STUDENT_ID, null, null, null);
	}

	@Test
	void multipleAssignmentsContributeTheirSelectedSkillRatios() {
		givenStudent();
		givenUser(1L, UserRole.ADMIN);
		when(reports.findStudentAttemptScores(STUDENT_ID, null, null, null)).thenReturn(List.of(
				attempt(11, 101, "8", "10", 1),
				attempt(12, 102, "6", "10", 1)));
		when(reports.findStudentSkillScores(STUDENT_ID, null, null, null)).thenReturn(List.of(
				skill(11, ModuleSkill.READING, "8", "10"),
				skill(12, ModuleSkill.WRITING, "6", "10")));

		StudentOverallScoreResponse response = service.overallScore(STUDENT_ID, null);

		assertThat(response.overallScore()).isEqualByComparingTo("7.0");
		assertThat(response.completedSkillCount()).isEqualTo(2);
		assertThat(response.missingSkills()).containsExactly(ModuleSkill.LISTENING, ModuleSkill.SPEAKING);
	}

	private void givenStudent() {
		when(reports.findStudent(STUDENT_ID))
				.thenReturn(new ReportStudentIdentity(STUDENT_ID, "Report student"));
	}

	private void givenUser(long userId, UserRole role) {
		when(currentUserProvider.requireActiveUser()).thenReturn(new User(
				userId, "Report caller", null, null, null, null, role, UserStatus.ACTIVE,
				false, null, null, null, null));
	}

	private ReportStudentAttemptScore attempt(
			long submissionId, long assignmentId, String score, String maximum, long moduleCount) {
		return new ReportStudentAttemptScore(
				submissionId,
				assignmentId,
				CLASS_ID,
				STUDENT_ID,
				OffsetDateTime.parse("2026-09-01T10:00:00Z"),
				"Overall assignment",
				new BigDecimal(score),
				new BigDecimal(maximum),
				moduleCount,
				moduleCount);
	}

	private ReportStudentSkillScore skill(long submissionId, ModuleSkill skill, String score, String maximum) {
		return new ReportStudentSkillScore(
				submissionId, skill, new BigDecimal(score), new BigDecimal(maximum));
	}
}
