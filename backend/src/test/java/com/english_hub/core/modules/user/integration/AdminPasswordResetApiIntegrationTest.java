package com.english_hub.core.modules.user.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.auth.domain.service.TokenHasher;
import com.english_hub.core.modules.auth.application.event.AdminUserPasswordResetListener;
import com.english_hub.core.modules.auth.infrastructure.persistence.entity.RefreshTokenJpaEntity;
import com.english_hub.core.modules.auth.infrastructure.persistence.repository.RefreshTokenRepository;
import com.english_hub.core.modules.user.application.service.AdminUserService;
import com.english_hub.core.infrastructure.security.JwtPrincipal;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Testcontainers
@SpringBootTest(properties = {
		"spring.jpa.hibernate.ddl-auto=validate",
		"spring.flyway.enabled=true",
		"spring.jpa.properties.hibernate.cache.use_second_level_cache=false",
		"spring.jpa.properties.hibernate.cache.use_query_cache=false",
		"app.cache.enabled=false",
		"spring.cache.type=none"
})
@AutoConfigureMockMvc
class AdminPasswordResetApiIntegrationTest {

	private static final String RESET_PATH = "/api/v1/admin/users/%d/reset-password";
	private static final String LOGIN_PATH = "/api/v1/auth/login";
	private static final String REFRESH_PATH = "/api/v1/auth/refresh";
	private static final String ADMIN_RESET_LOG_PREFIX = "event=ADMIN_PASSWORD_RESET adminId=";
	private static final String UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
	private static final String LOWERCASE = "abcdefghjkmnpqrstuvwxyz";
	private static final String DIGITS = "23456789";

	private static final SnapshotIdentity ADMIN_ACTIVE = new SnapshotIdentity(
			"Hoàng Thanh Ngân", "hoang.thanh.ngan@utc-polyglot.edu.vn", UserRole.ADMIN, UserStatus.ACTIVE);
	private static final SnapshotIdentity OTHER_ADMIN_ACTIVE = new SnapshotIdentity(
			"Ngô Hoàng Vinh", "ngo.hoang.vinh@utc-polyglot.edu.vn", UserRole.ADMIN, UserStatus.ACTIVE);
	private static final SnapshotIdentity TEACHER_ACTIVE = new SnapshotIdentity(
			"Phạm Diệu Anh", "pham.dieu.anh@gmail.com", UserRole.TEACHER, UserStatus.ACTIVE);
	private static final SnapshotIdentity STUDENT_ACTIVE = new SnapshotIdentity(
			"Ngô Thị Phương", "ngo.thi.phuong@gmail.com", UserRole.STUDENT, UserStatus.ACTIVE);
	private static final SnapshotIdentity STUDENT_LOCKED = new SnapshotIdentity(
			"Phan Quốc Tùng", "phan.quoc.tung@gmail.com", UserRole.STUDENT, UserStatus.LOCKED);

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_admin_password_reset_test")
			.withUsername("test")
			.withPassword("test");

	@DynamicPropertySource
	static void registerPostgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private RefreshTokenRepository refreshTokenRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private AdminUserService adminUserService;

	@Autowired
	private PlatformTransactionManager transactionManager;

	@Autowired
	private EntityManager entityManager;

	@Autowired
	private JdbcTemplate jdbc;

	private TransactionTemplate transactionTemplate;
	private Account admin;
	private String adminAccessToken;
	private Logger auditLogger;
	private Level originalLogLevel;
	private boolean originalAdditive;
	private ListAppender<ILoggingEvent> auditLogs;

	@BeforeEach
	void setUp() throws Exception {
		transactionTemplate = new TransactionTemplate(transactionManager);
		startAuditCapture();
		admin = createAccount(ADMIN_ACTIVE);
		LoginResult adminLogin = login(admin.email(), admin.password());
		adminAccessToken = adminLogin.accessToken();
		assertThat(adminLogin.status() == 200 && adminAccessToken != null && !adminAccessToken.isBlank())
				.as("Admin fixture can log in")
				.isTrue();
	}

	@AfterEach
	void tearDown() {
		SecurityContextHolder.clearContext();
		if (auditLogger != null && auditLogs != null) {
			auditLogger.detachAppender(auditLogs);
			auditLogs.stop();
			auditLogger.setLevel(originalLogLevel);
			auditLogger.setAdditive(originalAdditive);
		}
	}

