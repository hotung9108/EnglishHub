package com.english_hub.core.modules.auth.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.common.email.EmailService;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.auth.domain.repository.AuthUserRepository;
import com.english_hub.core.modules.auth.domain.service.PasswordResetStore;
import com.english_hub.core.modules.auth.domain.service.TokenHasher;
import com.english_hub.core.modules.auth.infrastructure.persistence.entity.RefreshTokenJpaEntity;
import com.english_hub.core.modules.auth.infrastructure.persistence.repository.RefreshTokenRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import jakarta.persistence.EntityManager;
import com.english_hub.core.modules.auth.application.event.UserSoftDeletedListener;
import com.english_hub.core.modules.auth.infrastructure.adapter.RefreshTokenJpaAdapter;
import com.english_hub.core.modules.user.application.service.AdminUserService;
import com.english_hub.core.modules.user.application.service.UserCrudService;
import com.english_hub.core.modules.user.domain.event.UserSoftDeletedEvent;
import org.springframework.aop.support.AopUtils;
import org.springframework.test.context.event.ApplicationEventsHolder;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.MockMvcPrint;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Tests Auth against isolated PostgreSQL initialized by the existing Flyway migrations.
 * Hibernate does not create or update the schema.
 */
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
@RecordApplicationEvents
@MockitoSpyBean(types = {UserSoftDeletedListener.class, RefreshTokenJpaAdapter.class})
class SoftDeletedAccountAuthIntegrationTest extends SoftDeletedAccountTestSupport {
	private final AdminUserService adminUsers;
	private final UserCrudService crudUsers;
	private final UserSoftDeletedListener deletionListener;
	private final com.english_hub.core.modules.auth.domain.repository.RefreshTokenRepository refreshPort;

	SoftDeletedAccountAuthIntegrationTest(MockMvc mvc, ObjectMapper json, UserRepository users,
			RefreshTokenRepository tokens, AuthUserRepository authUsers, PasswordEncoder encoder,
			PasswordResetStore challenges, EmailService email, PlatformTransactionManager manager,
			EntityManager entityManager, JwtTokenService jwtTokens,
			AdminUserService adminUsers, UserCrudService crudUsers,
			UserSoftDeletedListener deletionListener,
			com.english_hub.core.modules.auth.domain.repository.RefreshTokenRepository refreshPort) {
		super(mvc, json, users, tokens, authUsers, encoder, challenges, email, manager, entityManager, jwtTokens);
		this.adminUsers = adminUsers;
		this.crudUsers = crudUsers;
		this.deletionListener = deletionListener;
		this.refreshPort = refreshPort;
	}

	@BeforeEach
	void verifyListenerTransaction() {
		doAnswer(invocation -> {
			assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isTrue();
			return invocation.callRealMethod();
		}).when(deletionListener).onUserSoftDeleted(any(UserSoftDeletedEvent.class));
	}

	// C3, C4, P5, E1, E2: the fixture deliberately bypasses deletion services and revocation.
	@ParameterizedTest
	@EnumSource(UserRole.class)
	void lookupRejectsDeletedRowsForEveryRoleIncludingUnrevokedTokens(UserRole role) throws Exception {
		Account account = account(role);
		String rawToken = login(account).get("refreshToken").asText();
		refresh(rawToken, 200);
		changeUser(account, UserStatus.LOCKED, false);
		loginError(account, account.password(), 403);
		refresh(rawToken, 403);
		changeUser(account, UserStatus.LOCKED, true);
		loginError(account, account.password(), 404);
		refresh(rawToken, 401);
		changeUser(account, UserStatus.ACTIVE, true);
		loginError(account, account.password(), 404);
		refresh(rawToken, 401);
		assertThat(sessions(account).getFirst().revokedAt()).isNull();
		assertThat(inTransaction(() -> authUsers.findById(account.id()))).isEmpty();
		assertThat(inTransaction(() -> authUsers.findByEmail(account.email()))).isEmpty();
	}

