package com.english_hub.backend.seed;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Random;

import com.english_hub.backend.assignments.entity.Assignment;
import com.english_hub.backend.assignments.entity.AssignmentModule;
import com.english_hub.backend.assignments.entity.AssignmentStatus;
import com.english_hub.backend.assignments.entity.ModuleSkill;
import com.english_hub.backend.assignments.repository.AssignmentModuleRepository;
import com.english_hub.backend.assignments.repository.AssignmentRepository;
import com.english_hub.backend.classes.entity.ClassMember;
import com.english_hub.backend.classes.repository.ClassMemberRepository;
import com.english_hub.backend.submissions.entity.Submission;
import com.english_hub.backend.submissions.entity.SubmissionModule;
import com.english_hub.backend.submissions.entity.SubmissionStatus;
import com.english_hub.backend.submissions.repository.SubmissionModuleRepository;
import com.english_hub.backend.submissions.repository.SubmissionRepository;
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
@Order(4)
public class SubmissionMockDataSeeder implements CommandLineRunner {

	private static final Logger LOGGER = LoggerFactory.getLogger(SubmissionMockDataSeeder.class);
	private static final long RANDOM_SEED = 42L;

	private final EntityManager entityManager;
	private final AssignmentRepository assignmentRepository;
	private final AssignmentModuleRepository assignmentModuleRepository;
	private final ClassMemberRepository classMemberRepository;
	private final SubmissionRepository submissionRepository;
	private final SubmissionModuleRepository submissionModuleRepository;

	public SubmissionMockDataSeeder(
			EntityManager entityManager,
			AssignmentRepository assignmentRepository,
			AssignmentModuleRepository assignmentModuleRepository,
			ClassMemberRepository classMemberRepository,
			SubmissionRepository submissionRepository,
			SubmissionModuleRepository submissionModuleRepository) {
		this.entityManager = entityManager;
		this.assignmentRepository = assignmentRepository;
		this.assignmentModuleRepository = assignmentModuleRepository;
		this.classMemberRepository = classMemberRepository;
		this.submissionRepository = submissionRepository;
		this.submissionModuleRepository = submissionModuleRepository;
	}

	@Override
	@Transactional
	public void run(String... args) {
		List<Assignment> assignments = assignmentRepository.findAll(
				Sort.by(Sort.Direction.ASC, "id"));
		List<AssignmentModule> modules = assignmentModuleRepository.findAll(
				Sort.by(Sort.Direction.ASC, "assignmentId", "orderIndex"));
		List<ClassMember> classMembers = classMemberRepository.findAll();
		Map<Long, List<AssignmentModule>> modulesByAssignmentId = groupModules(modules);
		Map<Long, List<Long>> studentIdsByClassId = groupStudents(classMembers);

		validateDependencies(assignments, modules, classMembers);
		truncateSubmissionTables();

		Random random = new Random(RANDOM_SEED);
		List<SubmissionSeedData> seedData = buildSubmissionSeedData(
				assignments,
				modulesByAssignmentId,
				studentIdsByClassId,
				random);

		List<Submission> submissions = seedData.stream()
				.map(data -> new Submission(
						data.assignmentId(),
						data.studentId(),
						data.attemptNumber(),
						data.submittedAt(),
						data.status()))
				.toList();
		List<Submission> savedSubmissions = submissionRepository.saveAll(submissions);
		submissionRepository.flush();

		List<SubmissionModule> submissionModules = new ArrayList<>(savedSubmissions.size() * 4);
		for (int index = 0; index < savedSubmissions.size(); index++) {
			Submission submission = savedSubmissions.get(index);
			SubmissionSeedData data = seedData.get(index);
			for (AssignmentModule module : modulesByAssignmentId.get(data.assignmentId())) {
				submissionModules.add(new SubmissionModule(
						submission.getId(),
						module.getId(),
						data.status()));
			}
		}

		List<SubmissionModule> savedSubmissionModules = submissionModuleRepository.saveAll(submissionModules);
		submissionModuleRepository.flush();
		logSeedResult(savedSubmissions, savedSubmissionModules, seedData, modulesByAssignmentId);
	}

