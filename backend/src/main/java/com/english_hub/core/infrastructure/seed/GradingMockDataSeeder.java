package com.english_hub.core.infrastructure.seed;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.function.Function;

import com.english_hub.core.infrastructure.persistence.entity.Answer;
import com.english_hub.core.infrastructure.persistence.repository.AnswerRepository;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.Question;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.QuestionRepository;
import com.english_hub.core.infrastructure.persistence.entity.EnglishClass;
import com.english_hub.core.infrastructure.persistence.repository.EnglishClassRepository;
import com.english_hub.core.infrastructure.persistence.entity.AnnotationSource;
import com.english_hub.core.infrastructure.persistence.entity.AnswerAnnotation;
import com.english_hub.core.infrastructure.persistence.entity.Grading;
import com.english_hub.core.infrastructure.persistence.entity.GradingMethod;
import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.infrastructure.persistence.entity.ReviewStatus;
import com.english_hub.core.infrastructure.persistence.repository.AnswerAnnotationRepository;
import com.english_hub.core.infrastructure.persistence.repository.GradingRepository;
import com.english_hub.core.infrastructure.persistence.entity.Submission;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionModule;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionRepository;
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

@Component
@Profile("seed")
@Order(6)
public class GradingMockDataSeeder implements CommandLineRunner {

	private static final Logger LOGGER = LoggerFactory.getLogger(GradingMockDataSeeder.class);
	private static final long RANDOM_SEED = 42L;

	private static final String[] WRITING_AI_FEEDBACK = {
			"Your response addresses the topic clearly. Review the highlighted grammar points before revising it.",
			"The main idea is understandable and the examples are relevant. A few word choices can be more precise.",
			"The response has a clear direction. Check sentence structure and linking words to improve its flow."
	};

	private static final String[] SPEAKING_AI_FEEDBACK = {
			"The response follows the prompt and contains understandable ideas. Review the pronunciation notes before recording again.",
			"The main message is clear. Practise the highlighted words and keep a steady speaking pace.",
			"The answer is relevant and easy to follow. More consistent pronunciation would make it stronger."
	};

	private static final String[] FINAL_FEEDBACK = {
			"The response is relevant and understandable. Adding one more supporting detail would make it stronger.",
			"Good effort and a clear main idea. Keep working on accuracy while maintaining this level of organisation.",
			"The task is completed. Review the marked corrections and practise the same language in a new context."
	};

	private static final String[] WRITING_ERROR_TYPES = { "grammar", "vocabulary" };
	private static final String[] SPEAKING_ERROR_TYPES = { "pronunciation", "fluency" };
	private static final String[] COMMENTS = {
			"This part is understandable, but the form can be improved.",
			"This word fits the meaning, but a more natural expression is available."
	};
	private static final String[] SUGGESTED_FIXES = {
			"Use the revised form in the next sentence.",
			"Try the suggested wording to make the sentence more natural."
	};

	private final EntityManager entityManager;
	private final SubmissionModuleRepository submissionModuleRepository;
	private final SubmissionRepository submissionRepository;
	private final AssignmentModuleRepository assignmentModuleRepository;
	private final AssignmentRepository assignmentRepository;
	private final QuestionRepository questionRepository;
	private final AnswerRepository answerRepository;
	private final EnglishClassRepository englishClassRepository;
	private final GradingRepository gradingRepository;
	private final AnswerAnnotationRepository answerAnnotationRepository;
	private final ObjectMapper objectMapper;

	public GradingMockDataSeeder(
			EntityManager entityManager,
			SubmissionModuleRepository submissionModuleRepository,
			SubmissionRepository submissionRepository,
			AssignmentModuleRepository assignmentModuleRepository,
			AssignmentRepository assignmentRepository,
			QuestionRepository questionRepository,
			AnswerRepository answerRepository,
			EnglishClassRepository englishClassRepository,
			GradingRepository gradingRepository,
			AnswerAnnotationRepository answerAnnotationRepository,
			ObjectMapper objectMapper) {
		this.entityManager = entityManager;
		this.submissionModuleRepository = submissionModuleRepository;
		this.submissionRepository = submissionRepository;
		this.assignmentModuleRepository = assignmentModuleRepository;
		this.assignmentRepository = assignmentRepository;
		this.questionRepository = questionRepository;
		this.answerRepository = answerRepository;
		this.englishClassRepository = englishClassRepository;
		this.gradingRepository = gradingRepository;
		this.answerAnnotationRepository = answerAnnotationRepository;
		this.objectMapper = objectMapper;
	}

