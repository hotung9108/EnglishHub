package com.english_hub.core.infrastructure.seed;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

import com.english_hub.core.infrastructure.persistence.entity.Answer;
import com.english_hub.core.infrastructure.persistence.repository.AnswerRepository;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.Question;
import com.english_hub.core.infrastructure.persistence.entity.QuestionType;
import com.english_hub.core.infrastructure.persistence.entity.UploadStatus;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.QuestionRepository;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionModule;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
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
@Order(5)
public class AnswerMockDataSeeder implements CommandLineRunner {

	private static final Logger LOGGER = LoggerFactory.getLogger(AnswerMockDataSeeder.class);
	private static final long RANDOM_SEED = 42L;
	private static final String DOC_MIME_TYPE = "application/octet-stream";

	private static final String[] WRONG_SHORT_ANSWERS = {
			"Monday", "teacher", "airport", "expensive", "Paris", "ten", "green"
	};

	private static final String[] WRITING_ANSWERS = {
			"""
			Online learning gives students more freedom because they can study at home and choose a suitable time. However, it also requires strong self-discipline. Some students watch the lesson but do not review the vocabulary later, so they quickly forget what they learned. In my opinion, online courses work best when students make a weekly plan and practise speaking with other people. The lessons are useful, but teacher feedback are also important for improving mistakes. I often study in the evening, when my house is quiet. If I miss a class, I can watch it again, but I still need to finish the homework before the next lesson.
			""",
			"""
			Public transport is helpful for people who live in a busy city. Buses and trains can carry many passengers, so there are fewer cars on the road and the air may become cleaner. I usually take the bus to my English class because it is cheaper than using a taxi. The journey sometimes takes longer when traffic is heavy, and the bus can be very crowded in the morning. For this reason, city transport should be more frequent and comfortable. If the service is reliable, more people will leave their private vehicles at home and the streets will be less noisy.
			""",
			"""
			Technology has changed the way students learn new subjects. A phone or laptop gives them quick access to dictionaries, videos, and online exercises. This is useful when a student wants to practise outside the classroom. However, technology can also become a distraction. Some learners open social media during a lesson and lose focus for a long time. I think students should use digital tools with a clear purpose. Turning off unnecessary notifications and taking short notes can help them study better. Technology is not a replacement for effort, but it makes good learning habits easier to follow.
			""",
			"""
			Protecting the environment is not only the responsibility of governments. Ordinary people can also make small changes in their daily lives. For example, they can carry a reusable bottle, separate paper from other rubbish, and use electricity carefully. My family tries to avoid plastic bags when we go shopping, although we sometimes forget. Schools can help by teaching students how waste affects rivers and animals. These actions may look unimportant when one person does them, but they become meaningful when a whole community participates. A cleaner neighbourhood also makes people feel more comfortable and proud of where they live.
			""",
			"""
			Balancing study and work is difficult for many young adults. They often want to earn money, but they also need enough time to attend classes and complete assignments. I worked part-time in a small cafe last year, and I learned how important planning is. At first, I accepted too many shifts and became tired before my evening lessons. Later, I made a simple weekly schedule and told my manager when I had an important exam. I still had less free time than my friends, but my grades improved. A realistic plan is better than trying to do everything at once.
			""",
			"""
			A healthy daily routine can improve both energy and concentration. I try to wake up at the same time every morning, even on weekends, because sleeping too late makes me feel slow. After breakfast, I spend a few minutes checking my tasks for the day. In the evening, I review new English words and prepare my bag for the next morning. I do not always follow this routine perfectly, especially when I have a lot of homework. Still, these small habits help me avoid rushing. The most useful routine is one that a person can continue for many weeks, not one that is impossible to maintain.
			"""
	};

	private final EntityManager entityManager;
	private final SubmissionModuleRepository submissionModuleRepository;
	private final AssignmentModuleRepository assignmentModuleRepository;
	private final QuestionRepository questionRepository;
	private final AnswerRepository answerRepository;
	private final ObjectMapper objectMapper;

