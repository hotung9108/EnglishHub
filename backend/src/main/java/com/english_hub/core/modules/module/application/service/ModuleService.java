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
import com.english_hub.core.modules.module.application.port.AudioStoragePort;
import com.english_hub.core.modules.module.domain.model.Module;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.module.domain.model.ModuleTaskType;
import com.english_hub.core.modules.module.domain.model.ModuleUploadStatus;
import com.english_hub.core.modules.module.domain.repository.ModuleRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ModuleService {

	private static final String MODULE_NOT_FOUND_MESSAGE = "Không tìm thấy module.";
	private static final String ASSIGNMENT_NOT_FOUND_MESSAGE = "Không tìm thấy bài tập.";
	private static final String CLASS_NOT_FOUND_MESSAGE = "Không tìm thấy lớp học.";
	private static final String FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";
	private static final String ORDER_CONFLICT_CREATE_MESSAGE = "orderIndex đã được sử dụng trong bài tập này.";
	private static final String ORDER_CONFLICT_UPDATE_MESSAGE = "orderIndex đã được sử dụng.";
	private static final String INVALID_MODULE_DATA_MESSAGE = "Dữ liệu module không hợp lệ.";
	private static final String INVALID_PAIR_MESSAGE = "Skill và taskType không hợp lệ.";
	private static final String SUBMISSION_REFERENCE_MESSAGE = "Không thể xoá module đã có bài nộp.";
	private static final String AUDIO_NOT_SUPPORTED_MESSAGE = "Module này không hỗ trợ upload audio.";
	private static final String INVALID_AUDIO_MESSAGE = "File audio không hợp lệ.";
	private static final long MAX_AUDIO_BYTES = 25L * 1024 * 1024;
	private static final BigDecimal DEFAULT_MAX_SCORE = BigDecimal.TEN;
	private static final Set<String> AUDIO_CONTENT_TYPES = Set.of(
			"audio/mpeg",
			"audio/mp3",
			"audio/wav",
			"audio/x-wav",
			"audio/wave",
			"audio/mp4",
			"audio/m4a",
			"audio/x-m4a",
			"video/mp4",
			"application/octet-stream");

	private final ModuleRepository moduleRepository;
	private final AssignmentRepository assignmentRepository;
	private final ClassRepository classRepository;
	private final ClassMemberRepository classMemberRepository;
	private final CurrentUserProvider currentUserProvider;
	private final AudioStoragePort audioStoragePort;

	public ModuleService(
			ModuleRepository moduleRepository,
			AssignmentRepository assignmentRepository,
			ClassRepository classRepository,
			ClassMemberRepository classMemberRepository,
			CurrentUserProvider currentUserProvider,
			AudioStoragePort audioStoragePort) {
		this.moduleRepository = moduleRepository;
		this.assignmentRepository = assignmentRepository;
		this.classRepository = classRepository;
		this.classMemberRepository = classMemberRepository;
		this.currentUserProvider = currentUserProvider;
		this.audioStoragePort = audioStoragePort;
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
	}

	@Transactional
	public AudioUploadResult uploadAudio(long moduleId, MultipartFile file) {
		User caller = requireTeacher();
		Module module = requireModule(moduleId);
		Assignment assignment = requireAssignment(module.assignmentId());
		requireTeacherOwnsAssignment(assignment, caller);
		if (module.skill() != ModuleSkill.LISTENING) {
			throw ApiException.badRequest(AUDIO_NOT_SUPPORTED_MESSAGE);
		}
		validateAudioFile(file);

		AudioStoragePort.StoredAudio storedAudio = audioStoragePort.store(moduleId, file);
		Module updated = module.withAudio(
				storedAudio.storageKey(),
				storedAudio.durationSeconds(),
				storedAudio.mimeType() == null ? file.getContentType() : storedAudio.mimeType(),
				ModuleUploadStatus.PROCESSING);
		try {
			moduleRepository.save(updated);
		} catch (RuntimeException exception) {
			audioStoragePort.delete(storedAudio.storageKey());
			throw exception;
		}
		return new AudioUploadResult(storedAudio.storageKey(), ModuleUploadStatus.PROCESSING.name());
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

	private boolean isSupportedPair(ModuleSkill skill, ModuleTaskType taskType) {
		return (skill == ModuleSkill.READING && taskType == ModuleTaskType.QUIZ)
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

	private void validateAudioFile(MultipartFile file) {
		if (file == null || file.isEmpty() || file.getSize() > MAX_AUDIO_BYTES) {
			throw ApiException.badRequest(INVALID_AUDIO_MESSAGE);
		}
		String extension = extensionOf(file.getOriginalFilename());
		if (extension == null) {
			throw ApiException.badRequest(INVALID_AUDIO_MESSAGE);
		}
		String contentType = file.getContentType();
		if (contentType != null && !AUDIO_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
			throw ApiException.badRequest(INVALID_AUDIO_MESSAGE);
		}
		try (InputStream input = file.getInputStream()) {
			byte[] header = input.readNBytes(12);
			if (!matchesAudioSignature(extension, header)) {
				throw ApiException.badRequest(INVALID_AUDIO_MESSAGE);
			}
		} catch (IOException exception) {
			throw ApiException.badRequest(INVALID_AUDIO_MESSAGE);
		}
	}

	private String extensionOf(String originalFilename) {
		if (originalFilename == null) {
			return null;
		}
		String normalized = originalFilename.toLowerCase(Locale.ROOT);
		int dotIndex = normalized.lastIndexOf('.');
		if (dotIndex < 0) {
			return null;
		}
		String extension = normalized.substring(dotIndex);
		return Set.of(".mp3", ".wav", ".m4a").contains(extension) ? extension : null;
	}

	private boolean matchesAudioSignature(String extension, byte[] header) {
		if (".wav".equals(extension)) {
			return header.length >= 12
					&& header[0] == 'R'
					&& header[1] == 'I'
					&& header[2] == 'F'
					&& header[3] == 'F'
					&& header[8] == 'W'
					&& header[9] == 'A'
					&& header[10] == 'V'
					&& header[11] == 'E';
		}
		if (".m4a".equals(extension)) {
			return header.length >= 8
					&& header[4] == 'f'
					&& header[5] == 't'
					&& header[6] == 'y'
					&& header[7] == 'p';
		}
		return header.length >= 3 && header[0] == 'I' && header[1] == 'D' && header[2] == '3'
				|| header.length >= 2
						&& (header[0] & 0xFF) == 0xFF
						&& (header[1] & 0xE0) == 0xE0;
	}

	public record AudioUploadResult(String storageKey, String uploadStatus) {
	}
}