	@Override
	@Transactional
	public void run(String... args) {
		List<SubmissionModule> submissionModules = submissionModuleRepository.findAll(
				Sort.by(Sort.Direction.ASC, "id"));
		List<Submission> submissions = submissionRepository.findAll(
				Sort.by(Sort.Direction.ASC, "id"));
		List<AssignmentModule> modules = assignmentModuleRepository.findAll(
				Sort.by(Sort.Direction.ASC, "id"));
		List<Assignment> assignments = assignmentRepository.findAll(
				Sort.by(Sort.Direction.ASC, "id"));
		List<Question> questions = questionRepository.findAll(
				Sort.by(Sort.Direction.ASC, "moduleId", "orderIndex"));
		List<Answer> answers = answerRepository.findAll(
				Sort.by(Sort.Direction.ASC, "id"));
		List<EnglishClass> classes = englishClassRepository.findAll(
				Sort.by(Sort.Direction.ASC, "id"));

		validateDependencies(submissionModules, submissions, modules, assignments, questions, answers, classes);
		Map<Long, Submission> submissionById = indexBy(submissions, Submission::getId);
		Map<Long, AssignmentModule> moduleById = indexBy(modules, AssignmentModule::getId);
		Map<Long, Assignment> assignmentById = indexBy(assignments, Assignment::getId);
		Map<Long, EnglishClass> classById = indexBy(classes, EnglishClass::getId);
		Map<Long, List<Question>> questionsByModuleId = groupBy(questions, Question::getModuleId);
		Map<Long, List<Answer>> answersBySubmissionModuleId = groupBy(answers, Answer::getSubmissionModuleId);

		truncateGradingTables();

		Random random = new Random(RANDOM_SEED);
		List<GradingSeedData> seedData = new ArrayList<>();
		for (SubmissionModule submissionModule : submissionModules) {
			if (submissionModule.getStatus() == SubmissionStatus.IN_PROGRESS) {
				continue;
			}

			AssignmentModule module = required(
					moduleById,
					submissionModule.getModuleId(),
					"module");
			Submission submission = required(
					submissionById,
					submissionModule.getSubmissionId(),
					"submission");
			Assignment assignment = required(module.getAssignmentId(), assignmentById, "assignment");
			EnglishClass englishClass = required(assignment.getClassId(), classById, "class");
			if (submission.getSubmittedAt() == null || englishClass.getTeacherId() == null) {
				throw new IllegalStateException(
						"Grading requires submitted_at and a class teacher for submission module "
								+ submissionModule.getId());
			}

			List<Answer> moduleAnswers = answersBySubmissionModuleId.getOrDefault(
					submissionModule.getId(),
					List.of());
			if (module.getSkill() == ModuleSkill.READING || module.getSkill() == ModuleSkill.LISTENING) {
				if (submissionModule.getStatus() != SubmissionStatus.GRADED) {
					continue;
				}
				List<Question> moduleQuestions = questionsByModuleId.getOrDefault(module.getId(), List.of());
				validateQuestionAnswers(module, moduleQuestions, moduleAnswers);
				seedData.add(createAutoGrading(
						submissionModule,
						submission,
						module,
						moduleQuestions,
						moduleAnswers,
						englishClass.getTeacherId(),
						random));
				continue;
			}

			if (moduleAnswers.size() != 1) {
				throw new IllegalStateException(
						"Writing or Speaking module must have exactly one answer: " + module.getId());
			}
			seedData.add(createManualGrading(
					submissionModule,
					submission,
					module,
					moduleAnswers.get(0),
					englishClass.getTeacherId(),
					seedData.size(),
					random));
		}

		List<Grading> gradings = seedData.stream().map(GradingSeedData::grading).toList();
		List<Grading> savedGradings = gradingRepository.saveAll(gradings);
		gradingRepository.flush();

		List<AnswerAnnotation> annotations = new ArrayList<>();
		for (int index = 0; index < seedData.size(); index++) {
			GradingSeedData data = seedData.get(index);
			if (data.skill() == ModuleSkill.WRITING || data.skill() == ModuleSkill.SPEAKING) {
				annotations.addAll(createAnnotations(
						data.answer(),
						data.skill(),
						data.status(),
						index));
			}
		}
		List<AnswerAnnotation> savedAnnotations = answerAnnotationRepository.saveAll(annotations);
		answerAnnotationRepository.flush();

		assertPersistedData();
		logSeedResult(savedGradings, savedAnnotations, seedData);
	}