	// E3, E4, E5.
	@Test
	void failedLoginsNeverCreateSessions() throws Exception {
		Account account = account(UserRole.STUDENT);
		long before = tokens.count();
		loginError(account, password(), 401);
		postError("/auth/login", body("email", absentEmail(), "password", password()), 404);
		changeUser(account, UserStatus.ACTIVE, true);
		loginError(account, password(), 404);
		assertThat(tokens.count()).isEqualTo(before);
		verifyNoInteractions(email);
	}

	// E6.
	@ParameterizedTest
	@NullAndEmptySource
	@ValueSource(strings = {" ", "\t"})
	void loginRequiresBothCredentials(String value) throws Exception {
		Account account = account(UserRole.STUDENT);
		long before = tokens.count();
		postError("/auth/login", body("email", value, "password", account.password()), 400);
		postError("/auth/login", body("email", account.email(), "password", value), 400);
		assertThat(tokens.count()).isEqualTo(before);
		verifyNoInteractions(email);
	}

	// E6, E7.
	@ParameterizedTest
	@ValueSource(strings = {"null", "{}", "{", "[]", ""})
	void invalidAuthBodiesRemainBadRequests(String rawBody) throws Exception {
		long before = tokens.count();
		for (String path : List.of("/auth/login", "/auth/refresh")) {
			JsonNode response = send(post(PATH + path).contentType(MediaType.APPLICATION_JSON)
					.content(rawBody), 400);
			assertError(response);
		}
		assertThat(tokens.count()).isEqualTo(before);
		verifyNoInteractions(email);
	}

	// E7.
	@ParameterizedTest
	@NullAndEmptySource
	@ValueSource(strings = {" ", "\t"})
	void refreshRequiresToken(String value) throws Exception {
		long before = tokens.count();
		postError("/auth/refresh", body("refreshToken", value), 400);
		assertThat(tokens.count()).isEqualTo(before);
	}

	// E8, E9, E10.
	@Test
	void unknownExpiredAndRevokedTokensRemainUnauthorized() throws Exception {
		Account account = account(UserRole.STUDENT);
		String expired = token(account, -60, false);
		String revoked = token(account, 3600, true);
		List<Session> before = sessions(account);
		refresh(UUID.randomUUID().toString(), 401);
		refresh(expired, 401);
		refresh(revoked, 401);
		assertThat(sessions(account)).isEqualTo(before);
	}

	// E12: compare the complete JSON and verify that neither challenge nor mail is created.
	@Test
	void forgotDeletedAndAbsentEmailsHaveIdenticalResponsesWithoutSideEffects() throws Exception {
		Account account = account(UserRole.STUDENT);
		changeUser(account, UserStatus.ACTIVE, true);
		String absent = absentEmail();
		JsonNode deleted = postError("/auth/forgot-password", body("email", account.email()), 404);
		JsonNode missing = postError("/auth/forgot-password", body("email", absent), 404);
		assertThat(deleted).isEqualTo(missing);
		verify(challenges, never()).store(eq(account.email()), any(), any(), anyLong());
		verify(challenges, never()).store(eq(absent), any(), any(), anyLong());
		verifyNoInteractions(email);
		assertThat(sessions(account)).isEmpty();
	}

	// E13.
	@Test
	void forgotActiveStillSendsMailAndLockedStillReturnsForbidden() throws Exception {
		Account account = account(UserRole.STUDENT);
		postOk("/auth/forgot-password", body("email", account.email()), 200);
		verify(email).sendPasswordResetOtp(eq(account.email()), any(), any(), eq(15));
		verify(challenges).store(eq(account.email()), any(), any(), eq(900L));
		reset(email, challenges);
		changeUser(account, UserStatus.LOCKED, false);
		postError("/auth/forgot-password", body("email", account.email()), 403);
		verifyNoInteractions(email);
		verify(challenges, never()).store(any(), any(), any(), anyLong());
	}

