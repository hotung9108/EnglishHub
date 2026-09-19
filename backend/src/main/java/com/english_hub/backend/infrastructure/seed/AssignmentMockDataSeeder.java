package com.english_hub.backend.infrastructure.seed;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.Assignment;
import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.AssignmentModule;
import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.AssignmentStatus;
import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.ModuleSkill;
import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.ModuleTaskType;
import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.Question;
import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.QuestionType;
import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.UploadStatus;
import com.english_hub.backend.infrastructure.persistence.jpa_impl.repository.AssignmentModuleRepository;
import com.english_hub.backend.infrastructure.persistence.jpa_impl.repository.AssignmentRepository;
import com.english_hub.backend.infrastructure.persistence.jpa_impl.repository.QuestionRepository;
import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.ClassStatus;
import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.EnglishClass;
import com.english_hub.backend.infrastructure.persistence.jpa_impl.repository.EnglishClassRepository;
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
@Order(3)
public class AssignmentMockDataSeeder implements CommandLineRunner {

	private static final Logger LOGGER = LoggerFactory.getLogger(AssignmentMockDataSeeder.class);
	private static final long RANDOM_SEED = 42L;
	private static final int ASSIGNMENTS_PER_CLASS_MIN = 2;
	private static final int ASSIGNMENTS_PER_CLASS_RANGE = 3;
	private static final int CANCELLED_ASSIGNMENT_COUNT = 0;
	private static final int MODULE_COUNT = 4;
	private static final int QUESTIONS_PER_MODULE_MIN = 5;
	private static final int QUESTIONS_PER_MODULE_RANGE = 6;
	private static final int DRAFT_ASSIGNMENT_LIMIT = 2;

	private static final List<ModuleDefinition> MODULE_DEFINITIONS = List.of(
			new ModuleDefinition(
					ModuleSkill.READING,
					ModuleTaskType.QUIZ,
					"Đọc bài và trả lời câu hỏi kiểm tra khả năng hiểu nội dung."),
			new ModuleDefinition(
					ModuleSkill.LISTENING,
					ModuleTaskType.QUIZ,
					"Nghe đoạn hội thoại và chọn hoặc viết đáp án phù hợp."),
			new ModuleDefinition(
					ModuleSkill.WRITING,
					ModuleTaskType.ESSAY,
					"Viết câu trả lời có cấu trúc, sử dụng từ vựng và ngữ pháp phù hợp."),
			new ModuleDefinition(
					ModuleSkill.SPEAKING,
					ModuleTaskType.RECORDING,
					"Ghi âm câu trả lời và tập trung vào độ rõ ràng khi phát âm."));

	private static final String[] AI_INSTRUCTIONS = {
			"Ưu tiên kiểm tra khả năng dùng từ vựng theo ngữ cảnh.",
			"Chú ý đến độ chính xác ngữ pháp và ý chính trong câu trả lời.",
			"Đánh giá mạch lạc, phát âm và mức độ hoàn thành yêu cầu.",
			"So sánh câu trả lời với tiêu chí của module trước khi chấm điểm."
	};

	private static final String[] ASSIGNMENT_TITLES = {
			"Daily Routine Vocabulary",
			"Weekly Test - Unit 3: Travel",
			"Workplace Communication Practice",
			"Education and Future Plans Review",
			"Everyday English Checkpoint",
			"Mid-course Skills Assessment"
	};