	@Test
	void postgres16RunsFlywayV1ToV5AndHibernateValidatesTheSchema() {
		assertThat(jdbc.queryForObject("select current_database()", String.class))
				.isEqualTo(POSTGRES.getDatabaseName());
		assertThat(jdbc.queryForObject("show server_version", String.class)).startsWith("16.");
		assertThat(jdbc.queryForList(
				"select version from flyway_schema_history where success and version is not null order by installed_rank",
				String.class)).containsExactly("1", "2", "3", "4", "5");
		assertThat(jdbc.queryForObject("select count(*) from flyway_schema_history where not success", Long.class))
				.isZero();
	}

	@Test
	void activeTargetResetPersistsBcryptRevokesApplicableTokensAndAllowsNewLogin() throws Exception {
		Account target = createAccount(STUDENT_ACTIVE);
		LoginResult firstTargetLogin = login(target.email(), target.password());
		LoginResult secondTargetLogin = login(target.email(), target.password());
		assertThat(firstTargetLogin.status() == 200 && secondTargetLogin.status() == 200)
				.as("Active target can create two refresh sessions")
				.isTrue();

		long expiredTokenId = createToken(target.id(), Instant.now().minusSeconds(60), null);
		Instant oldRevocation = Instant.now().minusSeconds(600);
		long alreadyRevokedTokenId = createToken(target.id(), Instant.now().plusSeconds(600),
				oldRevocation.atOffset(ZoneOffset.UTC));
		Account other = createAccount(TEACHER_ACTIVE);
		LoginResult otherLogin = login(other.email(), other.password());
		assertThat(otherLogin.status() == 200).as("Other user can log in").isTrue();

		long otherRefreshId = tokenIdFor(otherLogin.refreshToken());
		List<TokenState> beforeTargetTokens = readTokensForUser(target.id());
		List<TokenState> beforeOtherTokens = readTokenStates(List.of(otherRefreshId));
		UserState beforeUser = readUserState(target.id());

		ResetResult reset = reset(target.id(), adminAccessToken);
		assertResetResponse(reset);
		UserState afterUser = readUserState(target.id());
		List<TokenState> afterTargetTokens = readTokensForUser(target.id());
		List<TokenState> afterOtherTokens = readTokenStates(List.of(otherRefreshId));

		boolean storedHashIsNewBcrypt = !beforeUser.passwordHash().equals(afterUser.passwordHash())
				&& afterUser.passwordHash().startsWith("$2")
				&& passwordEncoder.matches(reset.newPassword(), afterUser.passwordHash());
		assertThat(storedHashIsNewBcrypt).as("Database stores a BCrypt hash for the returned password").isTrue();
		boolean activeAndExpiredTokensWereRevoked = afterTargetTokens.size() == 4 && afterTargetTokens.stream()
				.filter(token -> token.id() != alreadyRevokedTokenId)
				.allMatch(token -> token.revokedAt() != null)
				&& stateFor(afterTargetTokens, expiredTokenId).expiresAt().isBefore(Instant.now())
				&& stateFor(afterTargetTokens, expiredTokenId).revokedAt() != null;
		assertThat(activeAndExpiredTokensWereRevoked)
				.as("All unrevoked target tokens, including expired tokens, are revoked")
				.isTrue();
		boolean oldRevocationWasPreserved = stateFor(afterTargetTokens, alreadyRevokedTokenId).revokedAt()
				.equals(stateFor(beforeTargetTokens, alreadyRevokedTokenId).revokedAt());
		assertThat(oldRevocationWasPreserved).as("Previously revoked token keeps its original timestamp").isTrue();
		assertThat(afterOtherTokens.equals(beforeOtherTokens)).as("Other user's refresh token is unchanged").isTrue();

		LoginResult newPasswordLogin = login(target.email(), reset.newPassword());
		LoginResult oldPasswordLogin = login(target.email(), target.password());
		int oldRefreshStatus = refresh(firstTargetLogin.refreshToken());
		assertThat(newPasswordLogin.status()).as("New password logs in successfully").isEqualTo(200);
		assertThat(oldPasswordLogin.status()).as("Old password is rejected").isEqualTo(401);
		assertThat(oldRefreshStatus).as("Old refresh token is rejected").isEqualTo(401);
		assertAuditCounts(target.id(), List.of(3), target.password(), reset.newPassword(),
				beforeUser.passwordHash(), afterUser.passwordHash());
	}

