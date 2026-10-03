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
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ReportTimeWindowApiIntegrationTest extends ReportIntegrationTestBase {

	@Test
	void reportUsesLocalOpenDateAndSubmittedDateForPendingGradings() throws Exception {
		DateFixture fixture = createFixture();
		mockMvc.perform(get("/api/v1/reports/overview")
				.param("from", "2026-09-15").param("to", "2026-09-15")
				.param("classId", Long.toString(fixture.classId()))
				.header("Authorization", bearer(fixture.adminId(), UserRole.ADMIN)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.assignedAssignmentCount").value(1))
				.andExpect(jsonPath("$.completionRatePercent").value(100.00))
				.andExpect(jsonPath("$.pendingGradingCount").value(3))
				.andExpect(jsonPath("$.pendingByStatus.PENDING").value(1))
				.andExpect(jsonPath("$.pendingByStatus.AI_GRADED").value(1))
				.andExpect(jsonPath("$.pendingByStatus.FAILED").value(1));
		assertCurrentMemberIsUnscored(fixture);
	}

	private void assertCurrentMemberIsUnscored(DateFixture fixture) throws Exception {
		mockMvc.perform(get("/api/v1/reports/classes/{id}/progress", fixture.classId())
				.param("from", "2026-09-15").param("to", "2026-09-15")
				.header("Authorization", bearer(fixture.adminId(), UserRole.ADMIN)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalStudentCount").value(1))
				.andExpect(jsonPath("$.scoredStudentCount").value(0))
				.andExpect(jsonPath("$.unscoredStudents[0].completionRatePercent").value(100.00))
				.andExpect(jsonPath("$.completionRatePercent").value(100.00));
	}

	private DateFixture createFixture() {
		long teacherId = createTeacher("Report teacher");
		long adminId = createAdmin();
		long currentStudent = createStudent("Locked but current", UserStatus.LOCKED, false);
		long deletedStudent = createStudent("Deleted", UserStatus.ACTIVE, true);
		long classId = createClass(teacherId, ClassStatus.ACTIVE);
		addMember(classId, currentStudent);
		addMember(classId, deletedStudent);
		addCompletionDateAssignment(classId, currentStudent);
		addPendingDateAssignment(classId, currentStudent, deletedStudent);
		return new DateFixture(adminId, classId);
	}

	private void addCompletionDateAssignment(long classId, long studentId) {
		long assignment = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00+07:00", false);
		createModules(assignment, BigDecimal.TEN);
		addAttempt(assignment, studentId, 1, SubmissionStatus.SUBMITTED,
				OffsetDateTime.parse("2026-09-14T16:00:00Z"),
				new BigDecimal[] { null }, new GradingStatus[] { GradingStatus.PENDING }, new BigDecimal[] { null });
	}

	private void addPendingDateAssignment(long classId, long currentStudent, long deletedStudent) {
		long assignment = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-13T18:00:00+07:00", false);
		createModules(assignment, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN);
		OffsetDateTime submittedAt = OffsetDateTime.parse("2026-09-15T12:00:00Z");
		addAttempt(assignment, currentStudent, 2, SubmissionStatus.GRADED, submittedAt,
				new BigDecimal[] { null, null, null },
				new GradingStatus[] { GradingStatus.PENDING, GradingStatus.AI_GRADED, GradingStatus.FAILED },
				new BigDecimal[] { null, null, null });
		addAttempt(assignment, currentStudent, 3, SubmissionStatus.IN_PROGRESS, null,
				new BigDecimal[] { null, null, null },
				new GradingStatus[] { GradingStatus.PENDING, GradingStatus.PENDING, GradingStatus.PENDING },
				new BigDecimal[] { null, null, null });
		addAttempt(assignment, deletedStudent, 1, SubmissionStatus.GRADED, submittedAt,
				new BigDecimal[] { null, null, null },
				new GradingStatus[] { GradingStatus.PENDING, GradingStatus.PENDING, GradingStatus.PENDING },
				new BigDecimal[] { null, null, null });
	}

	private record DateFixture(long adminId, long classId) {
	}
}