	private void validateDependencies(
			List<SubmissionModule> submissionModules,
			List<Submission> submissions,
			List<AssignmentModule> modules,
			List<Assignment> assignments,
			List<Question> questions,
			List<Answer> answers,
			List<EnglishClass> classes) {
		if (submissionModules.isEmpty() || submissions.isEmpty()) {
			throw new IllegalStateException("Task 6 requires submissions from Task 4");
		}
		if (modules.isEmpty() || assignments.isEmpty() || classes.isEmpty()) {
			throw new IllegalStateException("Task 6 requires assignments and classes from previous tasks");
		}
		if (questions.isEmpty() || answers.isEmpty()) {
			throw new IllegalStateException("Task 6 requires questions and answers from previous tasks");
		}
	}

	private void truncateGradingTables() {
		entityManager.createNativeQuery(
				"TRUNCATE answer_annotations, gradings RESTART IDENTITY CASCADE")
				.executeUpdate();
		entityManager.clear();
	}

	private GradingSeedData createAutoGrading(
			SubmissionModule submissionModule,
			Submission submission,
			AssignmentModule module,
			List<Question> questions,
			List<Answer> answers,
			Long teacherId,
			Random random) {
		BigDecimal finalScore = sumAnswerScores(answers);
		BigDecimal maxScore = sumQuestionScores(questions);
		OffsetDateTime gradedAt = gradingTime(submission.getSubmittedAt(), random);
		Grading grading = new Grading(
				submissionModule.getId(),
				GradingMethod.AUTO,
				GradingStatus.COMPLETED,
				null,
				finalScore,
				null,
				maxScore,
				teacherId,
				gradedAt,
				gradedAt,
				null,
				null);
		return new GradingSeedData(
				grading,
				submissionModule.getStatus(),
				module.getSkill(),
				null);
	}

	private GradingSeedData createManualGrading(
			SubmissionModule submissionModule,
			Submission submission,
			AssignmentModule module,
			Answer answer,
			Long teacherId,
			int ordinal,
			Random random) {
		boolean completed = submissionModule.getStatus() == SubmissionStatus.GRADED;
		OffsetDateTime gradedAt = completed ? gradingTime(submission.getSubmittedAt(), random) : null;
		JsonNode transcript = module.getSkill() == ModuleSkill.SPEAKING
				? createAndValidateTranscript()
				: null;
		Grading grading = new Grading(
				submissionModule.getId(),
				GradingMethod.TEACHER_MANUAL,
				completed ? GradingStatus.COMPLETED : GradingStatus.AI_GRADED,
				module.getSkill() == ModuleSkill.WRITING
						? WRITING_AI_FEEDBACK[ordinal % WRITING_AI_FEEDBACK.length]
						: SPEAKING_AI_FEEDBACK[ordinal % SPEAKING_AI_FEEDBACK.length],
				completed ? randomFinalScore(module.getMaxScore(), random) : null,
				completed ? FINAL_FEEDBACK[ordinal % FINAL_FEEDBACK.length] : null,
				module.getMaxScore(),
				completed ? teacherId : null,
				completed ? gradedAt.minusMinutes(5) : null,
				gradedAt,
				transcript == null ? null : transcript.toString(),
				module.getAiInstruction());
		return new GradingSeedData(grading, submissionModule.getStatus(), module.getSkill(), answer);
	}

	private List<AnswerAnnotation> createAnnotations(
			Answer answer,
			ModuleSkill skill,
			SubmissionStatus submissionStatus,
			int gradingOrdinal) {
		GradingStatus gradingStatus = submissionStatus == SubmissionStatus.SUBMITTED
				? GradingStatus.AI_GRADED
				: GradingStatus.COMPLETED;
		String[] errorTypes = skill == ModuleSkill.WRITING
				? WRITING_ERROR_TYPES
				: SPEAKING_ERROR_TYPES;
		List<AnswerAnnotation> result = new ArrayList<>();
		for (int index = 0; index < 2; index++) {
			int[] offsets = annotationOffsets(answer, index);
			ReviewStatus reviewStatus = gradingStatus == GradingStatus.AI_GRADED
					? ReviewStatus.PENDING
					: index == 0 ? ReviewStatus.ACCEPTED : ReviewStatus.REJECTED;
			result.add(new AnswerAnnotation(
					answer.getId(),
					AnnotationSource.AI,
					offsets[0],
					offsets[1],
					errorTypes[index],
					COMMENTS[index],
					SUGGESTED_FIXES[index],
					reviewStatus));
		}

		if (gradingStatus == GradingStatus.COMPLETED && gradingOrdinal % 10 < 3) {
			int[] offsets = annotationOffsets(answer, 0);
			result.add(new AnswerAnnotation(
					answer.getId(),
					AnnotationSource.TEACHER,
					offsets[0],
					offsets[1],
					"grammar",
					"Teacher reviewed this correction and confirmed the issue.",
					"Keep the revised form in the final answer.",
					ReviewStatus.ACCEPTED));
		}
		return result;
	}

