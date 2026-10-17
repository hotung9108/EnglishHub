package com.english_hub.core.modules.module.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.entity.Question;
import com.english_hub.core.infrastructure.persistence.entity.QuestionType;
import com.english_hub.core.infrastructure.persistence.entity.Submission;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionModule;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.infrastructure.persistence.entity.UploadStatus;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.QuestionRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.submission.application.port.StorageService;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassMemberEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassMemberJpaRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ModuleApiIntegrationTest {

	/**
	 * Module listening audio is stored in S3-compatible object storage
	 * (presigned direct upload, see ModuleService#requestAudioUpload). A
	 * localstack S3 endpoint replaces the real provider so the tests can
	 * PUT directly to the presigned URL and assert on the stored object.
	 */
	private static final String S3_BUCKET = "englishhub-module-audio-test";
	private static final String S3_ACCESS_KEY = "minioadmin";
	private static final String S3_SECRET_KEY = "minioadmin";
	private static final byte[] AUDIO_BYTES = new byte[] {'I', 'D', '3', 1, 2, 3};

	@Container
	static final GenericContainer<?> S3 = new GenericContainer<>("localstack/localstack:3")
			.withEnv("SERVICES", "s3")
			.withEnv("AWS_DEFAULT_REGION", "us-east-1")
			.withEnv("AWS_ACCESS_KEY_ID", S3_ACCESS_KEY)
			.withEnv("AWS_SECRET_ACCESS_KEY", S3_SECRET_KEY)
			.withExposedPorts(4566)
			.waitingFor(Wait.forHttp("/_localstack/health")
					.forStatusCode(200)
					.withStartupTimeout(java.time.Duration.ofMinutes(3)));

	@DynamicPropertySource
	static void registerStorageProperties(DynamicPropertyRegistry registry) {
		registry.add("app.storage.s3.enabled", () -> "true");
		registry.add("app.storage.s3.endpoint", () -> "http://localhost:" + S3.getMappedPort(4566));
		registry.add("app.storage.s3.region", () -> "us-east-1");
		registry.add("app.storage.s3.access-key-id", () -> S3_ACCESS_KEY);
		registry.add("app.storage.s3.secret-access-key", () -> S3_SECRET_KEY);
		registry.add("app.storage.s3.bucket", () -> S3_BUCKET);
		registry.add("app.storage.s3.path-style", () -> "true");
	}

	@BeforeAll
	static void createBucket() {
		try (S3Client client = S3Client.builder()
				.endpointOverride(URI.create("http://localhost:" + S3.getMappedPort(4566)))
				.region(Region.US_EAST_1)
				.credentialsProvider(StaticCredentialsProvider.create(
						AwsBasicCredentials.create(S3_ACCESS_KEY, S3_SECRET_KEY)))
				.serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
				.build()) {
			client.createBucket(bucket -> bucket.bucket(S3_BUCKET));
		}
	}

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TeacherProfileRepository teacherProfileRepository;

	@Autowired
	private StudentProfileRepository studentProfileRepository;

	@Autowired
	private ClassJpaRepository classRepository;

	@Autowired
	private ClassMemberJpaRepository classMemberRepository;

	@Autowired
	private AssignmentRepository assignmentRepository;

	@Autowired
	private AssignmentModuleRepository moduleRepository;

	@Autowired
	private QuestionRepository questionRepository;

	@Autowired
	private SubmissionRepository submissionRepository;

	@Autowired
	private SubmissionModuleRepository submissionModuleRepository;

	@Autowired
	private JwtTokenService jwtTokenService;

	/** Local instance: the application context does not expose a Jackson mapper bean. */
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Autowired
	private StorageService storageService;

	@PersistenceContext
	private EntityManager entityManager;

	private Long adminId;
	private Long teacherId;
	private Long otherTeacherId;
	private Long studentId;
	private Long otherStudentId;
	private Long classId;
	private Long assignmentId;
	private Long readingModuleId;
	private Long listeningModuleId;

	@BeforeEach
	void setUp() {
		adminId = createUser(UserRole.ADMIN, "Admin");
		teacherId = createUser(UserRole.TEACHER, "Teacher");
		otherTeacherId = createUser(UserRole.TEACHER, "Other teacher");
		studentId = createUser(UserRole.STUDENT, "Student");
		otherStudentId = createUser(UserRole.STUDENT, "Other student");

		teacherProfileRepository.save(new TeacherProfile(findUser(teacherId), "IELTS"));
		teacherProfileRepository.save(new TeacherProfile(findUser(otherTeacherId), "IELTS"));
		studentProfileRepository.save(new StudentProfile(
				findUser(studentId), "HV-" + uniqueSuffix(), LocalDate.of(2004, 4, 1), "0912345678"));
		studentProfileRepository.save(new StudentProfile(
				findUser(otherStudentId), "HV-" + uniqueSuffix(), LocalDate.of(2005, 5, 2), "0912345679"));

		ClassEntity englishClass = classRepository.save(new ClassEntity(
				"Module API class " + uniqueSuffix(),
				"Intermediate",
				"Module API test class",
				LocalDate.of(2026, 9, 15),
				null,
				ClassStatus.ACTIVE,
				teacherId));
		classId = englishClass.getId();
		classMemberRepository.save(new ClassMemberEntity(classId, studentId));

		Assignment assignment = assignmentRepository.save(new Assignment(
				classId,
				"Module API assignment",
				"Instructions",
				OffsetDateTime.parse("2026-09-15T00:00:00Z"),
				OffsetDateTime.parse("2026-09-20T23:59:00Z"),
				2,
				false,
				AssignmentStatus.DRAFT));
		assignmentId = assignment.getId();

		AssignmentModule reading = moduleRepository.save(new AssignmentModule(
				assignmentId,
				ModuleSkill.READING,
				ModuleTaskType.QUIZ,
				1,
				"Read",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
				"Grade reading"));
		readingModuleId = reading.getId();
		AssignmentModule listening = moduleRepository.save(new AssignmentModule(
				assignmentId,
				ModuleSkill.LISTENING,
				ModuleTaskType.QUIZ,
				2,
				"Listen",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
			null));
		listeningModuleId = listening.getId();
	}

	@Test
	void listAllowsOwnerAndMemberButBlocksOtherTeacherAndAdmin() throws Exception {
		mockMvc.perform(get("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(2)))
				.andExpect(jsonPath("$.data[0].orderIndex").value(1))
				.andExpect(jsonPath("$.data[1].orderIndex").value(2));

		mockMvc.perform(get("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(otherTeacherId, UserRole.TEACHER)))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isForbidden());
	}

	@Test
	void teacherAndStudentFromOneClassCannotReadModulesFromAnotherClass() throws Exception {
		ClassEntity foreignClass = classRepository.save(new ClassEntity(
				"Foreign module class " + uniqueSuffix(),
				"Advanced",
				"Module resource-scope fixture",
				LocalDate.of(2026, 9, 15),
				null,
				ClassStatus.ACTIVE,
				otherTeacherId));
		Assignment foreignAssignment = assignmentRepository.save(new Assignment(
				foreignClass.getId(),
				"Foreign module assignment " + uniqueSuffix(),
				"Instructions",
				OffsetDateTime.parse("2026-09-15T00:00:00Z"),
				OffsetDateTime.parse("2026-09-20T23:59:00Z"),
				2,
				false,
				AssignmentStatus.DRAFT));
		AssignmentModule foreignModule = moduleRepository.save(new AssignmentModule(
				foreignAssignment.getId(),
				ModuleSkill.READING,
				ModuleTaskType.QUIZ,
				1,
				"Foreign reading module",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
				"Grade reading"));

		mockMvc.perform(get("/api/v1/assignments/{id}/modules", foreignAssignment.getId())
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
			.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/assignments/{id}/modules", foreignAssignment.getId())
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
			.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/v1/modules/{id}", foreignModule.getId())
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
			.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/modules/{id}", foreignModule.getId())
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
			.andExpect(status().isForbidden());
	}

	@Test
	void createAllowsOwnerAndBlocksStudentOtherTeacherAndAdmin() throws Exception {
		String body = "{\"skill\":\"WRITING\",\"taskType\":\"ESSAY\","
				+ "\"orderIndex\":3,\"instructions\":\"Write\",\"maxScore\":20}";

		mockMvc.perform(post("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content(body))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.message").value("Thêm module thành công."))
				.andExpect(jsonPath("$.id").isNumber());

		for (UserRole role : new UserRole[] {UserRole.STUDENT, UserRole.ADMIN}) {
			mockMvc.perform(post("/api/v1/assignments/{id}/modules", assignmentId)
						.header("Authorization", bearer(role == UserRole.STUDENT ? studentId : adminId, role))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"skill\":\"WRITING\",\"taskType\":\"ESSAY\",\"orderIndex\":4}"))
					.andExpect(status().isForbidden());
		}

		mockMvc.perform(post("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(otherTeacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"skill\":\"WRITING\",\"taskType\":\"ESSAY\",\"orderIndex\":5}"))
				.andExpect(status().isForbidden());
	}

	@Test
	void duplicateOrderIndexIsRejectedAndSelfUpdateIsAllowed() throws Exception {
		mockMvc.perform(post("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"skill\":\"WRITING\",\"taskType\":\"ESSAY\",\"orderIndex\":3}"))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"skill\":\"SPEAKING\",\"taskType\":\"RECORDING\",\"orderIndex\":3}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("orderIndex đã được sử dụng trong bài tập này."));

		mockMvc.perform(put("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"orderIndex\":1}"))
				.andExpect(status().isOk());
	}

	@Test
	void detailAllowsMemberAndBlocksOtherStudentAndAdmin() throws Exception {
		mockMvc.perform(get("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.skill").value("READING"))
				.andExpect(jsonPath("$.aiInstruction").value("Grade reading"));

		mockMvc.perform(get("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(otherStudentId, UserRole.STUDENT)))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isForbidden());
	}

	@Test
	void updateAndDeleteRequireOwningTeacher() throws Exception {
		mockMvc.perform(put("/api/v1/modules/{id}", readingModuleId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"instructions\":\"Updated\",\"maxScore\":20,\"orderIndex\":1}"))
			.andExpect(status().isOk());
		moduleRepository.flush();
		entityManager.clear();
		AssignmentModule persistedUpdate = moduleRepository.findById(readingModuleId).orElseThrow();
		assertThat(persistedUpdate.getInstructions()).isEqualTo("Updated");
		assertThat(persistedUpdate.getMaxScore()).isEqualByComparingTo("20.00");
		assertThat(persistedUpdate.getOrderIndex()).isEqualTo(1);
		assertThat(persistedUpdate.getAiInstruction()).isEqualTo("Grade reading");

		mockMvc.perform(put("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(otherTeacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"instructions\":\"Blocked\"}"))
				.andExpect(status().isForbidden());

		mockMvc.perform(put("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"instructions\":\"Blocked\"}"))
				.andExpect(status().isForbidden());

		mockMvc.perform(put("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(adminId, UserRole.ADMIN))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"instructions\":\"Blocked\"}"))
				.andExpect(status().isForbidden());

		mockMvc.perform(delete("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(otherTeacherId, UserRole.TEACHER)))
				.andExpect(status().isForbidden());

		mockMvc.perform(delete("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isForbidden());

		mockMvc.perform(delete("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isForbidden());
	}

	@Test
	void deleteCascadesQuestionsButRejectsModuleReferencedBySubmission() throws Exception {
		Question question = questionRepository.save(new Question(
				readingModuleId,
				"Choose one",
				QuestionType.SHORT_ANSWER,
				"{\"correct_answer\":\"English\"}",
				BigDecimal.ONE,
				1));

		mockMvc.perform(delete("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Đã xoá module."));

		entityManager.flush();
		entityManager.clear();
		assertThat(moduleRepository.findById(readingModuleId)).isEmpty();
		assertThat(questionRepository.findById(question.getId())).isEmpty();

		AssignmentModule referencedModule = moduleRepository.save(new AssignmentModule(
				assignmentId,
				ModuleSkill.READING,
				ModuleTaskType.QUIZ,
				3,
				"Referenced",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
				null));
		Submission submission = submissionRepository.save(new Submission(
				assignmentId,
				studentId,
				1,
				null,
				SubmissionStatus.IN_PROGRESS));
		submissionModuleRepository.save(new SubmissionModule(
				submission.getId(), referencedModule.getId(), SubmissionStatus.IN_PROGRESS));

		mockMvc.perform(delete("/api/v1/modules/{id}", referencedModule.getId())
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không thể xoá module đã có bài nộp."));
	}

	@Test
	void listeningAudioPresignedUploadConfirmAndStreamRoundTrip() throws Exception {
		String uploadUrlResponse = mockMvc.perform(post("/api/v1/modules/{id}/audio", listeningModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"mimeType\":\"audio/mpeg\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Lấy link upload audio thành công."))
				.andExpect(jsonPath("$.storageKey")
						.value(startsWith("modules/" + listeningModuleId + "/audio/")))
				.andExpect(jsonPath("$.uploadUrl").isNotEmpty())
				.andExpect(jsonPath("$.expiresAt").isNotEmpty())
				.andExpect(jsonPath("$.sourceAudioUploadStatus").value("UPLOADING"))
				.andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
		JsonNode uploadUrlBody = objectMapper.readTree(uploadUrlResponse);
		String storageKey = uploadUrlBody.get("storageKey").asText();

		moduleRepository.flush();
		entityManager.clear();
		AssignmentModule pendingAudio = moduleRepository.findById(listeningModuleId).orElseThrow();
		assertThat(pendingAudio.getSourceAudioStorageKey()).isEqualTo(storageKey);
		assertThat(pendingAudio.getSourceAudioMimeType()).isEqualTo("audio/mpeg");
		assertThat(pendingAudio.getSourceAudioUploadStatus()).isEqualTo(UploadStatus.UPLOADING);

		byte[] audioBytes = new byte[] {'I', 'D', '3', 1, 2, 3};
		putToPresignedUrl(uploadUrlBody.get("uploadUrl").asText(), audioBytes);

		mockMvc.perform(post("/api/v1/modules/{id}/audio/confirm", listeningModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"storageKey\":\"" + storageKey + "\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Xác nhận upload audio thành công."))
				.andExpect(jsonPath("$.sourceAudioStorageKey").value(storageKey))
				.andExpect(jsonPath("$.sourceAudioUploadStatus").value("READY"));
		moduleRepository.flush();
		entityManager.clear();
		assertThat(moduleRepository.findById(listeningModuleId).orElseThrow().getSourceAudioUploadStatus())
				.isEqualTo(UploadStatus.READY);

		mockMvc.perform(get("/api/v1/modules/{id}/audio", listeningModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(content().contentType("audio/mpeg"))
				.andExpect(content().bytes(audioBytes));

		mockMvc.perform(get("/api/v1/modules/{id}/audio", listeningModuleId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(content().bytes(audioBytes));

		for (UserRole blockedRole : new UserRole[] {UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT}) {
			Long blockedUser = blockedRole == UserRole.ADMIN ? adminId
					: blockedRole == UserRole.TEACHER ? otherTeacherId : otherStudentId;
			mockMvc.perform(get("/api/v1/modules/{id}/audio", listeningModuleId)
						.header("Authorization", bearer(blockedUser, blockedRole)))
					.andExpect(status().isForbidden());
		}
	}

	@Test
	void confirmWithoutDirectUploadMarksFailedAndGuardsMatchUploadUrlStep() throws Exception {
		String uploadUrlResponse = mockMvc.perform(post("/api/v1/modules/{id}/audio", listeningModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"mimeType\":\"audio/mpeg\"}"))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
		String storageKey = objectMapper.readTree(uploadUrlResponse).get("storageKey").asText();

		mockMvc.perform(post("/api/v1/modules/{id}/audio/confirm", listeningModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"storageKey\":\"" + storageKey + "\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("File audio chưa được tải lên kho lưu trữ."))
				.andExpect(jsonPath("$.sourceAudioUploadStatus").value("FAILED"));
		moduleRepository.flush();
		entityManager.clear();
		assertThat(moduleRepository.findById(listeningModuleId).orElseThrow().getSourceAudioUploadStatus())
				.isEqualTo(UploadStatus.FAILED);

		mockMvc.perform(post("/api/v1/modules/{id}/audio/confirm", listeningModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"storageKey\":\"modules/999/audio/hack.mp3\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("storageKey không khớp với module."));

		mockMvc.perform(post("/api/v1/modules/{id}/audio", readingModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"mimeType\":\"audio/mpeg\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Module này không hỗ trợ upload audio."));

		mockMvc.perform(post("/api/v1/modules/{id}/audio", listeningModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"mimeType\":\"audio/ogg\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Định dạng file audio không được hỗ trợ."));

		for (UserRole blockedRole : new UserRole[] {UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT}) {
			Long blockedUser = blockedRole == UserRole.ADMIN ? adminId
					: blockedRole == UserRole.TEACHER ? otherTeacherId : studentId;
			mockMvc.perform(post("/api/v1/modules/{id}/audio", listeningModuleId)
						.header("Authorization", bearer(blockedUser, blockedRole))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"mimeType\":\"audio/mpeg\"}"))
					.andExpect(status().isForbidden());
		}
	}

	@Test
	void audioStreamReturnsNotFoundForMissingAudioOrObject() throws Exception {
		mockMvc.perform(get("/api/v1/modules/{id}/audio", readingModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Module chưa có file audio."));

		AssignmentModule listeningModule = moduleRepository.findById(listeningModuleId).orElseThrow();
		listeningModule.updateAudioMetadata("modules/" + listeningModuleId + "/audio/gone.mp3", null,
				"audio/mpeg", UploadStatus.READY);
		moduleRepository.flush();

		mockMvc.perform(get("/api/v1/modules/{id}/audio", listeningModuleId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Module chưa có file audio."));
	}

	/**
	 * Exercises the after-commit storage cleanup, so the fixtures must really
	 * commit: the service requests run in their own transactions
	 * (NOT_SUPPORTED suspends the test transaction), the after-commit hooks
	 * fire per request, and everything created is deleted again at the end.
	 */
	@Test
	@Transactional(propagation = Propagation.NOT_SUPPORTED)
	void reuploadAndModuleDeletionCleanUpStoredAudioObjects() throws Exception {
		try {
			UploadUrl first = requestAudioUploadUrl(listeningModuleId);
			putToPresignedUrl(first.uploadUrl(), AUDIO_BYTES);
			confirmAudioUpload(listeningModuleId, first.storageKey());
			assertThat(storageService.objectExists(first.storageKey())).isTrue();

			UploadUrl second = requestAudioUploadUrl(listeningModuleId);
			assertThat(storageService.objectExists(first.storageKey()))
					.as("previous audio object must be deleted after the re-upload request commits")
					.isFalse();
			putToPresignedUrl(second.uploadUrl(), AUDIO_BYTES);
			confirmAudioUpload(listeningModuleId, second.storageKey());
			assertThat(storageService.objectExists(second.storageKey())).isTrue();

			mockMvc.perform(delete("/api/v1/modules/{id}", listeningModuleId)
						.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
					.andExpect(status().isOk());
			assertThat(storageService.objectExists(second.storageKey()))
					.as("audio object must be deleted after the module delete commits")
					.isFalse();
		} finally {
			deleteCommittedFixtures();
		}
	}

	private record UploadUrl(String storageKey, String uploadUrl) {
	}

	private UploadUrl requestAudioUploadUrl(long moduleId) throws Exception {
		String response = mockMvc.perform(post("/api/v1/modules/{id}/audio", moduleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"mimeType\":\"audio/mpeg\"}"))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
		JsonNode body = objectMapper.readTree(response);
		return new UploadUrl(body.get("storageKey").asText(), body.get("uploadUrl").asText());
	}

	private void putToPresignedUrl(String uploadUrl, byte[] audioBytes) throws Exception {
		HttpResponse<Void> putResponse = HttpClient.newHttpClient()
				.send(HttpRequest.newBuilder()
						.uri(URI.create(uploadUrl))
						.header("Content-Type", "audio/mpeg")
						.PUT(HttpRequest.BodyPublishers.ofByteArray(audioBytes))
						.build(),
						HttpResponse.BodyHandlers.discarding());
		assertThat(putResponse.statusCode() / 100)
				.as("direct PUT to the presigned URL must succeed")
				.isEqualTo(2);
	}

	private void confirmAudioUpload(long moduleId, String storageKey) throws Exception {
		mockMvc.perform(post("/api/v1/modules/{id}/audio/confirm", moduleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"storageKey\":\"" + storageKey + "\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.sourceAudioUploadStatus").value("READY"));
	}

	private void deleteCommittedFixtures() {
		classMemberRepository.findAll().stream()
				.filter(member -> classId.equals(member.getClassId()))
				.forEach(classMemberRepository::delete);
		questionRepository.findAll().stream()
				.filter(question -> readingModuleId.equals(question.getModuleId())
						|| listeningModuleId.equals(question.getModuleId()))
				.forEach(questionRepository::delete);
		moduleRepository.findAll().stream()
				.filter(module -> assignmentId.equals(module.getAssignmentId()))
				.forEach(moduleRepository::delete);
		assignmentRepository.deleteById(assignmentId);
		classRepository.deleteById(classId);
		teacherProfileRepository.deleteById(teacherId);
		teacherProfileRepository.deleteById(otherTeacherId);
		studentProfileRepository.deleteById(studentId);
		studentProfileRepository.deleteById(otherStudentId);
		userRepository.deleteById(adminId);
		userRepository.deleteById(teacherId);
		userRepository.deleteById(otherTeacherId);
		userRepository.deleteById(studentId);
		userRepository.deleteById(otherStudentId);
	}

	private Long createUser(UserRole role, String name) {
		User user = new User(
				name + " " + uniqueSuffix(),
				role.name().toLowerCase() + "-" + uniqueSuffix() + "@englishhub.test",
				"0912345678",
				"hash",
				role,
				UserStatus.ACTIVE,
				false);
		return userRepository.save(user).getId();
	}

	private User findUser(Long userId) {
		return userRepository.findById(userId).orElseThrow();
	}

	private String bearer(Long userId, UserRole role) {
		com.english_hub.core.modules.user.domain.model.UserRole tokenRole =
				com.english_hub.core.modules.user.domain.model.UserRole.valueOf(role.name());
		return "Bearer " + jwtTokenService.createAccessToken(userId, tokenRole);
	}

	private String uniqueSuffix() {
		return UUID.randomUUID().toString().substring(0, 8);
	}
}
