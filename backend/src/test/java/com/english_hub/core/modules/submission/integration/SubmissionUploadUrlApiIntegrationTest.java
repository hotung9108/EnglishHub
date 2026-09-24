package com.english_hub.core.modules.submission.integration;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.ClassMember;
import com.english_hub.core.infrastructure.persistence.entity.ClassStatus;
import com.english_hub.core.infrastructure.persistence.entity.EnglishClass;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.ClassMemberRepository;
import com.english_hub.core.infrastructure.persistence.repository.EnglishClassRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.submission.application.port.StorageService;
import com.english_hub.core.modules.submission.domain.model.SubmissionModule;
import com.english_hub.core.modules.submission.domain.model.SubmissionStatus;
import com.english_hub.core.modules.submission.domain.repository.SubmissionModuleRepository;
import com.english_hub.core.modules.submission.domain.repository.SubmissionRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SubmissionUploadUrlApiIntegrationTest {

	private static final String BUCKET = "englishhub-upload-test";
	private static final String ACCESS_KEY = "minioadmin";
	private static final String SECRET_KEY = "minioadmin";
	private static final byte[] PAYLOAD = "phase-7b-upload-payload".getBytes();

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_test")
			.withUsername("test")
			.withPassword("test");

	@Container
	static final GenericContainer<?> MINIO = new GenericContainer<>("quay.io/minio/minio:latest")
			.withEnv("MINIO_ROOT_USER", ACCESS_KEY)
			.withEnv("MINIO_ROOT_PASSWORD", SECRET_KEY)
			.withCommand("server /data --address :9000 --console-address :9001")
			.withExposedPorts(9000);

	@DynamicPropertySource
	static void registerProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
		registry.add("app.storage.s3.enabled", () -> "true");
		registry.add("app.storage.s3.endpoint", () -> "http://localhost:" + MINIO.getMappedPort(9000));
		registry.add("app.storage.s3.region", () -> "us-east-1");
		registry.add("app.storage.s3.access-key-id", () -> ACCESS_KEY);
		registry.add("app.storage.s3.secret-access-key", () -> SECRET_KEY);
		registry.add("app.storage.s3.bucket", () -> BUCKET);
		registry.add("app.storage.s3.path-style", () -> "true");
	}

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private JwtTokenService jwtTokenService;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TeacherProfileRepository teacherProfileRepository;

	@Autowired
	private StudentProfileRepository studentProfileRepository;

	@Autowired
	private EnglishClassRepository englishClassRepository;

	@Autowired
	private ClassMemberRepository classMemberRepository;

	@Autowired
	private AssignmentRepository assignmentRepository;

	@Autowired
	private AssignmentModuleRepository assignmentModuleRepository;

	@Autowired
	private SubmissionRepository submissionRepository;

	@Autowired
	private SubmissionModuleRepository submissionModuleRepository;

	@Autowired
	private StorageService storageService;

	private Long teacherId;
	private Long studentMemberId;
	private Long studentOtherId;
	private Long publishedAssignmentId;
	private Long recordingModuleId;
	private Long essayModuleId;
	private Long quizModuleId;

	@BeforeAll
	static void createBucket() {
		try (S3Client client = S3Client.builder()
				.endpointOverride(URI.create("http://localhost:" + MINIO.getMappedPort(9000)))
				.region(Region.US_EAST_1)
				.credentialsProvider(StaticCredentialsProvider.create(
						AwsBasicCredentials.create(ACCESS_KEY, SECRET_KEY)))
				.serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
				.build()) {
			client.createBucket(bucket -> bucket.bucket(BUCKET));
		}
	}

	@BeforeEach
	void setUp() {
		teacherId = user(UserRole.TEACHER, "Giáo viên");
		studentMemberId = user(UserRole.STUDENT, "Học viên chính thức");
		studentOtherId = user(UserRole.STUDENT, "Học viên ngoài lớp");
		teacherProfileRepository.save(new TeacherProfile(user(teacherId), "IELTS"));
		studentProfileRepository.save(new StudentProfile(user(studentMemberId), "HV0001",
				LocalDate.of(2004, 4, 1), "0912345678"));
		studentProfileRepository.save(new StudentProfile(user(studentOtherId), "HV0002",
				LocalDate.of(2005, 5, 2), "0912345679"));

		long classId = englishClassRepository.save(new EnglishClass(
				"IELTS 6.5 - K12",
				"Intermediate",
				"Luyện IELTS",
				LocalDate.of(2026, 9, 15),
				LocalDate.of(2027, 1, 31),
				ClassStatus.ACTIVE,
				teacherId)).getId();
		classMemberRepository.save(new ClassMember(classId, studentMemberId));

		publishedAssignmentId = assignment(
				classId,
				AssignmentStatus.PUBLISHED,
				OffsetDateTime.now().minusHours(1),
				OffsetDateTime.now().plusHours(48));
		recordingModuleId = module(publishedAssignmentId, ModuleSkill.SPEAKING, ModuleTaskType.RECORDING, 1);
		essayModuleId = module(publishedAssignmentId, ModuleSkill.WRITING, ModuleTaskType.ESSAY, 2);
		quizModuleId = module(publishedAssignmentId, ModuleSkill.READING, ModuleTaskType.QUIZ, 3);
	}

	@Test
	void audioUploadUrl_pointsToSpeakingModuleAndAllowsDirectUpload() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long recordingSubmissionModuleId = submissionModuleIdOf(submissionId, recordingModuleId);

		String response = mockMvc.perform(post("/api/v1/submission-modules/{id}/audio-upload-url",
						recordingSubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"mimeType\":\"audio/webm\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.storageKey")
						.value("submissions/" + submissionId + "/module-" + recordingSubmissionModuleId + "/audio.webm"))
				.andExpect(jsonPath("$.expiresAt").exists())
				.andReturn().getResponse().getContentAsString();
		String uploadUrl = jsonString(response, "uploadUrl");

		assertThat(storageService.objectExists(
				"submissions/" + submissionId + "/module-" + recordingSubmissionModuleId + "/audio.webm")).isFalse();

		HttpResponse<Void> put = HttpClient.newHttpClient().send(HttpRequest.newBuilder()
				.uri(URI.create(uploadUrl))
				.header("Content-Type", "audio/webm")
				.PUT(HttpRequest.BodyPublishers.ofByteArray(PAYLOAD))
				.build(), HttpResponse.BodyHandlers.discarding());
		assertThat(put.statusCode()).isBetween(200, 204);

		assertThat(storageService.objectExists(
				"submissions/" + submissionId + "/module-" + recordingSubmissionModuleId + "/audio.webm")).isTrue();
	}

	@Test
	void audioUploadUrl_isRejectedForUnsupportedMimeType() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long recordingSubmissionModuleId = submissionModuleIdOf(submissionId, recordingModuleId);

		mockMvc.perform(post("/api/v1/submission-modules/{id}/audio-upload-url", recordingSubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"mimeType\":\"audio/ogg\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Định dạng file không được hỗ trợ."));
	}

	@Test
	void audioUploadUrl_isRejectedForANonSpeakingModule() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long quizSubmissionModuleId = submissionModuleIdOf(submissionId, quizModuleId);

		mockMvc.perform(post("/api/v1/submission-modules/{id}/audio-upload-url", quizSubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"mimeType\":\"audio/webm\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không thể upload ghi âm cho phần làm bài này."));
	}

	@Test
	void audioUploadUrl_isRejectedWhenModuleAlreadySubmitted() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long recordingSubmissionModuleId = submissionModuleIdOf(submissionId, recordingModuleId);
		SubmissionModule submissionModule = submissionModuleRepository.findById(recordingSubmissionModuleId).orElseThrow();
		submissionModule.setStatus(SubmissionStatus.SUBMITTED);
		submissionModuleRepository.save(submissionModule);

		mockMvc.perform(post("/api/v1/submission-modules/{id}/audio-upload-url", recordingSubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"mimeType\":\"audio/webm\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không thể upload ghi âm cho phần làm bài này."));
	}

	@Test
	void documentUploadUrl_pointsToEssayModuleAndAllowsDirectUpload() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long essaySubmissionModuleId = submissionModuleIdOf(submissionId, essayModuleId);

		String response = mockMvc.perform(post("/api/v1/submission-modules/{id}/document-upload-url",
						essaySubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"mimeType\":\"application/pdf\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.storageKey")
						.value("submissions/" + submissionId + "/module-" + essaySubmissionModuleId + "/essay.pdf"))
				.andExpect(jsonPath("$.expiresAt").exists())
				.andReturn().getResponse().getContentAsString();
		String uploadUrl = jsonString(response, "uploadUrl");

		HttpResponse<Void> put = HttpClient.newHttpClient().send(HttpRequest.newBuilder()
				.uri(URI.create(uploadUrl))
				.header("Content-Type", "application/pdf")
				.PUT(HttpRequest.BodyPublishers.ofByteArray(PAYLOAD))
				.build(), HttpResponse.BodyHandlers.discarding());
		assertThat(put.statusCode()).isBetween(200, 204);

		assertThat(storageService.objectExists(
				"submissions/" + submissionId + "/module-" + essaySubmissionModuleId + "/essay.pdf")).isTrue();
	}

	@Test
	void documentUploadUrl_isRejectedForUnsupportedMimeType() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long essaySubmissionModuleId = submissionModuleIdOf(submissionId, essayModuleId);

		mockMvc.perform(post("/api/v1/submission-modules/{id}/document-upload-url", essaySubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"mimeType\":\"text/plain\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Định dạng file không được hỗ trợ."));
	}

	@Test
	void documentUploadUrl_isRejectedForANonWritingModule() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long quizSubmissionModuleId = submissionModuleIdOf(submissionId, quizModuleId);

		mockMvc.perform(post("/api/v1/submission-modules/{id}/document-upload-url", quizSubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"mimeType\":\"application/pdf\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không thể upload tài liệu cho phần làm bài này."));
	}

	@Test
	void submitModule_marksEssayAnswerReadyWhenDocumentUploaded() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long essaySubmissionModuleId = submissionModuleIdOf(submissionId, essayModuleId);

		String response = mockMvc.perform(post("/api/v1/submission-modules/{id}/document-upload-url",
						essaySubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"mimeType\":\"application/pdf\"}"))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		HttpClient.newHttpClient().send(HttpRequest.newBuilder()
				.uri(URI.create(jsonString(response, "uploadUrl")))
				.header("Content-Type", "application/pdf")
				.PUT(HttpRequest.BodyPublishers.ofByteArray(PAYLOAD))
				.build(), HttpResponse.BodyHandlers.discarding());

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", essaySubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("SUBMITTED"))
				.andExpect(jsonPath("$.answers[0].questionId").value(nullValue()))
				.andExpect(jsonPath("$.answers[0].content").value(nullValue()))
				.andExpect(jsonPath("$.answers[0].docStorageKey")
						.value("submissions/" + submissionId + "/module-" + essaySubmissionModuleId + "/essay.pdf"))
				.andExpect(jsonPath("$.answers[0].docMimeType").value("application/pdf"))
				.andExpect(jsonPath("$.answers[0].docUploadStatus").value("READY"));
	}

	@Test
	void submitModule_marksEssayAnswerUploadingWhenNothingUploaded() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long essaySubmissionModuleId = submissionModuleIdOf(submissionId, essayModuleId);

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", essaySubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.answers[0].docStorageKey").value(nullValue()))
				.andExpect(jsonPath("$.answers[0].docUploadStatus").value("UPLOADING"));
	}

	@Test
	void submitModule_marksRecordingAnswerReadyWhenAudioUploaded() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long recordingSubmissionModuleId = submissionModuleIdOf(submissionId, recordingModuleId);

		String response = mockMvc.perform(post("/api/v1/submission-modules/{id}/audio-upload-url",
						recordingSubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"mimeType\":\"audio/webm\"}"))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		HttpClient.newHttpClient().send(HttpRequest.newBuilder()
				.uri(URI.create(jsonString(response, "uploadUrl")))
				.header("Content-Type", "audio/webm")
				.PUT(HttpRequest.BodyPublishers.ofByteArray(PAYLOAD))
				.build(), HttpResponse.BodyHandlers.discarding());

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", recordingSubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.answers[0].questionId").value(nullValue()))
				.andExpect(jsonPath("$.answers[0].content").value(nullValue()))
				.andExpect(jsonPath("$.answers[0].audioStorageKey")
						.value("submissions/" + submissionId + "/module-" + recordingSubmissionModuleId + "/audio.webm"))
				.andExpect(jsonPath("$.answers[0].audioMimeType").value("audio/webm"))
				.andExpect(jsonPath("$.answers[0].audioUploadStatus").value("READY"));
	}

	@Test
	void submitModule_marksRecordingAnswerUploadingWhenNoAudioUploaded() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long recordingSubmissionModuleId = submissionModuleIdOf(submissionId, recordingModuleId);

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", recordingSubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.answers[0].audioUploadStatus").value("UPLOADING"));
	}

	@Test
	void submittedEssayAnswerExposesDocumentMetadataInModuleDetail() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long essaySubmissionModuleId = submissionModuleIdOf(submissionId, essayModuleId);

		String response = mockMvc.perform(post("/api/v1/submission-modules/{id}/document-upload-url",
						essaySubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"mimeType\":\"application/pdf\"}"))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		HttpClient.newHttpClient().send(HttpRequest.newBuilder()
				.uri(URI.create(jsonString(response, "uploadUrl")))
				.header("Content-Type", "application/pdf")
				.PUT(HttpRequest.BodyPublishers.ofByteArray(PAYLOAD))
				.build(), HttpResponse.BodyHandlers.discarding());
		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", essaySubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/v1/submission-modules/{id}", essaySubmissionModuleId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.answers[0].docStorageKey")
						.value("submissions/" + submissionId + "/module-" + essaySubmissionModuleId + "/essay.pdf"))
				.andExpect(jsonPath("$.answers[0].docMimeType").value("application/pdf"))
				.andExpect(jsonPath("$.answers[0].docUploadStatus").value("READY"));
	}

	@Test
	void uploadUrlEndpoints_areRejectedForForeignStudentTeacherAndUnknownIds() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long recordingSubmissionModuleId = submissionModuleIdOf(submissionId, recordingModuleId);
		String audioBody = "{\"mimeType\":\"audio/webm\"}";

		mockMvc.perform(post("/api/v1/submission-modules/{id}/audio-upload-url", recordingSubmissionModuleId)
						.header("Authorization", bearer(studentOtherId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content(audioBody))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));

		mockMvc.perform(post("/api/v1/submission-modules/{id}/audio-upload-url", recordingSubmissionModuleId)
						.header("Authorization", bearer(teacherId, UserRole.TEACHER))
						.contentType(MediaType.APPLICATION_JSON)
						.content(audioBody))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));

		mockMvc.perform(post("/api/v1/submission-modules/{id}/audio-upload-url", 99999999L)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT))
						.contentType(MediaType.APPLICATION_JSON)
						.content(audioBody))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy phần làm bài."));
	}

	private long startSubmissionAsStudentMember() throws Exception {
		String response = mockMvc.perform(post("/api/v1/assignments/{id}/submissions", publishedAssignmentId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return jsonLong(response, "id");
	}

	private long submissionModuleIdOf(long submissionId, Long moduleId) {
		return submissionModuleRepository.findBySubmissionId(submissionId).stream()
				.filter(module -> module.getModuleId().equals(moduleId))
				.findFirst()
				.orElseThrow()
				.getId();
	}

	private long assignment(long classId, AssignmentStatus status, OffsetDateTime openAt, OffsetDateTime closeAt) {
		return assignmentRepository.save(new Assignment(
				classId,
				"Bài tập " + status,
				"Test assignment",
				openAt,
				closeAt,
				2,
				false,
				status)).getId();
	}

	private long module(long assignmentId, ModuleSkill skill, ModuleTaskType taskType, int orderIndex) {
		return assignmentModuleRepository.save(new AssignmentModule(
				assignmentId,
				skill,
				taskType,
				orderIndex,
				"Instructions",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
				null)).getId();
	}

	private String bearer(long userId, UserRole role) {
		com.english_hub.core.modules.user.domain.model.UserRole tokenRole =
				com.english_hub.core.modules.user.domain.model.UserRole.valueOf(role.name());
		return "Bearer " + jwtTokenService.createAccessToken(userId, tokenRole);
	}

	private long user(UserRole role, String fullName) {
		String suffix = UUID.randomUUID().toString().substring(0, 8);
		User user = new User(
				fullName,
				role.name().toLowerCase() + "-" + suffix + "@englishhub.test",
				"0912345678",
				"hash",
				role,
				UserStatus.ACTIVE,
				false);
		return userRepository.save(user).getId();
	}

	private com.english_hub.core.modules.user.infrastructure.persistence.entity.User user(Long userId) {
		return userRepository.findById(userId).orElseThrow();
	}

	private long jsonLong(String json, String field) {
		Matcher matcher = Pattern.compile("\"" + field + "\"\\s*:\\s*(\\d+)").matcher(json);
		if (!matcher.find()) {
			throw new IllegalStateException("Field not found in response: " + json);
		}
		return Long.parseLong(matcher.group(1));
	}

	private String jsonString(String json, String field) {
		Matcher matcher = Pattern.compile("\"" + field + "\"\\s*:\\s*\"([^\"]+)\"").matcher(json);
		if (!matcher.find()) {
			throw new IllegalStateException("Field not found in response: " + json);
		}
		return matcher.group(1);
	}
}