	private int[] annotationOffsets(Answer answer, int annotationIndex) {
		if (answer.getContent() == null) {
			return new int[] { 0, 10 };
		}
		int length = answer.getContent().length();
		if (length == 0) {
			return new int[] { 0, 0 };
		}
		int start = Math.min(annotationIndex * 8, length - 1);
		int end = Math.min(length, start + 8);
		return new int[] { start, end };
	}

	private BigDecimal sumAnswerScores(List<Answer> answers) {
		BigDecimal total = BigDecimal.ZERO;
		for (Answer answer : answers) {
			JsonNode content = parseObject(answer.getContent(), "answer " + answer.getId());
			JsonNode score = content.get("score");
			if (score == null || !score.isNumber()) {
				throw new IllegalStateException(
						"Graded question answer has no numeric score: " + answer.getId());
			}
			total = total.add(score.decimalValue());
		}
		return total;
	}

	private BigDecimal sumQuestionScores(List<Question> questions) {
		BigDecimal total = BigDecimal.ZERO;
		for (Question question : questions) {
			total = total.add(question.getScore());
		}
		return total;
	}

	private void validateQuestionAnswers(
			AssignmentModule module,
			List<Question> questions,
			List<Answer> answers) {
		if (questions.isEmpty() || answers.size() != questions.size()) {
			throw new IllegalStateException(
					"Question answer count does not match module " + module.getId());
		}
		for (Answer answer : answers) {
			if (answer.getQuestionId() == null) {
				throw new IllegalStateException(
						"Reading or Listening answer has no question: " + answer.getId());
			}
		}
	}

	private BigDecimal randomFinalScore(BigDecimal maxScore, Random random) {
		int maxCents = maxScore.movePointRight(2).intValueExact();
		return BigDecimal.valueOf(random.nextInt(maxCents + 1), 2);
	}

	private OffsetDateTime gradingTime(OffsetDateTime submittedAt, Random random) {
		return submittedAt.plusMinutes(30 + random.nextInt(121));
	}

	private JsonNode createAndValidateTranscript() {
		List<Map<String, Object>> words = List.of(
				Map.of("word", "I", "start", 0.0, "end", 0.3, "confidence", 0.95),
				Map.of("word", "usually", "start", 0.3, "end", 0.8, "confidence", 0.93),
				Map.of("word", "study", "start", 0.8, "end", 1.2, "confidence", 0.94),
				Map.of("word", "English", "start", 1.2, "end", 1.8, "confidence", 0.92));
		try {
			JsonNode transcript = objectMapper.readTree(objectMapper.writeValueAsString(words));
			validateTranscript(transcript);
			return transcript;
		} catch (JacksonException exception) {
			throw new IllegalStateException("Could not create Speaking transcript", exception);
		}
	}

	private void validateTranscript(JsonNode transcript) {
		if (transcript == null || !transcript.isArray() || transcript.size() == 0) {
			throw new IllegalStateException("Speaking ai_transcript must be a non-empty JSON array");
		}
		for (JsonNode word : transcript) {
			if (!word.isObject()
					|| word.get("word") == null
					|| !word.get("word").isString()
					|| word.get("start") == null
					|| !word.get("start").isNumber()
					|| word.get("end") == null
					|| !word.get("end").isNumber()
					|| word.get("confidence") == null
					|| !word.get("confidence").isNumber()) {
				throw new IllegalStateException("Speaking ai_transcript has an invalid word item");
			}
		}
	}

	private JsonNode parseObject(String json, String label) {
		if (json == null) {
			throw new IllegalStateException(label + " must contain JSON content");
		}
		try {
			JsonNode parsed = objectMapper.readTree(json);
			if (parsed == null || !parsed.isObject()) {
				throw new IllegalStateException(label + " must be a JSON object");
			}
			return parsed;
		} catch (JacksonException exception) {
			throw new IllegalStateException(label + " is not valid JSON", exception);
		}
	}

