package com.english_hub.backend.seed;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.function.Function;
import java.security.SecureRandom;

import com.english_hub.backend.auth.entity.RefreshToken;
import com.english_hub.backend.auth.repository.RefreshTokenRepository;
import com.english_hub.backend.classes.entity.ClassMember;
import com.english_hub.backend.classes.entity.EnglishClass;
import com.english_hub.backend.classes.repository.ClassMemberRepository;
import com.english_hub.backend.classes.repository.EnglishClassRepository;
import com.english_hub.backend.evaluations.entity.StudentEvaluation;
import com.english_hub.backend.evaluations.repository.StudentEvaluationRepository;
import com.english_hub.backend.common.domain.UserRole;
import com.english_hub.backend.features.user.infrastructure.persistence.entity.User;
import com.english_hub.backend.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("seed")
@Order(8)
public class MiscMockDataSeeder implements CommandLineRunner {

	private static final Logger LOGGER = LoggerFactory.getLogger(MiscMockDataSeeder.class);
	private static final long RANDOM_SEED = 42L;
	private static final String[] USER_AGENTS = {
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0",
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) Safari/17.5",
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/127.0",
			"Mozilla/5.0 (Linux; Android 14) Chrome/126.0 Mobile",
			"Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Safari/604.1",
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) Chrome/125.0"
	};

	private static final String[] EVALUATION_CONTENTS = {
			"Tiến bộ rõ rệt trong việc sử dụng từ vựng và chủ động phát biểu trên lớp.",
			"Nắm được nội dung chính của bài học và hoàn thành phần lớn bài tập đúng hạn.",
			"Có thái độ học tập tích cực, nên tiếp tục duy trì việc luyện tập đều đặn.",
			"Hiểu các cấu trúc cơ bản nhưng đôi lúc còn cần thêm thời gian để áp dụng.",
			"Kết quả ở mức ổn định; nên ôn lại từ vựng sau mỗi buổi học để nhớ lâu hơn.",
			"Có thể hoàn thành yêu cầu chính, tuy nhiên cần chú ý hơn đến độ chính xác ngữ pháp.",
			"Cần cải thiện sự tự tin khi nói và dành thêm thời gian luyện phát âm ở nhà.",
			"Nên lập kế hoạch học tập cụ thể hơn và hoàn thành bài tập trước hạn.",
			"Cần củng cố từ vựng nền tảng và chủ động hỏi giáo viên khi chưa hiểu bài."
	};

	private final EntityManager entityManager;
	private final UserRepository userRepository;
	private final ClassMemberRepository classMemberRepository;
	private final EnglishClassRepository englishClassRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final StudentEvaluationRepository studentEvaluationRepository;

	public MiscMockDataSeeder(
			EntityManager entityManager,
			UserRepository userRepository,
			ClassMemberRepository classMemberRepository,
			EnglishClassRepository englishClassRepository,
			RefreshTokenRepository refreshTokenRepository,
			StudentEvaluationRepository studentEvaluationRepository) {
		this.entityManager = entityManager;
		this.userRepository = userRepository;
		this.classMemberRepository = classMemberRepository;
		this.englishClassRepository = englishClassRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.studentEvaluationRepository = studentEvaluationRepository;
	}

	@Override
	@Transactional
	public void run(String... args) {
		List<User> users = userRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
		List<ClassMember> classMembers = classMemberRepository.findAll(
				Sort.by(Sort.Direction.ASC, "id"));
		List<EnglishClass> classes = englishClassRepository.findAll(
				Sort.by(Sort.Direction.ASC, "id"));
		validateDependencies(users, classMembers, classes);

		Map<Long, User> userById = indexBy(users, User::getId);
		Map<Long, EnglishClass> classById = indexBy(classes, EnglishClass::getId);
		truncateMiscTables();

		Random random = new Random(RANDOM_SEED);
		SecureRandom secureRandom = new SecureRandom();
		List<RefreshToken> refreshTokens = buildRefreshTokens(users, random, secureRandom);
		List<RefreshToken> savedTokens = refreshTokenRepository.saveAll(refreshTokens);
		refreshTokenRepository.flush();

		List<StudentEvaluation> evaluations = buildStudentEvaluations(
				users,
				classMembers,
				classById,
				random);
		List<StudentEvaluation> savedEvaluations = studentEvaluationRepository.saveAll(evaluations);
		studentEvaluationRepository.flush();

		assertPersistedData(userById, classById, classMembers);
		logSeedResult(savedTokens, savedEvaluations);
	}

	private void validateDependencies(
			List<User> users,
			List<ClassMember> classMembers,
			List<EnglishClass> classes) {
		if (users.isEmpty()) {
			throw new IllegalStateException("Task 8 requires users from Task 1");
		}
		if (classMembers.isEmpty() || classes.isEmpty()) {
			throw new IllegalStateException("Task 8 requires classes and members from Task 2");
		}
	}

	private void truncateMiscTables() {
		entityManager.createNativeQuery(
				"TRUNCATE refresh_tokens, student_evaluations RESTART IDENTITY")
				.executeUpdate();
		entityManager.clear();
	}

	private List<RefreshToken> buildRefreshTokens(
			List<User> users,
			Random random,
			SecureRandom secureRandom) {
		List<RefreshToken> result = new ArrayList<>();
		Set<String> usedTokenHashes = new HashSet<>();
		OffsetDateTime now = OffsetDateTime.now();
		int tokenOrdinal = 0;

		for (User user : users) {
			int tokenCount = 1 + random.nextInt(3);
			for (int index = 0; index < tokenCount; index++) {
				TokenState state = switch (tokenOrdinal % 5) {
					case 0, 1, 2 -> TokenState.ACTIVE;
					case 3 -> TokenState.REVOKED;
					default -> TokenState.EXPIRED;
				};
				OffsetDateTime expiresAt;
				OffsetDateTime revokedAt = null;
				switch (state) {
					case ACTIVE -> expiresAt = now.plusDays(7 + random.nextInt(24));
					case REVOKED -> {
						expiresAt = now.plusDays(3 + random.nextInt(20));
						revokedAt = now.minusHours(1 + random.nextInt(24 * 14));
					}
					case EXPIRED -> expiresAt = now.minusDays(1 + random.nextInt(30));
					default -> throw new IllegalStateException("Unsupported token state");
				}
				result.add(new RefreshToken(
						user.getId(),
						uniqueTokenHash(secureRandom, usedTokenHashes),
						expiresAt,
						revokedAt,
						USER_AGENTS[random.nextInt(USER_AGENTS.length)],
						generateIpv4(random)));
				tokenOrdinal++;
			}
		}
		return result;
	}

	private List<StudentEvaluation> buildStudentEvaluations(
			List<User> users,
			List<ClassMember> classMembers,
			Map<Long, EnglishClass> classById,
			Random random) {
		Map<Long, List<ClassTeacher>> eligibleClassesByStudentId = new LinkedHashMap<>();
		for (ClassMember classMember : classMembers) {
			EnglishClass englishClass = classById.get(classMember.getClassId());
			if (englishClass == null) {
				throw new IllegalStateException("Class member references missing class: " + classMember.getClassId());
			}
			if (englishClass.getTeacherId() != null) {
				eligibleClassesByStudentId
						.computeIfAbsent(classMember.getStudentId(), ignored -> new ArrayList<>())
						.add(new ClassTeacher(englishClass.getId(), englishClass.getTeacherId()));
			}
		}

		List<StudentEvaluation> result = new ArrayList<>();
		int contentOrdinal = 0;
		for (User user : users) {
			if (user.getRole() != UserRole.STUDENT) {
				continue;
			}
			List<ClassTeacher> eligibleClasses = eligibleClassesByStudentId.getOrDefault(user.getId(), List.of());
			if (eligibleClasses.isEmpty()) {
				// A student without a teacher-assigned class is intentionally waiting for placement.
				continue;
			}

			int evaluationCount = 1 + random.nextInt(3);
			for (int index = 0; index < evaluationCount; index++) {
				ClassTeacher classTeacher = eligibleClasses.get(random.nextInt(eligibleClasses.size()));
				result.add(new StudentEvaluation(
						user.getId(),
						classTeacher.teacherId(),
						classTeacher.classId(),
						EVALUATION_CONTENTS[contentOrdinal++ % EVALUATION_CONTENTS.length]));
			}
		}
		return result;
	}

	private String uniqueTokenHash(SecureRandom secureRandom, Set<String> usedTokenHashes) {
		byte[] bytes = new byte[32];
		String tokenHash;
		do {
			secureRandom.nextBytes(bytes);
			tokenHash = HexFormat.of().formatHex(bytes);
		} while (!usedTokenHashes.add(tokenHash));
		return tokenHash;
	}

	private String generateIpv4(Random random) {
		return (1 + random.nextInt(254))
				+ "." + (1 + random.nextInt(254))
				+ "." + (1 + random.nextInt(254))
				+ "." + (1 + random.nextInt(254));
	}

	private void assertPersistedData(
			Map<Long, User> userById,
			Map<Long, EnglishClass> classById,
			List<ClassMember> classMembers) {
		entityManager.clear();
		List<RefreshToken> tokens = refreshTokenRepository.findAll();
		Set<String> tokenHashes = new HashSet<>();
		for (RefreshToken token : tokens) {
			if (!token.getTokenHash().matches("[0-9a-f]{64}") || !tokenHashes.add(token.getTokenHash())) {
				throw new IllegalStateException("Invalid or duplicate refresh token hash: " + token.getId());
			}
			if (token.getRevokedAt() != null && !token.getRevokedAt().isBefore(token.getExpiresAt())) {
				throw new IllegalStateException("revoked_at must be before expires_at: " + token.getId());
			}
			if (!userById.containsKey(token.getUserId())) {
				throw new IllegalStateException("Refresh token references missing user: " + token.getId());
			}
		}

		Map<Long, Set<Long>> classIdsByStudentId = new LinkedHashMap<>();
		for (ClassMember classMember : classMembers) {
			classIdsByStudentId
					.computeIfAbsent(classMember.getStudentId(), ignored -> new HashSet<>())
					.add(classMember.getClassId());
		}
		List<StudentEvaluation> evaluations = studentEvaluationRepository.findAll();
		for (StudentEvaluation evaluation : evaluations) {
			EnglishClass englishClass = classById.get(evaluation.getClassId());
			if (englishClass == null
					|| englishClass.getTeacherId() == null
					|| !evaluation.getTeacherId().equals(englishClass.getTeacherId())
					|| !classIdsByStudentId.getOrDefault(evaluation.getStudentId(), Set.of())
							.contains(evaluation.getClassId())
					|| userById.get(evaluation.getStudentId()) == null
					|| userById.get(evaluation.getStudentId()).getRole() != UserRole.STUDENT
					|| evaluation.getContent() == null
					|| evaluation.getContent().isBlank()) {
				throw new IllegalStateException("Invalid student evaluation: " + evaluation.getId());
			}
		}
	}

	private void logSeedResult(
			List<RefreshToken> tokens,
			List<StudentEvaluation> evaluations) {
		Map<Long, List<Long>> tokenIdsByUserId = new LinkedHashMap<>();
		for (RefreshToken token : tokens) {
			tokenIdsByUserId.computeIfAbsent(token.getUserId(), ignored -> new ArrayList<>()).add(token.getId());
		}
		Map<Long, List<Long>> evaluationIdsByStudentId = new LinkedHashMap<>();
		for (StudentEvaluation evaluation : evaluations) {
			evaluationIdsByStudentId
					.computeIfAbsent(evaluation.getStudentId(), ignored -> new ArrayList<>())
					.add(evaluation.getId());
		}
		LOGGER.info(
				"Seeded {} refresh tokens and {} student evaluations. Runtime token IDs by user: {}. Runtime evaluation IDs by student: {}",
				tokens.size(),
				evaluations.size(),
				tokenIdsByUserId,
				evaluationIdsByStudentId);
	}

	private <K, V> Map<K, V> indexBy(List<V> values, Function<V, K> keyExtractor) {
		Map<K, V> result = new LinkedHashMap<>();
		for (V value : values) {
			result.put(keyExtractor.apply(value), value);
		}
		return result;
	}

	private record ClassTeacher(Long classId, Long teacherId) {
	}

	private enum TokenState {
		ACTIVE,
		REVOKED,
		EXPIRED
	}
}
