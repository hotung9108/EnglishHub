package com.english_hub.core.modules.auth.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.reset;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.email.EmailService;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.auth.domain.repository.AuthUserRepository;
import com.english_hub.core.modules.auth.domain.service.PasswordResetStore;
import com.english_hub.core.modules.auth.infrastructure.adapter.AuthUserJpaAdapter;
import com.english_hub.core.modules.auth.infrastructure.persistence.repository.RefreshTokenRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.JpaUserRepository;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.mockito.stubbing.Answer;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Tests controlled overlaps on the isolated, Flyway-initialized PostgreSQL container
 * configured by {@link SoftDeletedAccountTestSupport}.
 */
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
@MockitoSpyBean(types = {AuthUserJpaAdapter.class, JpaUserRepository.class})
@Timeout(45)
class SoftDeletedAccountConcurrencyIntegrationTest extends SoftDeletedAccountTestSupport {
	private static final String HELD_WORKER = "be64-held-lookup";
	private static final int WAIT_SECONDS = 10;
	private final com.english_hub.core.modules.user.domain.repository.UserRepository userPort;

	SoftDeletedAccountConcurrencyIntegrationTest(MockMvc mvc, ObjectMapper json, UserRepository users,
			RefreshTokenRepository tokens, AuthUserRepository authUsers, PasswordEncoder encoder,
			PasswordResetStore challenges, EmailService email, PlatformTransactionManager manager,
			EntityManager entityManager, JwtTokenService jwtTokens,
			com.english_hub.core.modules.user.domain.repository.UserRepository userPort) {
		super(mvc, json, users, tokens, authUsers, encoder, challenges, email, manager, entityManager, jwtTokens);
		this.userPort = userPort;
	}

	// E21: A already found the target; B commits deletion before A resumes.
	@Test
	void overlappingDeletesLeaveTargetRevokedWithoutChangingAnotherUser() throws Exception {
		Account admin = account(UserRole.ADMIN);
		Account target = account(UserRole.STUDENT);
		Account control = account(UserRole.TEACHER);
		String access = login(admin).get("accessToken").asText();
		String targetToken = token(target, 3600, false);
		token(control, 3600, false);
		List<Session> controlBefore = sessions(control);
		CountDownLatch lookupFinished = new CountDownLatch(1);
		CountDownLatch resumeLookup = new CountDownLatch(1);
		doAnswer(pauseAfterRealLookup(lookupFinished, resumeLookup)).when(userPort).findById(target.id());
		ExecutorService executor = worker();
		Future<Integer> heldDelete = executor.submit(() -> mvc.perform(delete(PATH + "/admin/users/" + target.id())
				.header("Authorization", "Bearer " + access)).andReturn().getResponse().getStatus());
		try {
			await(lookupFinished);
			deleteTarget(target, access);
			resumeLookup.countDown();
			int status = heldDelete.get(WAIT_SECONDS, TimeUnit.SECONDS);
			assertThat(status == 200 || status == 404).isTrue();
			assertThat(row(target).isDeleted()).isTrue();
			assertRevoked(target);
			refresh(targetToken, 401);
			assertThat(sessions(control)).isEqualTo(controlBefore);
		} finally {
			finish(resumeLookup, executor, heldDelete);
		}
	}

	// E22 login: its user lookup succeeded before deletion, but the session is inserted afterwards.
	@Test
	void overlappingLoginMayFinishButItsLateUnrevokedTokenCannotRefresh() throws Exception {
		Account admin = account(UserRole.ADMIN);
		Account target = account(UserRole.STUDENT);
		Account control = account(UserRole.TEACHER);
		String access = login(admin).get("accessToken").asText();
		token(control, 3600, false);
		List<Session> controlBefore = sessions(control);
		CountDownLatch lookupFinished = new CountDownLatch(1);
		CountDownLatch resumeLookup = new CountDownLatch(1);
		doAnswer(pauseAfterRealLookup(lookupFinished, resumeLookup)).when(authUsers).findByEmail(target.email());
		ExecutorService executor = worker();
		Future<JsonNode> heldLogin = executor.submit(() -> login(target));
		try {
			await(lookupFinished);
			deleteTarget(target, access);
			assertThat(row(target).isDeleted()).isTrue();
			assertThat(sessions(target)).isEmpty();
			resumeLookup.countDown();
			JsonNode result = heldLogin.get(WAIT_SECONDS, TimeUnit.SECONDS);
			String lateToken = result.get("refreshToken").asText();
			assertThat(sessions(target)).hasSize(1);
			assertThat(sessions(target).getFirst().revokedAt()).isNull();
			refresh(lateToken, 401);
			loginError(target, target.password(), 404);
			assertThat(sessions(control)).isEqualTo(controlBefore);
		} finally {
			finish(resumeLookup, executor, heldLogin);
		}
	}

	// E22 refresh: both token and user were read before DELETE committed.
	@Test
	void overlappingRefreshMayFinishButEveryNewLookupRejectsDeletedUser() throws Exception {
		Account admin = account(UserRole.ADMIN);
		Account target = account(UserRole.STUDENT);
		Account control = account(UserRole.TEACHER);
		String access = login(admin).get("accessToken").asText();
		String rawToken = login(target).get("refreshToken").asText();
		token(control, 3600, false);
		List<Session> controlBefore = sessions(control);
		CountDownLatch lookupFinished = new CountDownLatch(1);
		CountDownLatch resumeLookup = new CountDownLatch(1);
		doAnswer(pauseAfterRealLookup(lookupFinished, resumeLookup)).when(authUsers).findById(target.id());
		ExecutorService executor = worker();
		Future<JsonNode> heldRefresh = executor.submit(() -> refresh(rawToken, 200));
		try {
			await(lookupFinished);
			deleteTarget(target, access);
			assertRevoked(target);
			resumeLookup.countDown();
			JsonNode result = heldRefresh.get(WAIT_SECONDS, TimeUnit.SECONDS);
			assertThat(result.get("accessToken").asText()).isNotBlank();
			refresh(rawToken, 401);
			loginError(target, target.password(), 404);
			assertThat(sessions(control)).isEqualTo(controlBefore);
		} finally {
			finish(resumeLookup, executor, heldRefresh);
		}
	}

	private Answer<Object> pauseAfterRealLookup(CountDownLatch lookupFinished, CountDownLatch resumeLookup) {
		return invocation -> {
			Object result = invocation.callRealMethod();
			if (Thread.currentThread().getName().equals(HELD_WORKER)) {
				assertThat(result).isInstanceOf(java.util.Optional.class);
				assertThat(((java.util.Optional<?>) result).isPresent()).isTrue();
				lookupFinished.countDown();
				await(resumeLookup);
			}
			return result;
		};
	}

	private ExecutorService worker() {
		return Executors.newSingleThreadExecutor(task -> new Thread(task, HELD_WORKER));
	}

	private void await(CountDownLatch latch) throws InterruptedException {
		assertThat(latch.await(WAIT_SECONDS, TimeUnit.SECONDS)).isTrue();
	}

	private void deleteTarget(Account target, String access) throws Exception {
		send(delete(PATH + "/admin/users/" + target.id())
				.header("Authorization", "Bearer " + access), 200);
	}

	private void finish(CountDownLatch resumeLookup, ExecutorService executor, Future<?> request)
			throws InterruptedException {
		resumeLookup.countDown();
		request.cancel(true);
		executor.shutdownNow();
		try {
			assertThat(executor.awaitTermination(WAIT_SECONDS, TimeUnit.SECONDS)).isTrue();
		} finally {
			reset(authUsers);
			reset(userPort);
		}
	}
}
