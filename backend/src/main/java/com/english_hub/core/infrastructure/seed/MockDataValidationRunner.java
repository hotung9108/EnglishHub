package com.english_hub.core.infrastructure.seed;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import com.english_hub.core.infrastructure.persistence.entity.Answer;
import com.english_hub.core.infrastructure.persistence.repository.AnswerRepository;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Read-only validation for the data created by mock-data tasks 1-8.
 */
@Component
@Profile("seed")
@Order(9)
public class MockDataValidationRunner implements CommandLineRunner {

	private static final Logger LOGGER = LoggerFactory.getLogger(MockDataValidationRunner.class);
	private static final String REPORT_FILE_NAME = "mock-data-task-09-validation-report.txt";

	private static final List<String> TABLE_NAMES = List.of(
			"users",
			"teacher_profiles",
			"student_profiles",
			"classes",
			"class_members",
			"assignments",
			"modules",
			"questions",
			"submissions",
			"submission_modules",
			"answers",
			"answer_annotations",
			"gradings",
			"refresh_tokens",
			"student_evaluations",
			"grading_change_logs");

	private static final List<ForeignKeyCheck> FOREIGN_KEY_CHECKS = List.of(
			new ForeignKeyCheck(
					"teacher_profiles.user_id -> users.id",
					"SELECT tp.user_id FROM teacher_profiles tp "
							+ "LEFT JOIN users u ON u.id = tp.user_id "
							+ "WHERE u.id IS NULL ORDER BY tp.user_id"),
			new ForeignKeyCheck(
					"student_profiles.user_id -> users.id",
					"SELECT sp.user_id FROM student_profiles sp "
							+ "LEFT JOIN users u ON u.id = sp.user_id "
							+ "WHERE u.id IS NULL ORDER BY sp.user_id"),
			new ForeignKeyCheck(
					"classes.teacher_id -> teacher_profiles.user_id",
					"SELECT c.id FROM classes c "
							+ "LEFT JOIN teacher_profiles tp ON tp.user_id = c.teacher_id "
							+ "WHERE c.teacher_id IS NOT NULL AND tp.user_id IS NULL ORDER BY c.id"),
			new ForeignKeyCheck(
					"class_members.class_id -> classes.id",
					"SELECT cm.id FROM class_members cm "
							+ "LEFT JOIN classes c ON c.id = cm.class_id "
							+ "WHERE c.id IS NULL ORDER BY cm.id"),
			new ForeignKeyCheck(
					"class_members.student_id -> student_profiles.user_id",
					"SELECT cm.id FROM class_members cm "
							+ "LEFT JOIN student_profiles sp ON sp.user_id = cm.student_id "
							+ "WHERE sp.user_id IS NULL ORDER BY cm.id"),
			new ForeignKeyCheck(
					"assignments.class_id -> classes.id",
					"SELECT a.id FROM assignments a "
							+ "LEFT JOIN classes c ON c.id = a.class_id "
							+ "WHERE c.id IS NULL ORDER BY a.id"),
			new ForeignKeyCheck(
					"modules.assignment_id -> assignments.id",
					"SELECT m.id FROM modules m "
							+ "LEFT JOIN assignments a ON a.id = m.assignment_id "
							+ "WHERE a.id IS NULL ORDER BY m.id"),
			new ForeignKeyCheck(
					"questions.module_id -> modules.id",
					"SELECT q.id FROM questions q "
							+ "LEFT JOIN modules m ON m.id = q.module_id "
							+ "WHERE m.id IS NULL ORDER BY q.id"),
			new ForeignKeyCheck(
					"submissions.assignment_id -> assignments.id",
					"SELECT s.id FROM submissions s "
							+ "LEFT JOIN assignments a ON a.id = s.assignment_id "
							+ "WHERE a.id IS NULL ORDER BY s.id"),
			new ForeignKeyCheck(
					"submissions.student_id -> student_profiles.user_id",
					"SELECT s.id FROM submissions s "
							+ "LEFT JOIN student_profiles sp ON sp.user_id = s.student_id "
							+ "WHERE sp.user_id IS NULL ORDER BY s.id"),
			new ForeignKeyCheck(
					"submission_modules.submission_id -> submissions.id",
					"SELECT sm.id FROM submission_modules sm "
							+ "LEFT JOIN submissions s ON s.id = sm.submission_id "
							+ "WHERE s.id IS NULL ORDER BY sm.id"),
			new ForeignKeyCheck(
					"submission_modules.module_id -> modules.id",
					"SELECT sm.id FROM submission_modules sm "
							+ "LEFT JOIN modules m ON m.id = sm.module_id "
							+ "WHERE m.id IS NULL ORDER BY sm.id"),
			new ForeignKeyCheck(
					"answers.submission_module_id -> submission_modules.id",
					"SELECT a.id FROM answers a "
							+ "LEFT JOIN submission_modules sm ON sm.id = a.submission_module_id "
							+ "WHERE sm.id IS NULL ORDER BY a.id"),
			new ForeignKeyCheck(
					"answers.question_id -> questions.id",
					"SELECT a.id FROM answers a "
							+ "LEFT JOIN questions q ON q.id = a.question_id "
							+ "WHERE a.question_id IS NOT NULL AND q.id IS NULL ORDER BY a.id"),
			new ForeignKeyCheck(
					"answer_annotations.answer_id -> answers.id",
					"SELECT aa.id FROM answer_annotations aa "
							+ "LEFT JOIN answers a ON a.id = aa.answer_id "
							+ "WHERE a.id IS NULL ORDER BY aa.id"),
			new ForeignKeyCheck(
					"gradings.submission_module_id -> submission_modules.id",
					"SELECT g.id FROM gradings g "
							+ "LEFT JOIN submission_modules sm ON sm.id = g.submission_module_id "
							+ "WHERE sm.id IS NULL ORDER BY g.id"),
			new ForeignKeyCheck(
					"gradings.reviewed_by -> teacher_profiles.user_id",
					"SELECT g.id FROM gradings g "
							+ "LEFT JOIN teacher_profiles tp ON tp.user_id = g.reviewed_by "
							+ "WHERE g.reviewed_by IS NOT NULL AND tp.user_id IS NULL ORDER BY g.id"),
			new ForeignKeyCheck(
					"grading_change_logs.grading_id -> gradings.id",
					"SELECT l.id FROM grading_change_logs l "
							+ "LEFT JOIN gradings g ON g.id = l.grading_id "
							+ "WHERE g.id IS NULL ORDER BY l.id"),
			new ForeignKeyCheck(
					"grading_change_logs.changed_by -> teacher_profiles.user_id",
					"SELECT l.id FROM grading_change_logs l "
							+ "LEFT JOIN teacher_profiles tp ON tp.user_id = l.changed_by "
							+ "WHERE tp.user_id IS NULL ORDER BY l.id"),
			new ForeignKeyCheck(
					"refresh_tokens.user_id -> users.id",
					"SELECT rt.id FROM refresh_tokens rt "
							+ "LEFT JOIN users u ON u.id = rt.user_id "
							+ "WHERE u.id IS NULL ORDER BY rt.id"),
			new ForeignKeyCheck(
					"student_evaluations.student_id -> student_profiles.user_id",
					"SELECT se.id FROM student_evaluations se "
							+ "LEFT JOIN student_profiles sp ON sp.user_id = se.student_id "
							+ "WHERE sp.user_id IS NULL ORDER BY se.id"),
			new ForeignKeyCheck(
					"student_evaluations.teacher_id -> teacher_profiles.user_id",
					"SELECT se.id FROM student_evaluations se "
							+ "LEFT JOIN teacher_profiles tp ON tp.user_id = se.teacher_id "
							+ "WHERE tp.user_id IS NULL ORDER BY se.id"),
			new ForeignKeyCheck(
					"student_evaluations.class_id -> classes.id",
					"SELECT se.id FROM student_evaluations se "
							+ "LEFT JOIN classes c ON c.id = se.class_id "
							+ "WHERE c.id IS NULL ORDER BY se.id"));