	public AnswerMockDataSeeder(
			EntityManager entityManager,
			SubmissionModuleRepository submissionModuleRepository,
			AssignmentModuleRepository assignmentModuleRepository,
			QuestionRepository questionRepository,
			AnswerRepository answerRepository,
			ObjectMapper objectMapper) {
		this.entityManager = entityManager;
		this.submissionModuleRepository = submissionModuleRepository;
		this.assignmentModuleRepository = assignmentModuleRepository;
		this.questionRepository = questionRepository;
		this.answerRepository = answerRepository;
		this.objectMapper = objectMapper;
	}

	@Override
	@Transactional
	public void run(String... args) {
		List<SubmissionModule> submissionModules = submissionModuleRepository.findAll(
				Sort.by(Sort.Direction.ASC, "id"));
		List<AssignmentModule> modules = assignmentModuleRepository.findAll(
				Sort.by(Sort.Direction.ASC, "id"));
		List<Question> questions = questionRepository.findAll(
				Sort.by(Sort.Direction.ASC, "moduleId", "orderIndex"));
		Map<Long, AssignmentModule> moduleById = modules.stream()
				.collect(java.util.stream.Collectors.toMap(
						AssignmentModule::getId,
						module -> module,
						(first, second) -> first,
						LinkedHashMap::new));
		Map<Long, List<Question>> questionsByModuleId = groupQuestions(questions);

		validateDependencies(submissionModules, modules, questions);
		truncateAnswers();

		Random random = new Random(RANDOM_SEED);
		List<AnswerSeedData> seedData = new ArrayList<>();
		for (SubmissionModule submissionModule : submissionModules) {
			if (submissionModule.getStatus() == SubmissionStatus.IN_PROGRESS) {
				continue;
			}

			AssignmentModule module = moduleById.get(submissionModule.getModuleId());
			if (module == null) {
				throw new IllegalStateException(
						"Submission module references missing module: " + submissionModule.getModuleId());
			}

			switch (module.getSkill()) {
				case READING, LISTENING -> addQuestionAnswers(
						seedData,
						submissionModule,
						module,
						questionsByModuleId.getOrDefault(module.getId(), List.of()),
						random);
				case WRITING -> seedData.add(createWritingAnswer(submissionModule, module, random));
				case SPEAKING -> seedData.add(createSpeakingAnswer(submissionModule, module, random));
			}
		}

		List<Answer> answers = seedData.stream().map(AnswerSeedData::toEntity).toList();
		List<Answer> savedAnswers = answerRepository.saveAll(answers);
		answerRepository.flush();
		logSeedResult(savedAnswers, seedData);
	}

	private Map<Long, List<Question>> groupQuestions(List<Question> questions) {
		Map<Long, List<Question>> result = new LinkedHashMap<>();
		for (Question question : questions) {
			result.computeIfAbsent(question.getModuleId(), ignored -> new ArrayList<>()).add(question);
		}
		return result;
	}

	private void validateDependencies(
			List<SubmissionModule> submissionModules,
			List<AssignmentModule> modules,
			List<Question> questions) {
		if (submissionModules.isEmpty()) {
			throw new IllegalStateException("Task 5 requires submission modules from Task 4");
		}
		if (modules.isEmpty() || questions.isEmpty()) {
			throw new IllegalStateException("Task 5 requires modules and questions from Task 3");
		}
	}

	private void truncateAnswers() {
		entityManager.createNativeQuery("TRUNCATE answers RESTART IDENTITY CASCADE").executeUpdate();
		entityManager.clear();
	}

