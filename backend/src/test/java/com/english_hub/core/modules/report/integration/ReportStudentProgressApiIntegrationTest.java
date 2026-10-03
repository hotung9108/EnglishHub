package com.english_hub.core.modules.report.integration;

import static org.hamcrest.Matchers.nullValue;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ReportStudentProgressApiIntegrationTest extends ReportIntegrationTestBase {

	@Test
	void adminWithoutClassIdGetsBestScoresAcrossAllClasses() throws Exception {
		long teacherId = createTeacher("Student report teacher");
		long studentId = createStudent("Progress student", UserStatus.ACTIVE, false);
		long firstClass = createClass(teacherId, ClassStatus.ACTIVE);
		long secondClass = createClass(teacherId, ClassStatus.ACTIVE);
		long firstAssignment = createAssignment(firstClass, AssignmentStatus.PUBLISHED,
				"2026-09-15T00:00:00Z", false);
		createModules(firstAssignment, BigDecimal.TEN, new BigDecimal("20"));
		addAttempt(firstAssignment, studentId, 1, SubmissionStatus.SUBMITTED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("8"), new BigDecimal("10") },
				new GradingStatus[] { GradingStatus.COMPLETED, GradingStatus.COMPLETED },
				new BigDecimal[] { null, null });
		addAttempt(firstAssignment, studentId, 2, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-16T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("8"), new BigDecimal("18") },
				new GradingStatus[] { GradingStatus.COMPLETED, GradingStatus.COMPLETED },
				new BigDecimal[] { null, null });
		long secondAssignment = createAssignment(secondClass, AssignmentStatus.CLOSED,
				"2026-09-16T00:00:00Z", false);
		createModules(secondAssignment, BigDecimal.TEN);
		addAttempt(secondAssignment, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-17T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("5") }, new GradingStatus[] { GradingStatus.COMPLETED },
				new BigDecimal[] { null });
		long adminId = createAdmin();

		MvcResult result = mockMvc.perform(get("/api/v1/reports/students/{id}/progress", studentId)
				.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.studentId").value(studentId))
				.andExpect(jsonPath("$.studentName").value("Progress student"))
				.andExpect(jsonPath("$.classId").value(nullValue()))
				.andExpect(jsonPath("$.skillAverages[0].skill").value("READING"))
				.andExpect(jsonPath("$.skillAverages[0].averageScorePercent").value(65.00))
				.andExpect(jsonPath("$.skillAverages[1].skill").value("LISTENING"))
				.andExpect(jsonPath("$.skillAverages[1].averageScorePercent").value(90.00))
				.andExpect(jsonPath("$.scoreTimeline.length()").value(2))
				.andExpect(jsonPath("$.scoreTimeline[0].assignmentId").value(firstAssignment))
				.andExpect(jsonPath("$.scoreTimeline[0].scorePercent").value(86.67))
				.andExpect(jsonPath("$.scoreTimeline[1].assignmentId").value(secondAssignment))
				.andExpect(jsonPath("$.scoreTimeline[1].scorePercent").value(50.00))
				.andReturn();
		org.assertj.core.api.Assertions.assertThat(result.getResponse().getContentAsString()).contains("scoreTimeline");
	}

	@Test
	void teacherNeedsOwnedClassAndCannotReadAnotherTeachersClass() throws Exception {
		long teacherId = createTeacher("Owner teacher");
		long otherTeacherId = createTeacher("Other teacher");
		long studentId = createStudent("Teacher report student", UserStatus.ACTIVE, false);
		long ownedClass = createClass(teacherId, ClassStatus.ACTIVE);
		long foreignClass = createClass(otherTeacherId, ClassStatus.ACTIVE);
		long assignment = createAssignment(ownedClass, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignment, BigDecimal.TEN);
		addAttempt(assignment, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"), new BigDecimal[] { new BigDecimal("8") },
				new GradingStatus[] { GradingStatus.COMPLETED }, new BigDecimal[] { null });
		String auth = bearer(teacherId, UserRole.TEACHER);

		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", studentId)
				.param("classId", Long.toString(ownedClass)).header("Authorization", auth))
				.andExpect(status().isOk());
		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", studentId)
				.header("Authorization", auth))
				.andExpect(status().isBadRequest());
		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", studentId)
				.param("classId", Long.toString(foreignClass)).header("Authorization", auth))
				.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", studentId)
				.param("classId", "999999999").header("Authorization", auth))
				.andExpect(status().isNotFound());
	}

	@Test
	void departedStudentStillHasHistoricalProgress() throws Exception {
		long teacherId = createTeacher("History teacher");
		long studentId = createStudent("Departed student", UserStatus.ACTIVE, false);
		long classId = createClass(teacherId, ClassStatus.COMPLETED);
		addMember(classId, studentId);
		long assignment = createAssignment(classId, AssignmentStatus.CLOSED, "2026-09-15T00:00:00Z", false);
		createModules(assignment, BigDecimal.TEN);
		addAttempt(assignment, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"), new BigDecimal[] { new BigDecimal("7") },
				new GradingStatus[] { GradingStatus.COMPLETED }, new BigDecimal[] { null });
		memberRepository.delete(memberRepository.findByClassId(classId).get(0));
		long adminId = createAdmin();

		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", studentId)
				.param("classId", Long.toString(classId))
				.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.scoreTimeline.length()").value(1))
				.andExpect(jsonPath("$.scoreTimeline[0].scorePercent").value(70.00));
	}

	@Test
	void emptyDateWindowReturnsEmptySkillAndTimelineLists() throws Exception {
		long teacherId = createTeacher("Date teacher");
		long studentId = createStudent("Date student", UserStatus.ACTIVE, false);
		long classId = createClass(teacherId, ClassStatus.ACTIVE);
		long assignment = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignment, BigDecimal.TEN);
		addAttempt(assignment, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"), new BigDecimal[] { new BigDecimal("7") },
				new GradingStatus[] { GradingStatus.COMPLETED }, new BigDecimal[] { null });
		long adminId = createAdmin();

		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", studentId)
				.param("classId", Long.toString(classId))
				.param("from", "2026-10-01").param("to", "2026-10-01")
				.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.skillAverages.length()").value(0))
				.andExpect(jsonPath("$.scoreTimeline.length()").value(0));
	}

	@Test
	void missingDeletedOrNonStudentUserAndMissingClassReturnNotFound() throws Exception {
		long adminId = createAdmin();
		long teacherId = createTeacher("Not a student");
		long deletedStudent = createStudent("Deleted student", UserStatus.ACTIVE, true);
		long studentId = createStudent("Existing student", UserStatus.ACTIVE, false);
		String auth = bearer(adminId, UserRole.ADMIN);

		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", 999999999L)
				.header("Authorization", auth)).andExpect(status().isNotFound());
		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", teacherId)
				.header("Authorization", auth)).andExpect(status().isNotFound());
		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", deletedStudent)
				.header("Authorization", auth)).andExpect(status().isNotFound());
		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", studentId)
				.param("classId", "999999999").header("Authorization", auth))
				.andExpect(status().isNotFound());
	}
}