	private final EntityManager entityManager;
	private final AnswerRepository answerRepository;
	private final ObjectMapper objectMapper;

	public MockDataValidationRunner(
			EntityManager entityManager,
			AnswerRepository answerRepository,
			ObjectMapper objectMapper) {
		this.entityManager = entityManager;
		this.answerRepository = answerRepository;
		this.objectMapper = objectMapper;
	}

	@Override
	@Transactional(readOnly = true)
	public void run(String... args) {
		List<CheckResult> checks = new ArrayList<>();
		checks.add(runCheck("No orphan foreign keys", this::checkForeignKeyOrphans));
		checks.add(runCheck(
				"Assignments have open_at before close_at",
				() -> queryIds(
						"SELECT id FROM assignments "
								+ "WHERE open_at >= close_at ORDER BY id")));
		checks.add(runCheck(
				"Non-IN_PROGRESS submissions have submitted_at",
				() -> queryIds(
						"SELECT id FROM submissions "
								+ "WHERE status::text <> 'IN_PROGRESS' "
								+ "AND submitted_at IS NULL ORDER BY id")));
		checks.add(runCheck(
				"Question answers contain valid JSON",
				this::checkAnswerJson));
		checks.add(runCheck(
				"Each answer has exactly one content source",
				() -> queryIds(
						"SELECT id FROM answers "
								+ "WHERE (CASE WHEN content IS NOT NULL THEN 1 ELSE 0 END "
								+ "+ CASE WHEN audio_storage_key IS NOT NULL THEN 1 ELSE 0 END "
								+ "+ CASE WHEN doc_storage_key IS NOT NULL THEN 1 ELSE 0 END) <> 1 "
								+ "ORDER BY id")));
		checks.add(runCheck(
				"Grading final_score does not exceed max_score_snapshot",
				() -> queryIds(
						"SELECT id FROM gradings "
								+ "WHERE final_score IS NOT NULL "
								+ "AND (max_score_snapshot IS NULL OR final_score > max_score_snapshot) "
								+ "ORDER BY id")));
		checks.add(runCheck(
				"Latest grading change log matches final_score",
				this::checkLatestGradingChangeLogs));

		TableCheckResult tableCheck = runTableCountCheck();
		checks.add(tableCheck.result());

		checks.add(runCheck(
				"GRADED submission modules have COMPLETED grading",
				this::checkGradedSubmissionModules));

		String report = buildReport(checks, tableCheck.tableCounts());
		LOGGER.info("\n{}", report);
		writeReport(report);

		long failedChecks = checks.stream().filter(check -> !check.passed()).count();
		if (failedChecks > 0) {
			throw new IllegalStateException(
					"Task 9 validation failed: " + failedChecks + " check(s) failed. See the report for details.");
		}
	}

