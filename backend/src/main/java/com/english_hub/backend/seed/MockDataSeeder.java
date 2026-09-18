package com.english_hub.backend.seed;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;

import com.english_hub.backend.user.entity.StudentProfile;
import com.english_hub.backend.user.entity.TeacherProfile;
import com.english_hub.backend.user.entity.User;
import com.english_hub.backend.user.entity.UserRole;
import com.english_hub.backend.user.entity.UserStatus;
import com.english_hub.backend.user.repository.StudentProfileRepository;
import com.english_hub.backend.user.repository.TeacherProfileRepository;
import com.english_hub.backend.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("seed")
@Order(1)
public class MockDataSeeder implements CommandLineRunner {

	private static final Logger LOGGER = LoggerFactory.getLogger(MockDataSeeder.class);
	private static final String SEED_PASSWORD = "Password123!";
	private static final long RANDOM_SEED = 42L;
	private static final int ADMIN_COUNT = 3;
	private static final int TEACHER_COUNT = 8;
	private static final int STUDENT_COUNT = 80;
	private static final int LOCKED_STUDENT_COUNT = 4;
	private static final int NULL_OPTIONAL_FIELD_COUNT = 12;

	private static final String[] SURNAMES = {
			"Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Vũ", "Đặng", "Bùi", "Đỗ",
			"Võ", "Phan", "Đinh", "Ngô", "Dương", "Lý", "Mai", "Trịnh", "Cao", "Tạ"
	};

	private static final String[] MALE_MIDDLE_NAMES = {
			"Văn", "Hữu", "Minh", "Đức", "Quốc", "Gia", "Nhật", "Thanh", "Hoàng", "Anh"
	};

	private static final String[] FEMALE_MIDDLE_NAMES = {
			"Thị", "Ngọc", "Thuỳ", "Thanh", "Khánh", "Mai", "Bảo", "Quỳnh", "Mỹ", "Diệu"
	};

	private static final String[] MALE_GIVEN_NAMES = {
			"An", "Bảo", "Dũng", "Hải", "Hoàng", "Khang", "Long", "Minh", "Nam", "Phúc",
			"Quân", "Sơn", "Thắng", "Tuấn", "Việt", "Khôi", "Huy", "Kiên", "Tùng", "Vinh"
	};

	private static final String[] FEMALE_GIVEN_NAMES = {
			"Anh", "Chi", "Duyên", "Hà", "Hạnh", "Linh", "Mai", "My", "Ngân", "Phương",
			"Thảo", "Trang", "Uyên", "Vy", "Yến", "Hân", "Trân", "Nhi", "Như", "Quỳnh"
	};

	private static final String[] PHONE_PREFIXES = {
			"032", "033", "034", "035", "036", "037", "038", "039", "052", "056", "058", "059",
			"070", "076", "077", "078", "079", "081", "082", "083", "084", "085", "086", "088",
			"089", "090", "091", "093", "094", "096", "097", "098", "099"
	};

	private static final String[] TEACHER_SPECIALIZATIONS = {
			"Luyện thi IELTS",
			"Ngữ pháp & Từ vựng",
			"Kỹ năng Nói - Phát âm",
			"Kỹ năng Viết học thuật",
			"Tiếng Anh giao tiếp"
	};

	private final EntityManager entityManager;
	private final UserRepository userRepository;
	private final TeacherProfileRepository teacherProfileRepository;
	private final StudentProfileRepository studentProfileRepository;
	private final PasswordEncoder passwordEncoder;

