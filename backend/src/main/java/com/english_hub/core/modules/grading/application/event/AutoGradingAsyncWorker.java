package com.english_hub.core.modules.grading.application.event;

import com.english_hub.core.modules.grading.application.service.AutoGradingService;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Runs {@link AutoGradingService#grade(long)} on the auto-grading executor.
 *
 * <p>Separate from {@code AutoGradingListener} on purpose. If the listener itself carried
 * {@code @Async}, Spring's async proxy would submit the task before the listener body ran, so an
 * executor rejection would be thrown from inside the listener's own commit and could not be caught
 * by it. Splitting the two means the listener makes a plain synchronous call, and a rejected task
 * surfaces to the listener, which can then record the failure.
 *
 * <p>Only this class is asynchronous. {@code AutoGradingServiceImpl} owns the transaction, so the
 * grading transaction begins on the worker thread with no transaction of the caller's to join,
 * which is what keeps a thread-bound context from the submit request out of the way.
 */
@Component
public class AutoGradingAsyncWorker {

	private final AutoGradingService autoGradingService;

	public AutoGradingAsyncWorker(AutoGradingService autoGradingService) {
		this.autoGradingService = autoGradingService;
	}

	@Async("autoGradingExecutor")
	public void runAutoGrading(long submissionModuleId) {
		autoGradingService.grade(submissionModuleId);
	}
}