	private List<String> checkForeignKeyOrphans() {
		List<String> violations = new ArrayList<>();
		for (ForeignKeyCheck check : FOREIGN_KEY_CHECKS) {
			for (String childId : queryIds(check.sql())) {
				violations.add(check.label() + ", child_id=" + childId);
			}
		}
		return violations;
	}

	private List<String> checkAnswerJson() {
		List<String> violations = new ArrayList<>();
		List<Answer> answers = answerRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
		for (Answer answer : answers) {
if (answer.getQuestionId() == null) {
				continue;
			}
			if (answer.getContent() == null) {
				violations.add("answer_id=" + answer.getId() + ", content is null");
				continue;
			}

			try {
				JsonNode parsed = objectMapper.readTree(answer.getContent());
				if (parsed == null) {
					violations.add("answer_id=" + answer.getId() + ", parser returned null");
				}
			} catch (JacksonException exception) {
				violations.add(
						"answer_id=" + answer.getId() + ", " + exceptionMessage(exception));
			} catch (RuntimeException exception) {
				violations.add(
						"answer_id=" + answer.getId() + ", " + exceptionMessage(exception));
			}
		}
		return violations;
	}

	private List<String> checkLatestGradingChangeLogs() {
		String sql = "WITH ranked_logs AS ("
				+ " SELECT id, grading_id, new_score, "
				+ " ROW_NUMBER() OVER (PARTITION BY grading_id "
				+ " ORDER BY changed_at DESC, id DESC) AS row_number"
				+ " FROM grading_change_logs)"
				+ " SELECT l.grading_id, l.id, l.new_score, g.final_score"
				+ " FROM ranked_logs l"
				+ " JOIN gradings g ON g.id = l.grading_id"
				+ " WHERE l.row_number = 1"
				+ " AND l.new_score IS DISTINCT FROM g.final_score"
				+ " ORDER BY l.grading_id";

		List<String> violations = new ArrayList<>();
		for (Object row : entityManager.createNativeQuery(sql).getResultList()) {
			Object[] values = (Object[]) row;
			violations.add(
					"grading_id=" + values[0]
							+ ", latest_log_id=" + values[1]
							+ ", new_score=" + values[2]
							+ ", final_score=" + values[3]);
		}
		return violations;
	}

	private List<String> checkGradedSubmissionModules() {
		String sql = "SELECT sm.id, sm.submission_id, g.id, g.status::text"
				+ " FROM submission_modules sm"
				+ " LEFT JOIN gradings g ON g.submission_module_id = sm.id"
				+ " WHERE sm.status::text = 'GRADED'"
				+ " AND (g.id IS NULL OR g.status::text <> 'COMPLETED')"
				+ " ORDER BY sm.id";

		List<String> violations = new ArrayList<>();
		for (Object row : entityManager.createNativeQuery(sql).getResultList()) {
			Object[] values = (Object[]) row;
			violations.add(
					"submission_module_id=" + values[0]
							+ ", submission_id=" + values[1]
							+ ", grading_id=" + values[2]
							+ ", grading_status=" + values[3]);
		}
		return violations;
	}

