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
}