	// E14: validation/challenge order and the existing 400 contract are preserved.
	@ParameterizedTest
	@ValueSource(strings = {"missing", "wrong-otp", "wrong-link", "expired-otp", "expired-link"})
	void resetDeletedUserWithInvalidChallengeNeverChangesPasswordOrSessions(String condition) throws Exception {
		Account account = account(UserRole.STUDENT);
		token(account, 3600, false);
		Account control = account(UserRole.STUDENT);
		token(control, 3600, false);
		List<Session> controlBefore = sessions(control);
		String otp = otp();
		String link = UUID.randomUUID().toString();
		long ttl = condition.startsWith("expired") ? -1 : 900;
		challenges.store(account.email(), otp, link, ttl);
		changeUser(account, UserStatus.ACTIVE, true);
		List<Session> before = sessions(account);
		String otpInput = null;
		String linkInput = null;
		if (condition.equals("wrong-otp")) otpInput = "wrong";
		if (condition.equals("wrong-link")) linkInput = UUID.randomUUID().toString();
		if (condition.equals("expired-otp")) otpInput = otp;
		if (condition.equals("expired-link")) linkInput = link;
		JsonNode deleted = postError("/auth/reset-password", resetBody(account.email(), otpInput, linkInput), 400);
		JsonNode absent = postError("/auth/reset-password", resetBody(absentEmail(), otpInput, linkInput), 400);
		assertThat(deleted).isEqualTo(absent);
		assertOriginalPassword(account);
		assertThat(sessions(account)).isEqualTo(before);
		assertThat(sessions(control)).isEqualTo(controlBefore);
		verifyNoInteractions(email);
	}

	// E15: seed equal valid challenge conditions for deleted and nonexistent emails.
	@ParameterizedTest
	@ValueSource(booleans = {true, false})
	void validPreDeletionOtpOrLinkCannotResetDeletedUser(boolean useOtp) throws Exception {
		Account account = account(UserRole.STUDENT);
		token(account, 3600, false);
		Account control = account(UserRole.STUDENT);
		token(control, 3600, false);
		List<Session> controlBefore = sessions(control);
		String otp = otp();
		String link = UUID.randomUUID().toString();
		challenges.store(account.email(), otp, link, 900);
		changeUser(account, UserStatus.ACTIVE, true);
		String absent = absentEmail();
		challenges.store(absent, otp, link, 900);
		List<Session> before = sessions(account);
		String otpInput = useOtp ? otp : null;
		String linkInput = useOtp ? null : link;
		JsonNode deleted = postError("/auth/reset-password", resetBody(account.email(), otpInput, linkInput), 404);
		JsonNode missing = postError("/auth/reset-password", resetBody(absent, otpInput, linkInput), 404);
		assertThat(deleted).isEqualTo(missing);
		assertOriginalPassword(account);
		assertThat(sessions(account)).isEqualTo(before);
		assertThat(sessions(control)).isEqualTo(controlBefore);
		verifyNoInteractions(email);
	}

	// E16.
	@ParameterizedTest
	@ValueSource(booleans = {true, false})
	void activeResetUpdatesPasswordAndRevokesEveryOldSession(boolean useOtp) throws Exception {
		Account account = account(UserRole.STUDENT);
		String first = login(account).get("refreshToken").asText();
		String second = login(account).get("refreshToken").asText();
		String otp = otp();
		String link = UUID.randomUUID().toString();
		String newPassword = password();
		challenges.store(account.email(), otp, link, 900);
		postOk("/auth/reset-password", body("email", account.email(), "otp", useOtp ? otp : null,
				"token", useOtp ? null : link, "newPassword", newPassword), 200);
		User saved = row(account);
		assertThat(encoder.matches(newPassword, saved.getPasswordHash())).isTrue();
		assertThat(saved.isDeleted()).isFalse();
		assertRevoked(account);
		refresh(first, 401);
		refresh(second, 401);
		loginError(account, account.password(), 401);
		postOk("/auth/login", body("email", account.email(), "password", newPassword), 200);
	}

