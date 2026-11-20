package com.english_hub.core.modules.report.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ReportStudentOverallApiIntegrationTest extends ReportIntegrationTestBase {
	private static final String FORBIDDEN_ERROR = "Bạn không có quyền thực hiện thao tác này.";
	private static final String REPORT_FORBIDDEN_ERROR = "Bạn không có quyền xem báo cáo này.";
	private static final String INVALID_DATA_ERROR = "Dữ liệu không hợp lệ.";

	@Test
	void overall_forFourSkillsMatchesProgressTimelineAndSkillAverages() throws Exception {
		long teacherId = createTeacher("Overall main teacher");
		long adminId = createAdmin();
		long studentId = createStudent("Overall main student", UserStatus.ACTIVE, false);
		long classId = createClass(teacherId, ClassStatus.ACTIVE);
		addMember(classId, studentId);
		long assignmentId = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignmentId, BigDecimal.TEN, BigDecimal.TEN, new BigDecimal("20"), BigDecimal.TEN);
		addAttempt(assignmentId, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("6"), new BigDecimal("4"),
						new BigDecimal("18"), new BigDecimal("8") },
				completedGradings(4), new BigDecimal[] { null, null, null, null });
		String adminToken = bearer(adminId, UserRole.ADMIN);

		expectOverall(getOverall(studentId, Long.toString(classId), adminToken), 6.8, false, 4);
		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", studentId)
				.param("classId", Long.toString(classId))
				.header("Authorization", adminToken))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.skillAverages.length()").value(4))
				.andExpect(jsonPath("$.skillAverages[0].skill").value("READING"))
				.andExpect(jsonPath("$.skillAverages[0].averageScorePercent").value(60.00))
				.andExpect(jsonPath("$.skillAverages[1].skill").value("LISTENING"))
				.andExpect(jsonPath("$.skillAverages[1].averageScorePercent").value(40.00))
				.andExpect(jsonPath("$.skillAverages[2].skill").value("WRITING"))
				.andExpect(jsonPath("$.skillAverages[2].averageScorePercent").value(90.00))
				.andExpect(jsonPath("$.skillAverages[3].skill").value("SPEAKING"))
				.andExpect(jsonPath("$.skillAverages[3].averageScorePercent").value(80.00))
				.andExpect(jsonPath("$.scoreTimeline.length()").value(1))
				.andExpect(jsonPath("$.scoreTimeline[0].assignmentId").value(assignmentId))
				.andExpect(jsonPath("$.scoreTimeline[0].scorePercent").value(67.5));
	}

	@Test
	void overall_withoutScoredSubmissionsReturnsNullAndAllSkillsMissing() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("No scored submissions", UserStatus.ACTIVE, false);

		expectEmptyOverall(getOverall(studentId, null, bearer(adminId, UserRole.ADMIN)));
	}

	@Test
	void overall_withThreeModuleTypesReportsOneMissingSkill() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("Three skills", UserStatus.ACTIVE, false);
		long classId = createClass(createTeacher("Three skills teacher"), ClassStatus.ACTIVE);
		long assignmentId = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignmentId, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN);
		addAttempt(assignmentId, studentId, 1, SubmissionStatus.SUBMITTED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("7"), new BigDecimal("8"), new BigDecimal("9") },
				completedGradings(3), new BigDecimal[] { null, null, null });

		expectOverall(getOverall(studentId, Long.toString(classId), bearer(adminId, UserRole.ADMIN)),
				8.0, true, 3, "SPEAKING");
	}

	@Test
	void overall_withTwoModuleTypesReportsTwoMissingSkillsInEnumOrder() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("Two skills", UserStatus.ACTIVE, false);
		long classId = createClass(createTeacher("Two skills teacher"), ClassStatus.ACTIVE);
		long assignmentId = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignmentId, BigDecimal.TEN, BigDecimal.TEN);
		addAttempt(assignmentId, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("8"), new BigDecimal("6") },
				completedGradings(2), new BigDecimal[] { null, null });

		expectOverall(getOverall(studentId, Long.toString(classId), bearer(adminId, UserRole.ADMIN)),
				7.0, true, 2, "WRITING", "SPEAKING");
	}

	@Test
	void overall_withOneModuleTypeReportsThreeMissingSkillsInEnumOrder() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("One skill", UserStatus.ACTIVE, false);
		long classId = createClass(createTeacher("One skill teacher"), ClassStatus.ACTIVE);
		long assignmentId = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignmentId, BigDecimal.TEN);
		addAttempt(assignmentId, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"), new BigDecimal[] { new BigDecimal("9") },
				completedGradings(1), new BigDecimal[] { null });

		expectOverall(getOverall(studentId, Long.toString(classId), bearer(adminId, UserRole.ADMIN)),
				9.0, true, 1, "LISTENING", "WRITING", "SPEAKING");
	}

	@Test
	void overall_withSeveralModulesOfSameSkillUsesCombinedScoreAndMaximum() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("Repeated skill modules", UserStatus.ACTIVE, false);
		long teacherId = createTeacher("Repeated skill teacher");
		long classId = createClass(teacherId, ClassStatus.ACTIVE);
		long assignmentId = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignmentId, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN,
				new BigDecimal("20"));
		addAttempt(assignmentId, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("8"), BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN,
						new BigDecimal("18") },
				completedGradings(5), new BigDecimal[] { null, null, null, null, null });
		String adminToken = bearer(adminId, UserRole.ADMIN);

		expectOverall(getOverall(studentId, Long.toString(classId), adminToken), 9.7, false, 4);
		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", studentId)
				.param("classId", Long.toString(classId)).header("Authorization", adminToken))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.skillAverages[0].skill").value("READING"))
				.andExpect(jsonPath("$.skillAverages[0].averageScorePercent").value(86.67))
				.andExpect(jsonPath("$.skillAverages[1].averageScorePercent").value(100.00))
				.andExpect(jsonPath("$.scoreTimeline[0].scorePercent").value(96.67));
	}

	@Test
	void overall_adminWithoutClassIdCombinesScoresAcrossTwoClasses() throws Exception {
		long firstTeacherId = createTeacher("First all-class teacher");
		long secondTeacherId = createTeacher("Second all-class teacher");
		long adminId = createAdmin();
		long studentId = createStudent("Student in two classes", UserStatus.ACTIVE, false);
		long firstClassId = createClass(firstTeacherId, ClassStatus.ACTIVE);
		long secondClassId = createClass(secondTeacherId, ClassStatus.ACTIVE);
		addMember(firstClassId, studentId);
		addMember(secondClassId, studentId);

		long firstAssignmentId = createAssignment(
				firstClassId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(firstAssignmentId, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN);
		addAttempt(firstAssignmentId, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("8"), new BigDecimal("8"),
						new BigDecimal("8"), new BigDecimal("8") },
				completedGradings(4), new BigDecimal[] { null, null, null, null });

		long secondAssignmentId = createAssignment(
				secondClassId, AssignmentStatus.PUBLISHED, "2026-09-16T00:00:00Z", false);
		createModules(secondAssignmentId, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN);
		addAttempt(secondAssignmentId, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-16T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("4"), new BigDecimal("4"),
						new BigDecimal("4"), new BigDecimal("4") },
				completedGradings(4), new BigDecimal[] { null, null, null, null });

		String adminToken = bearer(adminId, UserRole.ADMIN);
		ResultActions allClassesOverall = getOverall(studentId, null, adminToken);
		// Class 1 has 80% in every skill; class 2 has 40% in every skill.
		// Each skill across both classes is (80% + 40%) / 2 = 60%.
		// The equal-weighted skill mean is 60%; on the 10-point scale it is 6.0.
		expectOverall(allClassesOverall, 6.0, false, 4);
		expectOverall(getOverall(studentId, Long.toString(firstClassId), adminToken), 8.0, false, 4);
		expectOverall(getOverall(studentId, Long.toString(secondClassId), adminToken), 4.0, false, 4);

		MvcResult progressResult = mockMvc.perform(get("/api/v1/reports/students/{id}/progress", studentId)
				.header("Authorization", adminToken))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.skillAverages.length()").value(4))
				.andExpect(jsonPath("$.scoreTimeline.length()").value(2))
				.andReturn();

		ObjectMapper objectMapper = new ObjectMapper();
		JsonNode progressBody = objectMapper.readTree(progressResult.getResponse().getContentAsString());
		JsonNode skillAverages = progressBody.get("skillAverages");
		BigDecimal totalSkillAveragePercent = BigDecimal.ZERO;
		// These finite ratios are represented exactly in skillAverages, so the values can be compared directly.
		for (JsonNode skillAverage : skillAverages) {
			assertThat(skillAverage.get("averageScorePercent").decimalValue())
					.isEqualByComparingTo("60.00");
			totalSkillAveragePercent = totalSkillAveragePercent
					.add(skillAverage.get("averageScorePercent").decimalValue());
		}
		BigDecimal progressOverallOnTen = totalSkillAveragePercent
				.divide(BigDecimal.valueOf(skillAverages.size()))
				.divide(BigDecimal.TEN);
		JsonNode overallBody = objectMapper.readTree(
				allClassesOverall.andReturn().getResponse().getContentAsString());
		assertThat(overallBody.get("overallScore").decimalValue())
				.isEqualByComparingTo(progressOverallOnTen);

		expectApiError(getOverall(studentId, null, bearer(firstTeacherId, UserRole.TEACHER)),
				400, "Giáo viên phải truyền classId.");
	}

	@Test
	void overall_usesTheExistingBestAttemptSelectorForTwoAttempts() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("Two attempts", UserStatus.ACTIVE, false);
		long classId = createClass(createTeacher("Attempt selector teacher"), ClassStatus.ACTIVE);
		long assignmentId = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignmentId, BigDecimal.TEN, BigDecimal.TEN, new BigDecimal("20"), BigDecimal.TEN);
		addAttempt(assignmentId, studentId, 1, SubmissionStatus.SUBMITTED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("6"), new BigDecimal("6"),
						new BigDecimal("20"), new BigDecimal("6") },
				completedGradings(4), new BigDecimal[] { null, null, null, null });
		addAttempt(assignmentId, studentId, 2, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-16T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("8"), new BigDecimal("8"),
						new BigDecimal("10"), new BigDecimal("8") },
				completedGradings(4), new BigDecimal[] { null, null, null, null });
		String adminToken = bearer(adminId, UserRole.ADMIN);

		expectOverall(getOverall(studentId, Long.toString(classId), adminToken), 7.0, false, 4);
		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", studentId)
				.param("classId", Long.toString(classId)).header("Authorization", adminToken))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.scoreTimeline.length()").value(1))
				.andExpect(jsonPath("$.scoreTimeline[0].scorePercent").value(70.0))
				.andExpect(jsonPath("$.skillAverages[0].averageScorePercent").value(60.00))
				.andExpect(jsonPath("$.skillAverages[2].averageScorePercent").value(100.00));
	}

	@Test
	void overallAcrossAssignmentsEqualsMeanOfProgressSkillAveragesOnTen() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("Multiple assignments", UserStatus.ACTIVE, false);
		long classId = createClass(createTeacher("Multiple assignments teacher"), ClassStatus.ACTIVE);
		long firstAssignment = createAssignment(classId, AssignmentStatus.PUBLISHED,
				"2026-09-15T00:00:00Z", false);
		createModules(firstAssignment, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN);
		addAttempt(firstAssignment, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("8"), new BigDecimal("8"),
						new BigDecimal("8"), new BigDecimal("8") },
				completedGradings(4), new BigDecimal[] { null, null, null, null });
		long secondAssignment = createAssignment(classId, AssignmentStatus.CLOSED,
				"2026-09-16T00:00:00Z", false);
		createModules(secondAssignment, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN);
		addAttempt(secondAssignment, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-16T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("6"), new BigDecimal("6"),
						new BigDecimal("6"), new BigDecimal("6") },
				completedGradings(4), new BigDecimal[] { null, null, null, null });
		String adminToken = bearer(adminId, UserRole.ADMIN);

		expectOverall(getOverall(studentId, Long.toString(classId), adminToken), 7.0, false, 4);
		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", studentId)
				.param("classId", Long.toString(classId)).header("Authorization", adminToken))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.scoreTimeline.length()").value(2))
				.andExpect(jsonPath("$.scoreTimeline[0].assignmentId").value(firstAssignment))
				.andExpect(jsonPath("$.scoreTimeline[0].scorePercent").value(80.0))
				.andExpect(jsonPath("$.scoreTimeline[1].assignmentId").value(secondAssignment))
				.andExpect(jsonPath("$.scoreTimeline[1].scorePercent").value(60.0))
				.andExpect(jsonPath("$.skillAverages[0].averageScorePercent").value(70.00))
				.andExpect(jsonPath("$.skillAverages[1].averageScorePercent").value(70.00))
				.andExpect(jsonPath("$.skillAverages[2].averageScorePercent").value(70.00))
				.andExpect(jsonPath("$.skillAverages[3].averageScorePercent").value(70.00));
	}

	@Test
	void overall_usesSnapshotMaximumBeforeModuleMaximum() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("Snapshot maximum", UserStatus.ACTIVE, false);
		long classId = createClass(createTeacher("Snapshot teacher"), ClassStatus.ACTIVE);
		long assignmentId = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignmentId, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN);
		addAttempt(assignmentId, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("18"), new BigDecimal("8"),
						new BigDecimal("6"), new BigDecimal("4") },
				completedGradings(4),
				new BigDecimal[] { new BigDecimal("20"), null, null, null });

		expectOverall(getOverall(studentId, Long.toString(classId), bearer(adminId, UserRole.ADMIN)),
				6.8, false, 4);
	}

	@Test
	void overall_fallsBackToModuleMaximumWhenSnapshotIsNull() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("Module maximum fallback", UserStatus.ACTIVE, false);
		long classId = createClass(createTeacher("Maximum fallback teacher"), ClassStatus.ACTIVE);
		long assignmentId = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignmentId, BigDecimal.TEN, BigDecimal.TEN, new BigDecimal("20"), BigDecimal.TEN);
		addAttempt(assignmentId, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("6"), new BigDecimal("4"),
						new BigDecimal("18"), new BigDecimal("8") },
				completedGradings(4), new BigDecimal[] { null, null, null, null });

		expectOverall(getOverall(studentId, Long.toString(classId), bearer(adminId, UserRole.ADMIN)),
				6.8, false, 4);
	}

	@Test
	void overall_databaseRatioAtSevenPointTwentyFiveRoundsHalfUp() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("Exact boundary", UserStatus.ACTIVE, false);
		long classId = createClass(createTeacher("Exact boundary teacher"), ClassStatus.ACTIVE);
		long assignmentId = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignmentId, new BigDecimal("3"), new BigDecimal("90"),
				new BigDecimal("90"), new BigDecimal("90"));
		addAttempt(assignmentId, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { new BigDecimal("2"), new BigDecimal("67"),
						new BigDecimal("67"), new BigDecimal("67") },
				completedGradings(4), new BigDecimal[] { null, null, null, null });

		expectOverall(getOverall(studentId, Long.toString(classId), bearer(adminId, UserRole.ADMIN)),
				7.3, false, 4);
	}

	@Test
	void overall_excludesWholeSubmissionWhenAnyGradingIsIncomplete() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("Incomplete grading", UserStatus.ACTIVE, false);
		long classId = createClass(createTeacher("Incomplete grading teacher"), ClassStatus.ACTIVE);
		List<GradingStatus> incompleteStatuses = List.of(
				GradingStatus.PENDING, GradingStatus.AI_GRADED, GradingStatus.FAILED);
		int attemptNumber = 1;
		for (GradingStatus incompleteStatus : incompleteStatuses) {
			long assignmentId = createAssignment(classId, AssignmentStatus.PUBLISHED,
					"2026-09-15T00:00:00Z", false);
			createModules(assignmentId, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN);
			GradingStatus[] statuses = completedGradings(4);
			statuses[3] = incompleteStatus;
			addAttempt(assignmentId, studentId, attemptNumber, SubmissionStatus.GRADED,
					OffsetDateTime.parse("2026-09-15T10:00:00Z").plusDays(attemptNumber),
					new BigDecimal[] { BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN },
					statuses, new BigDecimal[] { null, null, null, null });
			attemptNumber++;
		}

		expectEmptyOverall(getOverall(studentId, Long.toString(classId), bearer(adminId, UserRole.ADMIN)));
	}

	@Test
	void overall_excludesSubmissionWhenCompletedGradingHasNullFinalScore() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("Null final score", UserStatus.ACTIVE, false);
		long classId = createClass(createTeacher("Null final score teacher"), ClassStatus.ACTIVE);
		long assignmentId = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignmentId, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN);
		addAttempt(assignmentId, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				new BigDecimal[] { BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, null },
				completedGradings(4), new BigDecimal[] { null, null, null, null });

		expectEmptyOverall(getOverall(studentId, Long.toString(classId), bearer(adminId, UserRole.ADMIN)));
	}

	@Test
	void overallAndProgress_excludeInProgressAndSoftDeletedAssignmentData() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("Excluded attempts", UserStatus.ACTIVE, false);
		long classId = createClass(createTeacher("Excluded attempts teacher"), ClassStatus.ACTIVE);
		long inProgressAssignment = createAssignment(classId, AssignmentStatus.PUBLISHED,
				"2026-09-15T00:00:00Z", false);
		createModules(inProgressAssignment, BigDecimal.TEN);
		addAttempt(inProgressAssignment, studentId, 1, SubmissionStatus.IN_PROGRESS,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"), new BigDecimal[] { BigDecimal.TEN },
				completedGradings(1), new BigDecimal[] { null });
		long deletedAssignment = createAssignment(classId, AssignmentStatus.PUBLISHED,
				"2026-09-15T00:00:00Z", true);
		createModules(deletedAssignment, BigDecimal.TEN);
		addAttempt(deletedAssignment, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T11:00:00Z"), new BigDecimal[] { BigDecimal.TEN },
				completedGradings(1), new BigDecimal[] { null });
		String adminToken = bearer(adminId, UserRole.ADMIN);

		expectEmptyOverall(getOverall(studentId, Long.toString(classId), adminToken));
		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", studentId)
				.param("classId", Long.toString(classId)).header("Authorization", adminToken))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.skillAverages.length()").value(0))
				.andExpect(jsonPath("$.scoreTimeline.length()").value(0));
	}

	@Test
	void overall_adminMayOmitOrProvideClassId() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("Admin class scope", UserStatus.ACTIVE, false);
		long classId = createClass(createTeacher("Admin class scope teacher"), ClassStatus.ACTIVE);
		long assignmentId = createAssignment(classId, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignmentId, BigDecimal.TEN);
		addAttempt(assignmentId, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"), new BigDecimal[] { new BigDecimal("8") },
				completedGradings(1), new BigDecimal[] { null });
		String adminToken = bearer(adminId, UserRole.ADMIN);

		expectOverall(getOverall(studentId, null, adminToken), 8.0, true, 1,
				"LISTENING", "WRITING", "SPEAKING");
		expectOverall(getOverall(studentId, Long.toString(classId), adminToken), 8.0, true, 1,
				"LISTENING", "WRITING", "SPEAKING");
	}

	@Test
	void overall_teacherRequiresOwnedClassAndClassId() throws Exception {
		long teacherId = createTeacher("Overall teacher");
		long otherTeacherId = createTeacher("Other overall teacher");
		long adminId = createAdmin();
		long studentId = createStudent("Teacher access student", UserStatus.ACTIVE, false);
		long ownedClass = createClass(teacherId, ClassStatus.ACTIVE);
		long foreignClass = createClass(otherTeacherId, ClassStatus.ACTIVE);
		long assignmentId = createAssignment(ownedClass, AssignmentStatus.PUBLISHED, "2026-09-15T00:00:00Z", false);
		createModules(assignmentId, BigDecimal.TEN);
		addAttempt(assignmentId, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"), new BigDecimal[] { new BigDecimal("8") },
				completedGradings(1), new BigDecimal[] { null });
		String teacherToken = bearer(teacherId, UserRole.TEACHER);

		expectOverall(getOverall(studentId, Long.toString(ownedClass), teacherToken),
				8.0, true, 1, "LISTENING", "WRITING", "SPEAKING");
		expectApiError(getOverall(studentId, null, teacherToken), 400, "Giáo viên phải truyền classId.");
		expectApiError(getOverall(studentId, Long.toString(foreignClass), teacherToken),
				403, REPORT_FORBIDDEN_ERROR);
		expectApiError(getOverall(studentId, "999999999", bearer(adminId, UserRole.ADMIN)), 404,
				"Không tìm thấy lớp học.");
	}

	@Test
	void overall_requiresAuthenticationAndRejectsStudentEvenForSelf() throws Exception {
		long studentId = createStudent("Self access student", UserStatus.ACTIVE, false);

		expectApiError(getOverall(studentId, null, null), 401,
				"Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
		expectApiError(getOverall(studentId, null, bearer(studentId, UserRole.STUDENT)), 403, FORBIDDEN_ERROR);
	}

	@Test
	void overall_returnsNotFoundForMissingNonStudentAndSoftDeletedStudent() throws Exception {
		long adminId = createAdmin();
		long teacherId = createTeacher("Not a student target");
		long deletedStudentId = createStudent("Soft deleted target", UserStatus.ACTIVE, true);
		String adminToken = bearer(adminId, UserRole.ADMIN);

		expectApiError(getOverall(999999999L, null, adminToken), 404, "Không tìm thấy học viên.");
		expectApiError(getOverall(teacherId, null, adminToken), 404, "Không tìm thấy học viên.");
		expectApiError(getOverall(deletedStudentId, null, adminToken), 404, "Không tìm thấy học viên.");
	}

	@Test
	void overall_invalidClassIdAndStudentIdTypesReturnBadRequestJson() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("Invalid type student", UserStatus.ACTIVE, false);
		String adminToken = bearer(adminId, UserRole.ADMIN);

		expectApiError(getOverall(studentId, "not-a-number", adminToken), 400, INVALID_DATA_ERROR);
		expectApiError(mockMvc.perform(get("/api/v1/evaluations/students/{id}/overall", "not-a-number")
				.header("Authorization", adminToken)), 400, INVALID_DATA_ERROR);
	}

	@Test
	void overall_postMethodIsDeniedByCurrentRoutePolicy() throws Exception {
		long adminId = createAdmin();
		long studentId = createStudent("Unsupported method student", UserStatus.ACTIVE, false);

		expectApiError(mockMvc.perform(post("/api/v1/evaluations/students/{id}/overall", studentId)
				.header("Authorization", bearer(adminId, UserRole.ADMIN))), 403, FORBIDDEN_ERROR);
	}

	@Test
	void overall_adminCanReadHistoryAfterClassMembershipIsDeleted() throws Exception {
		long adminId = createAdmin();
		long teacherId = createTeacher("Departed membership teacher");
		long studentId = createStudent("Departed membership student", UserStatus.ACTIVE, false);
		long classId = createClass(teacherId, ClassStatus.COMPLETED);
		addMember(classId, studentId);
		long assignmentId = createAssignment(classId, AssignmentStatus.CLOSED, "2026-09-15T00:00:00Z", false);
		createModules(assignmentId, BigDecimal.TEN);
		addAttempt(assignmentId, studentId, 1, SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"), new BigDecimal[] { new BigDecimal("7") },
				completedGradings(1), new BigDecimal[] { null });
		memberRepository.delete(memberRepository.findByClassId(classId).get(0));
		String adminToken = bearer(adminId, UserRole.ADMIN);

		expectOverall(getOverall(studentId, Long.toString(classId), adminToken),
				7.0, true, 1, "LISTENING", "WRITING", "SPEAKING");
		mockMvc.perform(get("/api/v1/reports/students/{id}/progress", studentId)
				.param("classId", Long.toString(classId)).header("Authorization", adminToken))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.scoreTimeline.length()").value(1))
				.andExpect(jsonPath("$.scoreTimeline[0].scorePercent").value(70.0));
	}

	@Test
	void existingEvaluationByIdRouteStillReturnsItsEvaluation() throws Exception {
		long teacherId = createTeacher("Old evaluation route teacher");
		long studentId = createStudent("Old evaluation route student", UserStatus.ACTIVE, false);
		long classId = createClass(teacherId, ClassStatus.ACTIVE);
		addMember(classId, studentId);
		String teacherToken = bearer(teacherId, UserRole.TEACHER);
		String createBody = "{\"classId\":" + classId + ",\"content\":\"Good progress\"}";
		String response = mockMvc.perform(post("/api/v1/students/{id}/evaluations", studentId)
				.header("Authorization", teacherToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(createBody))
				.andExpect(status().isCreated())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.message").value("Đã lưu đánh giá."))
				.andExpect(jsonPath("$.id").isNumber())
				.andReturn().getResponse().getContentAsString();
		long evaluationId = new ObjectMapper().readTree(response).get("id").asLong();

		mockMvc.perform(get("/api/v1/evaluations/{id}", evaluationId)
				.header("Authorization", teacherToken))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.id").value(evaluationId))
				.andExpect(jsonPath("$.content").value("Good progress"));
	}

	private ResultActions getOverall(long studentId, String classId, String authorization) throws Exception {
		MockHttpServletRequestBuilder request = get("/api/v1/evaluations/students/{id}/overall", studentId);
		if (classId != null) {
			request.param("classId", classId);
		}
		if (authorization != null) {
			request.header("Authorization", authorization);
		}
		return mockMvc.perform(request);
	}

	private void expectOverall(
			ResultActions response, double score, boolean limitedData, int completedSkillCount, String... missingSkills)
			throws Exception {
		response.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.overallScore").value(score))
				.andExpect(jsonPath("$.limitedData").value(limitedData))
				.andExpect(jsonPath("$.completedSkillCount").value(completedSkillCount))
				.andExpect(jsonPath("$.missingSkills.length()").value(missingSkills.length))
				.andExpect(jsonPath("$.data").doesNotExist());
		for (int index = 0; index < missingSkills.length; index++) {
			response.andExpect(jsonPath("$.missingSkills[" + index + "]").value(missingSkills[index]));
		}
	}

	private void expectEmptyOverall(ResultActions response) throws Exception {
		response.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.overallScore").value(nullValue()))
				.andExpect(jsonPath("$.limitedData").value(true))
				.andExpect(jsonPath("$.completedSkillCount").value(0))
				.andExpect(jsonPath("$.missingSkills.length()").value(4))
				.andExpect(jsonPath("$.missingSkills[0]").value("READING"))
				.andExpect(jsonPath("$.missingSkills[1]").value("LISTENING"))
				.andExpect(jsonPath("$.missingSkills[2]").value("WRITING"))
				.andExpect(jsonPath("$.missingSkills[3]").value("SPEAKING"))
				.andExpect(content().string(containsString("\"overallScore\":null")));
	}

	private void expectApiError(ResultActions response, int expectedStatus, String expectedError) throws Exception {
		response.andExpect(status().is(expectedStatus))
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.error").value(expectedError));
	}

	private GradingStatus[] completedGradings(int moduleCount) {
		GradingStatus[] statuses = new GradingStatus[moduleCount];
		for (int index = 0; index < moduleCount; index++) {
			statuses[index] = GradingStatus.COMPLETED;
		}
		return statuses;
	}
}
