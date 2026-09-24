package com.english_hub.core.modules.module.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.assignment.application.command.CreateAssignmentCommand;
import com.english_hub.core.modules.assignment.domain.model.Assignment;
import com.english_hub.core.modules.assignment.domain.model.AssignmentStatus;
import com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.repository.ClassMemberRepository;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.module.application.command.CreateModuleCommand;
import com.english_hub.core.modules.module.application.command.UpdateModuleCommand;
import com.english_hub.core.modules.module.application.port.AudioStoragePort;
import com.english_hub.core.modules.module.domain.model.Module;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.module.domain.model.ModuleTaskType;
import com.english_hub.core.modules.module.domain.model.ModuleUploadStatus;
import com.english_hub.core.modules.module.domain.repository.ModuleRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.dao.DataAccessResourceFailureException;

@ExtendWith(MockitoExtension.class)
class ModuleServiceTest {

	private static final OffsetDateTime OPEN_AT = OffsetDateTime.parse("2026-09-15T00:00:00Z");
	private static final OffsetDateTime CLOSE_AT = OffsetDateTime.parse("2026-09-20T23:59:00Z");

	@Mock
	private ModuleRepository moduleRepository;

	@Mock
	private AssignmentRepository assignmentRepository;

	@Mock
	private ClassRepository classRepository;

	@Mock
	private ClassMemberRepository classMemberRepository;

	@Mock
	private CurrentUserProvider currentUserProvider;

	@Mock
	private AudioStoragePort audioStoragePort;

	private ModuleService moduleService;

	@BeforeEach
	void setUp() {
		moduleService = new ModuleService(
				moduleRepository,
				assignmentRepository,
				classRepository,
				classMemberRepository,
				currentUserProvider,
				audioStoragePort);
	}

	@Test
	void teacherOwnerCanListModulesInRepositoryOrder() {
		givenCaller(user(10L, UserRole.TEACHER));
		givenAssignmentAndClass(5L, 3L, 10L);
		Module first = module(9L, 5L, ModuleSkill.READING, 1);
		Module second = module(10L, 5L, ModuleSkill.LISTENING, 2);
		when(moduleRepository.findByAssignmentIdOrderByOrderIndexAsc(5L)).thenReturn(List.of(first, second));

		assertThat(moduleService.listModules(5L)).containsExactly(first, second);
	}

	@Test
	void studentMemberCanListModules() {
		givenCaller(user(41L, UserRole.STUDENT));
		givenAssignmentAndClass(5L, 3L, 10L);
		when(classMemberRepository.existsByClassIdAndStudentId(3L, 41L)).thenReturn(true);
		when(moduleRepository.findByAssignmentIdOrderByOrderIndexAsc(5L)).thenReturn(List.of());

		assertThat(moduleService.listModules(5L)).isEmpty();
	}