	@Test
	void userOwnsDeletedFlagAndAuthSaveCannotOverwriteIt() {
		Account account = account(UserRole.STUDENT);
		var authUser = inTransaction(() -> authUsers.findById(account.id()).orElseThrow());
		changeUser(account, UserStatus.ACTIVE, true);
		String changedPassword = password();
		authUser.setPasswordHash(encoder.encode(changedPassword));
		inTransaction(() -> authUsers.save(authUser));
		assertThat(encoder.matches(changedPassword, row(account).getPasswordHash())).isTrue();
		assertThat(row(account).isDeleted()).isTrue();
		boolean authSeesDeleted = inTransaction(() -> entityManager.find(
				com.english_hub.core.modules.auth.infrastructure.persistence.entity.AuthUserJpaEntity.class,
				account.id()).isDeleted());
		assertThat(authSeesDeleted).isTrue();
		assertThat(inTransaction(() -> authUsers.findById(account.id()))).isEmpty();
	}

	// C1, C2, P1, P2: the DB assertions are the revocation gate, independently of HTTP 401.
	@Test
	void adminDeletionCommitsFlagAndRevokesEveryTargetSessionOnly() throws Exception {
		Account admin = account(UserRole.ADMIN);
		Account target = account(UserRole.STUDENT);
		Account control = account(UserRole.TEACHER);
		String access = login(admin).get("accessToken").asText();
		String first = login(target).get("refreshToken").asText();
		String second = login(target).get("refreshToken").asText();
		String controlToken = login(control).get("refreshToken").asText();
		assertThat(first.equals(second)).isFalse();
		List<Session> controlBefore = sessions(control);
		long sessionCount = tokens.count();
		assertThat(AopUtils.isAopProxy(adminUsers)).isTrue();
		send(deleteRequest(target, access), 200);
		assertThat(row(target).isDeleted()).isTrue();
		assertThat(row(target).getStatus()).isEqualTo(UserStatus.ACTIVE);
		assertOriginalPassword(target);
		assertThat(sessions(target)).hasSize(2);
		assertRevoked(target);
		verify(deletionListener).onUserSoftDeleted(new UserSoftDeletedEvent(target.id()));
		loginError(target, target.password(), 404);
		refresh(first, 401);
		refresh(second, 401);
		assertThat(tokens.count()).isEqualTo(sessionCount);
		assertThat(sessions(control)).isEqualTo(controlBefore);
		refresh(controlToken, 200);
		login(control);
	}

	// P3.
	@Test
	void crudDeletionUsesItsOwnProxyTransactionAndTheSameRevocationGate() {
		Account target = account(UserRole.STUDENT);
		token(target, 3600, false);
		token(target, 3600, false);
		assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
		assertThat(AopUtils.isAopProxy(crudUsers)).isTrue();
		crudUsers.delete(target.id());
		assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
		assertThat(row(target).isDeleted()).isTrue();
		assertRevoked(target);
		verify(deletionListener).onUserSoftDeleted(new UserSoftDeletedEvent(target.id()));
	}

	// P4.
	@ParameterizedTest
	@ValueSource(strings = {"none", "revoked", "expired"})
	void deletionAcceptsTargetsWithoutActiveSessionsAndPreservesOtherUsers(String condition) throws Exception {
		Account admin = account(UserRole.ADMIN);
		Account target = account(UserRole.STUDENT);
		Account control = account(UserRole.STUDENT);
		token(control, 3600, false);
		if (condition.equals("revoked")) token(target, 3600, true);
		if (condition.equals("expired")) token(target, -60, false);
		List<Session> before = sessions(target);
		List<Session> controlBefore = sessions(control);
		send(deleteRequest(target, login(admin).get("accessToken").asText()), 200);
		assertThat(row(target).isDeleted()).isTrue();
		if (condition.equals("none")) assertThat(sessions(target)).isEmpty();
		else assertRevoked(target);
		if (condition.equals("revoked")) assertThat(sessions(target)).isEqualTo(before);
		assertThat(sessions(control)).isEqualTo(controlBefore);
	}