	private void assertPersistedData() {
		entityManager.clear();
		List<Grading> persistedGradings = gradingRepository.findAll(
				Sort.by(Sort.Direction.ASC, "id"));
		List<Answer> persistedAnswers = answerRepository.findAll();
		Map<Long, List<Answer>> answersBySubmissionModuleId = groupBy(
				persistedAnswers,
				Answer::getSubmissionModuleId);

		int autoCount = 0;
		for (Grading grading : persistedGradings) {
			if (grading.getMethod() == GradingMethod.AUTO) {
				autoCount++;
				BigDecimal expected = sumAnswerScores(
						answersBySubmissionModuleId.getOrDefault(grading.getSubmissionModuleId(), List.of()));
				if (grading.getFinalScore() == null
						|| grading.getFinalScore().compareTo(expected) != 0) {
					throw new IllegalStateException(
							"AUTO final_score does not match answer JSON for grading " + grading.getId());
				}
			}
			if (grading.getFinalScore() != null
					&& grading.getMaxScoreSnapshot() != null
					&& grading.getFinalScore().compareTo(grading.getMaxScoreSnapshot()) > 0) {
				throw new IllegalStateException(
						"final_score exceeds max_score_snapshot for grading " + grading.getId());
			}
			if (grading.getStatus() == GradingStatus.AI_GRADED
					&& (grading.getFinalScore() != null
							|| grading.getFinalFeedback() != null
							|| grading.getReviewedBy() != null
							|| grading.getReviewedAt() != null
							|| grading.getGradedAt() != null)) {
				throw new IllegalStateException(
						"AI_GRADED grading contains final or review fields: " + grading.getId());
			}
			if (grading.getStatus() == GradingStatus.COMPLETED
					&& (grading.getFinalScore() == null
							|| grading.getReviewedBy() == null
							|| grading.getReviewedAt() == null
							|| grading.getGradedAt() == null)) {
				throw new IllegalStateException(
						"COMPLETED grading is missing a required final field: " + grading.getId());
			}
			if (grading.getAiTranscript() != null) {
				try {
					validateTranscript(objectMapper.readTree(grading.getAiTranscript()));
				} catch (JacksonException exception) {
					throw new IllegalStateException(
							"Persisted ai_transcript is not valid JSON: " + grading.getId(), exception);
				}
			}
		}
		LOGGER.info("AUTO final_score assertion passed for {} gradings", autoCount);
	}

	private void logSeedResult(
			List<Grading> gradings,
			List<AnswerAnnotation> annotations,
			List<GradingSeedData> seedData) {
		Map<Long, GradingRuntimeData> gradingIds = new LinkedHashMap<>();
		for (int index = 0; index < gradings.size(); index++) {
			Grading grading = gradings.get(index);
			GradingSeedData data = seedData.get(index);
			gradingIds.put(
					grading.getId(),
					new GradingRuntimeData(
							data.grading().getSubmissionModuleId(),
							data.grading().getMethod(),
							data.grading().getStatus(),
							data.grading().getFinalScore()));
		}
		LOGGER.info(
				"Seeded {} gradings and {} answer annotations. Runtime grading IDs: {}",
				gradings.size(),
				annotations.size(),
				gradingIds);
	}

	private <K, V> Map<K, V> indexBy(List<V> values, Function<V, K> keyExtractor) {
		Map<K, V> result = new LinkedHashMap<>();
		for (V value : values) {
			result.put(keyExtractor.apply(value), value);
		}
		return result;
	}

	private <K, V> Map<K, List<V>> groupBy(List<V> values, Function<V, K> keyExtractor) {
		Map<K, List<V>> result = new LinkedHashMap<>();
		for (V value : values) {
			result.computeIfAbsent(keyExtractor.apply(value), ignored -> new ArrayList<>()).add(value);
		}
		return result;
	}

	private <K, V> V required(Map<K, V> values, K key, String label) {
		V value = values.get(key);
		if (value == null) {
			throw new IllegalStateException("Missing " + label + " " + key);
		}
		return value;
	}

	private <K, V> V required(K key, Map<K, V> values, String label) {
		return required(values, key, label);
	}

	private record GradingSeedData(
			Grading grading,
			SubmissionStatus status,
			ModuleSkill skill,
			Answer answer) {
	}

	private record GradingRuntimeData(
			Long submissionModuleId,
			GradingMethod method,
			GradingStatus status,
			BigDecimal finalScore) {
	}
}
