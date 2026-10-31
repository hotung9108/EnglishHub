package com.english_hub.core.modules.grading.application.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import com.english_hub.core.modules.grading.application.service.AutoGradingFailureRecorder;
import com.english_hub.core.modules.submission.domain.event.SubmissionModuleSubmittedEvent;
import java.util.List;
import java.util.concurrent.RejectedExecutionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AutoGradingListenerTest {

	private static final long SUBMISSION_MODULE_ID = 14L;
	private static final List<Long> SUBMISSION_MODULE_IDS = List.of(SUBMISSION_MODULE_ID, 15L, 16L);

	@Mock
	private AutoGradingAsyncWorker autoGradingAsyncWorker;

	@Mock
	private AutoGradingFailureRecorder autoGradingFailureRecorder;

	private AutoGradingListener listener;

	@BeforeEach
	void setUp() {
		listener = new AutoGradingListener(autoGradingAsyncWorker, autoGradingFailureRecorder);
	}

	@Test
	void handsTheCommittedModuleToTheAsyncWorker() {
		listener.onModuleSubmitted(new SubmissionModuleSubmittedEvent(SUBMISSION_MODULE_ID));

		verify(autoGradingAsyncWorker).runAutoGrading(SUBMISSION_MODULE_ID);
		verifyNoInteractions(autoGradingFailureRecorder);
	}

	@Test
	void recordsTheFailureWhenTheWorkerCannotAcceptTheTask() {
		doThrow(new RejectedExecutionException("autoGradingExecutor queue is full"))
				.when(autoGradingAsyncWorker)
				.runAutoGrading(SUBMISSION_MODULE_ID);

		assertThatCode(() -> listener.onModuleSubmitted(new SubmissionModuleSubmittedEvent(SUBMISSION_MODULE_ID)))
				.doesNotThrowAnyException();
		verify(autoGradingFailureRecorder).recordFailed(eq(SUBMISSION_MODULE_ID), any(Throwable.class));
	}

	@Test
	void neverFailsACommittedSubmissionOverAutoGrading() {
		doThrow(new RejectedExecutionException("executor shutting down")).when(autoGradingAsyncWorker).runAutoGrading(any(Long.class));
		doThrow(new IllegalStateException("cannot write")).when(autoGradingFailureRecorder).recordFailed(any(Long.class), any());

		assertThatCode(() -> listener.onModuleSubmitted(new SubmissionModuleSubmittedEvent(SUBMISSION_MODULE_ID)))
				.doesNotThrowAnyException();
		verify(autoGradingFailureRecorder).recordFailed(eq(SUBMISSION_MODULE_ID), any(Throwable.class));
	}

	@Test
	void doesNotRecordAFailureForAModuleThatWasNeverDispatched() {
		assertThatCode(() -> listener.onModuleSubmitted(new SubmissionModuleSubmittedEvent(SUBMISSION_MODULE_ID)))
				.doesNotThrowAnyException();

		verify(autoGradingAsyncWorker).runAutoGrading(SUBMISSION_MODULE_ID);
		verify(autoGradingFailureRecorder, never()).recordFailed(any(Long.class), any());
	}

	@Test
	void dispatchesEveryEventExactlyOnceWhenAllWorkersAccept() {
		dispatchEvents();

		assertEveryEventWasDispatchedOnce();
		verifyNoInteractions(autoGradingFailureRecorder);
	}

	@ParameterizedTest(name = "rejection at index {0} does not stop other events")
	@ValueSource(ints = {0, 1, 2})
	void recordsRejectedEventAndStillDispatchesEveryOtherEvent(int rejectedIndex) {
		long rejectedId = SUBMISSION_MODULE_IDS.get(rejectedIndex);
		RejectedExecutionException failure = new RejectedExecutionException("executor queue is full");
		doNothing().when(autoGradingAsyncWorker).runAutoGrading(anyLong());
		doThrow(failure).when(autoGradingAsyncWorker).runAutoGrading(rejectedId);

		assertThatCode(this::dispatchEvents).doesNotThrowAnyException();

		assertEveryEventWasDispatchedOnce();
		verify(autoGradingFailureRecorder).recordFailed(rejectedId, failure);
		verifyNoMoreInteractions(autoGradingFailureRecorder);
	}

	@ParameterizedTest(name = "recorder failure at index {0} does not stop other events")
	@ValueSource(ints = {0, 1, 2})
	void stillDispatchesOtherEventsWhenRecordingARejectionAlsoFails(int rejectedIndex) {
		long rejectedId = SUBMISSION_MODULE_IDS.get(rejectedIndex);
		RejectedExecutionException failure = new RejectedExecutionException("executor shutting down");
		doNothing().when(autoGradingAsyncWorker).runAutoGrading(anyLong());
		doThrow(failure).when(autoGradingAsyncWorker).runAutoGrading(rejectedId);
		doThrow(new IllegalStateException("recorder unavailable"))
				.when(autoGradingFailureRecorder).recordFailed(rejectedId, failure);

		assertThatCode(this::dispatchEvents).doesNotThrowAnyException();

		assertEveryEventWasDispatchedOnce();
		verify(autoGradingFailureRecorder).recordFailed(rejectedId, failure);
		verifyNoMoreInteractions(autoGradingFailureRecorder);
	}

	@Test
	void containsWorkerAndRecorderErrorsAndContinuesDispatching() {
		AssertionError failure = new AssertionError("worker error");
		doNothing().when(autoGradingAsyncWorker).runAutoGrading(anyLong());
		doThrow(failure).when(autoGradingAsyncWorker).runAutoGrading(SUBMISSION_MODULE_ID);
		doThrow(new AssertionError("recorder error"))
				.when(autoGradingFailureRecorder).recordFailed(SUBMISSION_MODULE_ID, failure);

		assertThatCode(this::dispatchEvents).doesNotThrowAnyException();

		assertEveryEventWasDispatchedOnce();
		verify(autoGradingFailureRecorder).recordFailed(SUBMISSION_MODULE_ID, failure);
		verifyNoMoreInteractions(autoGradingFailureRecorder);
	}

	private void dispatchEvents() {
		for (Long submissionModuleId : SUBMISSION_MODULE_IDS) {
			listener.onModuleSubmitted(new SubmissionModuleSubmittedEvent(submissionModuleId));
		}
	}

	private void assertEveryEventWasDispatchedOnce() {
		ArgumentCaptor<Long> moduleIds = ArgumentCaptor.forClass(Long.class);
		verify(autoGradingAsyncWorker, times(SUBMISSION_MODULE_IDS.size()))
				.runAutoGrading(moduleIds.capture());
		assertThat(moduleIds.getAllValues()).containsExactlyElementsOf(SUBMISSION_MODULE_IDS);
		verifyNoMoreInteractions(autoGradingAsyncWorker);
	}
}