	// E17 and sequential E21 control.
	@Test
	void repeatedAndMissingDeletesDoNotPublishOrRevokeAgain() throws Exception {
		Account admin = account(UserRole.ADMIN);
		Account target = account(UserRole.STUDENT);
		Account missing = account(UserRole.STUDENT);
		inTransaction(() -> { users.deleteById(missing.id()); users.flush(); return null; });
		String access = login(admin).get("accessToken").asText();
		token(target, 3600, false);
		send(deleteRequest(target, access), 200);
		List<Session> before = sessions(target);
		long eventsBefore = deletionEventCount();
		clearInvocations(deletionListener, refreshPort);
		assertError(send(deleteRequest(target, access), 404));
		assertError(send(deleteRequest(missing, access), 404));
		assertThat(deletionEventCount()).isEqualTo(eventsBefore);
		verifyNoInteractions(deletionListener, refreshPort);
		assertThat(sessions(target)).isEqualTo(before);
	}

	// E18.
	@ParameterizedTest
	@ValueSource(strings = {"anonymous", "STUDENT", "TEACHER"})
	void unauthorizedDeleteCannotChangeTargetOrPublish(String callerRole) throws Exception {
		Account target = account(UserRole.STUDENT);
		token(target, 3600, false);
		List<Session> before = sessions(target);
		long eventsBefore = deletionEventCount();
		MockHttpServletRequestBuilder request = delete(PATH + "/admin/users/" + target.id());
		int status = 401;
		if (!callerRole.equals("anonymous")) {
			Account caller = account(UserRole.valueOf(callerRole));
			request.header("Authorization", "Bearer " + login(caller).get("accessToken").asText());
			status = 403;
		}
		assertError(send(request, status));
		assertThat(row(target).isDeleted()).isFalse();
		assertThat(sessions(target)).isEqualTo(before);
		assertThat(deletionEventCount()).isEqualTo(eventsBefore);
		verifyNoInteractions(deletionListener);
	}

	// E19.
	@ParameterizedTest
	@ValueSource(booleans = {true, false})
	void inactiveAdminCannotDeleteOrRevokeTarget(boolean deleted) throws Exception {
		Account admin = account(UserRole.ADMIN);
		Account target = account(UserRole.STUDENT);
		String access = login(admin).get("accessToken").asText();
		changeUser(admin, deleted ? UserStatus.ACTIVE : UserStatus.LOCKED, deleted);
		token(target, 3600, false);
		List<Session> before = sessions(target);
		long eventsBefore = deletionEventCount();
		assertError(send(deleteRequest(target, access), 401));
		assertThat(row(target).isDeleted()).isFalse();
		assertThat(sessions(target)).isEqualTo(before);
		assertThat(deletionEventCount()).isEqualTo(eventsBefore);
		verifyNoInteractions(deletionListener);
	}

	// E20: execute the real bulk update, then fail at the Auth port before commit.
	@ParameterizedTest
	@ValueSource(booleans = {true, false})
	void revocationFailureRollsBackBothFlagAndAlreadyExecutedTokenUpdates(boolean throughAdminApi) throws Exception {
		Account admin = account(UserRole.ADMIN);
		Account target = account(UserRole.STUDENT);
		String access = login(admin).get("accessToken").asText();
		token(target, 3600, false);
		List<Session> before = sessions(target);
		IllegalStateException revocationFailure = new IllegalStateException("Forced BE-64 revocation failure");
		doAnswer(invocation -> {
			invocation.callRealMethod();
			throw revocationFailure;
		}).when(refreshPort).revokeAllByUserId(target.id());
		try {
			if (throughAdminApi) {
				try {
					send(deleteRequest(target, access), 500);
				} catch (jakarta.servlet.ServletException exception) {
					assertThat(exception).hasRootCauseInstanceOf(IllegalStateException.class);
				}
			} else {
				assertThatThrownBy(() -> crudUsers.delete(target.id()))
						.isInstanceOf(InvalidDataAccessApiUsageException.class)
						.hasCause(revocationFailure);
			}
			assertThat(row(target).isDeleted()).isFalse();
			assertThat(sessions(target)).isEqualTo(before);
			verify(refreshPort).revokeAllByUserId(target.id());
		} finally {
			reset(refreshPort);
		}
	}

