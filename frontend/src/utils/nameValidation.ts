export const MIN_FULL_NAME_LENGTH = 2;
export const MAX_FULL_NAME_LENGTH = 50;

/**
 * Regex matching valid full names:
 * - Must start with a Unicode letter (\p{L})
 * - Can contain spaces, hyphens (-), or apostrophes (') between words
 * - Must end with a Unicode letter
 * - Forbids consecutive spaces, hyphens, apostrophes
 * - Forbids digits (0-9) and special/symbol characters (!@#$%^&*()_+... < > / \)
 */
export const FULL_NAME_PATTERN = /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u;

/**
 * Normalizes a full name: trims whitespace and collapses consecutive spaces into a single space.
 */
export function normalizeFullName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export interface FullNameValidationResult {
  isValid: boolean;
  normalized: string;
  errorKey: 'required' | 'tooShort' | 'tooLong' | 'hasDigits' | 'hasSpecialChars' | 'invalidFormat' | null;
  errorMessage: string | null;
}

/**
 * Validates a user's full name according to the system rules.
 *
 * Rules:
 * 1. Required: Cannot be empty or whitespace only.
 * 2. Length: Between 2 and 50 characters (after normalization).
 * 3. Characters: Only Unicode letters (including Vietnamese accents), spaces, hyphens, and apostrophes.
 * 4. Forbidden: Digits (0-9), HTML tags, punctuation/symbols (!@#$%^&*, etc.).
 * 5. Formatting: No consecutive spaces/hyphens/apostrophes, cannot start/end with separators.
 */
export function validateFullName(name: string | null | undefined, isVi = true): FullNameValidationResult {
  if (!name || !name.trim()) {
    return {
      isValid: false,
      normalized: '',
      errorKey: 'required',
      errorMessage: isVi ? 'Vui lòng nhập họ và tên.' : 'Please enter your full name.',
    };
  }

  const normalized = normalizeFullName(name);

  if (normalized.length < MIN_FULL_NAME_LENGTH) {
    return {
      isValid: false,
      normalized,
      errorKey: 'tooShort',
      errorMessage: isVi
        ? `Họ và tên phải có ít nhất ${MIN_FULL_NAME_LENGTH} ký tự.`
        : `Full name must be at least ${MIN_FULL_NAME_LENGTH} characters.`,
    };
  }

  if (normalized.length > MAX_FULL_NAME_LENGTH) {
    return {
      isValid: false,
      normalized,
      errorKey: 'tooLong',
      errorMessage: isVi
        ? `Họ và tên không được vượt quá ${MAX_FULL_NAME_LENGTH} ký tự.`
        : `Full name cannot exceed ${MAX_FULL_NAME_LENGTH} characters.`,
    };
  }

  if (/\d/.test(normalized)) {
    return {
      isValid: false,
      normalized,
      errorKey: 'hasDigits',
      errorMessage: isVi
        ? 'Họ và tên không được chứa chữ số.'
        : 'Full name cannot contain numbers.',
    };
  }

  // Check for forbidden special characters (anything not letter, space, hyphen, apostrophe)
  if (/[^\p{L}\s'-]/u.test(normalized)) {
    return {
      isValid: false,
      normalized,
      errorKey: 'hasSpecialChars',
      errorMessage: isVi
        ? 'Họ và tên không được chứa ký tự đặc biệt.'
        : 'Full name cannot contain special characters.',
    };
  }

  if (!FULL_NAME_PATTERN.test(normalized)) {
    return {
      isValid: false,
      normalized,
      errorKey: 'invalidFormat',
      errorMessage: isVi
        ? 'Họ và tên không đúng định dạng (không đặt dấu cách, gạch nối hoặc nháy đơn ở đầu/cuối hoặc liên tiếp).'
        : 'Invalid full name format (cannot start/end with or have consecutive separators).',
    };
  }

  return {
    isValid: true,
    normalized,
    errorKey: null,
    errorMessage: null,
  };
}