	private static final List<QuestionTemplate> QUESTION_POOL = List.of(
			multipleChoice(
					"What do you call your mother's brother?",
					0,
					"An uncle",
					"A cousin",
					"A nephew",
					"A grandfather"),
			multipleChoice(
					"Which person is usually responsible for teaching a class?",
					1,
					"A mechanic",
					"A teacher",
					"A cashier",
					"A pilot"),
			multipleChoice(
					"What should you drink when you feel thirsty?",
					2,
					"Oil",
					"Salt",
					"Water",
					"Flour"),
			multipleChoice(
					"Where do people usually keep food cold?",
					3,
					"In a drawer",
					"On a bookshelf",
					"Under a bed",
					"In a refrigerator"),
			multipleChoice(
					"Which document do travelers usually need for an international flight?",
					0,
					"A passport",
					"A recipe",
					"A library card",
					"A shopping list"),
			multipleChoice(
					"What do travelers normally put clothes in for a trip?",
					1,
					"A wallet",
					"A suitcase",
					"A mailbox",
					"A calendar"),
			multipleChoice(
					"What do you usually receive from a hotel receptionist when you check in?",
					2,
					"A train ticket",
					"A passport",
					"A room key",
					"A school uniform"),
			multipleChoice(
					"What is the best thing to do when a flight is delayed?",
					3,
					"Leave the airport immediately",
					"Throw away your ticket",
					"Change your passport",
					"Check the updated departure information"),
			multipleChoice(
					"What does an architect design?",
					0,
					"Buildings",
					"Legal documents",
					"Menus",
					"Shoes"),
			multipleChoice(
					"What does a deadline tell you?",
					1,
					"Where to buy a product",
					"When something must be finished",
					"Who owns a building",
					"How to cook a meal"),
			multipleChoice(
					"Which is a polite reply to 'Could you send me the report?'",
					2,
					"No, I am a report",
					"The report is a window",
					"Certainly, I will send it this afternoon",
					"I sent a sandwich"),
			multipleChoice(
					"Where do colleagues usually discuss a meeting agenda?",
					3,
					"At a bus stop",
					"In a supermarket freezer",
					"At a swimming pool",
					"In a meeting"),
			multipleChoice(
					"Where can you try on clothes in a shop?",
					0,
					"In a fitting room",
					"At the post office",
					"In a parking meter",
					"At a bus station"),
			multipleChoice(
					"What do you usually get after paying for an item in a shop?",
					1,
					"A boarding pass",
					"A receipt",
					"A timetable",
					"A passport"),
			multipleChoice(
					"An item costs 20 dollars and has a 10 percent discount. What is the sale price?",
					2,
					"10 dollars",
					"12 dollars",
					"18 dollars",
					"22 dollars"),
			multipleChoice(
					"What can you ask for if a shirt is too small?",
					3,
					"A passport",
					"A lecture",
					"A suitcase",
					"A different size"),
			multipleChoice(
					"Where can students borrow books?",
					0,
					"At a library",
					"At a bakery",
					"At an airport gate",
					"At a petrol station"),
			multipleChoice(
					"What is the opposite of passing an exam?",
					1,
					"Winning",
					"Failing",
					"Arriving",
					"Borrowing"),
			multipleChoice(
					"What do students usually write in during a lesson?",
					2,
					"A suitcase",
					"A passport",
					"A notebook",
					"A receipt"),
			multipleChoice(
					"Which room is normally used for sleeping?",
					3,
					"The kitchen",
					"The garage",
					"The balcony",
					"The bedroom"),
			multipleChoice(
					"What do people often use to stay dry in the rain?",
					0,
					"An umbrella",
					"A dictionary",
					"A pillow",
					"A passport"),
			multipleChoice(
					"Who should you visit when you are seriously ill?",
					1,
					"A cashier",
					"A doctor",
					"A waiter",
					"A librarian"),
			multipleChoice(
					"What helps protect an online account?",
					2,
					"A suitcase",
					"A receipt",
					"A strong password",
					"A paper plate"),
			multipleChoice(
					"What should people do with paper and plastic that can be used again?",
					3,
					"Hide them under the bed",
					"Put them in a passport",
					"Leave them at the airport",
					"Recycle them"),
			multipleChoice(
					"Which day comes after Thursday?",
					0,
					"Friday",
					"Monday",
					"Wednesday",
					"Sunday"),
			shortAnswer("What is the opposite of 'expensive'?", "cheap"),
			shortAnswer("What should you show at an airport before an international flight?", "passport"),
			shortAnswer("What is the past tense of 'go'?", "went"),
			shortAnswer("How many days are there in a week?", "seven"),
			shortAnswer("What do you use to unlock a door?", "key"),
			shortAnswer("What do people usually eat in the morning?", "breakfast"),
			shortAnswer("Where do passengers wait for a train?", "station"),
			shortAnswer("What do students usually complete at home after a lesson?", "homework"),
			shortAnswer("What do we call a person who buys goods or services?", "customer"),
			shortAnswer("What does a plant need to grow?", "water"),
			shortAnswer("What do you call a planned journey?", "trip"));

	private final EntityManager entityManager;
	private final EnglishClassRepository englishClassRepository;
	private final AssignmentRepository assignmentRepository;
	private final AssignmentModuleRepository assignmentModuleRepository;
	private final QuestionRepository questionRepository;
	private final ObjectMapper objectMapper;