	// Mutation probe: disabling the listener must make the same persistence gate fail.
	@Test
	void revocationGateDetectsTemporarilyDisabledListenerAndRestoresIt() throws Exception {
		Account admin = account(UserRole.ADMIN);
		Account target = account(UserRole.STUDENT);
		Account nextTarget = account(UserRole.STUDENT);
		String access = login(admin).get("accessToken").asText();
		token(target, 3600, false);
		token(nextTarget, 3600, false);
		List<Session> before = sessions(target);
		try {
			doNothing().when(deletionListener).onUserSoftDeleted(new UserSoftDeletedEvent(target.id()));
			send(deleteRequest(target, access), 200);
			assertThat(row(target).isDeleted()).isTrue();
			assertThat(sessions(target)).isEqualTo(before);
			assertThatThrownBy(() -> assertRevoked(target))
					.isInstanceOf(AssertionError.class)
					.hasMessageContaining("revokedAt");
		} finally {
			reset(deletionListener);
		}
		send(deleteRequest(nextTarget, access), 200);
		assertRevoked(nextTarget);
	}

	// Sequential E22 control: a late session escaped revoke, so lookup is the deciding guard.
	@Test
	void refreshRejectsUnrevokedTokenCreatedAfterDeletionCommitted() throws Exception {
		Account admin = account(UserRole.ADMIN);
		Account target = account(UserRole.STUDENT);
		send(deleteRequest(target, login(admin).get("accessToken").asText()), 200);
		String lateToken = token(target, 3600, false);
		assertThat(sessions(target).getFirst().revokedAt()).isNull();
		refresh(lateToken, 401);
	}

	// E23.
	@Test
	void adminSelfDeletionKeepsDeleteContractButRejectsNewAuthentication() throws Exception {
		Account admin = account(UserRole.ADMIN);
		JsonNode session = login(admin);
		String access = session.get("accessToken").asText();
		send(deleteRequest(admin, access), 200);
		assertThat(row(admin).isDeleted()).isTrue();
		assertRevoked(admin);
		loginError(admin, admin.password(), 404);
		refresh(session.get("refreshToken").asText(), 401);
		assertError(send(get(PATH + "/users/me").header("Authorization", "Bearer " + access), 401));
	}

	private long deletionEventCount() {
		return ApplicationEventsHolder.getRequiredApplicationEvents().stream(UserSoftDeletedEvent.class).count();
	}

	private MockHttpServletRequestBuilder deleteRequest(Account target, String access) {
		return delete(PATH + "/admin/users/" + target.id()).header("Authorization", "Bearer " + access);
	}

}

/** Shared container configuration using Flyway's default classpath:db/migration location. */
@Testcontainers
@Execution(ExecutionMode.SAME_THREAD)
@SpringBootTest(properties = {
		"spring.jpa.open-in-view=false",
		"spring.jpa.properties.hibernate.cache.use_second_level_cache=false",
		"spring.jpa.properties.hibernate.cache.use_query_cache=false",
		"app.cache.enabled=false",
		"spring.cache.type=none"
})
@AutoConfigureMockMvc(print = MockMvcPrint.NONE)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@MockitoBean(types = EmailService.class)
@MockitoSpyBean(types = PasswordResetStore.class)
abstract class SoftDeletedAccountTestSupport {
	protected static final String PATH = "/api/v1";

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_be64_test")
			.withUsername("test")
			.withPassword(UUID.randomUUID().toString())
			.withReuse(false);

