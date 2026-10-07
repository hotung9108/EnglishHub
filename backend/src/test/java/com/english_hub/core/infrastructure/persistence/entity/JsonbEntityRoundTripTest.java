package com.english_hub.core.infrastructure.persistence.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.repository.AnswerRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.EnglishClassRepository;
import com.english_hub.core.infrastructure.persistence.repository.QuestionRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import jakarta.persistence.EntityManager;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Testcontainers
@SpringBootTest
@Transactional
class JsonbEntityRoundTripTest {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_test")
			.withUsername("test")
			.withPassword("test");

	private static final JsonMapper JSON_MAPPER = JsonMapper.builder().build();

	@DynamicPropertySource
	static void registerPostgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	@Autowired
	private EntityManager entityManager;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TeacherProfileRepository teacherProfileRepository;

	@Autowired
	private StudentProfileRepository studentProfileRepository;

	@Autowired
	private EnglishClassRepository englishClassRepository;

	@Autowired
	private AssignmentRepository assignmentRepository;

	@Autowired
	private AssignmentModuleRepository assignmentModuleRepository;

	@Autowired
	private QuestionRepository questionRepository;

	@Autowired
	private SubmissionRepository submissionRepository;

	@Autowired
	private SubmissionModuleRepository submissionModuleRepository;

	@Autowired
	private AnswerRepository answerRepository;

	@Test
	void persistsAndReadsJsonbValuesForQuestionsAndAnswers() throws Exception {
		Fixture fixture = persistFixture();

		entityManager.flush();
		entityManager.clear();

		Question multipleChoice = questionRepository.findById(fixture.multipleChoiceQuestionId()).orElseThrow();
		Question shortAnswer = questionRepository.findById(fixture.shortAnswerQuestionId()).orElseThrow();
		Answer quizAnswer = answerRepository.findById(fixture.quizAnswerId()).orElseThrow();
		Answer essayAnswer = answerRepository.findById(fixture.essayAnswerId()).orElseThrow();
		Answer speakingAnswer = answerRepository.findById(fixture.speakingAnswerId()).orElseThrow();

		assertThat(readJson(multipleChoice.getCorrectAnswer()))
				.isEqualTo(readJson("""
						{"options":[{"id":1,"content":"A","is_correct":true},{"id":2,"content":"B","is_correct":false}]}
						"""));
		assertThat(readJson(shortAnswer.getCorrectAnswer()))
				.isEqualTo(readJson("""
						{"correct_answer":"Đáp án đúng"}
						"""));
		assertThat(readJson(quizAnswer.getContent()))
				.isEqualTo(readJson("""
						{"selected_option_ids":[1],"is_correct":true,"score":1.0}
						"""));
		assertThat(essayAnswer.getContent())
				.isEqualTo("Dòng đầu tiên\nDòng có \"dấu nháy kép\" và tiếng Việt: cảm ơn bạn.");
		assertThat(speakingAnswer.getContent()).isNull();
	}

	private Fixture persistFixture() {
		User teacher = userRepository.save(new User(
				"JSONB Teacher",
				"jsonb-teacher@example.com",
				null,
				"password-hash",
				UserRole.TEACHER,
				UserStatus.ACTIVE,
				false));
		teacherProfileRepository.save(new TeacherProfile(teacher, "English"));

		EnglishClass englishClass = englishClassRepository.save(new EnglishClass(
				"JSONB Round Trip Class",
				"Intermediate",
				"Test class",
				LocalDate.of(2026, 1, 1),
				LocalDate.of(2026, 12, 31),
				ClassStatus.ACTIVE,
				teacher.getId()));

		Assignment assignment = assignmentRepository.save(new Assignment(
				englishClass.getId(),
				"JSONB Round Trip Assignment",
				"Test assignment",
				OffsetDateTime.of(2026, 1, 1, 9, 0, 0, 0, ZoneOffset.UTC),
				OffsetDateTime.of(2026, 12, 31, 17, 0, 0, 0, ZoneOffset.UTC),
				3,
				false,
				AssignmentStatus.PUBLISHED));

		AssignmentModule module = assignmentModuleRepository.save(new AssignmentModule(
				assignment.getId(),
				ModuleSkill.READING,
				ModuleTaskType.QUIZ,
				1,
				"Read and answer.",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
				null));

		Question multipleChoice = questionRepository.save(new Question(
				module.getId(),
				"Choose the correct option.",
				QuestionType.MULTIPLE_CHOICE,
				"""
						{"options":[{"id":1,"content":"A","is_correct":true},{"id":2,"content":"B","is_correct":false}]}
						""",
				BigDecimal.ONE,
				1));
		Question shortAnswer = questionRepository.save(new Question(
				module.getId(),
				"Write the short answer.",
				QuestionType.SHORT_ANSWER,
				"""
						{"correct_answer":"Đáp án đúng"}
						""",
				BigDecimal.ONE,
				2));

		User student = userRepository.save(new User(
				"JSONB Student",
				"jsonb-student@example.com",
				null,
				"password-hash",
				UserRole.STUDENT,
				UserStatus.ACTIVE,
				false));
		studentProfileRepository.save(new StudentProfile(
				student,
				"JSONB-STUDENT",
				LocalDate.of(2000, 1, 1),
				null));

		Submission submission = submissionRepository.save(new Submission(
				assignment.getId(),
				student.getId(),
				1,
				null,
				SubmissionStatus.IN_PROGRESS));
		SubmissionModule submissionModule = submissionModuleRepository.save(new SubmissionModule(
				submission.getId(),
				module.getId(),
				SubmissionStatus.IN_PROGRESS));

		Answer quizAnswer = answerRepository.save(new Answer(
				submissionModule.getId(),
				multipleChoice.getId(),
				"""
						{"selected_option_ids":[1],"is_correct":true,"score":1.0}
						""",
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null));
		Answer essayAnswer = answerRepository.save(new Answer(
				submissionModule.getId(),
				null,
				"Dòng đầu tiên\nDòng có \"dấu nháy kép\" và tiếng Việt: cảm ơn bạn.",
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null));
		Answer speakingAnswer = answerRepository.save(new Answer(
				submissionModule.getId(),
				null,
				null,
				"speaking/answer.webm",
				12,
				2048L,
				"audio/webm",
				UploadStatus.READY,
				null,
				null,
				null,
				null));

		return new Fixture(
				multipleChoice.getId(),
				shortAnswer.getId(),
				quizAnswer.getId(),
				essayAnswer.getId(),
				speakingAnswer.getId());
	}

	private JsonNode readJson(String json) throws Exception {
		return JSON_MAPPER.readTree(json);
	}

	private record Fixture(
			Long multipleChoiceQuestionId,
			Long shortAnswerQuestionId,
			Long quizAnswerId,
			Long essayAnswerId,
			Long speakingAnswerId) {
	}
}