	public MockDataSeeder(
			EntityManager entityManager,
			UserRepository userRepository,
			TeacherProfileRepository teacherProfileRepository,
			StudentProfileRepository studentProfileRepository,
			PasswordEncoder passwordEncoder) {
		this.entityManager = entityManager;
		this.userRepository = userRepository;
		this.teacherProfileRepository = teacherProfileRepository;
		this.studentProfileRepository = studentProfileRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	@Transactional
	public void run(String... args) {
		truncateSeedTables();

		Random random = new Random(RANDOM_SEED);
		LocalDate today = LocalDate.now();
		String passwordHash = passwordEncoder.encode(SEED_PASSWORD);
		Set<String> usedNames = new HashSet<>();
		Set<String> usedEmails = new HashSet<>();
		Set<String> usedPhoneNumbers = new HashSet<>();

		List<User> users = new ArrayList<>(ADMIN_COUNT + TEACHER_COUNT + STUDENT_COUNT);
		List<User> teacherUsers = new ArrayList<>(TEACHER_COUNT);
		List<User> studentUsers = new ArrayList<>(STUDENT_COUNT);
		List<StudentSeedData> studentSeedData = new ArrayList<>(STUDENT_COUNT);

		for (int index = 0; index < ADMIN_COUNT; index++) {
			users.add(createUser(
					UserRole.ADMIN,
					UserStatus.ACTIVE,
					passwordHash,
					random,
					usedNames,
					usedEmails,
					usedPhoneNumbers));
		}

		for (int index = 0; index < TEACHER_COUNT; index++) {
			User teacher = createUser(
					UserRole.TEACHER,
					UserStatus.ACTIVE,
					passwordHash,
					random,
					usedNames,
					usedEmails,
					usedPhoneNumbers);
			users.add(teacher);
			teacherUsers.add(teacher);
		}

		Set<Integer> lockedStudentIndexes = selectLockedStudentIndexes(random);
		Set<Integer> nullDateOfBirthIndexes = selectStudentIndexes(random, NULL_OPTIONAL_FIELD_COUNT);
		Set<Integer> nullParentPhoneIndexes = selectStudentIndexes(random, NULL_OPTIONAL_FIELD_COUNT);
		for (int index = 0; index < STUDENT_COUNT; index++) {
			String fullName = generateUniqueFullName(random, usedNames);
			String email = generateUniqueEmail(fullName, UserRole.STUDENT, usedEmails);
			String phone = generateUniquePhoneNumber(random, usedPhoneNumbers);
			LocalDate dateOfBirth = nullDateOfBirthIndexes.contains(index)
					? null
					: generateDateOfBirth(random, today);
			String parentPhone = nullParentPhoneIndexes.contains(index)
					? null
					: generateUniquePhoneNumber(random, usedPhoneNumbers);
			String studentCode = String.format(Locale.ROOT, "SV%06d", index + 1);

			User student = new User(
					fullName,
					email,
					phone,
					passwordHash,
					UserRole.STUDENT,
					lockedStudentIndexes.contains(index) ? UserStatus.LOCKED : UserStatus.ACTIVE,
					false);
			users.add(student);
			studentUsers.add(student);
			studentSeedData.add(new StudentSeedData(student, studentCode, dateOfBirth, parentPhone));
		}

		userRepository.saveAll(users);
		userRepository.flush();

		List<TeacherProfile> teacherProfiles = teacherUsers.stream()
				.map(user -> new TeacherProfile(user, pick(random, TEACHER_SPECIALIZATIONS)))
				.toList();
		List<StudentProfile> studentProfiles = studentSeedData.stream()
				.map(data -> new StudentProfile(
						data.user(),
						data.studentCode(),
						data.dateOfBirth(),
						data.parentPhone()))
				.toList();

		teacherProfileRepository.saveAll(teacherProfiles);
		studentProfileRepository.saveAll(studentProfiles);
		teacherProfileRepository.flush();
		studentProfileRepository.flush();

		List<Long> adminIds = collectIds(users, UserRole.ADMIN);
		List<Long> teacherUserIds = collectIds(teacherUsers);
		List<Long> studentUserIds = collectIds(studentUsers);
		Map<String, List<Long>> runtimeIds = new LinkedHashMap<>();
		runtimeIds.put("adminIds", adminIds);
		runtimeIds.put("teacherUserIds", teacherUserIds);
		runtimeIds.put("studentUserIds", studentUserIds);

		LOGGER.info(
				"Seeded {} users ({} admins, {} teachers, {} students; {} locked students). Runtime IDs: {}",
				users.size(),
				adminIds.size(),
				teacherUserIds.size(),
				studentUserIds.size(),
				lockedStudentIndexes.size(),
				runtimeIds);
	}

	private void truncateSeedTables() {
		entityManager.createNativeQuery(
				"TRUNCATE student_profiles, teacher_profiles, users RESTART IDENTITY CASCADE")
				.executeUpdate();
		entityManager.clear();
	}

	private User createUser(
			UserRole role,
			UserStatus status,
			String passwordHash,
			Random random,
			Set<String> usedNames,
			Set<String> usedEmails,
			Set<String> usedPhoneNumbers) {
		String fullName = generateUniqueFullName(random, usedNames);
		return new User(
				fullName,
				generateUniqueEmail(fullName, role, usedEmails),
				generateUniquePhoneNumber(random, usedPhoneNumbers),
				passwordHash,
				role,
				status,
				false);
	}

	private String generateUniqueFullName(Random random, Set<String> usedNames) {
		while (true) {
			boolean female = random.nextBoolean();
			String middleName = female
					? pick(random, FEMALE_MIDDLE_NAMES)
					: pick(random, MALE_MIDDLE_NAMES);
			String givenName = female
					? pick(random, FEMALE_GIVEN_NAMES)
					: pick(random, MALE_GIVEN_NAMES);
			String fullName = pick(random, SURNAMES) + " " + middleName + " " + givenName;
			if (usedNames.add(fullName)) {
				return fullName;
			}
		}
	}

	private String generateUniqueEmail(
			String fullName,
			UserRole role,
			Set<String> usedEmails) {
		String localPart = normalizeName(fullName);
		String domain = role == UserRole.ADMIN ? "utc-polyglot.edu.vn" : "gmail.com";
		String baseEmail = localPart + "@" + domain;
		String candidate = baseEmail;
		int suffix = 2;
		while (!usedEmails.add(candidate)) {
			candidate = localPart + suffix + "@" + domain;
			suffix++;
		}
		return candidate;
	}

	private String normalizeName(String fullName) {
		String withoutAccents = Normalizer.normalize(fullName, Normalizer.Form.NFD)
				.replaceAll("\\p{M}+", "")
				.replace('đ', 'd')
				.replace('Đ', 'D');
		return withoutAccents.toLowerCase(Locale.ROOT)
				.replaceAll("[^a-z0-9]+", " ")
				.trim()
				.replaceAll("\\s+", ".");
	}

	private String generateUniquePhoneNumber(Random random, Set<String> usedPhoneNumbers) {
		while (true) {
			String phoneNumber = pick(random, PHONE_PREFIXES)
					+ String.format(Locale.ROOT, "%07d", random.nextInt(10_000_000));
			if (usedPhoneNumbers.add(phoneNumber)) {
				return phoneNumber;
			}
		}
	}

	private LocalDate generateDateOfBirth(Random random, LocalDate today) {
		LocalDate earliest = today.minusYears(25);
		LocalDate latest = today.minusYears(15);
		long availableDays = ChronoUnit.DAYS.between(earliest, latest);
		return earliest.plusDays(random.nextLong(availableDays + 1));
	}

	private Set<Integer> selectLockedStudentIndexes(Random random) {
		return selectStudentIndexes(random, LOCKED_STUDENT_COUNT);
	}

	private Set<Integer> selectStudentIndexes(Random random, int count) {
		List<Integer> indexes = new ArrayList<>(STUDENT_COUNT);
		for (int index = 0; index < STUDENT_COUNT; index++) {
			indexes.add(index);
		}
		Collections.shuffle(indexes, random);
		return new LinkedHashSet<>(indexes.subList(0, count));
	}

	private List<Long> collectIds(List<User> users, UserRole role) {
		return users.stream()
				.filter(user -> user.getRole() == role)
				.map(User::getId)
				.toList();
	}

	private List<Long> collectIds(List<User> users) {
		return users.stream().map(User::getId).toList();
	}

	private String pick(Random random, String[] values) {
		return values[random.nextInt(values.length)];
	}

	private record StudentSeedData(
			User user,
			String studentCode,
			LocalDate dateOfBirth,
			String parentPhone) {
	}
}