	@DynamicPropertySource
	static void containerProperties(DynamicPropertyRegistry registry) {
		POSTGRES.start();
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
		registry.add("spring.flyway.enabled", () -> true);
		registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
	}

	protected final MockMvc mvc;
	protected final ObjectMapper json;
	protected final UserRepository users;
	protected final RefreshTokenRepository tokens;
	protected final AuthUserRepository authUsers;
	protected final PasswordEncoder encoder;
	protected final PasswordResetStore challenges;
	protected final EmailService email;
	protected final TransactionTemplate transaction;
	protected final EntityManager entityManager;
	protected final JwtTokenService jwtTokens;
	private final List<String> fixtureEmails = new ArrayList<>();

	SoftDeletedAccountTestSupport(MockMvc mvc, ObjectMapper json, UserRepository users,
			RefreshTokenRepository tokens, AuthUserRepository authUsers, PasswordEncoder encoder,
			PasswordResetStore challenges, EmailService email, PlatformTransactionManager manager,
			EntityManager entityManager, JwtTokenService jwtTokens) {
		this.mvc = mvc;
		this.json = json;
		this.users = users;
		this.tokens = tokens;
		this.authUsers = authUsers;
		this.encoder = encoder;
		this.challenges = challenges;
		this.email = email;
		this.transaction = new TransactionTemplate(manager);
		this.entityManager = entityManager;
		this.jwtTokens = jwtTokens;
	}

	@BeforeEach
	void resetExternalSpies() {
		reset(email, challenges);
	}

	@AfterEach
	void clearFixtureChallenges() {
		for (String fixtureEmail : fixtureEmails) {
			challenges.clear(fixtureEmail);
		}
	}

	protected Account account(UserRole role) {
		// Names and email stems come from local-dev/db-snapshot/users.csv.
		String name;
		String sourceEmail;
		switch (role) {
			case ADMIN -> { name = "Hoàng Thanh Ngân"; sourceEmail = "hoang.thanh.ngan@utc-polyglot.edu.vn"; }
			case TEACHER -> { name = "Phạm Diệu Anh"; sourceEmail = "pham.dieu.anh@gmail.com"; }
			case STUDENT -> { name = "Ngô Thị Phương"; sourceEmail = "ngo.thi.phuong@gmail.com"; }
			default -> throw new IllegalArgumentException("Unsupported fixture role");
		}
		String uniqueEmail = sourceEmail.replace("@", "+be64-" + UUID.randomUUID() + "@");
		fixtureEmails.add(uniqueEmail);
		String rawPassword = password();
		User user = new User(name, uniqueEmail, null, encoder.encode(rawPassword), role, UserStatus.ACTIVE, false);
		Long id = inTransaction(() -> users.saveAndFlush(user).getId());
		return new Account(id, uniqueEmail, rawPassword);
	}

	protected void changeUser(Account account, UserStatus status, boolean deleted) {
		inTransaction(() -> {
			User user = users.findById(account.id()).orElseThrow();
			user.updateFrom(user.getFullName(), user.getEmail(), user.getPhone(), user.getAvatarUrl(),
					user.getPasswordHash(), user.getRole(), status, deleted);
			users.saveAndFlush(user);
			return null;
		});
	}

	protected String token(Account account, long ttlSeconds, boolean revoked) {
		String rawToken = UUID.randomUUID().toString();
		inTransaction(() -> {
			RefreshTokenJpaEntity entity = new RefreshTokenJpaEntity(account.id(), TokenHasher.sha256(rawToken),
					OffsetDateTime.now().plusSeconds(ttlSeconds), null, null);
			if (revoked) entity.setRevokedAt(OffsetDateTime.now().minusMinutes(1));
			tokens.saveAndFlush(entity);
			return null;
		});
		return rawToken;
	}

	protected User row(Account account) {
		return inTransaction(() -> users.findById(account.id()).orElseThrow());
	}

