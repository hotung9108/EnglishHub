package com.english_hub.core.modules.grading.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableAsync
public class GradingAsyncConfiguration {

	@Bean(name = "gradingAiExecutor")
	public ThreadPoolTaskExecutor gradingAiExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(1);
		executor.setMaxPoolSize(2);
		executor.setQueueCapacity(100);
		executor.setThreadNamePrefix("grading-ai-");
		executor.setWaitForTasksToCompleteOnShutdown(true);
		return executor;
	}

	/**
	 * Dedicated pool for deterministic answer comparison, kept separate from {@code gradingAiExecutor}
	 * so a burst of cheap scoring tasks can never be starved behind rate-limited AI calls.
	 *
	 * <p>Core equals the intended concurrency: {@code ThreadPoolTaskExecutor} only grows past the
	 * core size once the queue is full, so a small core with a large queue would silently stay at the
	 * core size.
	 */
	@Bean(name = "autoGradingExecutor")
	public ThreadPoolTaskExecutor autoGradingExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(4);
		executor.setMaxPoolSize(4);
		executor.setQueueCapacity(50);
		executor.setThreadNamePrefix("auto-grading-");
		executor.setWaitForTasksToCompleteOnShutdown(true);
		return executor;
	}
}