	@ParameterizedTest(name = "active target role {0} can be reset")
	@MethodSource("activeTargetIdentities")
	void activeTeacherStudentAndOtherAdminCanBeReset(SnapshotIdentity identity) throws Exception {
		Account target = createAccount(identity);
		LoginResult oldLogin = login(target.email(), target.password());
		assertThat(oldLogin.status() == 200).as("Active target can log in before reset").isTrue();
		String oldHash = readUserState(target.id()).passwordHash();

		ResetResult reset = reset(target.id(), adminAccessToken);
		assertResetResponse(reset);
		UserState after = readUserState(target.id());
		boolean passwordWasUpdated = !oldHash.equals(after.passwordHash())
				&& passwordEncoder.matches(reset.newPassword(), after.passwordHash());
		assertThat(passwordWasUpdated).as("Reset password was stored as a matching BCrypt hash").isTrue();
		assertThat(login(target.email(), reset.newPassword()).status()).as("New password is accepted").isEqualTo(200);
		assertThat(login(target.email(), target.password()).status()).as("Old password is rejected").isEqualTo(401);
		assertAuditCounts(target.id(), List.of(1), target.password(), reset.newPassword(), oldHash, after.passwordHash());
	}

	@Test
	void lockedTargetCanBeResetAndRemainsLocked() throws Exception {
		Account target = createAccount(STUDENT_LOCKED);
		long oldSessionId = createToken(target.id(), Instant.now().plusSeconds(600), null);
		String oldHash = readUserState(target.id()).passwordHash();

		ResetResult reset = reset(target.id(), adminAccessToken);
		assertResetResponse(reset);
		UserState after = readUserState(target.id());
		boolean passwordWasUpdatedAndStatusPreserved = !oldHash.equals(after.passwordHash())
				&& passwordEncoder.matches(reset.newPassword(), after.passwordHash())
				&& after.status() == UserStatus.LOCKED;
		assertThat(passwordWasUpdatedAndStatusPreserved)
				.as("Locked target gets a new hash without being unlocked")
				.isTrue();
		assertThat(login(target.email(), reset.newPassword()).status())
				.as("Locked target cannot log in after reset")
				.isEqualTo(403);
		assertThat(stateFor(readTokenStates(List.of(oldSessionId)), oldSessionId).revokedAt() != null)
				.as("Locked target's active refresh token is revoked")
				.isTrue();
		assertAuditCounts(target.id(), List.of(1), target.password(), reset.newPassword(), oldHash, after.passwordHash());
	}

	@Test
	void targetWithoutRefreshTokensCanStillBeReset() throws Exception {
		Account target = createAccount(STUDENT_ACTIVE);
		String oldHash = readUserState(target.id()).passwordHash();

		ResetResult reset = reset(target.id(), adminAccessToken);
		assertResetResponse(reset);
		UserState after = readUserState(target.id());
		boolean updatedWithoutTokens = !oldHash.equals(after.passwordHash())
				&& passwordEncoder.matches(reset.newPassword(), after.passwordHash())
				&& readTokensForUser(target.id()).isEmpty();
		assertThat(updatedWithoutTokens).as("Password reset succeeds when target has no refresh tokens").isTrue();
		assertAuditCounts(target.id(), List.of(0), target.password(), reset.newPassword(), oldHash, after.passwordHash());
	}

	@Test
	void missingTargetReturns404WithoutChangingDatabaseState() throws Exception {
		Account unchanged = createAccount(STUDENT_ACTIVE);
		LoginResult session = login(unchanged.email(), unchanged.password());
		long tokenId = tokenIdFor(session.refreshToken());
		UserState beforeUser = readUserState(unchanged.id());
		List<TokenState> beforeTokens = readTokenStates(List.of(tokenId));

		int responseStatus = reset(Long.MAX_VALUE, adminAccessToken).status();

		assertThat(responseStatus).as("Unknown target returns 404").isEqualTo(404);
		assertThat(stateIsUnchanged(unchanged.id(), beforeUser, beforeTokens))
				.as("Missing target request changes no stored password or token")
				.isTrue();
		assertNoAuditLogs();
	}