	public AssignmentMockDataSeeder(
			EntityManager entityManager,
			EnglishClassRepository englishClassRepository,
			AssignmentRepository assignmentRepository,
			AssignmentModuleRepository assignmentModuleRepository,
			QuestionRepository questionRepository,
			ObjectMapper objectMapper) {
		this.entityManager = entityManager;
		this.englishClassRepository = englishClassRepository;
		this.assignmentRepository = assignmentRepository;
		this.assignmentModuleRepository = assignmentModuleRepository;
		this.questionRepository = questionRepository;
		this.objectMapper = objectMapper;
	}

	@Override
	@Transactional
	public void run(String... args) {
		List<EnglishClass> classes = englishClassRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
		validateClassDependencies(classes);
		truncateAssignmentTables();

		Random random = new Random(RANDOM_SEED);
		ZoneId zoneId = ZoneId.systemDefault();
		List<AssignmentSeedData> assignmentSeedData = buildAssignmentSeedData(classes, random, zoneId);
		List<Assignment> assignments = assignmentSeedData.stream()
				.map(data -> new Assignment(
						data.classId(),
						data.title(),
						data.description(),
						data.openAt(),
						data.closeAt(),
						data.maxSubmissions(),
						data.manuallyClosed(),
						false,
						data.status()))
				.toList();

		List<Assignment> savedAssignments = assignmentRepository.saveAll(assignments);
		assignmentRepository.flush();

		Map<Long, Long> classIdByAssignmentId = new LinkedHashMap<>();
		List<AssignmentModule> modules = new ArrayList<>(savedAssignments.size() * MODULE_COUNT);
		List<ModuleSeedData> moduleSeedData = new ArrayList<>(savedAssignments.size() * MODULE_COUNT);
		for (int assignmentIndex = 0; assignmentIndex < savedAssignments.size(); assignmentIndex++) {
			Assignment assignment = savedAssignments.get(assignmentIndex);
			classIdByAssignmentId.put(assignment.getId(), assignment.getClassId());
			for (int moduleIndex = 0; moduleIndex < MODULE_DEFINITIONS.size(); moduleIndex++) {
				ModuleDefinition definition = MODULE_DEFINITIONS.get(moduleIndex);
				AssignmentModule module = createModule(assignment.getId(), moduleIndex + 1, definition, random);
				modules.add(module);
				moduleSeedData.add(new ModuleSeedData(module, assignment.getId(), definition.skill()));
			}
		}

		List<AssignmentModule> savedModules = assignmentModuleRepository.saveAll(modules);
		assignmentModuleRepository.flush();

		Map<Long, ModuleRuntimeData> assignmentDataByModuleId = new LinkedHashMap<>();
		List<Question> questions = new ArrayList<>();
		for (ModuleSeedData data : moduleSeedData) {
			assignmentDataByModuleId.put(
					data.module().getId(),
					new ModuleRuntimeData(data.assignmentId(), data.skill()));
			if (data.skill() != ModuleSkill.READING && data.skill() != ModuleSkill.LISTENING) {
				continue;
			}

			List<QuestionTemplate> shuffledQuestionPool = new ArrayList<>(QUESTION_POOL);
			Collections.shuffle(shuffledQuestionPool, random);
			int questionCount = QUESTIONS_PER_MODULE_MIN + random.nextInt(QUESTIONS_PER_MODULE_RANGE);
			for (int questionIndex = 0; questionIndex < questionCount; questionIndex++) {
				QuestionTemplate template = shuffledQuestionPool.get(questionIndex);
				questions.add(new Question(
						data.module().getId(),
						template.content(),
						template.type(),
						buildAndValidateCorrectAnswer(template, random),
						questionScore(random),
						questionIndex + 1));
			}
		}

		List<Question> savedQuestions = questionRepository.saveAll(questions);
		questionRepository.flush();
		Map<Long, QuestionRuntimeData> questionRuntimeData = new LinkedHashMap<>();
		for (Question question : savedQuestions) {
			questionRuntimeData.put(
					question.getId(),
					new QuestionRuntimeData(
							question.getModuleId(),
							question.getQuestionType(),
							parseCorrectAnswerJson(question.getCorrectAnswer())));
		}

		LOGGER.info(
				"Seeded {} assignments, {} modules and {} questions. Runtime assignment IDs: {}. Runtime module IDs: {}. Runtime question IDs: {}",
				savedAssignments.size(),
				savedModules.size(),
				savedQuestions.size(),
				classIdByAssignmentId,
				assignmentDataByModuleId,
				questionRuntimeData);
	}