	private void addQuestionAnswers(
			List<AnswerSeedData> result,
			SubmissionModule submissionModule,
			AssignmentModule module,
			List<Question> questions,
			Random random) {
		if (questions.isEmpty()) {
			throw new IllegalStateException("Reading or Listening module has no questions: " + module.getId());
		}
		for (Question question : questions) {
			QuestionAnswer questionAnswer = createQuestionAnswer(
					question,
					submissionModule.getStatus(),
					random);
			result.add(answerData(
					submissionModule.getId(),
					question.getId(),
					module.getSkill(),
					questionAnswer.content(),
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					questionAnswer.isCorrectForLog()));
		}
	}

	private QuestionAnswer createQuestionAnswer(
			Question question,
			SubmissionStatus submissionStatus,
			Random random) {
		JsonNode correctAnswer = parseJson(question.getCorrectAnswer(), "question " + question.getId());
		Map<String, Object> content = new LinkedHashMap<>();
		boolean isCorrect;

		if (question.getQuestionType() == QuestionType.MULTIPLE_CHOICE) {
			List<Integer> optionIds = new ArrayList<>();
			List<Integer> correctOptionIds = new ArrayList<>();
			JsonNode options = correctAnswer.get("options");
			if (options == null || !options.isArray() || options.size() < 2) {
				throw new IllegalStateException("Invalid multiple-choice correct_answer for question " + question.getId());
			}
			for (JsonNode option : options) {
				int optionId = option.get("id").intValue();
				optionIds.add(optionId);
				JsonNode correct = option.get("is_correct");
				if (correct != null && correct.isBoolean() && correct.booleanValue()) {
					correctOptionIds.add(optionId);
				}
			}
			if (correctOptionIds.size() != 1) {
				throw new IllegalStateException("Expected exactly one correct option for question " + question.getId());
			}

			isCorrect = random.nextInt(4) != 0;
			int selectedOptionId;
			if (isCorrect) {
				selectedOptionId = correctOptionIds.get(0);
			} else {
				List<Integer> wrongOptionIds = optionIds.stream()
						.filter(optionId -> !optionId.equals(correctOptionIds.get(0)))
						.toList();
				selectedOptionId = wrongOptionIds.get(random.nextInt(wrongOptionIds.size()));
			}
			content.put("selected_option_ids", List.of(selectedOptionId));
		} else {
			JsonNode correctAnswerText = correctAnswer.get("correct_answer");
			if (correctAnswerText == null || !correctAnswerText.isString()) {
				throw new IllegalStateException("Invalid short-answer correct_answer for question " + question.getId());
			}
			String expectedAnswer = correctAnswerText.stringValue();
			isCorrect = random.nextInt(4) != 0;
			content.put("answer_text", isCorrect ? expectedAnswer : wrongShortAnswer(expectedAnswer, random));
		}

		if (submissionStatus == SubmissionStatus.GRADED) {
			content.put("is_correct", isCorrect);
			content.put("score", isCorrect ? question.getScore() : BigDecimal.ZERO);
		}

		return new QuestionAnswer(
				serializeAndValidate(content, "answer for question " + question.getId()),
				submissionStatus == SubmissionStatus.GRADED ? isCorrect : null);
	}

	private String wrongShortAnswer(String expectedAnswer, Random random) {
		String candidate;
		do {
			candidate = WRONG_SHORT_ANSWERS[random.nextInt(WRONG_SHORT_ANSWERS.length)];
		} while (candidate.equalsIgnoreCase(expectedAnswer));
		return candidate;
	}

	private AnswerSeedData createWritingAnswer(
			SubmissionModule submissionModule,
			AssignmentModule module,
			Random random) {
		if (random.nextInt(5) == 0) {
			long fileSize = 50_000L + random.nextInt(450_001);
			return answerData(
					submissionModule.getId(),
					null,
					module.getSkill(),
					null,
					null,
					null,
					null,
					null,
					null,
					"docs/writing/" + UUID.randomUUID() + ".docx",
					DOC_MIME_TYPE,
					fileSize,
					UploadStatus.READY,
					null);
		}

		return answerData(
				submissionModule.getId(),
				null,
				module.getSkill(),
				WRITING_ANSWERS[random.nextInt(WRITING_ANSWERS.length)],
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null);
	}