	@Test
	void softDeletedTargetReturns404WithoutChangingDatabaseState() throws Exception {
		Account target = createAccount(STUDENT_ACTIVE);
		LoginResult session = login(target.email(), target.password());
		long tokenId = tokenIdFor(session.refreshToken());
		markDeleted(target.id());
		UserState beforeUser = readUserState(target.id());
		List<TokenState> beforeTokens = readTokenStates(List.of(tokenId));

		int responseStatus = reset(target.id(), adminAccessToken).status();

		assertThat(responseStatus).as("Soft-deleted target returns 404").isEqualTo(404);
		assertThat(stateIsUnchanged(target.id(), beforeUser, beforeTokens))
				.as("Soft-deleted target's password and refresh token remain unchanged")
				.isTrue();
		assertNoAuditLogs();
	}

	@Test
	void adminCannotResetOwnPasswordAndNoDatabaseStateChanges() throws Exception {
		UserState beforeUser = readUserState(admin.id());
		List<TokenState> beforeTokens = readTokensForUser(admin.id());

		int responseStatus = reset(admin.id(), adminAccessToken).status();

		assertThat(responseStatus).as("Admin self-reset returns 400").isEqualTo(400);
		assertThat(stateIsUnchanged(admin.id(), beforeUser, beforeTokens))
				.as("Self-reset does not change the password or refresh tokens")
				.isTrue();
		assertNoAuditLogs();
	}

	@ParameterizedTest(name = "non-admin {0} receives forbidden")
	@EnumSource(value = UserRole.class, names = {"TEACHER", "STUDENT"})
	void teacherAndStudentCannotResetAnotherUsersPassword(UserRole role) throws Exception {
		SnapshotIdentity identity = role == UserRole.TEACHER ? TEACHER_ACTIVE : STUDENT_ACTIVE;
		Account caller = createAccount(identity);
		LoginResult callerLogin = login(caller.email(), caller.password());
		Account target = createAccount(OTHER_ADMIN_ACTIVE);
		LoginResult targetLogin = login(target.email(), target.password());
		UserState beforeUser = readUserState(target.id());
		List<TokenState> beforeTokens = readTokensForUser(target.id());

		int responseStatus = reset(target.id(), callerLogin.accessToken()).status();

		assertThat(callerLogin.status() == 200 && responseStatus == 403)
				.as("Authenticated non-admin cannot reset another user")
				.isTrue();
		assertThat(stateIsUnchanged(target.id(), beforeUser, beforeTokens))
				.as("Forbidden request leaves target password and tokens unchanged")
				.isTrue();
		assertThat(targetLogin.status() == 200).as("Target fixture logged in before the rejected request").isTrue();
		assertNoAuditLogs();
	}

	@Test
	void missingAccessTokenReturns401WithoutChangingDatabaseState() throws Exception {
		Account target = createAccount(OTHER_ADMIN_ACTIVE);
		LoginResult targetLogin = login(target.email(), target.password());
		UserState beforeUser = readUserState(target.id());
		List<TokenState> beforeTokens = readTokensForUser(target.id());

		int responseStatus = reset(target.id(), null).status();

		assertThat(responseStatus).as("Unauthenticated reset request returns 401").isEqualTo(401);
		assertThat(stateIsUnchanged(target.id(), beforeUser, beforeTokens))
				.as("Unauthenticated request leaves target password and tokens unchanged")
				.isTrue();
		assertThat(targetLogin.status() == 200).as("Target fixture logged in before the rejected request").isTrue();
		assertNoAuditLogs();
	}

