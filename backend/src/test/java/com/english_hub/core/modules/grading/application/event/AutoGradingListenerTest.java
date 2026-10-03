package com.english_hub.core.modules.grading.application.event;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.english_hub.core.modules.grading.application.service.AutoGradingFailureRecorder;
import com.english_hub.core.modules.submission.domain.event.SubmissionModuleSubmittedEvent;
import java.util.concurrent.RejectedExecutionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AutoGradingListenerTest {

	private static final long SUBMISSION_MODULE_ID = 14L;

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
}