	private void validateClassDependencies(List<EnglishClass> classes) {
		if (classes.size() != 6) {
			throw new IllegalStateException("Task 3 requires exactly 6 classes from Task 2");
		}
		if (classes.stream().anyMatch(englishClass -> englishClass.getId() == null)) {
			throw new IllegalStateException("Task 3 requires persisted class IDs from Task 2");
		}
	}

	private void truncateAssignmentTables() {
		entityManager.createNativeQuery(
				"TRUNCATE questions, modules, assignments RESTART IDENTITY CASCADE")
				.executeUpdate();
		entityManager.clear();
	}

	private List<AssignmentSeedData> buildAssignmentSeedData(
			List<EnglishClass> classes,
			Random random,
			ZoneId zoneId) {
		List<AssignmentSeedData> seedData = new ArrayList<>();
		int assignmentOrdinal = 0;
		int draftAssignmentCount = 0;
		for (EnglishClass englishClass : classes) {
			int assignmentCount = englishClass.getStatus() == ClassStatus.CANCELLED
					? CANCELLED_ASSIGNMENT_COUNT
					: ASSIGNMENTS_PER_CLASS_MIN + random.nextInt(ASSIGNMENTS_PER_CLASS_RANGE);
			for (int assignmentIndex = 0; assignmentIndex < assignmentCount; assignmentIndex++) {
				AssignmentStatus status = chooseAssignmentStatus(
						englishClass.getStatus(),
						assignmentIndex,
						draftAssignmentCount,
						random);
				if (status == AssignmentStatus.DRAFT) {
					draftAssignmentCount++;
				}

				OffsetDateTime openAt = generateOpenAt(englishClass, random, zoneId);
				OffsetDateTime closeAt = openAt.plusDays(7 + random.nextInt(14));
				if (!openAt.isBefore(closeAt)) {
					throw new IllegalStateException("Generated assignment has open_at >= close_at");
				}

				seedData.add(new AssignmentSeedData(
						englishClass.getId(),
						"Assignment " + (assignmentIndex + 1) + " - "
								+ ASSIGNMENT_TITLES[assignmentOrdinal % ASSIGNMENT_TITLES.length],
						"Bài tập tổng hợp kỹ năng cho lớp " + englishClass.getName() + ".",
						openAt,
						closeAt,
						maxSubmissionsFor(assignmentOrdinal),
						status == AssignmentStatus.CLOSED && assignmentOrdinal % 4 == 0,
						status));
				assignmentOrdinal++;
			}
		}
		return seedData;
	}

	private AssignmentStatus chooseAssignmentStatus(
			ClassStatus classStatus,
			int assignmentIndex,
			int draftAssignmentCount,
			Random random) {
		if (classStatus == ClassStatus.ACTIVE
				&& assignmentIndex == 0
				&& draftAssignmentCount < DRAFT_ASSIGNMENT_LIMIT) {
			return AssignmentStatus.DRAFT;
		}
		if (classStatus == ClassStatus.COMPLETED) {
			return random.nextBoolean() ? AssignmentStatus.CLOSED : AssignmentStatus.PUBLISHED;
		}
		return random.nextBoolean() ? AssignmentStatus.PUBLISHED : AssignmentStatus.CLOSED;
	}

	private OffsetDateTime generateOpenAt(EnglishClass englishClass, Random random, ZoneId zoneId) {
		return englishClass.getStartDate()
				.atStartOfDay(zoneId)
				.toOffsetDateTime()
				.plusDays(random.nextInt(21))
				.plusHours(8 + random.nextInt(8));
	}

	private Integer maxSubmissionsFor(int assignmentOrdinal) {
		return switch (assignmentOrdinal % 4) {
			case 0 -> null;
			case 1 -> 1;
			case 2 -> 2;
			default -> 3;
		};
	}

	private AssignmentModule createModule(
			Long assignmentId,
			int orderIndex,
			ModuleDefinition definition,
			Random random) {
		boolean listening = definition.skill() == ModuleSkill.LISTENING;
		return new AssignmentModule(
				assignmentId,
				definition.skill(),
				definition.taskType(),
				orderIndex,
				definition.instructions(),
				BigDecimal.valueOf(definition.skill() == ModuleSkill.WRITING && random.nextInt(4) == 0 ? 20 : 10),
				listening ? "audio/listening/" + UUID.randomUUID() + ".mp3" : null,
				listening ? 60 + random.nextInt(241) : null,
				listening ? "audio/mpeg" : null,
				listening ? UploadStatus.READY : null,
				random.nextInt(4) == 0 ? null : pick(AI_INSTRUCTIONS, random));
	}