	@Test
	void sequentialResetsLeaveOnlyTheLastPasswordUsable() throws Exception {
		Account target = createAccount(STUDENT_ACTIVE);
		LoginResult originalLogin = login(target.email(), target.password());
		String originalHash = readUserState(target.id()).passwordHash();

		ResetResult firstReset = reset(target.id(), adminAccessToken);
		assertResetResponse(firstReset);
		String firstHash = readUserState(target.id()).passwordHash();
		LoginResult firstPasswordLogin = login(target.email(), firstReset.newPassword());
		assertThat(firstPasswordLogin.status()).as("First generated password works before the second reset").isEqualTo(200);

		ResetResult secondReset = reset(target.id(), adminAccessToken);
		assertResetResponse(secondReset);
		String finalHash = readUserState(target.id()).passwordHash();
		int firstPasswordStatus = login(target.email(), firstReset.newPassword()).status();
		int originalPasswordStatus = login(target.email(), target.password()).status();
		int finalPasswordStatus = login(target.email(), secondReset.newPassword()).status();
		int originalRefreshStatus = refresh(originalLogin.refreshToken());

		boolean finalHashMatchesOnlyLatest = passwordEncoder.matches(secondReset.newPassword(), finalHash)
				&& !passwordEncoder.matches(firstReset.newPassword(), finalHash)
				&& !passwordEncoder.matches(target.password(), finalHash)
				&& !originalHash.equals(finalHash)
				&& !firstHash.equals(finalHash);
		assertThat(finalHashMatchesOnlyLatest).as("Final BCrypt hash matches only the last generated password").isTrue();
		assertThat(firstPasswordStatus == 401 && originalPasswordStatus == 401 && finalPasswordStatus == 200
				&& originalRefreshStatus == 401)
				.as("Only the latest password can log in and old refresh tokens are rejected")
				.isTrue();
		assertAuditCounts(target.id(), List.of(1, 1), target.password(), firstReset.newPassword(),
				secondReset.newPassword(), originalHash, firstHash, finalHash);
	}

