export const PHONE_PATTERN = /^\+?[0-9]{9,15}$/;

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  errorMessage: string | null;
}

/**
 * Validates a user's phone number.
 *
 * Rules:
 * - Optional: Can be empty or null (clears phone).
 * - Format: If provided, must match ^\+?[0-9]{9,15}$ (9-15 digits, optional leading +).
 */
export function validatePhone(phone: string | null | undefined, isVi = true): PhoneValidationResult {
  if (!phone || !phone.trim()) {
    return {
      isValid: true,
      normalized: '',
      errorMessage: null,
    };
  }

  const normalized = phone.trim();
  if (!PHONE_PATTERN.test(normalized)) {
    return {
      isValid: false,
      normalized,
      errorMessage: isVi
        ? 'Số điện thoại không đúng định dạng (9-15 chữ số).'
        : 'Invalid phone number format (9-15 digits).',
    };
  }

  return {
    isValid: true,
    normalized,
    errorMessage: null,
  };
}