	protected List<Session> sessions(Account account) {
		return inTransaction(() -> {
			List<Session> result = new ArrayList<>();
			for (RefreshTokenJpaEntity token : tokens.findAll()) {
				if (account.id().equals(token.getUserId())) {
					result.add(new Session(token.getId(), token.getTokenHash(), token.getExpiresAt(), token.getRevokedAt()));
				}
			}
			result.sort(java.util.Comparator.comparing(Session::id));
			return result;
		});
	}

	protected void assertRevoked(Account account) {
		List<Session> sessions = sessions(account);
		assertThat(sessions).isNotEmpty();
		for (Session session : sessions) {
			assertThat(session.revokedAt()).as("revokedAt of refresh session %s", session.id()).isNotNull();
		}
	}

	protected void assertOriginalPassword(Account account) {
		assertThat(encoder.matches(account.password(), row(account).getPasswordHash())).isTrue();
	}

	protected <V> V inTransaction(Supplier<V> work) {
		return transaction.execute(status -> work.get());
	}

	protected JsonNode login(Account account) throws Exception {
		JsonNode response = postOk("/auth/login", body("email", account.email(), "password", account.password()), 200);
		assertThat(response.get("accessToken").asText()).isNotBlank();
		assertThat(response.get("refreshToken").asText()).isNotBlank();
		assertThat(response.get("user").get("id").asLong()).isEqualTo(account.id());
		return response;
	}

	protected void loginError(Account account, String password, int status) throws Exception {
		postError("/auth/login", body("email", account.email(), "password", password), status);
	}

	protected JsonNode refresh(String rawToken, int status) throws Exception {
		JsonNode response = postOk("/auth/refresh", body("refreshToken", rawToken), status);
		if (status == 200) {
			String accessToken = response.get("accessToken").asText();
			assertThat(accessToken).isNotBlank();
			var principal = jwtTokens.parse(accessToken).orElseThrow();
			Long expectedUserId = inTransaction(() -> tokens.findByTokenHash(TokenHasher.sha256(rawToken))
					.orElseThrow().getUserId());
			assertThat(principal.userId()).isEqualTo(expectedUserId.longValue());
		} else {
			assertError(response);
		}
		return response;
	}

	protected JsonNode postOk(String path, Object body, int status) throws Exception {
		return send(post(PATH + path).contentType(MediaType.APPLICATION_JSON)
				.content(json.writeValueAsString(body)), status);
	}

	protected JsonNode postError(String path, Object body, int status) throws Exception {
		JsonNode response = postOk(path, body, status);
		assertError(response);
		return response;
	}

	protected JsonNode send(MockHttpServletRequestBuilder request, int status) throws Exception {
		MvcResult result = mvc.perform(request).andReturn();
		assertThat(result.getResponse().getStatus()).isEqualTo(status);
		return json.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
	}

	protected void assertError(JsonNode response) {
		assertThat(response.has("error")).isTrue();
		assertThat(response.size()).isEqualTo(1);
		assertThat(response.has("accessToken")).isFalse();
		assertThat(response.has("refreshToken")).isFalse();
	}

	protected Map<String, Object> resetBody(String email, String otp, String link) {
		return body("email", email, "otp", otp, "token", link, "newPassword", password());
	}

	protected Map<String, Object> body(Object... entries) {
		Map<String, Object> result = new LinkedHashMap<>();
		for (int index = 0; index < entries.length; index += 2) {
			result.put((String) entries[index], entries[index + 1]);
		}
		return result;
	}

	protected String password() { return "Aa1!" + UUID.randomUUID(); }
	protected String otp() { return String.format("%06d", java.util.concurrent.ThreadLocalRandom.current().nextInt(1_000_000)); }
	protected String absentEmail() {
		String email = "absent-" + UUID.randomUUID() + "@example.invalid";
		fixtureEmails.add(email);
		return email;
	}
	protected record Account(Long id, String email, String password) { }
	protected record Session(Long id, String hash, OffsetDateTime expiresAt, OffsetDateTime revokedAt) { }
}
