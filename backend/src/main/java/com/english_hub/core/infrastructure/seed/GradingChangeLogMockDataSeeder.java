package com.english_hub.core.infrastructure.seed;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.function.Function;

import com.english_hub.core.infrastructure.persistence.entity.Grading;
import com.english_hub.core.infrastructure.persistence.entity.GradingChangeLog;
import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.infrastructure.persistence.repository.GradingChangeLogRepository;
import com.english_hub.core.infrastructure.persistence.repository.GradingRepository;
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
@Order(7)
public class GradingChangeLogMockDataSeeder implements CommandLineRunner {

	private static final Logger LOGGER = LoggerFactory.getLogger(GradingChangeLogMockDataSeeder.class);
	private static final long RANDOM_SEED = 42L;
	private static final String[] NOTES = {
			"Xem lại thấy chấm nhẹ tay quá, điều chỉnh lại theo rubric.",
			"Học viên khiếu nại, đối chiếu lại và sửa điểm.",
			"Đối chiếu lại bài làm và cập nhật điểm cho sát tiêu chí hơn."
	};

	private final EntityManager entityManager;
	private final GradingRepository gradingRepository;
	private final GradingChangeLogRepository gradingChangeLogRepository;

	public GradingChangeLogMockDataSeeder(
			EntityManager entityManager,
			GradingRepository gradingRepository,
			GradingChangeLogRepository gradingChangeLogRepository) {
		this.entityManager = entityManager;
		this.gradingRepository = gradingRepository;
		this.gradingChangeLogRepository = gradingChangeLogRepository;
	}

	@Override
	@Transactional
	public void run(String... args) {
		List<Grading> completedGradings = gradingRepository.findAll(
				Sort.by(Sort.Direction.ASC, "id")).stream()
				.filter(grading -> grading.getStatus() == GradingStatus.COMPLETED)
				.toList();
		validateDependencies(completedGradings);

		Map<Long, Grading> gradingById = indexBy(completedGradings, Grading::getId);
		truncateChangeLogs();

		List<Grading> shuffled = new ArrayList<>(completedGradings);
		Random random = new Random(RANDOM_SEED);
		Collections.shuffle(shuffled, random);
		int selectedCount = Math.max(1, (int) Math.round(shuffled.size() * 0.10));

		List<GradingChangeLogSeedData> seedData = new ArrayList<>();
		for (int index = 0; index < selectedCount; index++) {
			Grading grading = shuffled.get(index);
			seedData.addAll(createLogs(grading, index, random));
		}

		List<GradingChangeLog> logs = seedData.stream()
				.map(GradingChangeLogSeedData::toEntity)
				.toList();
		List<GradingChangeLog> savedLogs = gradingChangeLogRepository.saveAll(logs);
		gradingChangeLogRepository.flush();

		assertPersistedData(gradingById);
		logSeedResult(savedLogs, seedData);
	}

	private void validateDependencies(List<Grading> completedGradings) {
		if (completedGradings.isEmpty()) {
			throw new IllegalStateException("Task 7 requires COMPLETED gradings from Task 6");
		}
		if (completedGradings.stream().anyMatch(grading -> grading.getFinalScore() == null
				|| grading.getReviewedBy() == null
				|| grading.getGradedAt() == null)) {
			throw new IllegalStateException("Every COMPLETED grading needs final score, reviewer and graded_at");
		}
	}

	private void truncateChangeLogs() {
		entityManager.createNativeQuery(
				"TRUNCATE grading_change_logs RESTART IDENTITY")
				.executeUpdate();
		entityManager.clear();
	}

	private List<GradingChangeLogSeedData> createLogs(
			Grading grading,
			int selectedIndex,
			Random random) {
		BigDecimal finalScore = grading.getFinalScore();
		BigDecimal oldScore = previousScore(grading, random);
		boolean twoLogs = selectedIndex % 10 == 0;
		OffsetDateTime firstChangedAt = grading.getGradedAt().plusMinutes(10);

		if (!twoLogs) {
			return List.of(new GradingChangeLogSeedData(
					grading.getId(),
					grading.getReviewedBy(),
					oldScore,
					finalScore,
					NOTES[selectedIndex % NOTES.length],
					firstChangedAt));
		}

		BigDecimal intermediateScore = oldScore.add(finalScore)
				.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
		return List.of(
				new GradingChangeLogSeedData(
						grading.getId(),
						grading.getReviewedBy(),
						oldScore,
						intermediateScore,
						NOTES[selectedIndex % NOTES.length],
						firstChangedAt),
				new GradingChangeLogSeedData(
						grading.getId(),
						grading.getReviewedBy(),
						intermediateScore,
						finalScore,
						NOTES[(selectedIndex + 1) % NOTES.length],
						grading.getGradedAt().plusMinutes(20)));
	}