	private TableCheckResult runTableCountCheck() {
		List<TableRowCount> tableCounts = new ArrayList<>();
		List<String> violations = new ArrayList<>();
		for (String tableName : TABLE_NAMES) {
			try {
				long rowCount = countRows("SELECT COUNT(*) FROM " + tableName);
				tableCounts.add(new TableRowCount(tableName, rowCount));
			} catch (RuntimeException exception) {
				tableCounts.add(new TableRowCount(tableName, -1));
				violations.add(
						"table=" + tableName + ", query failed: " + exceptionMessage(exception));
			}
		}
		return new TableCheckResult(
				new CheckResult("All 16 table row counts are available", violations),
				tableCounts);
	}

	private CheckResult runCheck(String name, ValidationOperation operation) {
		try {
			return new CheckResult(name, operation.run());
		} catch (RuntimeException exception) {
			return new CheckResult(
					name,
					List.of("validator query failed: " + exceptionMessage(exception)));
		}
	}

	private List<String> queryIds(String sql) {
		List<String> values = new ArrayList<>();
		for (Object value : entityManager.createNativeQuery(sql).getResultList()) {
			values.add(String.valueOf(value));
		}
		return values;
	}

	private long countRows(String sql) {
		Object result = entityManager.createNativeQuery(sql).getSingleResult();
		return ((Number) result).longValue();
	}

	private String buildReport(List<CheckResult> checks, List<TableRowCount> tableCounts) {
		StringBuilder report = new StringBuilder();
		report.append("================ Task 9 Validation Report ================\n");
		report.append("Generated at: ").append(OffsetDateTime.now()).append('\n');
		report.append("Scope: read-only SELECT validation; no database mutation.\n");
		report.append("Latest log rule: ROW_NUMBER() OVER (PARTITION BY grading_id "
				+ "ORDER BY changed_at DESC, id DESC).\n\n");

		for (int index = 0; index < checks.size(); index++) {
			CheckResult check = checks.get(index);
			report.append('[').append(index + 1).append("] ")
					.append(check.name()).append('\n');
			report.append(check.passed() ? "PASS" : "FAIL")
					.append(" - violations: ").append(check.violationCount()).append('\n');
			for (String detail : check.details()) {
				report.append("  - ").append(detail).append('\n');
			}

			if (index == 7) {
				report.append("  TABLE SUMMARY\n");
				report.append("  table_name | row_count\n");
				for (TableRowCount tableCount : tableCounts) {
					report.append("  ").append(tableCount.tableName())
							.append(" | ").append(tableCount.rowCount()).append('\n');
				}
			}
			report.append('\n');
		}

		long failedChecks = checks.stream().filter(check -> !check.passed()).count();
		report.append("OVERALL: ").append(failedChecks == 0 ? "PASS" : "FAIL")
				.append(" (failed checks: ").append(failedChecks).append(")\n");
		return report.toString();
	}

	private void writeReport(String report) {
		Path reportPath = resolveReportPath();
		try {
			Files.createDirectories(reportPath.getParent());
			Files.writeString(reportPath, report, StandardCharsets.UTF_8);
			LOGGER.info("Validation report written to {}", reportPath.toAbsolutePath());
		} catch (IOException exception) {
			throw new IllegalStateException(
					"Could not write validation report to " + reportPath.toAbsolutePath(),
					exception);
		}
	}

	private Path resolveReportPath() {
		Path directPath = Path.of("production_artifacts", "be_to_tester", REPORT_FILE_NAME);
		if (Files.isDirectory(directPath.getParent())) {
			return directPath;
		}
		return Path.of("..").resolve(directPath).normalize();
	}

	private String exceptionMessage(Exception exception) {
		String message = exception.getMessage();
		return exception.getClass().getSimpleName()
				+ (message == null || message.isBlank() ? "" : ": " + message);
	}

	@FunctionalInterface
	private interface ValidationOperation {
		List<String> run();
	}

	private record ForeignKeyCheck(String label, String sql) {
	}

	private record CheckResult(String name, List<String> details) {

		private boolean passed() {
			return details.isEmpty();
		}

		private int violationCount() {
			return details.size();
		}
	}

	private record TableCheckResult(CheckResult result, List<TableRowCount> tableCounts) {
	}

	private record TableRowCount(String tableName, long rowCount) {
	}
}