	private BigDecimal questionScore(Random random) {
		return BigDecimal.valueOf(random.nextInt(5) == 0 ? 2 : 1);
	}

	private String buildAndValidateCorrectAnswer(QuestionTemplate template, Random random) {
		Map<String, Object> answer = new LinkedHashMap<>();
		if (template.type() == QuestionType.MULTIPLE_CHOICE) {
			int correctIndex = random.nextInt(template.options().size());
			List<String> options = new ArrayList<>(template.options());
			String correctOption = options.remove(template.correctOptionIndex());
			options.add(correctIndex, correctOption);

			List<Map<String, Object>> serializedOptions = new ArrayList<>(options.size());
			for (int index = 0; index < options.size(); index++) {
				Map<String, Object> option = new LinkedHashMap<>();
				option.put("id", index + 1);
				option.put("content", options.get(index));
				option.put("is_correct", index == correctIndex);
				serializedOptions.add(option);
			}
			answer.put("options", serializedOptions);
		} else {
			answer.put("correct_answer", template.shortAnswer());
		}

		try {
			String json = objectMapper.writeValueAsString(answer);
			validateCorrectAnswerJson(json, template.type());
			return json;
		} catch (JacksonException exception) {
			throw new IllegalStateException("Could not serialize or parse correct_answer JSON", exception);
		}
	}

	private void validateCorrectAnswerJson(String json, QuestionType questionType) {
		try {
			JsonNode root = objectMapper.readTree(json);
			if (root == null || !root.isObject()) {
				throw new IllegalStateException("correct_answer must be a JSON object");
			}
			if (questionType == QuestionType.MULTIPLE_CHOICE) {
				JsonNode options = root.get("options");
				if (options == null || !options.isArray() || options.size() != 4) {
					throw new IllegalStateException("MULTIPLE_CHOICE correct_answer must contain four options");
				}
				int correctCount = 0;
				for (JsonNode option : options) {
					JsonNode isCorrect = option.get("is_correct");
					if (isCorrect != null && isCorrect.isBoolean() && isCorrect.booleanValue()) {
						correctCount++;
					}
				}
				if (correctCount != 1) {
					throw new IllegalStateException("MULTIPLE_CHOICE correct_answer must have exactly one correct option");
				}
				return;
			}

			JsonNode shortAnswer = root.get("correct_answer");
			if (shortAnswer == null || !shortAnswer.isString()) {
				throw new IllegalStateException("SHORT_ANSWER correct_answer must contain a text answer");
			}
		} catch (JacksonException exception) {
			throw new IllegalStateException("correct_answer is not parseable JSON", exception);
		}
	}

	private JsonNode parseCorrectAnswerJson(String json) {
		try {
			return objectMapper.readTree(json);
		} catch (JacksonException exception) {
			throw new IllegalStateException("correct_answer is not parseable JSON", exception);
		}
	}

	private String pick(String[] values, Random random) {
		return values[random.nextInt(values.length)];
	}

	private static QuestionTemplate multipleChoice(
			String content,
			int correctOptionIndex,
			String optionOne,
			String optionTwo,
			String optionThree,
			String optionFour) {
		return new QuestionTemplate(
				content,
				QuestionType.MULTIPLE_CHOICE,
				List.of(optionOne, optionTwo, optionThree, optionFour),
				correctOptionIndex,
				null);
	}

	private static QuestionTemplate shortAnswer(String content, String answer) {
		return new QuestionTemplate(content, QuestionType.SHORT_ANSWER, List.of(), -1, answer);
	}

	private record AssignmentSeedData(
			Long classId,
			String title,
			String description,
			OffsetDateTime openAt,
			OffsetDateTime closeAt,
			Integer maxSubmissions,
			boolean manuallyClosed,
			AssignmentStatus status) {
	}

	private record ModuleDefinition(
			ModuleSkill skill,
			ModuleTaskType taskType,
			String instructions) {
	}

	private record ModuleSeedData(
			AssignmentModule module,
			Long assignmentId,
			ModuleSkill skill) {
	}

	private record ModuleRuntimeData(Long assignmentId, ModuleSkill skill) {
	}

	private record QuestionRuntimeData(Long moduleId, QuestionType questionType, JsonNode parsedCorrectAnswer) {
	}

	private record QuestionTemplate(
			String content,
			QuestionType type,
			List<String> options,
			int correctOptionIndex,
			String shortAnswer) {
	}
}