	private BigDecimal previousScore(Grading grading, Random random) {
		BigDecimal currentScore = grading.getFinalScore();
		BigDecimal maxScore = grading.getMaxScoreSnapshot();
		BigDecimal delta = BigDecimal.valueOf(5 + random.nextInt(6), 1);
		boolean canLower = currentScore.compareTo(delta) >= 0;
		boolean canRaise = maxScore != null
				&& currentScore.add(delta).compareTo(maxScore) <= 0;

		if (!canLower && !canRaise) {
			throw new IllegalStateException("Cannot create a previous score for grading " + grading.getId());
		}
		if (canLower && canRaise && random.nextBoolean()) {
			return currentScore.subtract(delta);
		}
		return canLower ? currentScore.subtract(delta) : currentScore.add(delta);
	}

	private void assertPersistedData(Map<Long, Grading> gradingById) {
		entityManager.clear();
		List<GradingChangeLog> persistedLogs = gradingChangeLogRepository.findAll(
				Sort.by(Sort.Direction.ASC, "gradingId", "changedAt", "id"));
		Map<Long, List<GradingChangeLog>> logsByGradingId = groupBy(
				persistedLogs,
				GradingChangeLog::getGradingId);

		for (GradingChangeLog log : persistedLogs) {
			Grading grading = gradingById.get(log.getGradingId());
			if (grading == null) {
				throw new IllegalStateException("Change log references a non-COMPLETED grading: " + log.getId());
			}
			if (!grading.getReviewedBy().equals(log.getChangedBy())) {
				throw new IllegalStateException("changed_by mismatch for change log " + log.getId());
			}
			if (!log.getChangedAt().isAfter(grading.getGradedAt())) {
				throw new IllegalStateException("changed_at is not after graded_at for change log " + log.getId());
			}
			if (log.getOldScore() == null
					|| log.getNewScore() == null
					|| log.getOldScore().compareTo(log.getNewScore()) == 0) {
				throw new IllegalStateException("Change log score values must be different: " + log.getId());
			}
		}

		for (Map.Entry<Long, List<GradingChangeLog>> entry : logsByGradingId.entrySet()) {
			List<GradingChangeLog> logs = entry.getValue();
			logs.sort(Comparator.comparing(GradingChangeLog::getChangedAt)
					.thenComparing(GradingChangeLog::getId));
			Grading grading = gradingById.get(entry.getKey());
			GradingChangeLog latest = logs.get(logs.size() - 1);
			if (latest.getNewScore().compareTo(grading.getFinalScore()) != 0) {
				throw new IllegalStateException(
						"Latest change log does not contain the current final score: " + latest.getId());
			}
			if (logs.size() == 2
					&& logs.get(0).getNewScore().compareTo(grading.getFinalScore()) == 0) {
				throw new IllegalStateException("Intermediate change log already contains final score: " + logs.get(0).getId());
			}
		}
	}

	private void logSeedResult(
			List<GradingChangeLog> logs,
			List<GradingChangeLogSeedData> seedData) {
		Map<Long, List<Long>> logIdsByGradingId = new LinkedHashMap<>();
		for (int index = 0; index < logs.size(); index++) {
			GradingChangeLog log = logs.get(index);
			logIdsByGradingId.computeIfAbsent(
					seedData.get(index).gradingId(),
					ignored -> new ArrayList<>())
					.add(log.getId());
		}
		LOGGER.info(
				"Seeded {} grading change logs for {} gradings. Runtime log IDs by grading ID: {}",
				logs.size(),
				logIdsByGradingId.size(),
				logIdsByGradingId);
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

	private record GradingChangeLogSeedData(
			Long gradingId,
			Long changedBy,
			BigDecimal oldScore,
			BigDecimal newScore,
			String note,
			OffsetDateTime changedAt) {

		private GradingChangeLog toEntity() {
			return new GradingChangeLog(
					gradingId,
					changedBy,
					oldScore,
					newScore,
					note,
					changedAt);
		}
	}
}