	private Map<Long, List<AssignmentModule>> groupModules(List<AssignmentModule> modules) {
		Map<Long, List<AssignmentModule>> result = new LinkedHashMap<>();
		for (AssignmentModule module : modules) {
			result.computeIfAbsent(module.getAssignmentId(), ignored -> new ArrayList<>()).add(module);
		}
		return result;
	}

	private Map<Long, List<Long>> groupStudents(List<ClassMember> classMembers) {
		Map<Long, List<Long>> result = new LinkedHashMap<>();
		classMembers.stream()
				.sorted(Comparator.comparing(ClassMember::getClassId)
						.thenComparing(ClassMember::getStudentId))
				.forEach(member -> result
						.computeIfAbsent(member.getClassId(), ignored -> new ArrayList<>())
						.add(member.getStudentId()));
		return result;
	}

	private void validateDependencies(
			List<Assignment> assignments,
			List<AssignmentModule> modules,
			List<ClassMember> classMembers) {
		if (assignments.isEmpty()) {
			throw new IllegalStateException("Task 4 requires assignments from Task 3");
		}
		if (modules.isEmpty()) {
			throw new IllegalStateException("Task 4 requires modules from Task 3");
		}
		if (classMembers.isEmpty()) {
			throw new IllegalStateException("Task 4 requires class members from Task 2");
		}
	}

	private void truncateSubmissionTables() {
		entityManager.createNativeQuery(
				"TRUNCATE submission_modules, submissions RESTART IDENTITY CASCADE")
				.executeUpdate();
		entityManager.clear();
	}

	private List<SubmissionSeedData> buildSubmissionSeedData(
			List<Assignment> assignments,
			Map<Long, List<AssignmentModule>> modulesByAssignmentId,
			Map<Long, List<Long>> studentIdsByClassId,
			Random random) {
		List<SubmissionSeedData> result = new ArrayList<>();
		int eligibleAssignmentIndex = 0;

		for (Assignment assignment : assignments) {
			if (assignment.getStatus() == AssignmentStatus.DRAFT) {
				continue;
			}

			List<AssignmentModule> modules = modulesByAssignmentId.get(assignment.getId());
			if (modules == null || modules.size() != 4) {
				throw new IllegalStateException(
						"Every eligible assignment must have exactly four modules: " + assignment.getId());
			}
			validateAssignmentWindow(assignment);

			List<Long> studentIds = studentIdsByClassId.getOrDefault(
					assignment.getClassId(),
					List.of());
			Set<Long> skippedStudentIds = closedAssignmentSkippedStudents(
					assignment,
					studentIds,
					random);

			for (int studentIndex = 0; studentIndex < studentIds.size(); studentIndex++) {
				Long studentId = studentIds.get(studentIndex);
				if (skippedStudentIds.contains(studentId)
						|| publishedStudentHasNotStarted(assignment, studentIndex, eligibleAssignmentIndex)) {
					continue;
				}

				SubmissionStatus status = chooseStatus(
						assignment.getStatus(),
						studentIndex,
						eligibleAssignmentIndex);
				addSubmission(result, assignment, studentId, 1, status, random);

				if (status != SubmissionStatus.IN_PROGRESS
						&& shouldCreateAttempt(assignment, studentIndex, eligibleAssignmentIndex, 2)) {
					addSubmission(result, assignment, studentId, 2, status, random);
				}
				if (status != SubmissionStatus.IN_PROGRESS
						&& shouldCreateAttempt(assignment, studentIndex, eligibleAssignmentIndex, 3)) {
					addSubmission(result, assignment, studentId, 3, status, random);
				}
			}
			eligibleAssignmentIndex++;
		}
		return result;
	}

	private Set<Long> closedAssignmentSkippedStudents(
			Assignment assignment,
			List<Long> studentIds,
			Random random) {
		if (assignment.getStatus() != AssignmentStatus.CLOSED || studentIds.isEmpty()) {
			return Set.of();
		}
		List<Long> shuffledStudentIds = new ArrayList<>(studentIds);
		Collections.shuffle(shuffledStudentIds, random);
		int skippedCount = Math.max(1, (int) Math.round(studentIds.size() * 0.10));
		return new HashSet<>(shuffledStudentIds.subList(0, skippedCount));
	}

