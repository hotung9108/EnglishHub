package com.english_hub.core.modules.report.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ReportMetricsApiIntegrationTest extends ReportIntegrationTestBase {

	@Test
	void classProgress_usesBestCompleteAttemptAndSnapshotFallbackForMixedModuleScales() throws Exception {
		long teacherId = createTeacher("Report teacher");
		long adminId = createAdmin();
		long studentId = createStudent("Current student", UserStatus.ACTIVE, false);
		long classId = createClass(teacherId, ClassStatus.ACTIVE);
		addMember(classId, studentId);
		long assignmentId = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignmentId, BigDecimal.TEN, new BigDecimal("100"));
		addAttempt(assignmentId, studentId, 1, SubmissionStatus.SUBMITTED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("10"), BigDecimal.ZERO },
				new GradingStatus[] { GradingStatus.COMPLETED, GradingStatus.COMPLETED },
				new BigDecimal[] { null, null });
		addAttempt(assignmentId, studentId, 2, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-16T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("8"), new BigDecimal("80") },
				new GradingStatus[] { GradingStatus.COMPLETED, GradingStatus.COMPLETED },
				new BigDecimal[] { null, null });
		addAttempt(assignmentId, studentId, 3, SubmissionStatus.SUBMITTED,
				OffsetDateTime.parse("2026-09-17T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("10"), new BigDecimal("100") },
				new GradingStatus[] { GradingStatus.COMPLETED, GradingStatus.PENDING },
				new BigDecimal[] { null, null });

		getClassProgress(classId, adminId, "").andExpect(status().isOk())
				.andExpect(jsonPath("$.assignmentScores[0].averageScorePercent").value(80.00))
				.andExpect(jsonPath("$.scoredStudentCount").value(1));
	}

	@Test
	void classProgress_countsOnlyCurrentStudentsButKeepsDepartedStudentsInClassAverage() throws Exception {
		long teacherId = createTeacher("Report teacher");
		long adminId = createAdmin();
		long currentStudent = createStudent("Current", UserStatus.ACTIVE, false);
		long departedStudent = createStudent("Departed", UserStatus.ACTIVE, false);
		long classId = createClass(teacherId, ClassStatus.ACTIVE);
		addMember(classId, currentStudent);
		long assignmentId = createAssignment(classId, AssignmentStatus.CLOSED, "2026-09-15T00:00:00Z", false);
		createModules(assignmentId, BigDecimal.TEN);
		addAttempt(assignmentId, currentStudent, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("8") }, new GradingStatus[] { GradingStatus.COMPLETED },
				new BigDecimal[] { null });
		addAttempt(assignmentId, departedStudent, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T11:00:00Z"),
				new BigDecimal[] { BigDecimal.ZERO }, new GradingStatus[] { GradingStatus.COMPLETED },
				new BigDecimal[] { null });

		getClassProgress(classId, adminId, "").andExpect(status().isOk())
				.andExpect(jsonPath("$.totalStudentCount").value(1))
				.andExpect(jsonPath("$.scoredStudentCount").value(1))
				.andExpect(jsonPath("$.belowAverageCount").value(0))
				.andExpect(jsonPath("$.assignmentScores[0].averageScorePercent").value(40.00));
	}

	@Test
	void overview_aggregatesClassesAndStudentAssignmentPairs() throws Exception {
		long teacherId = createTeacher("Report teacher");
		long adminId = createAdmin();
		long firstStudent = createStudent("First", UserStatus.ACTIVE, false);
		long secondStudent = createStudent("Second", UserStatus.ACTIVE, false);
		long firstClass = createClass(teacherId, ClassStatus.ACTIVE);
		long secondClass = createClass(teacherId, ClassStatus.ACTIVE);
		addMember(firstClass, firstStudent);
		addMember(secondClass, secondStudent);
		createScoredAssignment(firstClass, firstStudent, "8");
		createScoredAssignment(secondClass, secondStudent, "6");

		getOverview(adminId, "").andExpect(status().isOk())
				.andExpect(jsonPath("$.classCount").value(2))
				.andExpect(jsonPath("$.assignedAssignmentCount").value(2))
				.andExpect(jsonPath("$.averageScorePercent").value(70.00))
				.andExpect(jsonPath("$.completionRatePercent").value(100.00));
	}

	@Test
	void classes_keepsClassWithZeroInRangeAssignmentsAndExcludesSoftDeletedAssignment() throws Exception {
		long teacherId = createTeacher("Report teacher");
		long adminId = createAdmin();
		long studentId = createStudent("Current", UserStatus.ACTIVE, false);
		long classId = createClass(teacherId, ClassStatus.COMPLETED);
		addMember(classId, studentId);
		long deletedAssignment = createAssignment(classId, AssignmentStatus.PUBLISHED,
				"2026-09-15T00:00:00Z", true);
		createModules(deletedAssignment, BigDecimal.TEN);
		addAttempt(deletedAssignment, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { BigDecimal.TEN }, new GradingStatus[] { GradingStatus.COMPLETED },
				new BigDecimal[] { null });

		mockMvc.perform(get("/api/v1/reports/classes?from=2026-09-15&to=2026-09-15&page=1&limit=10")
				.header("Authorization", bearer(adminId, UserRole.ADMIN))
				)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[0].status").value("COMPLETED"))
				.andExpect(jsonPath("$.data[0].assignedAssignmentCount").value(0))
				.andExpect(jsonPath("$.data[0].averageScorePercent").value(0.00))
				.andExpect(jsonPath("$.data[0].completionRatePercent").value(0.00));
	}

	@Test
	void classProgress_countsCurrentScoredAndUnscoredMembersAndUsesVietnamDateBoundary() throws Exception {
		long teacherId = createTeacher("Current member teacher");
		long adminId = createAdmin();
		long belowStudent = createStudent("Below threshold", UserStatus.ACTIVE, false);
		long aboveStudent = createStudent("Above threshold", UserStatus.ACTIVE, false);
		long unscoredStudent = createStudent("No score", UserStatus.ACTIVE, false);
		long classId = createClass(teacherId, ClassStatus.ACTIVE);
		addMember(classId, belowStudent);
		addMember(classId, aboveStudent);
		addMember(classId, unscoredStudent);
		long assignment = createAssignment(classId, AssignmentStatus.PUBLISHED,
				"2026-11-01T00:00:00+07:00", false);
		createModules(assignment, BigDecimal.TEN);
		OffsetDateTime oneAmVietnam = OffsetDateTime.parse("2026-10-31T18:00:00Z");
		addAttempt(assignment, belowStudent, 1, SubmissionStatus.GRADED, oneAmVietnam,
				new BigDecimal[] { new BigDecimal("4") }, new GradingStatus[] { GradingStatus.COMPLETED },
				new BigDecimal[] { null });
		addAttempt(assignment, aboveStudent, 1, SubmissionStatus.GRADED, oneAmVietnam,
				new BigDecimal[] { new BigDecimal("8") }, new GradingStatus[] { GradingStatus.COMPLETED },
				new BigDecimal[] { null });

		mockMvc.perform(get("/api/v1/reports/classes/{id}/progress", classId)
				.param("from", "2026-11-01").param("to", "2026-11-01")
				.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.completionRatePercent").value(66.67))
				.andExpect(jsonPath("$.totalStudentCount").value(3))
				.andExpect(jsonPath("$.scoredStudentCount").value(2))
				.andExpect(jsonPath("$.belowAverageCount").value(1))
				.andExpect(jsonPath("$.belowAverageRatePercent").value(50.00))
				.andExpect(jsonPath("$.laggingStudents.length()").value(1))
				.andExpect(jsonPath("$.laggingStudents[0].studentId").value(belowStudent))
				.andExpect(jsonPath("$.laggingStudents[0].averageScorePercent").value(40.00))
				.andExpect(jsonPath("$.unscoredStudents.length()").value(1))
				.andExpect(jsonPath("$.unscoredStudents[0].studentId").value(unscoredStudent))
				.andExpect(jsonPath("$.unscoredStudents[0].completionRatePercent").value(0.00))
				.andExpect(jsonPath("$.assignmentScores.length()").value(1));

		mockMvc.perform(get("/api/v1/reports/classes/{id}/progress", classId)
				.param("from", "2026-10-31").param("to", "2026-10-31")
				.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.assignmentScores.length()").value(0))
				.andExpect(jsonPath("$.scoredStudentCount").value(0));

		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", belowStudent)
				.param("classId", Long.toString(classId))
				.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.classId").value(classId))
				.andExpect(jsonPath("$.skillAverages[0].averageScorePercent").value(40.00));
	}

	private ResultActions getOverview(long adminId, String query) throws Exception {
		return mockMvc.perform(get("/api/v1/reports/overview" + query)
				.header("Authorization", bearer(adminId, UserRole.ADMIN)));
	}

	private ResultActions getClassProgress(long classId, long adminId, String query) throws Exception {
		return mockMvc.perform(get("/api/v1/reports/classes/{id}/progress" + query, classId)
				.header("Authorization", bearer(adminId, UserRole.ADMIN)));
	}

	private void createScoredAssignment(long classId, long studentId, String score) {
		long assignment = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignment, BigDecimal.TEN);
		addAttempt(assignment, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { new BigDecimal(score) }, new GradingStatus[] { GradingStatus.COMPLETED },
				new BigDecimal[] { null });
	}

}
