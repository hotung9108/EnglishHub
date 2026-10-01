package com.english_hub.core.modules.report.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
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
class ReportAccessApiIntegrationTest extends ReportIntegrationTestBase {

	@Test
	void teacherCanReadOwnedClassButNotForeignOrMissingClass() throws Exception {
		long teacherId = createTeacher("Owner teacher");
		long otherTeacherId = createTeacher("Other teacher");
		long ownedClass = createClass(teacherId, ClassStatus.ACTIVE);
		long foreignClass = createClass(otherTeacherId, ClassStatus.ACTIVE);
		String auth = bearer(teacherId, UserRole.TEACHER);

		mockMvc.perform(get("/api/v1/reports/classes/{id}/progress", ownedClass)
				.header("Authorization", auth))
				.andExpect(status().isOk());
		mockMvc.perform(get("/api/v1/reports/classes/{id}/progress", foreignClass)
				.header("Authorization", auth))
				.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/reports/classes/{id}/progress", 999999999L)
				.header("Authorization", auth))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").exists());
	}

	@Test
	void teacherCannotRequestAnotherTeachersOverview() throws Exception {
		long teacherId = createTeacher("Current teacher");
		long otherTeacherId = createTeacher("Requested teacher");

		mockMvc.perform(get("/api/v1/reports/overview")
				.param("teacherId", Long.toString(otherTeacherId))
				.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isForbidden());
	}

	@Test
	void studentCannotOpenReportRoute() throws Exception {
		long studentId = createStudent("Student", UserStatus.ACTIVE, false);

		mockMvc.perform(get("/api/v1/reports/overview")
				.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isForbidden());
	}

	@Test
	void overviewRejectsReversedDateRange() throws Exception {
		long adminId = createAdmin();

		mockMvc.perform(get("/api/v1/reports/overview")
				.param("from", "2026-09-16")
				.param("to", "2026-09-15")
				.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").exists());
	}

	@Test
	void classProgressRejectsThresholdAboveOneHundred() throws Exception {
		long adminId = createAdmin();
		long classId = createClass(null, ClassStatus.ACTIVE);

		mockMvc.perform(get("/api/v1/reports/classes/{id}/progress", classId)
				.param("threshold", "100.01")
				.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isBadRequest());
	}

	@Test
	void classesRejectsInvalidPageAndLimit() throws Exception {
		long adminId = createAdmin();
		String auth = bearer(adminId, UserRole.ADMIN);

		mockMvc.perform(get("/api/v1/reports/classes").param("page", "0")
				.header("Authorization", auth))
				.andExpect(status().isBadRequest());
		mockMvc.perform(get("/api/v1/reports/classes").param("limit", "101")
				.header("Authorization", auth))
				.andExpect(status().isBadRequest());
	}
}
