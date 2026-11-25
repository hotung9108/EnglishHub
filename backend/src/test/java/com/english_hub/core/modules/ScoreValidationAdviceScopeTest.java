package com.english_hub.core.modules;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.modules.module.presentation.rest.ModuleController;
import com.english_hub.core.modules.module.presentation.rest.ModuleScoreValidationAdvice;
import com.english_hub.core.modules.question.presentation.rest.QuestionController;
import com.english_hub.core.modules.question.presentation.rest.QuestionScoreValidationAdvice;
import org.junit.jupiter.api.Test;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.bind.annotation.RestControllerAdvice;

class ScoreValidationAdviceScopeTest {

	@Test
	void scoreValidationAdvicesAreRestrictedToTheirOwnControllers() {
		assertAdviceScope(ModuleScoreValidationAdvice.class, ModuleController.class);
		assertAdviceScope(QuestionScoreValidationAdvice.class, QuestionController.class);
	}

	private void assertAdviceScope(Class<?> adviceClass, Class<?> controllerClass) {
		RestControllerAdvice advice = adviceClass.getAnnotation(RestControllerAdvice.class);
		assertThat(advice).isNotNull();
		assertThat(advice.assignableTypes()).containsExactly(controllerClass);

		Order order = adviceClass.getAnnotation(Order.class);
		assertThat(order).isNotNull();
		assertThat(order.value()).isEqualTo(Ordered.HIGHEST_PRECEDENCE);
	}
}