	@Test
	void adminCannotListModules() {
		givenCaller(user(1L, UserRole.ADMIN));
		givenAssignment(5L, 3L);

		assertApiException(() -> moduleService.listModules(5L), "Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void teacherOwnerCanCreateModuleWithDefaultScore() {
		givenCaller(user(10L, UserRole.TEACHER));
		givenAssignmentAndClass(5L, 3L, 10L);
		when(moduleRepository.existsByAssignmentIdAndOrderIndex(5L, 1)).thenReturn(false);
		Module saved = module(9L, 5L, ModuleSkill.READING, 1);
		when(moduleRepository.save(any(Module.class))).thenReturn(saved);

		long id = moduleService.createModule(
				5L,
				new CreateModuleCommand(ModuleSkill.READING, ModuleTaskType.QUIZ, 1, "Read", null, null));

		assertThat(id).isEqualTo(9L);
		verify(moduleRepository).save(any(Module.class));
	}

	@Test
	void studentCannotCreateModule() {
		givenCaller(user(41L, UserRole.STUDENT));

		assertApiException(
				() -> moduleService.createModule(
						5L,
						new CreateModuleCommand(ModuleSkill.READING, ModuleTaskType.QUIZ, 1, null, null, BigDecimal.TEN)),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void adminCannotCreateModule() {
		givenCaller(user(1L, UserRole.ADMIN));

		assertApiException(
				() -> moduleService.createModule(
						5L,
						new CreateModuleCommand(ModuleSkill.READING, ModuleTaskType.QUIZ, 1, null, null, BigDecimal.TEN)),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void teacherFromAnotherClassCannotCreateModule() {
		givenCaller(user(11L, UserRole.TEACHER));
		givenAssignmentAndClass(5L, 3L, 10L);

		assertApiException(
				() -> moduleService.createModule(
						5L,
						new CreateModuleCommand(ModuleSkill.READING, ModuleTaskType.QUIZ, 1, null, null, BigDecimal.TEN)),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void duplicateOrderIndexIsRejectedOnCreate() {
		givenCaller(user(10L, UserRole.TEACHER));
		givenAssignmentAndClass(5L, 3L, 10L);
		when(moduleRepository.existsByAssignmentIdAndOrderIndex(5L, 1)).thenReturn(true);

		assertApiException(
				() -> moduleService.createModule(
						5L,
						new CreateModuleCommand(ModuleSkill.READING, ModuleTaskType.QUIZ, 1, null, null, BigDecimal.TEN)),
				"orderIndex đã được sử dụng trong bài tập này.");
		verify(moduleRepository, never()).save(any(Module.class));
	}

	@Test
	void unsupportedSkillTaskTypePairIsRejected() {
		givenCaller(user(10L, UserRole.TEACHER));
		givenAssignmentAndClass(5L, 3L, 10L);

		assertApiException(
				() -> moduleService.createModule(
						5L,
						new CreateModuleCommand(ModuleSkill.READING, ModuleTaskType.ESSAY, 1, null, null, BigDecimal.TEN)),
				"Skill và taskType không hợp lệ.");
	}

	@Test
	void teacherOwnerCanReadModuleDetail() {
		givenCaller(user(10L, UserRole.TEACHER));
		Module module = module(9L, 5L, ModuleSkill.READING, 1);
		when(moduleRepository.findById(9L)).thenReturn(Optional.of(module));
		givenAssignmentAndClass(5L, 3L, 10L);

		assertThat(moduleService.getModule(9L)).isEqualTo(module);
	}

	@Test
	void studentMemberCanReadModuleDetail() {
		givenCaller(user(41L, UserRole.STUDENT));
		Module module = module(9L, 5L, ModuleSkill.READING, 1);
		when(moduleRepository.findById(9L)).thenReturn(Optional.of(module));
		givenAssignmentAndClass(5L, 3L, 10L);
		when(classMemberRepository.existsByClassIdAndStudentId(3L, 41L)).thenReturn(true);

		assertThat(moduleService.getModule(9L)).isEqualTo(module);
	}

	@Test
	void adminCannotReadModuleDetail() {
		givenCaller(user(1L, UserRole.ADMIN));
		when(moduleRepository.findById(9L)).thenReturn(Optional.of(module(9L, 5L, ModuleSkill.READING, 1)));
		givenAssignment(5L, 3L);

		assertApiException(() -> moduleService.getModule(9L), "Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void teacherOwnerCanUpdateModule() {
		givenCaller(user(10L, UserRole.TEACHER));
		Module module = module(9L, 5L, ModuleSkill.READING, 1);
		when(moduleRepository.findById(9L)).thenReturn(Optional.of(module));
		givenAssignmentAndClass(5L, 3L, 10L);
		when(moduleRepository.existsByAssignmentIdAndOrderIndexAndIdNot(5L, 2, 9L)).thenReturn(false);

		moduleService.updateModule(9L, new UpdateModuleCommand("Updated", "AI", BigDecimal.valueOf(20), 2));

		verify(moduleRepository).save(any(Module.class));
	}

	@Test
	void wrongTeacherCannotUpdateModule() {
		givenCaller(user(11L, UserRole.TEACHER));
		when(moduleRepository.findById(9L)).thenReturn(Optional.of(module(9L, 5L, ModuleSkill.READING, 1)));
		givenAssignmentAndClass(5L, 3L, 10L);

		assertApiException(
				() -> moduleService.updateModule(9L, new UpdateModuleCommand("Updated", null, null, 2)),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void duplicateOrderIndexIsRejectedOnUpdateExcludingCurrentModule() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(moduleRepository.findById(9L)).thenReturn(Optional.of(module(9L, 5L, ModuleSkill.READING, 1)));
		givenAssignmentAndClass(5L, 3L, 10L);
		when(moduleRepository.existsByAssignmentIdAndOrderIndexAndIdNot(5L, 2, 9L)).thenReturn(true);

		assertApiException(
				() -> moduleService.updateModule(9L, new UpdateModuleCommand("Updated", null, null, 2)),
				"orderIndex đã được sử dụng.");
		verify(moduleRepository, never()).save(any(Module.class));
	}

	@Test
	void teacherOwnerCanDeleteModuleWhenItHasNoSubmission() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(moduleRepository.findById(9L)).thenReturn(Optional.of(module(9L, 5L, ModuleSkill.READING, 1)));
		givenAssignmentAndClass(5L, 3L, 10L);
		when(moduleRepository.existsSubmissionReference(9L)).thenReturn(false);

		moduleService.deleteModule(9L);

		verify(moduleRepository).deleteById(9L);
	}

	@Test
	void studentCannotDeleteModule() {
		givenCaller(user(41L, UserRole.STUDENT));

		assertApiException(() -> moduleService.deleteModule(9L), "Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void adminCannotDeleteModule() {
		givenCaller(user(1L, UserRole.ADMIN));

		assertApiException(() -> moduleService.deleteModule(9L), "Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void moduleWithSubmissionCannotBeDeleted() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(moduleRepository.findById(9L)).thenReturn(Optional.of(module(9L, 5L, ModuleSkill.READING, 1)));
		givenAssignmentAndClass(5L, 3L, 10L);
		when(moduleRepository.existsSubmissionReference(9L)).thenReturn(true);

		assertApiException(() -> moduleService.deleteModule(9L), "Không thể xoá module đã có bài nộp.");
		verify(moduleRepository, never()).deleteById(9L);
	}

	@Test
	void teacherOwnerCanUploadListeningAudioAndMarkItReady() {
		givenCaller(user(10L, UserRole.TEACHER));
		Module module = module(9L, 5L, ModuleSkill.LISTENING, 2);
		when(moduleRepository.findById(9L)).thenReturn(Optional.of(module));
		givenAssignmentAndClass(5L, 3L, 10L);
		MockMultipartFile file = new MockMultipartFile(
				"file", "question.mp3", "audio/mpeg", new byte[] {'I', 'D', '3', 1, 2, 3});
		when(audioStoragePort.store(9L, file)).thenReturn(new AudioStoragePort.StoredAudio(
				"modules/9/audio/test.mp3", "audio/mpeg", null));

		ModuleService.AudioUploadResult result = moduleService.uploadAudio(9L, file);

		assertThat(result.storageKey()).isEqualTo("modules/9/audio/test.mp3");
		assertThat(result.uploadStatus()).isEqualTo("READY");
		verify(moduleRepository).save(any(Module.class));
	}

	@Test
	void databaseMetadataFailureCleansUpFileAndBestEffortPersistsFailedStatus() {
		givenCaller(user(10L, UserRole.TEACHER));
		Module module = module(9L, 5L, ModuleSkill.LISTENING, 2);
		when(moduleRepository.findById(9L)).thenReturn(Optional.of(module));
		givenAssignmentAndClass(5L, 3L, 10L);
		MockMultipartFile file = new MockMultipartFile(
				"file", "question.mp3", "audio/mpeg", new byte[] {'I', 'D', '3', 1, 2, 3});
		when(audioStoragePort.store(9L, file)).thenReturn(new AudioStoragePort.StoredAudio(
				"modules/9/audio/failed.mp3", "audio/mpeg", null));
		DataAccessResourceFailureException databaseException =
				new DataAccessResourceFailureException("metadata save failed");
		when(moduleRepository.save(any(Module.class)))
				.thenThrow(databaseException)
				.thenAnswer(invocation -> invocation.getArgument(0));

		assertThatThrownBy(() -> moduleService.uploadAudio(9L, file))
				.isSameAs(databaseException);

		ArgumentCaptor<Module> savedModules = ArgumentCaptor.forClass(Module.class);
		verify(moduleRepository, org.mockito.Mockito.times(2)).save(savedModules.capture());
		assertThat(savedModules.getAllValues().get(0).sourceAudioUploadStatus())
				.isEqualTo(ModuleUploadStatus.READY);
		assertThat(savedModules.getAllValues().get(1).sourceAudioUploadStatus())
				.isEqualTo(ModuleUploadStatus.FAILED);
		verify(audioStoragePort).delete("modules/9/audio/failed.mp3");
	}

	@Test
	void cleanupFailureIsLoggedAndDoesNotReplaceDatabaseException() {
		givenCaller(user(10L, UserRole.TEACHER));
		Module module = module(9L, 5L, ModuleSkill.LISTENING, 2);
		when(moduleRepository.findById(9L)).thenReturn(Optional.of(module));
		givenAssignmentAndClass(5L, 3L, 10L);
		MockMultipartFile file = new MockMultipartFile(
				"file", "question.mp3", "audio/mpeg", new byte[] {'I', 'D', '3', 1, 2, 3});
		when(audioStoragePort.store(9L, file)).thenReturn(new AudioStoragePort.StoredAudio(
				"modules/9/audio/cleanup-failure.mp3", "audio/mpeg", null));
		DataAccessResourceFailureException databaseException =
				new DataAccessResourceFailureException("metadata save failed");
		when(moduleRepository.save(any(Module.class))).thenThrow(databaseException);
		RuntimeException cleanupException = new RuntimeException("cleanup failed");
		doThrow(cleanupException).when(audioStoragePort).delete("modules/9/audio/cleanup-failure.mp3");

		assertThatThrownBy(() -> moduleService.uploadAudio(9L, file))
				.isSameAs(databaseException)
				.satisfies(exception -> assertThat(exception.getSuppressed()).contains(cleanupException));
		verify(audioStoragePort).delete("modules/9/audio/cleanup-failure.mp3");
	}

	@Test
	void nonListeningModuleCannotReceiveAudio() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(moduleRepository.findById(9L)).thenReturn(Optional.of(module(9L, 5L, ModuleSkill.READING, 1)));
		givenAssignmentAndClass(5L, 3L, 10L);

		assertApiException(
				() -> moduleService.uploadAudio(9L, new MockMultipartFile(
						"file", "question.mp3", "audio/mpeg", new byte[] {'I', 'D', '3'})),
				"Module này không hỗ trợ upload audio.");
	}

	@Test
	void studentCannotUploadAudio() {
		givenCaller(user(41L, UserRole.STUDENT));

		assertApiException(
				() -> moduleService.uploadAudio(9L, new MockMultipartFile(
						"file", "question.mp3", "audio/mpeg", new byte[] {'I', 'D', '3'})),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void acceptsAudioAtExactTwentyFiveMiBBoundary() {
		givenListeningModule();
		MockMultipartFile file = new MockMultipartFile(
				"file", "boundary.mp3", "audio/mpeg", audioBytes(25 * 1024 * 1024, 'I', 'D', '3'));
		givenStoredAudio(file);

		ModuleService.AudioUploadResult result = moduleService.uploadAudio(9L, file);

		assertThat(result.uploadStatus()).isEqualTo("READY");
		verify(audioStoragePort).store(9L, file);
	}

	@Test
	void rejectsAudioOneByteOverTwentyFiveMiBBoundary() {
		givenListeningModule();
		MockMultipartFile file = new MockMultipartFile(
				"file", "too-large.mp3", "audio/mpeg", audioBytes(25 * 1024 * 1024 + 1, 'I', 'D', '3'));

		assertApiException(() -> moduleService.uploadAudio(9L, file), "File audio không hợp lệ.");
		verify(audioStoragePort, never()).store(anyLong(), any());
	}

	@Test
	void rejectsAudioFilenameWithoutExtension() {
		givenListeningModule();
		MockMultipartFile file = new MockMultipartFile(
				"file", "audio", "audio/mpeg", audioBytes(6, 'I', 'D', '3'));

		assertApiException(() -> moduleService.uploadAudio(9L, file), "File audio không hợp lệ.");
		verify(audioStoragePort, never()).store(anyLong(), any());
	}

	@Test
	void acceptsUppercaseAudioExtension() {
		givenListeningModule();
		MockMultipartFile file = new MockMultipartFile(
				"file", "SOURCE.MP3", "audio/mpeg", audioBytes(6, 'I', 'D', '3'));
		givenStoredAudio(file);

		moduleService.uploadAudio(9L, file);

		verify(audioStoragePort).store(9L, file);
	}

	@Test
	void acceptsAudioWithNullMimeTypeWhenSignatureAndExtensionAreValid() {
		givenListeningModule();
		MockMultipartFile file = new MockMultipartFile(
				"file", "source.mp3", null, audioBytes(6, 'I', 'D', '3'));
		givenStoredAudio(file);

		moduleService.uploadAudio(9L, file);

		verify(audioStoragePort).store(9L, file);
	}

	@Test
	void rejectsMp3MagicBytesWithWavExtension() {
		givenListeningModule();
		MockMultipartFile file = new MockMultipartFile(
				"file", "source.wav", "audio/wav", audioBytes(6, 'I', 'D', '3'));

		assertApiException(() -> moduleService.uploadAudio(9L, file), "File audio không hợp lệ.");
		verify(audioStoragePort, never()).store(anyLong(), any());
	}

	@Test
	void rejectsWavMagicBytesWithMp3Extension() {
		givenListeningModule();
		byte[] wavHeader = new byte[] {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'A', 'V', 'E'};
		MockMultipartFile file = new MockMultipartFile(
				"file", "source.mp3", "audio/mpeg", wavHeader);

		assertApiException(() -> moduleService.uploadAudio(9L, file), "File audio không hợp lệ.");
		verify(audioStoragePort, never()).store(anyLong(), any());
	}

	private void givenListeningModule() {
		givenCaller(user(10L, UserRole.TEACHER));
		when(moduleRepository.findById(9L)).thenReturn(Optional.of(module(9L, 5L, ModuleSkill.LISTENING, 2)));
		givenAssignmentAndClass(5L, 3L, 10L);
	}

	private void givenStoredAudio(MockMultipartFile file) {
		when(audioStoragePort.store(9L, file)).thenReturn(new AudioStoragePort.StoredAudio(
				"modules/9/audio/test.mp3", "audio/mpeg", null));
	}

	private byte[] audioBytes(int size, char... header) {
		byte[] bytes = new byte[size];
		for (int index = 0; index < header.length; index++) {
			bytes[index] = (byte) header[index];
		}
		return bytes;
	}

	private void givenAssignment(Long assignmentId, Long classId) {
		Assignment value = assignment(assignmentId, classId);
		when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(value));
		lenient().when(assignmentRepository.findByIdForUpdate(assignmentId)).thenReturn(Optional.of(value));
	}

	private void givenAssignmentAndClass(Long assignmentId, Long classId, Long teacherId) {
		givenAssignment(assignmentId, classId);
		when(classRepository.findById(classId)).thenReturn(Optional.of(englishClass(classId, teacherId)));
	}

	private Assignment assignment(Long id, Long classId) {
		return new Assignment(
				id,
				classId,
				"Weekly Test",
				"Instructions",
				OPEN_AT,
				CLOSE_AT,
				2,
				AssignmentStatus.DRAFT,
				false,
				null,
				null);
	}

	private EnglishClass englishClass(Long id, Long teacherId) {
		EnglishClass englishClass = new EnglishClass(
				"IELTS 6.5",
				"Intermediate",
				"Test class",
				java.time.LocalDate.of(2026, 9, 15),
				null,
				ClassStatus.ACTIVE,
				teacherId);
		englishClass.setId(id);
		return englishClass;
	}

	private Module module(Long id, Long assignmentId, ModuleSkill skill, int orderIndex) {
		return new Module(
				id,
				assignmentId,
				skill,
				skill == ModuleSkill.SPEAKING ? ModuleTaskType.RECORDING : ModuleTaskType.QUIZ,
				orderIndex,
				"Instructions",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
				null);
	}

	private User user(Long id, UserRole role) {
		User user = User.create(
				role.name(),
				role.name().toLowerCase() + "@englishhub.test",
				null,
				null,
				null,
				role,
				UserStatus.ACTIVE,
				null,
				null,
				null,
				null);
		user.setId(id);
		return user;
	}

	private void givenCaller(User user) {
		when(currentUserProvider.requireActiveUser()).thenReturn(user);
	}

	private void assertApiException(ThrowingOperation operation, String message) {
		assertThatThrownBy(operation::run)
				.isInstanceOf(ApiException.class)
				.hasMessage(message);
	}

	@FunctionalInterface
	private interface ThrowingOperation {
		void run();
	}
}