	private boolean publishedStudentHasNotStarted(
			Assignment assignment,
			int studentIndex,
			int eligibleAssignmentIndex) {
		return assignment.getStatus() == AssignmentStatus.PUBLISHED
				&& (studentIndex + eligibleAssignmentIndex) % 5 < 2;
	}

	private SubmissionStatus chooseStatus(
			AssignmentStatus assignmentStatus,
			int studentIndex,
			int eligibleAssignmentIndex) {
		if (assignmentStatus == AssignmentStatus.CLOSED) {
			return (studentIndex + eligibleAssignmentIndex) % 3 == 0
					? SubmissionStatus.GRADED
					: SubmissionStatus.SUBMITTED;
		}
		return (studentIndex + eligibleAssignmentIndex) % 5 == 2
				? SubmissionStatus.IN_PROGRESS
				: SubmissionStatus.SUBMITTED;
	}

	private boolean shouldCreateAttempt(
			Assignment assignment,
			int studentIndex,
			int eligibleAssignmentIndex,
			int attemptNumber) {
			if (assignment.getMaxSubmissions() != null
					&& assignment.getMaxSubmissions() < attemptNumber) {
				return false;
			}
			int position = studentIndex + eligibleAssignmentIndex;
			return attemptNumber == 2
					? position % 10 == 0
					: position % 50 == 0;
	}

	private void addSubmission(
			List<SubmissionSeedData> result,
			Assignment assignment,
			Long studentId,
			int attemptNumber,
			SubmissionStatus status,
			Random random) {
		OffsetDateTime submittedAt = status == SubmissionStatus.IN_PROGRESS
				? null
				: randomSubmittedAt(assignment, random);
		result.add(new SubmissionSeedData(
				assignment.getId(),
				studentId,
				attemptNumber,
				submittedAt,
				status));
	}

	private OffsetDateTime randomSubmittedAt(Assignment assignment, Random random) {
		long durationSeconds = Duration.between(
				assignment.getOpenAt(),
				assignment.getCloseAt()).getSeconds();
		return assignment.getOpenAt().plusSeconds(random.nextLong(durationSeconds + 1));
	}

	private void validateAssignmentWindow(Assignment assignment) {
		if (!assignment.getOpenAt().isBefore(assignment.getCloseAt())) {
			throw new IllegalStateException(
					"Assignment open_at must be before close_at: " + assignment.getId());
		}
	}

	private void logSeedResult(
			List<Submission> submissions,
			List<SubmissionModule> submissionModules,
			List<SubmissionSeedData> seedData,
			Map<Long, List<AssignmentModule>> modulesByAssignmentId) {
		Map<Long, SubmissionRuntimeData> submissionIds = new LinkedHashMap<>();
		for (int index = 0; index < submissions.size(); index++) {
			Submission submission = submissions.get(index);
			SubmissionSeedData data = seedData.get(index);
			submissionIds.put(
					submission.getId(),
					new SubmissionRuntimeData(data.assignmentId(), data.studentId(), data.status()));
		}

		Map<Long, SubmissionModuleRuntimeData> submissionModuleIds = new LinkedHashMap<>();
		int moduleIndex = 0;
		for (Submission submission : submissions) {
			SubmissionSeedData data = seedData.get(moduleIndex / 4);
			for (AssignmentModule module : modulesByAssignmentId.get(data.assignmentId())) {
				SubmissionModule savedModule = submissionModules.get(moduleIndex++);
				submissionModuleIds.put(
						savedModule.getId(),
						new SubmissionModuleRuntimeData(
								submission.getId(),
								module.getId(),
								module.getSkill(),
								data.status()));
			}
		}

		LOGGER.info(
				"Seeded {} submissions and {} submission modules. Runtime submission IDs: {}. Runtime submission module IDs: {}",
				submissions.size(),
				submissionModules.size(),
				submissionIds,
				submissionModuleIds);
	}

	private record SubmissionSeedData(
			Long assignmentId,
			Long studentId,
			int attemptNumber,
			OffsetDateTime submittedAt,
			SubmissionStatus status) {
	}

	private record SubmissionRuntimeData(
			Long assignmentId,
			Long studentId,
			SubmissionStatus status) {
	}

	private record SubmissionModuleRuntimeData(
			Long submissionId,
			Long moduleId,
			ModuleSkill skill,
			SubmissionStatus status) {
	}
}
