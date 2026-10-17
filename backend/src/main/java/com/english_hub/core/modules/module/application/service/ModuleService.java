package com.english_hub.core.modules.module.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.modules.assignment.domain.model.Assignment;
import com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.repository.ClassMemberRepository;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.module.application.command.CreateModuleCommand;
import com.english_hub.core.modules.module.application.command.UpdateModuleCommand;
import com.english_hub.core.modules.module.domain.model.Module;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.module.domain.model.ModuleTaskType;
import com.english_hub.core.modules.module.domain.model.ModuleUploadStatus;
import com.english_hub.core.modules.module.domain.repository.ModuleRepository;
import com.english_hub.core.modules.submission.application.port.StorageService;
import com.english_hub.core.modules.submission.application.port.StorageService.PresignedUpload;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.dao.PessimisticLockingFailureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class ModuleService {

	private static final Logger LOGGER = LoggerFactory.getLogger(ModuleService.class);

	private static final String MODULE_NOT_FOUND_MESSAGE = "Không tìm thấy module.";
	private static final String ASSIGNMENT_NOT_FOUND_MESSAGE = "Không tìm thấy bài tập.";
	private static final String CLASS_NOT_FOUND_MESSAGE = "Không tìm thấy lớp học.";
	private static final String FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";
	private static final String ORDER_CONFLICT_CREATE_MESSAGE = "orderIndex đã được sử dụng trong bài tập này.";
	private static final String ORDER_CONFLICT_UPDATE_MESSAGE = "orderIndex đã được sử dụng.";
	private static final String INVALID_MODULE_DATA_MESSAGE = "Dữ liệu module không hợp lệ.";
	private static final String INVALID_PAIR_MESSAGE = "Skill và taskType không hợp lệ.";
	private static final String SUBMISSION_REFERENCE_MESSAGE = "Không thể xoá module đã có bài nộp.";
	private static final String LOCK_TIMEOUT_MESSAGE = "Tài nguyên đang được cập nhật, vui lòng thử lại.";
	private static final String AUDIO_NOT_SUPPORTED_MESSAGE = "Module này không hỗ trợ upload audio.";
	private static final String UNSUPPORTED_AUDIO_MIME_MESSAGE = "Định dạng file audio không được hỗ trợ.";
	private static final String AUDIO_CONFIRM_MISMATCH_MESSAGE = "storageKey không khớp với module.";
	private static final String AUDIO_NOT_AVAILABLE_MESSAGE = "Module chưa có file audio.";
	private static final String DEFAULT_AUDIO_MIME_TYPE = "audio/mpeg";
	private static final BigDecimal DEFAULT_MAX_SCORE = BigDecimal.TEN;
	/**
	 * Allowed listening-audio mime types mapped to their storage extension.
	 * The extension of the generated storage key is derived from the declared
	 * mime type because the backend never receives the file bytes: clients
	 * upload directly to the object store through a presigned URL.
	 */
	private static final Map<String, String> AUDIO_EXTENSION_BY_MIME_TYPE = Map.of(
			"audio/mpeg", "mp3",
			"audio/mp3", "mp3",
			"audio/wav", "wav",
			"audio/x-wav", "wav",
			"audio/wave", "wav",
			"audio/mp4", "m4a",
			"audio/m4a", "m4a",
			"audio/x-m4a", "m4a");

	private final ModuleRepository moduleRepository;
	private final AssignmentRepository assignmentRepository;
	private final ClassRepository classRepository;
	private final ClassMemberRepository classMemberRepository;
	private final CurrentUserProvider currentUserProvider;
	private final StorageService storageService;

	public ModuleService(
			ModuleRepository moduleRepository,
			AssignmentRepository assignmentRepository,
			ClassRepository classRepository,
			ClassMemberRepository classMemberRepository,
			CurrentUserProvider currentUserProvider,
			StorageService storageService) {
		this.moduleRepository = moduleRepository;
		this.assignmentRepository = assignmentRepository;
		this.classRepository = classRepository;
		this.classMemberRepository = classMemberRepository;
		this.currentUserProvider = currentUserProvider;
		this.storageService = storageService;
	}

	@Transactional(readOnly = true)
	public List<Module> listModules(long assignmentId) {
		User caller = currentUserProvider.requireActiveUser();
		Assignment assignment = requireAssignment(assignmentId);
		requireReadAccess(assignment, caller);
		return moduleRepository.findByAssignmentIdOrderByOrderIndexAsc(assignmentId);
	}

	@Transactional
	public long createModule(long assignmentId, CreateModuleCommand command) {
		User caller = requireTeacher();
		Assignment assignment = requireAssignment(assignmentId);
		requireTeacherOwnsAssignment(assignment, caller);
		validateCreateCommand(command);
		lockAssignment(assignmentId);
		if (moduleRepository.existsByAssignmentIdAndOrderIndex(assignmentId, command.orderIndex())) {
			throw ApiException.badRequest(ORDER_CONFLICT_CREATE_MESSAGE);
		}

		BigDecimal maxScore = command.maxScore() == null ? DEFAULT_MAX_SCORE : command.maxScore();
		Module module = new Module(
				null,
				assignmentId,
				command.skill(),
				command.taskType(),
				command.orderIndex(),
				command.instructions(),
				maxScore,
				null,
				null,
				null,
				null,
				command.aiInstruction());
		return moduleRepository.save(module).id();
	}

	@Transactional(readOnly = true)
	public Module getModule(long moduleId) {
		User caller = currentUserProvider.requireActiveUser();
		Module module = requireModule(moduleId);
		Assignment assignment = requireAssignment(module.assignmentId());
		requireReadAccess(assignment, caller);
		return module;
	}

	@Transactional
	public void updateModule(long moduleId, UpdateModuleCommand command) {
		User caller = requireTeacher();
		Module module = requireModule(moduleId);
		Assignment assignment = requireAssignment(module.assignmentId());
		requireTeacherOwnsAssignment(assignment, caller);
		if (command == null || hasNoUpdateFields(command)) {
			throw ApiException.badRequest(INVALID_MODULE_DATA_MESSAGE);
		}

		int orderIndex = command.orderIndex() == null ? module.orderIndex() : command.orderIndex();
		lockAssignment(module.assignmentId());
		if (moduleRepository.existsByAssignmentIdAndOrderIndexAndIdNot(
				module.assignmentId(), orderIndex, module.id())) {
			throw ApiException.badRequest(ORDER_CONFLICT_UPDATE_MESSAGE);
		}

		BigDecimal maxScore = command.maxScore() == null ? module.maxScore() : command.maxScore();
		if (maxScore == null || maxScore.compareTo(BigDecimal.ZERO) <= 0 || orderIndex <= 0) {
			throw ApiException.badRequest(INVALID_MODULE_DATA_MESSAGE);
		}
		Module updated = module.withDetails(
				command.instructions() == null ? module.instructions() : command.instructions(),
				command.aiInstruction() == null ? module.aiInstruction() : command.aiInstruction(),
				maxScore,
				orderIndex);
		moduleRepository.save(updated);
	}

	@Transactional
	public void deleteModule(long moduleId) {
		User caller = requireTeacher();
		Module module = requireModule(moduleId);
		Assignment assignment = requireAssignment(module.assignmentId());
		requireTeacherOwnsAssignment(assignment, caller);
		if (moduleRepository.existsSubmissionReference(moduleId)) {
			throw ApiException.badRequest(SUBMISSION_REFERENCE_MESSAGE);
		}
		moduleRepository.deleteById(moduleId);
		deleteStoredAudioAfterCommit(module.sourceAudioStorageKey());
	}

	/**
	 * Step 1 of the presigned listening-audio upload (mirrors the submission
	 * module upload flow): generates a presigned PUT URL so the client uploads
	 * the file directly to object storage, then persists the pending metadata
	 * with status {@code UPLOADING}. A previous audio object is deleted once
	 * the transaction commits. Call
	 * {@link #confirmAudioUpload(long, String)} after the direct PUT finishes.
	 */
	@Transactional
	public AudioUploadUrlResult requestAudioUpload(long moduleId, String mimeType) {
		User caller = requireTeacher();
		Module module = requireModule(moduleId);
		Assignment assignment = requireAssignment(module.assignmentId());
		requireTeacherOwnsAssignment(assignment, caller);
		if (module.skill() != ModuleSkill.LISTENING) {
			throw ApiException.badRequest(AUDIO_NOT_SUPPORTED_MESSAGE);
		}
		String normalizedMimeType = mimeType == null ? "" : mimeType.toLowerCase(Locale.ROOT);
		String extension = AUDIO_EXTENSION_BY_MIME_TYPE.get(normalizedMimeType);
		if (extension == null) {
			throw ApiException.badRequest(UNSUPPORTED_AUDIO_MIME_MESSAGE);
		}
		String previousStorageKey = module.sourceAudioStorageKey();
		String storageKey = "modules/" + moduleId + "/audio/" + UUID.randomUUID() + "." + extension;
		PresignedUpload presigned = storageService.generatePresignedPutUrl(storageKey, normalizedMimeType);
		Module updated = module.withAudio(
				storageKey,
				null,
				normalizedMimeType,
				ModuleUploadStatus.UPLOADING);
		moduleRepository.save(updated);
		deleteStoredAudioAfterCommit(previousStorageKey);
		return new AudioUploadUrlResult(
				presigned.uploadUrl(),
				storageKey,
				presigned.expiresAt(),
				ModuleUploadStatus.UPLOADING.name());
	}

	/**
	 * Step 2 of the presigned upload: probes object storage for the file the
	 * client was asked to PUT and flips the status to {@code READY}, or to
	 * {@code FAILED} when nothing was uploaded. Returns the resulting status
	 * in the response body instead of failing with 4xx/5xx so the FAILED
	 * status is committed by the same transaction.
	 */
	@Transactional
	public AudioUploadConfirmResult confirmAudioUpload(long moduleId, String storageKey) {
		User caller = requireTeacher();
		Module module = requireModule(moduleId);
		Assignment assignment = requireAssignment(module.assignmentId());
		requireTeacherOwnsAssignment(assignment, caller);
		if (storageKey == null || storageKey.isBlank() || !storageKey.equals(module.sourceAudioStorageKey())) {
			throw ApiException.badRequest(AUDIO_CONFIRM_MISMATCH_MESSAGE);
		}
		ModuleUploadStatus status = storageService.objectExists(storageKey)
				? ModuleUploadStatus.READY
				: ModuleUploadStatus.FAILED;
		moduleRepository.save(module.withAudio(
				module.sourceAudioStorageKey(),
				module.sourceAudioDurationSeconds(),
				module.sourceAudioMimeType(),
				status));
		return new AudioUploadConfirmResult(storageKey, status.name());
	}

	/**
	 * Streams the listening-audio bytes of a module. Read access mirrors
	 * {@link #getModule(long)}: the owning teacher and class-member students
	 * only.
	 */
	@Transactional(readOnly = true)
	public ModuleAudioResult getModuleAudio(long moduleId) {
		User caller = currentUserProvider.requireActiveUser();
		Module module = requireModule(moduleId);
		Assignment assignment = requireAssignment(module.assignmentId());
		requireReadAccess(assignment, caller);
		String storageKey = module.sourceAudioStorageKey();
		if (storageKey == null || storageKey.isBlank()) {
			throw ApiException.notFound(AUDIO_NOT_AVAILABLE_MESSAGE);
		}
		byte[] bytes = storageService.getObjectBytes(storageKey);
		if (bytes == null || bytes.length == 0) {
			throw ApiException.notFound(AUDIO_NOT_AVAILABLE_MESSAGE);
		}
		String mimeType = module.sourceAudioMimeType() == null
				? DEFAULT_AUDIO_MIME_TYPE
				: module.sourceAudioMimeType();
		return new ModuleAudioResult(bytes, mimeType);
	}

	/**
	 * Best-effort deletion of a stored audio object after the current
	 * transaction commits, so a rolled-back save never leaves the database
	 * pointing at an already-deleted file. Outside a transaction (unit tests)
	 * the deletion runs synchronously.
	 */
	private void deleteStoredAudioAfterCommit(String storageKey) {
		if (storageKey == null || storageKey.isBlank()) {
			return;
		}
		if (!TransactionSynchronizationManager.isSynchronizationActive()) {
			deleteStoredAudio(storageKey);
			return;
		}
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				deleteStoredAudio(storageKey);
			}
		});
	}

	private void deleteStoredAudio(String storageKey) {
		try {
			storageService.deleteObject(storageKey);
		} catch (RuntimeException exception) {
			LOGGER.error("Không thể xoá file audio khỏi kho lưu trữ: {}", storageKey, exception);
		}
	}

	private User requireTeacher() {
		User caller = currentUserProvider.requireActiveUser();
		if (caller.role() != UserRole.TEACHER) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		return caller;
	}

	private void requireReadAccess(Assignment assignment, User caller) {
		if (caller.role() == UserRole.ADMIN) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		EnglishClass englishClass = requireClass(assignment.classId());
		if (caller.role() == UserRole.TEACHER
				&& Objects.equals(englishClass.getTeacherId(), caller.id())) {
			return;
		}
		if (caller.role() == UserRole.STUDENT
				&& classMemberRepository.existsByClassIdAndStudentId(assignment.classId(), caller.id())) {
			return;
		}
		throw ApiException.forbidden(FORBIDDEN_MESSAGE);
	}

	private void requireTeacherOwnsAssignment(Assignment assignment, User caller) {
		EnglishClass englishClass = requireClass(assignment.classId());
		if (!Objects.equals(englishClass.getTeacherId(), caller.id())) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
	}

	private Assignment requireAssignment(long assignmentId) {
		return assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> ApiException.notFound(ASSIGNMENT_NOT_FOUND_MESSAGE));
	}

	private void lockAssignment(long assignmentId) {
		try {
			assignmentRepository.findByIdForUpdate(assignmentId)
					.orElseThrow(() -> ApiException.notFound(ASSIGNMENT_NOT_FOUND_MESSAGE));
		} catch (PessimisticLockingFailureException exception) {
			throw ApiException.conflict(LOCK_TIMEOUT_MESSAGE);
		}
	}

	private Module requireModule(long moduleId) {
		return moduleRepository.findById(moduleId)
				.orElseThrow(() -> ApiException.notFound(MODULE_NOT_FOUND_MESSAGE));
	}

	private EnglishClass requireClass(long classId) {
		return classRepository.findById(classId)
				.orElseThrow(() -> ApiException.notFound(CLASS_NOT_FOUND_MESSAGE));
	}

	private void validateCreateCommand(CreateModuleCommand command) {
		if (command == null
				|| command.skill() == null
				|| command.taskType() == null
				|| command.orderIndex() <= 0) {
			throw ApiException.badRequest(INVALID_MODULE_DATA_MESSAGE);
		}
		if (!isSupportedPair(command.skill(), command.taskType())) {
			throw ApiException.badRequest(INVALID_PAIR_MESSAGE);
		}
		if (command.maxScore() != null && command.maxScore().compareTo(BigDecimal.ZERO) <= 0) {
			throw ApiException.badRequest(INVALID_MODULE_DATA_MESSAGE);
		}
	}

	/**
	 * Whitelist of supported skill and task-type pairs. Reading also supports REWRITE, which is
	 * answered through the same question payloads as QUIZ and is therefore auto-graded the same way.
	 */
	private boolean isSupportedPair(ModuleSkill skill, ModuleTaskType taskType) {
		return (skill == ModuleSkill.READING && taskType == ModuleTaskType.QUIZ)
				|| (skill == ModuleSkill.READING && taskType == ModuleTaskType.REWRITE)
				|| (skill == ModuleSkill.LISTENING && taskType == ModuleTaskType.QUIZ)
				|| (skill == ModuleSkill.WRITING && taskType == ModuleTaskType.ESSAY)
				|| (skill == ModuleSkill.SPEAKING && taskType == ModuleTaskType.RECORDING);
	}

	private boolean hasNoUpdateFields(UpdateModuleCommand command) {
		return command.instructions() == null
				&& command.aiInstruction() == null
				&& command.maxScore() == null
				&& command.orderIndex() == null;
	}

	public record AudioUploadUrlResult(
			String uploadUrl,
			String storageKey,
			OffsetDateTime expiresAt,
			String uploadStatus) {
	}

	public record AudioUploadConfirmResult(String storageKey, String uploadStatus) {
	}

	public record ModuleAudioResult(byte[] bytes, String mimeType) {
	}
}