	@Test
	void beforeCommitFailureRollsBackPasswordTokenRevocationAndSuccessAudit() throws Exception {
		Account target = createAccount(STUDENT_ACTIVE);
		LoginResult originalLogin = login(target.email(), target.password());
		long oldTokenId = tokenIdFor(originalLogin.refreshToken());
		String originalHash = readUserState(target.id()).passwordHash();
		AtomicReference<String> generatedPassword = new AtomicReference<>();

		SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
				new JwtPrincipal(admin.id(), com.english_hub.core.modules.user.domain.model.UserRole.ADMIN),
				"integration-test",
				List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
		try {
			assertThatThrownBy(() -> transactionTemplate.execute(status -> {
				AdminUserService.ResetPasswordData resetData = adminUserService.resetPassword(target.id());
				generatedPassword.set(resetData.newPassword());
				TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
					@Override
					public void beforeCommit(boolean readOnly) {
						entityManager.flush();
						User userInTransaction = userRepository.findById(target.id()).orElseThrow();
						RefreshTokenJpaEntity tokenInTransaction = refreshTokenRepository.findById(oldTokenId).orElseThrow();
						boolean writesAreVisibleBeforeCommit = passwordEncoder.matches(
								generatedPassword.get(), userInTransaction.getPasswordHash())
								&& tokenInTransaction.getRevokedAt() != null;
						assertThat(writesAreVisibleBeforeCommit)
								.as("Password and token updates are visible inside beforeCommit")
								.isTrue();
						throw new ControlledRollbackException();
					}
				});
				return null;
			})).isInstanceOf(ControlledRollbackException.class);
		} finally {
			SecurityContextHolder.clearContext();
		}

		UserState afterRollback = readUserState(target.id());
		TokenState tokenAfterRollback = stateFor(readTokenStates(List.of(oldTokenId)), oldTokenId);
		boolean databaseWasRolledBack = originalHash.equals(afterRollback.passwordHash())
				&& tokenAfterRollback.revokedAt() == null;
		assertThat(databaseWasRolledBack).as("Password and refresh token changes were rolled back").isTrue();
		assertThat(login(target.email(), target.password()).status()).as("Original password still works after rollback").isEqualTo(200);
		assertThat(refresh(originalLogin.refreshToken())).as("Original refresh token still works after rollback").isEqualTo(200);
		assertNoAuditLogs();
	}

	@Test
	void twoConcurrentAdminResetsBothSucceedAndOnlyOnePasswordWins() throws Exception {
		Account target = createAccount(STUDENT_ACTIVE);
		LoginResult originalLogin = login(target.email(), target.password());
		long oldTokenId = tokenIdFor(originalLogin.refreshToken());
		String originalHash = readUserState(target.id()).passwordHash();

		ExecutorService executor = Executors.newFixedThreadPool(2);
		CountDownLatch ready = new CountDownLatch(2);
		CountDownLatch start = new CountDownLatch(1);
		Future<ResetResult> firstFuture = executor.submit(() -> resetAfterBarrier(target.id(), ready, start));
		Future<ResetResult> secondFuture = executor.submit(() -> resetAfterBarrier(target.id(), ready, start));
		ResetResult first;
		ResetResult second;
		try {
			boolean bothRequestsReady = ready.await(10, TimeUnit.SECONDS);
			start.countDown();
			assertThat(bothRequestsReady).as("Both independent HTTP requests reach the start barrier").isTrue();
			first = firstFuture.get(30, TimeUnit.SECONDS);
			second = secondFuture.get(30, TimeUnit.SECONDS);
		} finally {
			start.countDown();
			executor.shutdownNow();
			executor.awaitTermination(10, TimeUnit.SECONDS);
		}

		assertThat(first.status() == 200 && second.status() == 200)
				.as("Both concurrent reset requests succeed")
				.isTrue();
		assertResetResponse(first);
		assertResetResponse(second);
		UserState finalState = readUserState(target.id());
		boolean exactlyOneReturnedPasswordWon = passwordEncoder.matches(first.newPassword(), finalState.passwordHash())
				!= passwordEncoder.matches(second.newPassword(), finalState.passwordHash());
		assertThat(exactlyOneReturnedPasswordWon)
				.as("Final BCrypt hash matches exactly one concurrent response")
				.isTrue();
		assertThat(!passwordEncoder.matches(target.password(), finalState.passwordHash()))
				.as("Original password no longer matches after concurrent resets")
				.isTrue();
		assertThat(stateFor(readTokenStates(List.of(oldTokenId)), oldTokenId).revokedAt() != null)
				.as("Original refresh token is revoked after concurrent resets")
				.isTrue();
		int firstLoginStatus = login(target.email(), first.newPassword()).status();
		int secondLoginStatus = login(target.email(), second.newPassword()).status();
		assertThat((firstLoginStatus == 200) != (secondLoginStatus == 200))
				.as("Exactly one returned password remains usable")
				.isTrue();
		assertThat(login(target.email(), target.password()).status()).as("Original password is rejected").isEqualTo(401);
		List<Integer> auditCounts = auditCountsFor(target.id());
		boolean auditCountsAreCorrect = auditCounts.size() == 2
				&& auditCounts.stream().mapToInt(Integer::intValue).sum() == 1;
		assertThat(auditCountsAreCorrect).as("Both successful requests wrote one audit line with the actual revoke count").isTrue();
		assertNoSensitiveAuditValues(target.password(), first.newPassword(), second.newPassword(),
				originalHash, finalState.passwordHash());
	}

	private static Stream<Arguments> activeTargetIdentities() {
		return Stream.of(Arguments.of(TEACHER_ACTIVE), Arguments.of(STUDENT_ACTIVE), Arguments.of(OTHER_ADMIN_ACTIVE));
	}

	private Account createAccount(SnapshotIdentity identity) {
		String email = uniqueEmail(identity.email());
		String password = runtimePassword();
		String hash = passwordEncoder.encode(password);
		return inTransaction(() -> {
			User saved = userRepository.saveAndFlush(new User(
					identity.fullName(), email, null, hash, identity.role(), identity.status(), false));
			return new Account(saved.getId(), email, password);
		});
	}

	private long createToken(long userId, Instant expiresAt, OffsetDateTime revokedAt) {
		String rawToken = "be78-" + UUID.randomUUID();
		return inTransaction(() -> {
			RefreshTokenJpaEntity token = new RefreshTokenJpaEntity(
					userId,
					TokenHasher.sha256(rawToken),
					expiresAt.atOffset(ZoneOffset.UTC),
					"integration-test",
					"127.0.0.1");
			token.setRevokedAt(revokedAt);
			return refreshTokenRepository.saveAndFlush(token).getId();
		});
	}

	private void markDeleted(long userId) {
		inTransaction(() -> {
			User user = userRepository.findById(userId).orElseThrow();
			user.updateFrom(user.getFullName(), user.getEmail(), user.getPhone(), user.getAvatarUrl(),
					user.getPasswordHash(), user.getRole(), user.getStatus(), true);
			userRepository.saveAndFlush(user);
			return null;
		});
	}

	private LoginResult login(String email, String password) throws Exception {
		String requestBody = objectMapper.writeValueAsString(new LoginRequestBody(email, password));
		MvcResult result = mockMvc.perform(post(LOGIN_PATH)
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody)).andReturn();
		int status = result.getResponse().getStatus();
		if (status != 200) {
			return new LoginResult(status, null, null);
		}
		JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
		return new LoginResult(status, body.path("accessToken").asText(), body.path("refreshToken").asText());
	}

	private int refresh(String rawToken) throws Exception {
		String requestBody = objectMapper.writeValueAsString(new RefreshRequestBody(rawToken));
		return mockMvc.perform(post(REFRESH_PATH)
				.contentType(MediaType.APPLICATION_JSON)
				.content(requestBody)).andReturn().getResponse().getStatus();
	}

	private ResetResult reset(long targetId, String accessToken) throws Exception {
		var request = post(RESET_PATH.formatted(targetId));
		if (accessToken != null) {
			request.header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);
		}
		MvcResult result = mockMvc.perform(request).andReturn();
		int status = result.getResponse().getStatus();
		if (status != 200) {
			return new ResetResult(status, null, null);
		}
		String responseBody = result.getResponse().getContentAsString();
		JsonNode json = objectMapper.readTree(responseBody);
		return new ResetResult(status, json.path("newPassword").asText(), json);
	}

	private void assertResetResponse(ResetResult result) {
		boolean correctShape = result.status() == 200
				&& result.body().isObject()
				&& result.body().size() == 2
				&& result.body().has("message")
				&& result.body().has("newPassword")
				&& result.body().path("message").asText().equals("Đặt lại mật khẩu thành công.")
				&& result.body().path("newPassword").asText().length() == 16;
		assertThat(correctShape).as("Reset response contains message and one 16-character password").isTrue();
		boolean passwordMeetsPolicy = hasPasswordPolicy(result.newPassword());
		assertThat(passwordMeetsPolicy).as("Generated password follows the selected character policy").isTrue();
	}

	private boolean hasPasswordPolicy(String password) {
		if (password == null || password.length() != 16) {
			return false;
		}
		boolean hasUpper = false;
		boolean hasLower = false;
		boolean hasDigit = false;
		for (int index = 0; index < password.length(); index++) {
			char character = password.charAt(index);
			if (UPPERCASE.indexOf(character) >= 0) {
				hasUpper = true;
			} else if (LOWERCASE.indexOf(character) >= 0) {
				hasLower = true;
			} else if (DIGITS.indexOf(character) >= 0) {
				hasDigit = true;
			} else {
				return false;
			}
		}
		return hasUpper && hasLower && hasDigit;
	}

	private ResetResult resetAfterBarrier(long targetId, CountDownLatch ready, CountDownLatch start) throws Exception {
		ready.countDown();
		if (!start.await(10, TimeUnit.SECONDS)) {
			throw new IllegalStateException("Concurrent reset start timed out");
		}
		return reset(targetId, adminAccessToken);
	}

	private long tokenIdFor(String rawToken) {
		String tokenHash = TokenHasher.sha256(rawToken);
		return inTransaction(() -> refreshTokenRepository.findByTokenHash(tokenHash)
				.orElseThrow()
				.getId());
	}

	private UserState readUserState(long userId) {
		return inTransaction(() -> {
			User user = userRepository.findById(userId).orElseThrow();
			return new UserState(user.getPasswordHash(), user.getStatus(), user.isDeleted());
		});
	}

	private List<TokenState> readTokensForUser(long userId) {
		List<Long> ids = inTransaction(() -> refreshTokenRepository.findAll().stream()
				.filter(token -> token.getUserId().equals(userId))
				.map(RefreshTokenJpaEntity::getId)
				.toList());
		return readTokenStates(ids);
	}

	private List<TokenState> readTokenStates(List<Long> ids) {
		if (ids.isEmpty()) {
			return List.of();
		}
		return inTransaction(() -> refreshTokenRepository.findAllById(ids).stream()
				.map(token -> new TokenState(
						token.getId(),
						token.getUserId(),
						token.getRevokedAt() == null ? null : token.getRevokedAt().toInstant(),
						token.getExpiresAt().toInstant()))
				.sorted(Comparator.comparing(TokenState::id))
				.toList());
	}

	private boolean stateIsUnchanged(long userId, UserState beforeUser, List<TokenState> beforeTokens) {
		return beforeUser.equals(readUserState(userId)) && beforeTokens.equals(readTokensForUser(userId));
	}

	private TokenState stateFor(List<TokenState> tokens, long tokenId) {
		return tokens.stream().filter(token -> token.id() == tokenId).findFirst().orElseThrow();
	}

	private void assertAuditCounts(long targetId, List<Integer> expectedCounts, String... secrets) {
		List<Integer> actualCounts = auditCountsFor(targetId);
		List<Integer> expected = new ArrayList<>(expectedCounts);
		actualCounts.sort(Integer::compareTo);
		expected.sort(Integer::compareTo);
		assertThat(actualCounts.equals(expected)).as("Each successful reset has one correctly formatted audit line").isTrue();
		assertNoSensitiveAuditValues(secrets);
	}

	private List<Integer> auditCountsFor(long targetId) {
		List<Integer> counts = new ArrayList<>();
		boolean allLinesAreValid = true;
		for (ILoggingEvent event : auditLogs.list) {
			String line = event.getFormattedMessage();
			Integer revokedCount = parseAuditLine(line, targetId);
			if (event.getLevel() != Level.INFO || revokedCount == null) {
				allLinesAreValid = false;
			} else {
				counts.add(revokedCount);
			}
		}
		assertThat(allLinesAreValid).as("Audit log fields match the reset event contract").isTrue();
		return counts;
	}

	private Integer parseAuditLine(String line, long targetId) {
		String prefix = ADMIN_RESET_LOG_PREFIX + admin.id() + " targetUserId=" + targetId + " occurredAt=";
		String countMarker = " revokedRefreshTokens=";
		if (!line.startsWith(prefix)) {
			return null;
		}
		int countPosition = line.lastIndexOf(countMarker);
		if (countPosition <= prefix.length()) {
			return null;
		}
		String occurredAt = line.substring(prefix.length(), countPosition);
		String countValue = line.substring(countPosition + countMarker.length());
		try {
			Instant.parse(occurredAt);
			return Integer.valueOf(countValue);
		} catch (RuntimeException exception) {
			return null;
		}
	}

	private void assertNoSensitiveAuditValues(String... secrets) {
		boolean containsSensitiveValue = auditLogs.list.stream()
				.map(ILoggingEvent::getFormattedMessage)
				.anyMatch(line -> containsAny(line, secrets));
		assertThat(containsSensitiveValue).as("Audit log does not contain passwords or password hashes").isFalse();
	}

	private boolean containsAny(String value, String... candidates) {
		for (String candidate : candidates) {
			if (candidate != null && !candidate.isBlank() && value.contains(candidate)) {
				return true;
			}
		}
		return false;
	}

	private void assertNoAuditLogs() {
		assertThat(auditLogs.list.isEmpty()).as("Rejected or rolled-back reset has no success audit log").isTrue();
	}

	private void startAuditCapture() {
		auditLogger = (Logger) LoggerFactory.getLogger(AdminUserPasswordResetListener.class);
		originalLogLevel = auditLogger.getLevel();
		originalAdditive = auditLogger.isAdditive();
		auditLogger.setLevel(Level.INFO);
		auditLogger.setAdditive(false);
		auditLogs = new ListAppender<>();
		auditLogs.start();
		auditLogger.addAppender(auditLogs);
	}

	private <T> T inTransaction(java.util.function.Supplier<T> work) {
		return transactionTemplate.execute(status -> work.get());
	}

	private String uniqueEmail(String snapshotEmail) {
		int atPosition = snapshotEmail.indexOf('@');
		String suffix = "+be78-" + UUID.randomUUID().toString().replace("-", "");
		return snapshotEmail.substring(0, atPosition) + suffix + snapshotEmail.substring(atPosition);
	}

	private String runtimePassword() {
		return "Be78A1" + UUID.randomUUID();
	}

	private record SnapshotIdentity(String fullName, String email, UserRole role, UserStatus status) {
	}

	private static final class Account {
		private final long id;
		private final String email;
		private final String password;

		private Account(long id, String email, String password) {
			this.id = id;
			this.email = email;
			this.password = password;
		}

		long id() { return id; }
		String email() { return email; }
		String password() { return password; }
	}

	private record TokenState(long id, long userId, Instant revokedAt, Instant expiresAt) {
	}

	private record UserState(String passwordHash, UserStatus status, boolean deleted) {
	}

	private record LoginResult(int status, String accessToken, String refreshToken) {
	}

	private record ResetResult(int status, String newPassword, JsonNode body) {
	}

	private record LoginRequestBody(String email, String password) {
	}

	private record RefreshRequestBody(String refreshToken) {
	}

	private static final class ControlledRollbackException extends RuntimeException {
	}
}
