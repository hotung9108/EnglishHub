package com.english_hub.core.modules.grading.application.event;

import com.english_hub.core.modules.grading.application.service.AutoGradingFailureRecorder;
import com.english_hub.core.modules.submission.domain.event.SubmissionModuleSubmittedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Hands a committed submission module to auto-grading.
 *
 * <p>Runs {@code AFTER_COMMIT} because scoring reads the answer rows the submit transaction wrote;
 * dispatching earlier would race that write. This listener stays synchronous and only hands the
 * module to {@code AutoGradingAsyncWorker}, so the student's request thread never waits for scoring.
 *
 * <p>Nothing is allowed to escape this method. It runs inside the submit request's commit, so a
 * thrown exception would surface as a 500 for a submission that is already committed. A rejected
 * task is caught here too, which is why the async boundary lives in the worker rather than here.
 */
@Component
public class AutoGradingListener {

	private static final Logger LOGGER = LoggerFactory.getLogger(AutoGradingListener.class);

	private final AutoGradingAsyncWorker autoGradingAsyncWorker;
	private final AutoGradingFailureRecorder autoGradingFailureRecorder;

	public AutoGradingListener(
			AutoGradingAsyncWorker autoGradingAsyncWorker,
			AutoGradingFailureRecorder autoGradingFailureRecorder) {
		this.autoGradingAsyncWorker = autoGradingAsyncWorker;
		this.autoGradingFailureRecorder = autoGradingFailureRecorder;
	}

	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	public void onModuleSubmitted(SubmissionModuleSubmittedEvent event) {
		long submissionModuleId = event.submissionModuleId();
		try {
			autoGradingAsyncWorker.runAutoGrading(submissionModuleId);
		} catch (Throwable throwable) {
			recordFailure(submissionModuleId, throwable);
		}
	}

	private void recordFailure(long submissionModuleId, Throwable cause) {
		try {
			autoGradingFailureRecorder.recordFailed(submissionModuleId, cause);
		} catch (Throwable failureException) {
			/*
			 * Last resort: the grading row stays PENDING and surfaces through the report module's
			 * pending-gradings count. Still must not propagate, or the student's submit would fail.
			 */
			LOGGER.error(
					"Could not mark submission module {} as failed; its grading stays pending.",
					submissionModuleId,
					failureException);
		}
	}
}