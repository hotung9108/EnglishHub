package com.english_hub.core.modules.grading.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.grading.application.dto.GradingChangeLogItem;
import com.english_hub.core.modules.grading.domain.model.AnnotationSource;
import com.english_hub.core.modules.grading.domain.model.AnswerAnnotation;
import com.english_hub.core.modules.grading.domain.model.Grading;
import com.english_hub.core.modules.grading.domain.model.GradingChangeLog;
import com.english_hub.core.modules.grading.domain.model.GradingContext;
import com.english_hub.core.modules.grading.domain.model.GradingFilter;
import com.english_hub.core.modules.grading.domain.model.GradingPage;
import com.english_hub.core.modules.grading.domain.model.GradingStatus;
import com.english_hub.core.modules.grading.domain.model.ReviewStatus;
import com.english_hub.core.modules.grading.application.port.AiAnalysisInFlightRegistry;
import com.english_hub.core.modules.grading.domain.repository.AnswerAnnotationRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingChangeLogRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingContextRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingRepository;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import com.english_hub.core.modules.user.domain.repository.UserRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import com.english_hub.core.infrastructure.persistence.entity.Answer;
import com.english_hub.core.modules.grading.presentation.rest.dto.AiGradingSuggestionResponse;
import com.english_hub.core.modules.grading.presentation.rest.dto.AnswerAnnotationResponse;
import com.english_hub.core.modules.submission.infrastructure.persistence.repository.SpringDataAnswerRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.dao.PessimisticLockingFailureException;
import jakarta.persistence.LockTimeoutException;
import jakarta.persistence.PessimisticLockException;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class GradingService {

	private static final Logger LOGGER = org.slf4j.LoggerFactory.getLogger(GradingService.class);
	private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

	private static final String FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";
	private static final String GRADING_NOT_FOUND_MESSAGE = "Không tìm thấy bản chấm điểm.";
	private static final String SUBMISSION_MODULE_NOT_FOUND_MESSAGE = "Không tìm thấy phần làm bài.";
	private static final String ANSWER_NOT_FOUND_MESSAGE = "Không tìm thấy câu trả lời.";
	private static final String ANNOTATION_NOT_FOUND_MESSAGE = "Không tìm thấy chú thích.";
	private static final String INVALID_SCORE_MESSAGE = "Điểm số không hợp lệ so với thang điểm tối đa.";
	private static final String INVALID_ANNOTATION_RANGE_MESSAGE =
			"Vị trí kết thúc phải lớn hơn hoặc bằng vị trí bắt đầu.";
	private static final String INVALID_ANNOTATION_REVIEW_MESSAGE = "Không thể duyệt chú thích này.";
	private static final String INVALID_AI_ANALYSIS_MESSAGE = "Không thể phân tích AI cho module này.";
	private static final String AI_ANALYSIS_LOCK_TIMEOUT_MESSAGE =
			"Không thể khóa bản chấm để cập nhật. Vui lòng thử lại.";

	private final GradingRepository gradingRepository;
	private final AnswerAnnotationRepository answerAnnotationRepository;
	private final GradingChangeLogRepository gradingChangeLogRepository;
	private final GradingContextRepository gradingContextRepository;
	private final ClassRepository classRepository;
	private final CurrentUserProvider currentUserProvider;
	private final UserRepository userRepository;
	private final GradingAiAnalysisService gradingAiAnalysisService;
	private final GradingAiResultPersistenceService gradingAiResultPersistenceService;
	private final AiAnalysisInFlightRegistry aiAnalysisInFlightRegistry;
	private final SpringDataAnswerRepository answerRepository;

	@Autowired
	public GradingService(
			GradingRepository gradingRepository,
			AnswerAnnotationRepository answerAnnotationRepository,
			GradingChangeLogRepository gradingChangeLogRepository,
			GradingContextRepository gradingContextRepository,
			ClassRepository classRepository,
			CurrentUserProvider currentUserProvider,
			UserRepository userRepository,
			GradingAiAnalysisService gradingAiAnalysisService,
			GradingAiResultPersistenceService gradingAiResultPersistenceService,
			AiAnalysisInFlightRegistry aiAnalysisInFlightRegistry,
			@Autowired(required = false) SpringDataAnswerRepository answerRepository) {
		this.gradingRepository = gradingRepository;
		this.answerAnnotationRepository = answerAnnotationRepository;
		this.gradingChangeLogRepository = gradingChangeLogRepository;
		this.gradingContextRepository = gradingContextRepository;
		this.classRepository = classRepository;
		this.currentUserProvider = currentUserProvider;
		this.userRepository = userRepository;
		this.gradingAiAnalysisService = gradingAiAnalysisService;
		this.gradingAiResultPersistenceService = gradingAiResultPersistenceService;
		this.aiAnalysisInFlightRegistry = aiAnalysisInFlightRegistry;
		this.answerRepository = answerRepository;
	}

	public GradingService(
			GradingRepository gradingRepository,
			AnswerAnnotationRepository answerAnnotationRepository,
			GradingChangeLogRepository gradingChangeLogRepository,
			GradingContextRepository gradingContextRepository,
			ClassRepository classRepository,
			CurrentUserProvider currentUserProvider,
			UserRepository userRepository,
			GradingAiAnalysisService gradingAiAnalysisService,
			GradingAiResultPersistenceService gradingAiResultPersistenceService,
			AiAnalysisInFlightRegistry aiAnalysisInFlightRegistry) {
		this(
				gradingRepository,
				answerAnnotationRepository,
				gradingChangeLogRepository,
				gradingContextRepository,
				classRepository,
				currentUserProvider,
				userRepository,
				gradingAiAnalysisService,
				gradingAiResultPersistenceService,
				aiAnalysisInFlightRegistry,
				null);
	}

	public Grading getBySubmissionModuleId(long submissionModuleId) {
		User caller = currentUserProvider.requireActiveUser();
		GradingContext context = requireSubmissionModuleContext(submissionModuleId);
		requireSubmissionReadAccess(context, caller);
		return gradingRepository.findBySubmissionModuleId(submissionModuleId)
				.orElseThrow(() -> ApiException.notFound(GRADING_NOT_FOUND_MESSAGE));
	}

	public AiGradingSuggestionResponse getAiSuggestion(long submissionModuleId) {
		User caller = currentUserProvider.requireActiveUser();
		GradingContext context = requireSubmissionModuleContext(submissionModuleId);
		requireSubmissionReadAccess(context, caller);

		if (context.moduleSkill() != ModuleSkill.SPEAKING && context.moduleSkill() != ModuleSkill.WRITING) {
			throw ApiException.badRequest("Gợi ý chấm AI chỉ hỗ trợ cho kỹ năng Nói (Speaking) và Viết (Writing).");
		}

		Grading grading = gradingRepository.findBySubmissionModuleId(submissionModuleId)
				.orElseThrow(() -> ApiException.notFound(GRADING_NOT_FOUND_MESSAGE));

		List<AnswerAnnotationResponse> annotations = List.of();
		if (answerRepository != null) {
			List<Answer> answers = answerRepository.findBySubmissionModuleId(submissionModuleId);
			if (!answers.isEmpty()) {
				annotations = answerAnnotationRepository.findByAnswerId(answers.getFirst().getId()).stream()
						.map(AnswerAnnotationResponse::from)
						.toList();
			}
		} else if (context.answerId() != null) {
			annotations = answerAnnotationRepository.findByAnswerId(context.answerId()).stream()
					.map(AnswerAnnotationResponse::from)
					.toList();
		}

		JsonNode transcriptNode = null;
		JsonNode criteriaScoresNode = null;
		JsonNode metricsNode = null;
		String modelUsed = null;
		String providerUsed = null;

		if (grading.aiTranscript() != null) {
			JsonNode parsedNode = null;
			if (grading.aiTranscript() instanceof JsonNode jn) {
				parsedNode = jn;
			} else {
				try {
					parsedNode = OBJECT_MAPPER.readTree(grading.aiTranscript().toString());
				} catch (Exception e) {
					LOGGER.warn(
							"Failed to parse AI transcript JSON for grading {}: {}",
							grading.id(),
							e.getClass().getSimpleName());
				}
			}

			if (parsedNode != null) {
				if (parsedNode.isArray()) {
					transcriptNode = parsedNode;
				} else if (parsedNode.isObject()) {
					if (parsedNode.hasNonNull("transcript")) {
						transcriptNode = parsedNode.get("transcript");
					}
					if (parsedNode.hasNonNull("criteriaScores")) {
						criteriaScoresNode = parsedNode.get("criteriaScores");
					}
					if (parsedNode.hasNonNull("fluencyMetrics")) {
						metricsNode = parsedNode.get("fluencyMetrics");
					} else if (parsedNode.hasNonNull("textMetrics")) {
						metricsNode = parsedNode.get("textMetrics");
					} else if (parsedNode.hasNonNull("metrics")) {
						metricsNode = parsedNode.get("metrics");
					}
					if (parsedNode.hasNonNull("modelUsed")) {
						modelUsed = parsedNode.get("modelUsed").asText();
					}
					if (parsedNode.hasNonNull("providerUsed")) {
						providerUsed = parsedNode.get("providerUsed").asText();
					}
				}
			}
		}

		boolean canTriggerAi = grading.status() == GradingStatus.PENDING || grading.status() == GradingStatus.FAILED;
		boolean fallbackManualGradingAvailable = true;
		String fallbackMessage = switch (grading.status()) {
			case FAILED -> "AI phân tích gặp lỗi hoặc quá thời gian chờ (timeout). Giáo viên có thể thử lại bằng nút 'Phân tích lại' hoặc thực hiện chấm thủ công theo cơ chế dự phòng PP R6 (gọi PUT /api/v1/gradings/" + grading.id() + ").";
			case PENDING -> "AI đang xử lý hoặc chưa được phân tích. Giáo viên có thể chờ AI hoàn tất hoặc chủ động chấm thủ công ngay lập tức theo PP R6.";
			case AI_GRADED -> "AI đã hoàn tất gợi ý chấm điểm. Giáo viên có thể duyệt gợi ý hoặc chỉnh sửa lại điểm số và nhận xét trước khi lưu chính thức.";
			case COMPLETED -> "Bài làm đã được chấm điểm hoàn tất. Giáo viên vẫn có thể cập nhật lại điểm nếu cần thiết.";
			default -> "Giáo viên có thể chấm điểm và nhận xét thủ công qua API [BE-19].";
		};

		BigDecimal suggestedScore = null;
		if (criteriaScoresNode != null && criteriaScoresNode.hasNonNull("overallScore")) {
			try {
				suggestedScore = new BigDecimal(criteriaScoresNode.get("overallScore").asText());
			} catch (Exception ignored) {
				suggestedScore = BigDecimal.valueOf(criteriaScoresNode.get("overallScore").asDouble());
			}
		}

		return new AiGradingSuggestionResponse(
				submissionModuleId,
				grading.id(),
				context.moduleSkill().name(),
				grading.status().name(),
				suggestedScore,
				grading.maxScoreSnapshot(),
				grading.aiFeedback(),
				criteriaScoresNode,
				metricsNode,
				annotations,
				transcriptNode,
				modelUsed,
				providerUsed,
				canTriggerAi,
				fallbackManualGradingAvailable,
				fallbackMessage
		);
	}

	@Transactional
	public void requestAiAnalysis(long submissionModuleId) {
		User teacher = requireTeacher();
		GradingContext context = requireSubmissionModuleContext(submissionModuleId);
		requireTeacherOwnsContext(context, teacher);
		Grading grading = requireGradingForUpdate(submissionModuleId);
		if (!context.submitted()
				|| (context.moduleSkill() != ModuleSkill.WRITING && context.moduleSkill() != ModuleSkill.SPEAKING)
				|| (grading.status() != GradingStatus.PENDING && grading.status() != GradingStatus.FAILED)) {
			throw ApiException.badRequest(INVALID_AI_ANALYSIS_MESSAGE);
		}
		if (!aiAnalysisInFlightRegistry.tryClaim(submissionModuleId)) {
			throw ApiException.badRequest(INVALID_AI_ANALYSIS_MESSAGE);
		}
		try {
			registerAiWorkerAfterCommit(submissionModuleId);
			if (grading.status() == GradingStatus.FAILED) {
				gradingRepository.updateStatus(grading.id(), GradingStatus.PENDING);
			}
		} catch (RuntimeException exception) {
			aiAnalysisInFlightRegistry.release(submissionModuleId);
			throw exception;
		}
	}

	@Transactional
	public void updateFinalGrade(long gradingId, BigDecimal finalScore, String finalFeedback, String note) {
		User teacher = requireTeacher();
		GradingContext context = requireGradingContext(gradingId);
		requireTeacherOwnsContext(context, teacher);
		Grading current = requireGradingForUpdate(context.submissionModuleId());
		if (!Objects.equals(current.id(), gradingId)) {
			throw ApiException.notFound(GRADING_NOT_FOUND_MESSAGE);
		}
		if (!isValidScore(finalScore, current.maxScoreSnapshot())) {
			throw ApiException.badRequest(INVALID_SCORE_MESSAGE);
		}

		OffsetDateTime changedAt = OffsetDateTime.now(ZoneOffset.UTC);
		boolean scoreChanged = !sameScore(current.finalScore(), finalScore);
		Grading updated = current.withTeacherGrade(finalScore, finalFeedback, teacher.id(), changedAt);
		gradingRepository.saveTeacherGrade(updated);
		if (scoreChanged) {
			gradingChangeLogRepository.save(new GradingChangeLog(
					null,
						gradingId,
						teacher.id(),
						current.finalScore(),
						finalScore,
						note,
						changedAt));
		}
	}

	private void registerAiWorkerAfterCommit(long submissionModuleId) {
		if (!TransactionSynchronizationManager.isSynchronizationActive()) {
			throw new IllegalStateException("AI analysis requests require an active transaction synchronization.");
		}
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				try {
					gradingAiAnalysisService.analyzeSubmittedModule(submissionModuleId);
				} catch (RuntimeException exception) {
					aiAnalysisInFlightRegistry.release(submissionModuleId);
					LOGGER.warn(
							"AI analysis worker could not be scheduled for submission module {}: {}",
							submissionModuleId,
							exception.getClass().getSimpleName());
					try {
						gradingAiResultPersistenceService.markFailedIfStillPending(submissionModuleId);
					} catch (RuntimeException failure) {
						LOGGER.error(
								"Could not mark rejected AI analysis as failed for submission module {}: {}",
								submissionModuleId,
								failure.getClass().getSimpleName());
					}
				}
			}

			@Override
			public void afterCompletion(int status) {
				if (status != STATUS_COMMITTED) {
					aiAnalysisInFlightRegistry.release(submissionModuleId);
				}
			}
		});
	}

	public Grading getById(long gradingId) {
		User caller = currentUserProvider.requireActiveUser();
		Grading grading = requireGrading(gradingId);
		GradingContext context = requireGradingContext(gradingId);
		requireSubmissionReadAccess(context, caller);
		return grading;
	}

	public GradingPage listGradings(Long classId, Long studentId, String statusValue, int page, int limit) {
		User caller = currentUserProvider.requireActiveUser();
		if (caller.role() != UserRole.TEACHER && caller.role() != UserRole.ADMIN) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		validatePage(classId, studentId, page, limit);
		if (caller.role() == UserRole.TEACHER && classId != null) {
			requireTeacherOwnsClass(classId, caller);
		}
		GradingStatus status = parseStatus(statusValue);
		Long teacherId = caller.role() == UserRole.TEACHER ? caller.id() : null;
		return gradingRepository.findPage(new GradingFilter(classId, studentId, status, teacherId), page, limit);
	}

	public List<AnswerAnnotation> listAnnotations(long answerId) {
		User caller = currentUserProvider.requireActiveUser();
		GradingContext context = requireAnswerContext(answerId);
		requireSubmissionReadAccess(context, caller);
		return answerAnnotationRepository.findByAnswerId(answerId);
	}

	@Transactional
	public Long createTeacherAnnotation(
			long answerId,
			Integer startOffset,
			Integer endOffset,
			String errorType,
			String comment,
			String suggestedFix) {
		User teacher = requireTeacher();
		GradingContext context = requireAnswerContext(answerId);
		requireTeacherOwnsContext(context, teacher);
		if (startOffset == null || endOffset == null) {
			throw ApiException.badRequest(INVALID_ANNOTATION_RANGE_MESSAGE);
		}
		AnswerAnnotation annotation;
		try {
			annotation = AnswerAnnotation.teacher(
					answerId,
					startOffset,
					endOffset,
					context.answerContentLength(),
					errorType,
					comment,
					suggestedFix);
		} catch (IllegalArgumentException exception) {
			throw ApiException.badRequest(INVALID_ANNOTATION_RANGE_MESSAGE);
		}
		AnswerAnnotation saved = answerAnnotationRepository.save(annotation);
		return saved.id();
	}

	@Transactional
	public void reviewAnnotation(long annotationId, String reviewStatusValue) {
		User teacher = requireTeacher();
		AnswerAnnotation annotation = requireAnnotation(annotationId);
		GradingContext context = requireAnswerContext(annotation.answerId());
		requireTeacherOwnsContext(context, teacher);
		ReviewStatus reviewStatus = parseReviewStatus(reviewStatusValue);
		if (annotation.source() != AnnotationSource.AI || reviewStatus == ReviewStatus.PENDING) {
			throw ApiException.badRequest(INVALID_ANNOTATION_REVIEW_MESSAGE);
		}
		answerAnnotationRepository.save(annotation.withReviewStatus(reviewStatus));
	}

	@Transactional
	public void deleteAnnotation(long annotationId) {
		User teacher = requireTeacher();
		AnswerAnnotation annotation = requireAnnotation(annotationId);
		GradingContext context = requireAnswerContext(annotation.answerId());
		requireTeacherOwnsContext(context, teacher);
		answerAnnotationRepository.deleteById(annotationId);
	}

	public List<GradingChangeLogItem> listChangeLogs(long gradingId) {
		User caller = currentUserProvider.requireActiveUser();
		if (caller.role() != UserRole.TEACHER && caller.role() != UserRole.ADMIN) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		requireGrading(gradingId);
		GradingContext context = requireGradingContext(gradingId);
		if (caller.role() == UserRole.TEACHER) {
			requireTeacherOwnsContext(context, caller);
		}
		return gradingChangeLogRepository.findByGradingIdNewestFirst(gradingId).stream()
				.map(changeLog -> new GradingChangeLogItem(
						userRepository.findById(changeLog.changedBy())
								.map(User::fullName)
								.orElse(changeLog.changedBy().toString()),
						changeLog.oldScore(),
						changeLog.newScore(),
						changeLog.note(),
						changeLog.changedAt()))
				.toList();
	}

	private User requireTeacher() {
		User caller = currentUserProvider.requireActiveUser();
		if (caller.role() != UserRole.TEACHER) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		return caller;
	}

	private void requireTeacherOwnsContext(GradingContext context, User teacher) {
		if (!Objects.equals(context.teacherId(), teacher.id())) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
	}

	private void requireTeacherOwnsClass(long classId, User teacher) {
		EnglishClass englishClass = classRepository.findById(classId)
				.orElseThrow(() -> ApiException.notFound("Không tìm thấy lớp học."));
		if (!Objects.equals(englishClass.getTeacherId(), teacher.id())) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
	}

	private void requireSubmissionReadAccess(GradingContext context, User caller) {
		if (caller.role() == UserRole.TEACHER) {
			requireTeacherOwnsContext(context, caller);
			return;
		}
		if (caller.role() == UserRole.STUDENT && Objects.equals(context.studentId(), caller.id())) {
			return;
		}
		throw ApiException.forbidden(FORBIDDEN_MESSAGE);
	}

	private GradingContext requireSubmissionModuleContext(long submissionModuleId) {
		return gradingContextRepository.findBySubmissionModuleId(submissionModuleId)
				.orElseThrow(() -> ApiException.notFound(SUBMISSION_MODULE_NOT_FOUND_MESSAGE));
	}

	private GradingContext requireGradingContext(long gradingId) {
		return gradingContextRepository.findByGradingId(gradingId)
				.orElseThrow(() -> ApiException.notFound(GRADING_NOT_FOUND_MESSAGE));
	}

	private GradingContext requireAnswerContext(long answerId) {
		return gradingContextRepository.findByAnswerId(answerId)
				.orElseThrow(() -> ApiException.notFound(ANSWER_NOT_FOUND_MESSAGE));
	}

	private Grading requireGrading(long gradingId) {
		return gradingRepository.findById(gradingId)
				.orElseThrow(() -> ApiException.notFound(GRADING_NOT_FOUND_MESSAGE));
	}

	private Grading requireGradingForUpdate(long submissionModuleId) {
		try {
			return gradingRepository.findBySubmissionModuleIdForUpdate(submissionModuleId)
					.orElseThrow(() -> ApiException.notFound(GRADING_NOT_FOUND_MESSAGE));
		} catch (PessimisticLockingFailureException | LockTimeoutException | PessimisticLockException exception) {
			throw ApiException.badRequest(AI_ANALYSIS_LOCK_TIMEOUT_MESSAGE);
		}
	}

	private AnswerAnnotation requireAnnotation(long annotationId) {
		return answerAnnotationRepository.findById(annotationId)
				.orElseThrow(() -> ApiException.notFound(ANNOTATION_NOT_FOUND_MESSAGE));
	}

	private boolean isValidScore(BigDecimal score, BigDecimal maxScore) {
		return score != null
				&& maxScore != null
				&& score.compareTo(BigDecimal.ZERO) >= 0
				&& score.compareTo(maxScore) <= 0;
	}

	private boolean sameScore(BigDecimal first, BigDecimal second) {
		return first == null ? second == null : second != null && first.compareTo(second) == 0;
	}

	private void validatePage(Long classId, Long studentId, int page, int limit) {
		if ((classId != null && classId <= 0)
				|| (studentId != null && studentId <= 0)
				|| page < 1
				|| limit < 1
				|| limit > 100) {
			throw ApiException.badRequest("Thông số phân trang hoặc bộ lọc không hợp lệ.");
		}
	}

	private GradingStatus parseStatus(String statusValue) {
		if (statusValue == null || statusValue.isBlank()) {
			return null;
		}
		try {
			return GradingStatus.valueOf(statusValue.trim().toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException exception) {
			throw ApiException.badRequest("Trạng thái không hợp lệ.");
		}
	}

	private ReviewStatus parseReviewStatus(String reviewStatusValue) {
		try {
			return ReviewStatus.valueOf(reviewStatusValue.trim().toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException | NullPointerException exception) {
			throw ApiException.badRequest(INVALID_ANNOTATION_REVIEW_MESSAGE);
		}
	}
}
