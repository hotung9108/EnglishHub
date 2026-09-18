package com.english_hub.backend.seed;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import com.english_hub.backend.classes.entity.ClassMember;
import com.english_hub.backend.classes.entity.ClassStatus;
import com.english_hub.backend.classes.entity.EnglishClass;
import com.english_hub.backend.classes.repository.ClassMemberRepository;
import com.english_hub.backend.classes.repository.EnglishClassRepository;
import com.english_hub.backend.user.entity.StudentProfile;
import com.english_hub.backend.user.entity.TeacherProfile;
import com.english_hub.backend.user.repository.StudentProfileRepository;
import com.english_hub.backend.user.repository.TeacherProfileRepository;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("seed")
@Order(2)
public class ClassMockDataSeeder implements CommandLineRunner {

	private static final Logger LOGGER = LoggerFactory.getLogger(ClassMockDataSeeder.class);
	private static final long RANDOM_SEED = 42L;
	private static final int STANDARD_MEMBER_MIN = 15;
	private static final int STANDARD_MEMBER_RANGE = 6;
	private static final int CANCELLED_MEMBER_COUNT = 1;

	private final EntityManager entityManager;
	private final EnglishClassRepository englishClassRepository;
	private final ClassMemberRepository classMemberRepository;
	private final TeacherProfileRepository teacherProfileRepository;
	private final StudentProfileRepository studentProfileRepository;

	public ClassMockDataSeeder(
			EntityManager entityManager,
			EnglishClassRepository englishClassRepository,
			ClassMemberRepository classMemberRepository,
			TeacherProfileRepository teacherProfileRepository,
			StudentProfileRepository studentProfileRepository) {
		this.entityManager = entityManager;
		this.englishClassRepository = englishClassRepository;
		this.classMemberRepository = classMemberRepository;
		this.teacherProfileRepository = teacherProfileRepository;
		this.studentProfileRepository = studentProfileRepository;
	}

	@Override
	@Transactional
	public void run(String... args) {
		List<Long> teacherUserIds = teacherProfileRepository.findAll().stream()
				.map(TeacherProfile::getUserId)
				.toList();
		List<Long> studentUserIds = studentProfileRepository.findAll().stream()
				.map(StudentProfile::getUserId)
				.toList();
		validateDependencies(teacherUserIds, studentUserIds);

		truncateClassTables();

		Random random = new Random(RANDOM_SEED);
		LocalDate today = LocalDate.now();
		List<ClassSeedData> classSeedData = buildClassSeedData(today, teacherUserIds, random);
		List<EnglishClass> classes = classSeedData.stream()
				.map(data -> new EnglishClass(
						data.name(),
						data.level(),
						data.description(),
						data.startDate(),
						data.endDate(),
						data.status(),
						data.teacherId()))
				.toList();

		List<EnglishClass> savedClasses = englishClassRepository.saveAll(classes);
		englishClassRepository.flush();

		Map<Long, Long> teacherIdByClassId = new LinkedHashMap<>();
		Map<Long, List<Long>> studentIdsByClassId = new LinkedHashMap<>();
		List<ClassMember> classMembers = new ArrayList<>();
		for (EnglishClass englishClass : savedClasses) {
			List<Long> selectedStudentIds = selectStudentIds(studentUserIds, englishClass.getStatus(), random);
			teacherIdByClassId.put(englishClass.getId(), englishClass.getTeacherId());
			studentIdsByClassId.put(englishClass.getId(), selectedStudentIds);
			selectedStudentIds.forEach(studentId ->
					classMembers.add(new ClassMember(englishClass.getId(), studentId)));
		}

		classMemberRepository.saveAll(classMembers);
		classMemberRepository.flush();

		LOGGER.info(
				"Seeded {} classes and {} class members. Runtime teacher IDs by class: {}. Runtime student IDs by class: {}",
				savedClasses.size(),
				classMembers.size(),
				teacherIdByClassId,
				studentIdsByClassId);
	}

