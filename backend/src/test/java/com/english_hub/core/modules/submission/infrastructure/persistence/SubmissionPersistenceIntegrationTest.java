package com.english_hub.core.modules.submission.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.ClassStatus;
import com.english_hub.core.infrastructure.persistence.entity.EnglishClass;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.EnglishClassRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.modules.submission.application.page.SubmissionPageRequest;
import com.english_hub.core.modules.submission.domain.model.Grading;
import com.english_hub.core.modules.submission.domain.model.GradingDraft;
import com.english_hub.core.modules.submission.domain.model.GradingMethod;
import com.english_hub.core.modules.submission.domain.model.GradingStatus;
import com.english_hub.core.modules.submission.domain.model.Submission;
import com.english_hub.core.modules.submission.domain.model.SubmissionFilter;
import com.english_hub.core.modules.submission.domain.model.SubmissionModule;
import com.english_hub.core.modules.submission.domain.model.SubmissionPage;
import com.english_hub.core.modules.submission.domain.model.SubmissionStatus;
import com.english_hub.core.modules.submission.domain.repository.GradingRepository;
import com.english_hub.core.modules.submission.domain.repository.SubmissionModuleRepository;
import com.english_hub.core.modules.submission.domain.repository.SubmissionRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;

import jakarta.persistence.EntityManager;

@Testcontainers
@SpringBootTest
@Transactional
class SubmissionPersistenceIntegrationTest {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_test")
			.withUsername("test")
			.withPassword("test");

	@DynamicPropertySource
	static void registerPostgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	@Autowired
	private EntityManager entityManager;

	@Autowired
	private SubmissionRepository submissionRepository;

	@Autowired
	private SubmissionModuleRepository submissionModuleRepository;

	@Autowired
	private GradingRepository gradingRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TeacherProfileRepository teacherProfileRepository;

	@Autowired
	private StudentProfileRepository studentProfileRepository;

	@Autowired
	private EnglishClassRepository englishClassRepository;

	@Autowired
	private AssignmentRepository assignmentRepository;

	@Autowired
	private AssignmentModuleRepository assignmentModuleRepository;

	@Test
	void createPersistsInProgressSubmission() {
		Seed seed = seedBase();

		Submission submission = submissionRepository.create(seed.assignmentId(), seed.studentId(), 1);

		assertThat(submission.getId()).isNotNull();
		assertThat(submission.getAttemptNumber()).isEqualTo(1);
		assertThat(submission.getStatus()).isEqualTo(SubmissionStatus.IN_PROGRESS);
		assertThat(submission.getSubmittedAt()).isNull();

		entityManager.flush();
		entityManager.clear();

		Submission loaded = submissionRepository.findById(submission.getId()).orElseThrow();
		assertThat(loaded.getAssignmentId()).isEqualTo(seed.assignmentId());
		assertThat(loaded.getStudentId()).isEqualTo(seed.studentId());
		assertThat(loaded.getAttemptNumber()).isEqualTo(1);
		assertThat(loaded.getStatus()).isEqualTo(SubmissionStatus.IN_PROGRESS);
	}