	private AnswerSeedData createSpeakingAnswer(
			SubmissionModule submissionModule,
			AssignmentModule module,
			Random random) {
		int durationSeconds = 30 + random.nextInt(91);
		return answerData(
				submissionModule.getId(),
				null,
				module.getSkill(),
				null,
				"audio/speaking/" + UUID.randomUUID() + ".mp3",
				durationSeconds,
				durationSeconds * 16_000L,
				"audio/mpeg",
				UploadStatus.READY,
				null,
				null,
				null,
				null,
				null);
	}

	private AnswerSeedData answerData(
			Long submissionModuleId,
			Long questionId,
			ModuleSkill skill,
			String content,
			String audioStorageKey,
			Integer audioDurationSeconds,
			Long audioFileSizeBytes,
			String audioMimeType,
			UploadStatus audioUploadStatus,
			String docStorageKey,
			String docMimeType,
			Long docFileSizeBytes,
			UploadStatus docUploadStatus,
			Boolean isCorrect) {
		int sourceCount = (content != null ? 1 : 0)
				+ (audioStorageKey != null ? 1 : 0)
				+ (docStorageKey != null ? 1 : 0);
		if (sourceCount != 1) {
			throw new IllegalStateException(
					"Answer must have exactly one source for submission module " + submissionModuleId);
		}
		return new AnswerSeedData(
				submissionModuleId,
				questionId,
				skill,
				content,
				audioStorageKey,
				audioDurationSeconds,
				audioFileSizeBytes,
				audioMimeType,
				audioUploadStatus,
				docStorageKey,
				docMimeType,
				docFileSizeBytes,
				docUploadStatus,
				isCorrect);
	}

	private JsonNode parseJson(String json, String label) {
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

	private String serializeAndValidate(Map<String, Object> content, String label) {
		try {
			String json = objectMapper.writeValueAsString(content);
			parseJson(json, label);
			return json;
		} catch (JacksonException exception) {
			throw new IllegalStateException("Could not serialize " + label, exception);
		}
	}

	private void logSeedResult(List<Answer> answers, List<AnswerSeedData> seedData) {
		Map<Long, AnswerRuntimeData> answerIds = new LinkedHashMap<>();
		for (int index = 0; index < answers.size(); index++) {
			Answer answer = answers.get(index);
			AnswerSeedData data = seedData.get(index);
			answerIds.put(
					answer.getId(),
					new AnswerRuntimeData(
							data.submissionModuleId(),
							data.questionId(),
							data.skill(),
							data.isCorrect()));
		}
		LOGGER.info("Seeded {} answers. Runtime answer IDs: {}", answers.size(), answerIds);
	}

	private record QuestionAnswer(String content, Boolean isCorrectForLog) {
	}

	private record AnswerSeedData(
			Long submissionModuleId,
			Long questionId,
			ModuleSkill skill,
			String content,
			String audioStorageKey,
			Integer audioDurationSeconds,
			Long audioFileSizeBytes,
			String audioMimeType,
			UploadStatus audioUploadStatus,
			String docStorageKey,
			String docMimeType,
			Long docFileSizeBytes,
			UploadStatus docUploadStatus,
			Boolean isCorrect) {

		private Answer toEntity() {
			return new Answer(
					submissionModuleId,
					questionId,
					content,
					audioStorageKey,
					audioDurationSeconds,
					audioFileSizeBytes,
					audioMimeType,
					audioUploadStatus,
					docStorageKey,
					docMimeType,
					docFileSizeBytes,
					docUploadStatus);
		}
	}

	private record AnswerRuntimeData(
			Long submissionModuleId,
			Long questionId,
			ModuleSkill skill,
			Boolean isCorrect) {
	}
}