	private void validateDependencies(List<Long> teacherUserIds, List<Long> studentUserIds) {
		if (teacherUserIds.size() < 1) {
			throw new IllegalStateException("Task 2 requires at least one teacher profile from Task 1");
		}
		if (studentUserIds.size() < STANDARD_MEMBER_MIN) {
			throw new IllegalStateException(
					"Task 2 requires at least " + STANDARD_MEMBER_MIN + " student profiles from Task 1");
		}
	}

	private void truncateClassTables() {
		entityManager.createNativeQuery(
				"TRUNCATE class_members, classes RESTART IDENTITY CASCADE")
				.executeUpdate();
		entityManager.clear();
	}

	private List<ClassSeedData> buildClassSeedData(
			LocalDate today,
			List<Long> teacherUserIds,
			Random random) {
		Long activeTeacherOne = pick(teacherUserIds, random);
		Long activeTeacherTwo = pick(teacherUserIds, random);
		Long activeTeacherThree = pick(teacherUserIds, random);
		Long activeTeacherFour = pick(teacherUserIds, random);
		Long completedTeacher = pick(teacherUserIds, random);

		LocalDate completedEndDate = today.minusDays(1 + random.nextInt(14));
		return List.of(
				new ClassSeedData(
						"IELTS Foundation K1",
						"IELTS 4.0-5.0",
						"Củng cố nền tảng ngữ pháp, từ vựng và bốn kỹ năng IELTS.",
						today.minusMonths(1),
						today.plusMonths(2),
						ClassStatus.ACTIVE,
						activeTeacherOne),
				new ClassSeedData(
						"Tiếng Anh Giao Tiếp Cơ Bản A1",
						"A1",
						"Luyện giao tiếp hằng ngày cho người mới bắt đầu.",
						today.plusDays(7),
						today.plusMonths(4),
						ClassStatus.ACTIVE,
						activeTeacherTwo),
				new ClassSeedData(
						"IELTS Intensive 6.5+",
						"IELTS 6.5+",
						"Luyện chuyên sâu theo mục tiêu 6.5 trở lên.",
						today.minusMonths(2),
						today.plusMonths(1),
						ClassStatus.ACTIVE,
						activeTeacherThree),
				new ClassSeedData(
						"Tiếng Anh Tổng Quát B1",
						"B1",
						"Phát triển khả năng sử dụng tiếng Anh trong học tập và công việc.",
						today.minusDays(10),
						today.plusMonths(3),
						ClassStatus.ACTIVE,
						activeTeacherFour),
				new ClassSeedData(
						"TOEIC Pre-Intermediate A2",
						"A2",
						"Khoá luyện nền tảng TOEIC đã hoàn thành.",
						completedEndDate.minusMonths(3),
						completedEndDate,
						ClassStatus.COMPLETED,
						completedTeacher),
				new ClassSeedData(
						"Lớp Ôn Thi B2 - Tạm Huỷ",
						"B2",
						"Lớp tạm huỷ sớm trước khi phân công giáo viên.",
						today.minusMonths(1),
						today.plusMonths(2),
						ClassStatus.CANCELLED,
						null));
	}

	private List<Long> selectStudentIds(
			List<Long> studentUserIds,
			ClassStatus classStatus,
			Random random) {
		int memberCount = classStatus == ClassStatus.CANCELLED
				? CANCELLED_MEMBER_COUNT
				: STANDARD_MEMBER_MIN + random.nextInt(STANDARD_MEMBER_RANGE);
		List<Long> shuffledStudentIds = new ArrayList<>(studentUserIds);
		Collections.shuffle(shuffledStudentIds, random);
		return List.copyOf(shuffledStudentIds.subList(0, memberCount));
	}

	private Long pick(List<Long> values, Random random) {
		return values.get(random.nextInt(values.size()));
	}

	private record ClassSeedData(
			String name,
			String level,
			String description,
			LocalDate startDate,
			LocalDate endDate,
			ClassStatus status,
			Long teacherId) {
	}
}