	@Test
	void duplicateAttemptViolatesUniqueConstraint() {
		Seed seed = seedBase();

		submissionRepository.create(seed.assignmentId(), seed.studentId(), 1);

		assertThatThrownBy(() -> submissionRepository.create(seed.assignmentId(), seed.studentId(), 1))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void findPageAppliesFiltersAndPagination() {
		Seed seed = seedBase();
		Long assignmentA = seed.assignmentId();
		Long assignmentB = seed.secondAssignmentId();
		Long student2 = createStudent();

		Long a1s1 = submissionRepository.create(assignmentA, seed.studentId(), 1).getId();
		Long a2s1 = submissionRepository.create(assignmentA, seed.studentId(), 2).getId();
		submissionRepository.create(assignmentA, student2, 1);
		submissionRepository.create(assignmentB, seed.studentId(), 1);

		Submission submitted = submissionRepository.findById(a1s1).orElseThrow();
		submitted.setStatus(SubmissionStatus.SUBMITTED);
		submissionRepository.save(submitted);
		entityManager.flush();
		entityManager.clear();

		SubmissionPage all = submissionRepository.findPage(
				new SubmissionFilter(null, null, null), new SubmissionPageRequest(1, 2));
		assertThat(all.submissions()).hasSize(2);
		assertThat(all.total()).isEqualTo(4);
		assertThat(all.getTotalPages()).isEqualTo(2);

		SubmissionPage secondPage = submissionRepository.findPage(
				new SubmissionFilter(null, null, null), new SubmissionPageRequest(2, 2));
		assertThat(secondPage.submissions()).hasSize(2);

		SubmissionPage byAssignment = submissionRepository.findPage(
				new SubmissionFilter(assignmentA, null, null), new SubmissionPageRequest(1, 20));
		assertThat(byAssignment.submissions()).hasSize(3);
		assertThat(byAssignment.submissions()).extracting(Submission::getAssignmentId)
				.containsOnly(assignmentA);

		SubmissionPage byStudent = submissionRepository.findPage(
				new SubmissionFilter(null, seed.studentId(), null), new SubmissionPageRequest(1, 20));
		assertThat(byStudent.submissions()).hasSize(3);
		assertThat(byStudent.submissions()).extracting(Submission::getStudentId)
				.containsOnly(seed.studentId());

		SubmissionPage byStatus = submissionRepository.findPage(
				new SubmissionFilter(null, null, SubmissionStatus.SUBMITTED), new SubmissionPageRequest(1, 20));
		assertThat(byStatus.submissions()).hasSize(1);
		assertThat(byStatus.submissions()).extracting(Submission::getId).containsExactly(a1s1);

		SubmissionPage combined = submissionRepository.findPage(
				new SubmissionFilter(assignmentA, seed.studentId(), null), new SubmissionPageRequest(1, 20));
		assertThat(combined.submissions()).hasSize(2);

		entityManager.flush();
		entityManager.clear();
		assertThat(submissionRepository.findById(a2s1)).isPresent();
	}

	@Test
	void bulkCreateCreatesOneModuleRowPerModuleId() {
		Seed seed = seedBase();
		Long submissionId = submissionRepository.create(seed.assignmentId(), seed.studentId(), 1).getId();

		List<SubmissionModule> modules =
				submissionModuleRepository.bulkCreate(submissionId, List.of(seed.module1Id(), seed.module2Id()));

		assertThat(modules).hasSize(2);
		assertThat(modules).extracting(SubmissionModule::getId).doesNotContainNull();
		assertThat(modules).extracting(SubmissionModule::getStatus)
				.containsOnly(SubmissionStatus.IN_PROGRESS);
		assertThat(modules).extracting(SubmissionModule::getModuleId)
				.containsExactlyInAnyOrder(seed.module1Id(), seed.module2Id());

		entityManager.flush();
		entityManager.clear();

		List<SubmissionModule> loaded = submissionModuleRepository.findBySubmissionId(submissionId);
		assertThat(loaded).hasSize(2);
		assertThat(loaded).extracting(SubmissionModule::getModuleId)
				.containsExactlyInAnyOrder(seed.module1Id(), seed.module2Id());
	}

	@Test
	void bulkCreateDuplicatesViolateUniqueConstraint() {
		Seed seed = seedBase();
		Long submissionId = submissionRepository.create(seed.assignmentId(), seed.studentId(), 1).getId();
		submissionModuleRepository.bulkCreate(submissionId, List.of(seed.module1Id()));

		assertThatThrownBy(() -> submissionModuleRepository.bulkCreate(submissionId, List.of(seed.module1Id())))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void bulkCreateCreatesPendingGradingsWithResolvedMethod() {
		Seed seed = seedBase();
		Long submissionId = submissionRepository.create(seed.assignmentId(), seed.studentId(), 1).getId();
		List<SubmissionModule> modules =
				submissionModuleRepository.bulkCreate(submissionId, List.of(seed.module1Id(), seed.module2Id()));

		List<GradingDraft> drafts = List.of(
				new GradingDraft(modules.get(0).getId(), GradingMethod.AUTO),
				new GradingDraft(modules.get(1).getId(), GradingMethod.TEACHER_MANUAL));

		List<Grading> gradings = gradingRepository.bulkCreate(drafts);

		assertThat(gradings).hasSize(2);
		assertThat(gradings).extracting(Grading::getId).doesNotContainNull();
		assertThat(gradings).extracting(Grading::getStatus).containsOnly(GradingStatus.PENDING);
		assertThat(gradings).extracting(Grading::getMethod)
				.containsExactly(GradingMethod.AUTO, GradingMethod.TEACHER_MANUAL);

		entityManager.flush();
		entityManager.clear();

		Grading first = gradingRepository.findBySubmissionModuleId(modules.get(0).getId()).get(0);
		assertThat(first.getMethod()).isEqualTo(GradingMethod.AUTO);
		assertThat(first.getStatus()).isEqualTo(GradingStatus.PENDING);
	}

	@Test
	void submissionModulesEachHaveOneGrading() {
		Seed seed = seedBase();
		Long submissionId = submissionRepository.create(seed.assignmentId(), seed.studentId(), 1).getId();
		List<SubmissionModule> modules =
				submissionModuleRepository.bulkCreate(submissionId, List.of(seed.module1Id(), seed.module2Id()));
		List<GradingDraft> drafts = modules.stream()
				.map(m -> new GradingDraft(m.getId(), GradingMethod.AUTO))
				.toList();
		gradingRepository.bulkCreate(drafts);

		entityManager.flush();
		entityManager.clear();

		List<Grading> gradings = gradingRepository.findBySubmissionModuleIds(
				modules.stream().map(SubmissionModule::getId).toList());
		assertThat(gradings).hasSize(2);
		assertThat(gradings).extracting(Grading::getSubmissionModuleId)
				.containsExactlyInAnyOrderElementsOf(
						modules.stream().map(SubmissionModule::getId).toList());
	}

	private Long createStudent() {
		User student = userRepository.save(new User(
				"Persistence Student 2",
				"persistence-student-2@example.com",
				null,
				"password-hash",
				UserRole.STUDENT,
				UserStatus.ACTIVE,
				false));
		studentProfileRepository.save(new StudentProfile(student, "PERSISTENCE-2", LocalDate.of(2000, 1, 1), null));
		return student.getId();
	}

	private Seed seedBase() {
		User teacher = userRepository.save(new User(
				"Persistence Teacher",
				"persistence-teacher@example.com",
				null,
				"password-hash",
				UserRole.TEACHER,
				UserStatus.ACTIVE,
				false));
		teacherProfileRepository.save(new TeacherProfile(teacher, "English"));

		EnglishClass englishClass = englishClassRepository.save(new EnglishClass(
				"Persistence Class",
				"Intermediate",
				"Test class",
				LocalDate.of(2026, 1, 1),
				LocalDate.of(2026, 12, 31),
				ClassStatus.ACTIVE,
				teacher.getId()));

		Long assignmentA = assignmentRepository.save(new Assignment(
				englishClass.getId(),
				"Persistence Assignment A",
				"Test assignment",
				OffsetDateTime.of(2026, 1, 1, 9, 0, 0, 0, ZoneOffset.UTC),
				OffsetDateTime.of(2026, 12, 31, 17, 0, 0, 0, ZoneOffset.UTC),
				3,
				false,
				AssignmentStatus.PUBLISHED)).getId();

		Long assignmentB = assignmentRepository.save(new Assignment(
				englishClass.getId(),
				"Persistence Assignment B",
				"Test assignment",
				OffsetDateTime.of(2026, 1, 1, 9, 0, 0, 0, ZoneOffset.UTC),
				OffsetDateTime.of(2026, 12, 31, 17, 0, 0, 0, ZoneOffset.UTC),
				3,
				false,
				AssignmentStatus.PUBLISHED)).getId();

		Long module1 = assignmentModuleRepository.save(new AssignmentModule(
				assignmentA,
				ModuleSkill.READING,
				ModuleTaskType.QUIZ,
				1,
				"Read and answer.",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
				null)).getId();

		Long module2 = assignmentModuleRepository.save(new AssignmentModule(
				assignmentA,
				ModuleSkill.WRITING,
				ModuleTaskType.ESSAY,
				2,
				"Write an essay.",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
				null)).getId();

		User student = userRepository.save(new User(
				"Persistence Student",
				"persistence-student@example.com",
				null,
				"password-hash",
				UserRole.STUDENT,
				UserStatus.ACTIVE,
				false));
		studentProfileRepository.save(new StudentProfile(student, "PERSISTENCE-1", LocalDate.of(2000, 1, 1), null));

		return new Seed(assignmentA, assignmentB, module1, module2, student.getId());
	}

	private record Seed(Long assignmentId, Long secondAssignmentId, Long module1Id, Long module2Id, Long studentId) {
	}
}