package com.english_hub.core.modules.student_evaluation.integration;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.StudentEvaluation;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluationFilter;
import com.english_hub.core.modules.student_evaluation.domain.repository.StudentEvaluationRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest
@Transactional
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
class StudentEvaluationPersistenceIntegrationTest {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_student_evaluation_persistence_test")
			.withUsername("test")
			.withPassword("test");

	@DynamicPropertySource
	static void registerPostgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	private final StudentEvaluationRepository studentEvaluationRepository;
	private final com.english_hub.core.infrastructure.persistence.repository.StudentEvaluationRepository jpaRepository;
	private final UserRepository userRepository;
	private final TeacherProfileRepository teacherProfileRepository;
	private final StudentProfileRepository studentProfileRepository;
	private final ClassJpaRepository classRepository;
	private final EntityManager entityManager;

	StudentEvaluationPersistenceIntegrationTest(
			StudentEvaluationRepository studentEvaluationRepository,
			com.english_hub.core.infrastructure.persistence.repository.StudentEvaluationRepository jpaRepository,
			UserRepository userRepository,
			TeacherProfileRepository teacherProfileRepository,
			StudentProfileRepository studentProfileRepository,
			ClassJpaRepository classRepository,
			EntityManager entityManager) {
		this.studentEvaluationRepository = studentEvaluationRepository;
		this.jpaRepository = jpaRepository;
		this.userRepository = userRepository;
		this.teacherProfileRepository = teacherProfileRepository;
		this.studentProfileRepository = studentProfileRepository;
		this.classRepository = classRepository;
		this.entityManager = entityManager;
	}

	private long teacherId;
	private long studentId;
	private long classOneId;
	private long classTwoId;

	@BeforeEach
	void setUp() {
		teacherId = createUser(UserRole.TEACHER, "Persistence Teacher");
		studentId = createUser(UserRole.STUDENT, "Persistence Student");
		teacherProfileRepository.save(new TeacherProfile(user(teacherId), "English"));
		studentProfileRepository.save(new StudentProfile(
				user(studentId), "SE-" + UUID.randomUUID().toString().substring(0, 10),
					LocalDate.of(2004, 3, 4), null));
		classOneId = createClass("Persistence Class One");
		classTwoId = createClass("Persistence Class Two");
	}

	@Test
	void specificationRequiresStudentIdAddsOptionalClassFilterAndSortsByCreatedAtDescending() {
		long oldestId = saveEvaluation(classOneId, "Oldest", "2026-09-20T10:00:00Z");
		long newestId = saveEvaluation(classOneId, "Newest", "2026-09-22T10:00:00Z");
		long otherClassId = saveEvaluation(classTwoId, "Other class", "2026-09-21T10:00:00Z");
		entityManager.flush();
		entityManager.clear();

		var firstPage = studentEvaluationRepository.findPage(new StudentEvaluationFilter(studentId, null), 1, 1);
		var secondPage = studentEvaluationRepository.findPage(new StudentEvaluationFilter(studentId, null), 2, 1);
		var classFiltered = studentEvaluationRepository.findPage(
				new StudentEvaluationFilter(studentId, classOneId), 1, 20);
		var otherStudent = studentEvaluationRepository.findPage(
				new StudentEvaluationFilter(studentId + 999, null), 1, 20);

		assertThat(firstPage.getTotalElements()).isEqualTo(3);
		assertThat(firstPage.getContent()).extracting(com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluation::id)
				.containsExactly(newestId);
		assertThat(secondPage.getContent()).extracting(com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluation::id)
				.containsExactly(otherClassId);
		assertThat(classFiltered.getTotalElements()).isEqualTo(2);
		assertThat(classFiltered.getContent()).extracting(com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluation::id)
				.containsExactly(newestId, oldestId);
		assertThat(otherStudent.getTotalElements()).isZero();
		assertThat(firstPage.getContent().getFirst().createdAt()).isEqualTo(Instant.parse("2026-09-22T10:00:00Z"));
	}

	@Test
	void adapterMapsAndUpdatesContentAndDeletesWithoutChangingTheAuthorOrClass() {
		var created = studentEvaluationRepository.save(new com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluation(
				null, studentId, teacherId, classOneId, null, "Original content", null));

		var loaded = studentEvaluationRepository.findById(created.id()).orElseThrow();
		assertThat(loaded.studentId()).isEqualTo(studentId);
		assertThat(loaded.teacherId()).isEqualTo(teacherId);
		assertThat(loaded.classId()).isEqualTo(classOneId);
		assertThat(loaded.createdAt()).isNotNull();

		studentEvaluationRepository.save(loaded.withContent("Updated content"));
		entityManager.flush();
		entityManager.clear();
		assertThat(jpaRepository.findById(created.id()).orElseThrow().getContent()).isEqualTo("Updated content");

		studentEvaluationRepository.deleteById(created.id());
		entityManager.flush();
		assertThat(studentEvaluationRepository.findById(created.id())).isEmpty();
	}

	private long createUser(UserRole role, String name) {
		return userRepository.save(new User(
				name,
				name.toLowerCase().replace(' ', '.') + "." + UUID.randomUUID() + "@test.local",
				null,
				"test-hash",
				role,
				UserStatus.ACTIVE,
				false)).getId();
	}

	private User user(long id) {
		return userRepository.findById(id).orElseThrow();
	}

	private long createClass(String name) {
		return classRepository.saveAndFlush(new ClassEntity(
				name + " " + UUID.randomUUID(),
				"Intermediate",
				"Student evaluation persistence fixture",
				LocalDate.of(2026, 9, 1),
				null,
				ClassStatus.ACTIVE,
				teacherId)).getId();
	}

	private long saveEvaluation(long classId, String content, String createdAt) {
		StudentEvaluation evaluation = new StudentEvaluation(studentId, teacherId, classId, content);
		ReflectionTestUtils.setField(evaluation, "createdAt", Instant.parse(createdAt));
		return jpaRepository.saveAndFlush(evaluation).getId();
	}
}
