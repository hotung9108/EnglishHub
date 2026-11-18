package com.english_hub.core.modules.report.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

import java.math.BigDecimal;
import java.math.BigInteger;
import org.junit.jupiter.api.Test;

class ExactFractionTest {
	@Test
	void add_combinesFractionsExactly() {
		ExactFraction sum = ExactFraction.of(BigInteger.ONE, BigInteger.valueOf(3))
				.add(ExactFraction.of(BigInteger.ONE, BigInteger.valueOf(6)));

		assertThat(sum.roundHalfUp(3)).isEqualTo(new BigDecimal("0.500"));
	}

	@Test
	void divideByPositiveInteger_preservesExactValue() {
		ExactFraction quotient = ExactFraction.of(BigInteger.valueOf(3), BigInteger.valueOf(4))
				.divideByPositiveInteger(2);

		assertThat(quotient.roundHalfUp(4)).isEqualTo(new BigDecimal("0.3750"));
	}

	@Test
	void fromDecimalRatio_alignsDifferentScalesExactly() {
		ExactFraction ratio = ExactFraction.fromDecimalRatio(
				new BigDecimal("18.5"), new BigDecimal("20.00"));

		assertThat(ratio.roundHalfUp(4)).isEqualTo(new BigDecimal("0.9250"));
	}

	@Test
	void multiplyByPositiveInteger_scalesNumeratorExactly() {
		ExactFraction scaled = ExactFraction.of(BigInteger.valueOf(7), BigInteger.valueOf(10))
				.multiplyByPositiveInteger(100);

		assertThat(scaled.roundHalfUp(2)).isEqualTo(new BigDecimal("70.00"));
	}

	@Test
	void roundHalfUp_supportsSeveralScalesAndExactTies() {
		ExactFraction oneEighth = ExactFraction.of(BigInteger.ONE, BigInteger.valueOf(8));
		ExactFraction twoAndHalf = ExactFraction.of(BigInteger.valueOf(5), BigInteger.valueOf(2));

		assertThat(oneEighth.roundHalfUp(0)).isEqualTo(new BigDecimal("0"));
		assertThat(oneEighth.roundHalfUp(2)).isEqualTo(new BigDecimal("0.13"));
		assertThat(oneEighth.roundHalfUp(3)).isEqualTo(new BigDecimal("0.125"));
		assertThat(twoAndHalf.roundHalfUp(0)).isEqualTo(new BigDecimal("3"));
	}

	@Test
	void roundHalfUp_doesNotRoundUpBelowTheBoundary() {
		ExactFraction belowHalf = ExactFraction.of(BigInteger.valueOf(1249), BigInteger.valueOf(10000));

		assertThat(belowHalf.roundHalfUp(2)).isEqualTo(new BigDecimal("0.12"));
	}

	@Test
	void divideByPositiveInteger_rejectsZeroOrNegativeDivisors() {
		ExactFraction fraction = ExactFraction.of(BigInteger.ONE, BigInteger.valueOf(2));

		assertThatIllegalArgumentException().isThrownBy(() -> fraction.divideByPositiveInteger(0));
		assertThatIllegalArgumentException().isThrownBy(() -> fraction.divideByPositiveInteger(-1));
	}

	@Test
	void of_rejectsZeroDenominator() {
		assertThatIllegalArgumentException()
				.isThrownBy(() -> ExactFraction.of(BigInteger.ONE, BigInteger.ZERO));
	}
}
