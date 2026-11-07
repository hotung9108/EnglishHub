package com.english_hub.core.modules.grading.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.Answer;
import com.english_hub.core.infrastructure.persistence.entity.AnswerAnnotation;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.ClassMember;
import com.english_hub.core.infrastructure.persistence.entity.Grading;
import com.english_hub.core.infrastructure.persistence.entity.GradingMethod;
import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.entity.Submission;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionModule;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.infrastructure.persistence.entity.UploadStatus;
import com.english_hub.core.infrastructure.persistence.repository.AnswerAnnotationRepository;
import com.english_hub.core.infrastructure.persistence.repository.AnswerRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.ClassMemberRepository;
import com.english_hub.core.infrastructure.persistence.repository.GradingRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.grading.application.service.GradingAiAnalysisService;
import com.english_hub.core.modules.grading.infrastructure.client.AiServiceClient;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisResponse;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiWritingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiWritingAnalysisResponse;
import com.english_hub.core.modules.submission.application.port.StorageService;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class AiServiceMockFlowIntegrationTest {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_ai_service_mock_flow_test")
			.withUsername("test")
			.withPassword("test");

	@DynamicPropertySource
	static void registerProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
		// Point to running AI Service on port 8001 (mock mode)
		registry.add("app.ai-service.base-url", () -> "http://localhost:8001");
	}

	@Autowired private MockMvc mockMvc;
	@Autowired private AiServiceClient aiServiceClient;
	@Autowired private GradingAiAnalysisService gradingAiAnalysisService;
	@MockitoBean
	private StorageService storageService;
	@Autowired private UserRepository userRepository;
	@Autowired private TeacherProfileRepository teacherProfileRepository;
	@Autowired private StudentProfileRepository studentProfileRepository;
	@Autowired private ClassJpaRepository classRepository;
	@Autowired private ClassMemberRepository classMemberRepository;
	@Autowired private AssignmentRepository assignmentRepository;
	@Autowired private AssignmentModuleRepository moduleRepository;
	@Autowired private SubmissionRepository submissionRepository;
	@Autowired private SubmissionModuleRepository submissionModuleRepository;
	@Autowired private AnswerRepository answerRepository;
	@Autowired private GradingRepository gradingRepository;
	@Autowired private AnswerAnnotationRepository answerAnnotationRepository;
	@Autowired private JwtTokenService jwtTokenService;

	private long teacherId;
	private long studentId;
	private long classId;
	private long assignmentId;
	private long speakingModuleId;
	private long writingModuleId;
	private long speakingSubmissionModuleId;
	private long writingSubmissionModuleId;
	private long speakingGradingId;
	private long writingGradingId;
	private long speakingAnswerId;
	private long writingAnswerId;

	@BeforeEach
	void setUp() {
		cleanupData();
		when(storageService.generatePresignedGetUrl(anyString()))
				.thenAnswer(inv -> "https://storage.local/" + inv.getArgument(0));

		teacherId = createUser(UserRole.TEACHER, "MockFlow Teacher");
		studentId = createUser(UserRole.STUDENT, "MockFlow Student");

		teacherProfileRepository.save(new TeacherProfile(user(teacherId), "Mock Teacher Bio"));
		studentProfileRepository.save(new StudentProfile(user(studentId), "GA-" + UUID.randomUUID().toString().substring(0, 8), LocalDate.of(2002, 5, 20), null));

		ClassEntity testClass = classRepository.save(new ClassEntity(
				"AI Mock Integration Class " + UUID.randomUUID(),
				"Intermediate",
				"AI Mock Flow Fixture",
				LocalDate.of(2026, 9, 1),
				null,
				ClassStatus.ACTIVE,
				teacherId));
		classId = testClass.getId();
		classMemberRepository.save(new ClassMember(classId, studentId));

		Assignment assignment = assignmentRepository.save(new Assignment(
				classId,
				"AI Mock Flow Assignment",
				"Test AI Grading Flow with Mock AI Service",
				OffsetDateTime.parse("2026-09-01T00:00:00Z"),
				OffsetDateTime.parse("2026-10-01T00:00:00Z"),
				1,
				false,
				AssignmentStatus.PUBLISHED));
		assignmentId = assignment.getId();

		AssignmentModule speakingModule = moduleRepository.save(new AssignmentModule(
				assignmentId,
				ModuleSkill.SPEAKING,
				ModuleTaskType.RECORDING,
				1,
				"Describe your favorite hobby.",
				new BigDecimal("9.00"),
				null,
				null,
				null,
				null,
				"Evaluate fluency, vocabulary, grammar and pronunciation based on IELTS Speaking band descriptors."));
		speakingModuleId = speakingModule.getId();

		AssignmentModule writingModule = moduleRepository.save(new AssignmentModule(
				assignmentId,
				ModuleSkill.WRITING,
				ModuleTaskType.ESSAY,
				2,
				"Write an essay about the advantages and disadvantages of remote work.",
				new BigDecimal("10.00"),
				null,
				null,
				null,
				null,
				"Assess task achievement, coherence and cohesion, lexical resource, and grammatical accuracy."));
		writingModuleId = writingModule.getId();

		Submission submission = submissionRepository.save(new Submission(
				assignmentId,
				studentId,
				1,
				OffsetDateTime.parse("2026-09-15T10:00:00Z"),
				SubmissionStatus.SUBMITTED));

		SubmissionModule speakingSubModule = submissionModuleRepository.save(new SubmissionModule(
				submission.getId(),
				speakingModuleId,
				SubmissionStatus.SUBMITTED));
		speakingSubmissionModuleId = speakingSubModule.getId();

		Answer speakingAnswer = answerRepository.save(new Answer(
				speakingSubmissionModuleId,
				null,
				null,
				"submissions/1383/module-2555/audio.wav",
				45,
				720_000L,
				"audio/wav",
				UploadStatus.READY,
				null,
				null,
				null,
				null));
		speakingAnswerId = speakingAnswer.getId();

		Grading speakingGrading = gradingRepository.save(new Grading(
				speakingSubmissionModuleId,
				GradingMethod.AUTO,
				GradingStatus.PENDING,
				null,
				null,
				null,
				new BigDecimal("9.00"),
				null,
				null,
				null,
				null,
				speakingModule.getAiInstruction()));
		speakingGradingId = speakingGrading.getId();

		SubmissionModule writingSubModule = submissionModuleRepository.save(new SubmissionModule(
				submission.getId(),
				writingModuleId,
				SubmissionStatus.SUBMITTED));
		writingSubmissionModuleId = writingSubModule.getId();

		Answer writingAnswer = answerRepository.save(new Answer(
				writingSubmissionModuleId,
				null,
				"Remote work has become increasingly popular in modern society. It offers flexibility and saves valuable commute time for employees. However, working remotely can blur the boundary between personal life and work responsibilities.",
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null));
		writingAnswerId = writingAnswer.getId();

		Grading writingGrading = gradingRepository.save(new Grading(
				writingSubmissionModuleId,
				GradingMethod.AUTO,
				GradingStatus.PENDING,
				null,
				null,
				null,
				new BigDecimal("10.00"),
				null,
				null,
				null,
				null,
				writingModule.getAiInstruction()));
		writingGradingId = writingGrading.getId();
	}

	@AfterEach
	void tearDown() {
		cleanupData();
	}

	private void cleanupData() {
		answerAnnotationRepository.deleteAll();
		gradingRepository.deleteAll();
		answerRepository.deleteAll();
		submissionModuleRepository.deleteAll();
		submissionRepository.deleteAll();
		moduleRepository.deleteAll();
		assignmentRepository.deleteAll();
		classMemberRepository.deleteAll();
		classRepository.deleteAll();
		studentProfileRepository.deleteAll();
		teacherProfileRepository.deleteAll();
		userRepository.deleteAll();
	}

	@Test
	@DisplayName("1. AiServiceClient direct call to AI Service (Mock Mode) - Speaking & Writing")
	void aiServiceClient_communicatesSuccessfullyWithMockAiService() {
		// Speaking
		AiSpeakingAnalysisRequest speakingRequest = new AiSpeakingAnalysisRequest(
				speakingSubmissionModuleId,
				"https://example.com/audio.wav",
				null,
				"submissions/1383/module-2555/audio.wav",
				"Describe your favorite hobby.",
				"Evaluate fluency, vocabulary, grammar and pronunciation.",
				9.0
		);

		AiSpeakingAnalysisResponse speakingResponse = aiServiceClient.analyzeSpeaking(speakingRequest);
		assertThat(speakingResponse).isNotNull();
		assertThat(speakingResponse.submissionModuleId()).isEqualTo(speakingSubmissionModuleId);
		assertThat(speakingResponse.overallScore()).isNotNull();
		assertThat(speakingResponse.aiFeedback()).isNotBlank();
		assertThat(speakingResponse.criteriaScores()).isNotNull();
		assertThat(speakingResponse.criteriaScores().pronunciation()).isNotNull();
		assertThat(speakingResponse.aiTranscript()).isNotNull();
		assertThat(speakingResponse.annotations()).isNotEmpty();

		// Writing
		AiWritingAnalysisRequest writingRequest = new AiWritingAnalysisRequest(
				writingSubmissionModuleId,
				"Remote work provides many advantages for modern professionals including flexible hours and reduced commute times. However, isolation and communication barriers remain significant challenges that must be addressed carefully.",
				"Write an essay about remote work.",
				"Assess task achievement, coherence, vocabulary and grammar.",
				10.0
		);

		AiWritingAnalysisResponse writingResponse = aiServiceClient.analyzeWriting(writingRequest);
		assertThat(writingResponse).isNotNull();
		assertThat(writingResponse.submissionModuleId()).isEqualTo(writingSubmissionModuleId);
		assertThat(writingResponse.overallScore()).isNotNull();
		assertThat(writingResponse.aiFeedback()).isNotBlank();
		assertThat(writingResponse.criteriaScores()).isNotNull();
		assertThat(writingResponse.annotations()).isNotEmpty();
	}

	@Test
	@DisplayName("2. Full Business Flow: analyzeSubmittedModule updates DB, sets AI_GRADED status and persists annotations")
	void fullBusinessFlow_analyzeSubmittedModule_updatesDatabaseCorrectly() throws Exception {
		// 1. Analyze Writing Module
		gradingAiAnalysisService.analyzeSubmittedModule(writingSubmissionModuleId);

		Grading updatedWritingGrading = waitForAiGraded(writingGradingId);
		assertThat(updatedWritingGrading.getStatus()).isEqualTo(GradingStatus.AI_GRADED);
		assertThat(updatedWritingGrading.getAiFeedback()).isNotBlank();
		assertThat(updatedWritingGrading.getAiTranscript()).isNotNull();

		List<AnswerAnnotation> writingAnnotations = answerAnnotationRepository.findAll().stream()
				.filter(a -> a.getAnswerId().equals(writingAnswerId))
				.toList();
		assertThat(writingAnnotations).isNotEmpty();

		// 2. Analyze Speaking Module
		gradingAiAnalysisService.analyzeSubmittedModule(speakingSubmissionModuleId);

		Grading updatedSpeakingGrading = waitForAiGraded(speakingGradingId);
		assertThat(updatedSpeakingGrading.getStatus()).isEqualTo(GradingStatus.AI_GRADED);
		assertThat(updatedSpeakingGrading.getAiFeedback()).isNotBlank();
		assertThat(updatedSpeakingGrading.getAiTranscript()).isNotNull();

		List<AnswerAnnotation> speakingAnnotations = answerAnnotationRepository.findAll().stream()
				.filter(a -> a.getAnswerId().equals(speakingAnswerId))
				.toList();
		assertThat(speakingAnnotations).isNotEmpty();
	}

	@Test
	@DisplayName("3. Teacher API GET ai-suggestion retrieves persisted AI analysis from DB")
	void teacherCanRetrieveAiSuggestion_afterAiGradingCompleted() throws Exception {
		// Perform analysis and wait for completion
		gradingAiAnalysisService.analyzeSubmittedModule(writingSubmissionModuleId);
		waitForAiGraded(writingGradingId);

		// Teacher calls GET /api/v1/submission-modules/{id}/grading/ai-suggestion
		mockMvc.perform(get("/api/v1/submission-modules/{id}/grading/ai-suggestion", writingSubmissionModuleId)
						.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.suggestedScore").isNumber())
				.andExpect(jsonPath("$.aiFeedback").isString())
				.andExpect(jsonPath("$.annotations").isArray());
	}

	private Grading waitForAiGraded(long gradingId) throws InterruptedException {
		long deadline = System.currentTimeMillis() + 10_000;
		while (System.currentTimeMillis() < deadline) {
			Grading grading = gradingRepository.findById(gradingId).orElse(null);
			if (grading != null && grading.getStatus() == GradingStatus.AI_GRADED) {
				return grading;
			}
			Thread.sleep(200);
		}
		Grading lastState = gradingRepository.findById(gradingId).orElse(null);
		throw new AssertionError("Grading " + gradingId + " did not reach AI_GRADED within 10s. Last status: "
				+ (lastState != null ? lastState.getStatus() : "null"));
	}

	private long createUser(UserRole role, String name) {
		return userRepository.save(new User(
				name,
				name.toLowerCase().replace(' ', '.') + "." + UUID.randomUUID() + "@test.local",
				null,
				"test-hash",
				role,
				UserStatus.ACTIVE,
				false)).getId();
	}

	private User user(long id) {
		return userRepository.findById(id).orElseThrow();
	}

	private String bearer(long userId, UserRole role) {
		return "Bearer " + jwtTokenService.createAccessToken(
				userId,
				com.english_hub.core.modules.user.domain.model.UserRole.valueOf(role.name()));
	}
}
