package com.english_hub.core.modules.report.application.service;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.Objects;

final class ExactFraction {
	private static final BigInteger TEN = BigInteger.TEN;
	private static final BigInteger TWO = BigInteger.valueOf(2);
	private static final ExactFraction ZERO = new ExactFraction(BigInteger.ZERO, BigInteger.ONE);

	private final BigInteger numerator;
	private final BigInteger denominator;

	private ExactFraction(BigInteger numerator, BigInteger denominator) {
		Objects.requireNonNull(numerator);
		Objects.requireNonNull(denominator);
		if (numerator.signum() < 0) {
			throw new IllegalArgumentException("Numerator must not be negative.");
		}
		if (denominator.signum() <= 0) {
			throw new IllegalArgumentException("Denominator must be positive.");
		}
		BigInteger greatestCommonDivisor = numerator.gcd(denominator);
		this.numerator = numerator.divide(greatestCommonDivisor);
		this.denominator = denominator.divide(greatestCommonDivisor);
	}

	static ExactFraction zero() {
		return ZERO;
	}

	static ExactFraction of(BigInteger numerator, BigInteger denominator) {
		return new ExactFraction(numerator, denominator);
	}

	static ExactFraction fromDecimalRatio(BigDecimal numerator, BigDecimal denominator) {
		Objects.requireNonNull(numerator);
		Objects.requireNonNull(denominator);
		int commonScale = Math.max(numerator.scale(), denominator.scale());
		BigInteger scaledNumerator = numerator.setScale(commonScale).unscaledValue();
		BigInteger scaledDenominator = denominator.setScale(commonScale).unscaledValue();
		return of(scaledNumerator, scaledDenominator);
	}

	ExactFraction add(ExactFraction other) {
		Objects.requireNonNull(other);
		BigInteger sumNumerator = numerator.multiply(other.denominator)
				.add(other.numerator.multiply(denominator));
		BigInteger sumDenominator = denominator.multiply(other.denominator);
		return of(sumNumerator, sumDenominator);
	}

	ExactFraction divideByPositiveInteger(int divisor) {
		if (divisor <= 0) {
			throw new IllegalArgumentException("Divisor must be positive.");
		}
		return of(numerator, denominator.multiply(BigInteger.valueOf(divisor)));
	}

	ExactFraction multiplyByPositiveInteger(int multiplier) {
		if (multiplier <= 0) {
			throw new IllegalArgumentException("Multiplier must be positive.");
		}
		return of(numerator.multiply(BigInteger.valueOf(multiplier)), denominator);
	}

	BigDecimal roundHalfUp(int scale) {
		if (scale < 0) {
			throw new IllegalArgumentException("Scale must not be negative.");
		}
		BigInteger scaledNumerator = numerator.multiply(TEN.pow(scale));
		BigInteger[] quotientAndRemainder = scaledNumerator.divideAndRemainder(denominator);
		BigInteger roundedValue = quotientAndRemainder[0];
		BigInteger doubledRemainder = quotientAndRemainder[1].multiply(TWO);
		if (doubledRemainder.compareTo(denominator) >= 0) {
			roundedValue = roundedValue.add(BigInteger.ONE);
		}
		return new BigDecimal(roundedValue, scale);
	}
}
