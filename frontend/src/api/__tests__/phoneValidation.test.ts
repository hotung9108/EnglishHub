import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePhone, PHONE_PATTERN } from '../../utils/phoneValidation';

test('validatePhone - accepts null, undefined and blank strings as optional', () => {
  assert.strictEqual(validatePhone(null).isValid, true);
  assert.strictEqual(validatePhone(null).normalized, '');
  assert.strictEqual(validatePhone(undefined).isValid, true);
  assert.strictEqual(validatePhone('').isValid, true);
  assert.strictEqual(validatePhone('   ').isValid, true);
});

test('validatePhone - accepts valid phone numbers', () => {
  const valid = [
    '0901234567',
    '+84901234567',
    '0123456789',
    '+12345678901',
    '123456789',
    '123456789012345',
  ];

  for (const p of valid) {
    const res = validatePhone(p, true);
    assert.strictEqual(res.isValid, true, `Expected "${p}" to be valid`);
    assert.strictEqual(res.errorMessage, null);
    assert.strictEqual(res.normalized, p.trim());
  }
});

test('validatePhone - rejects invalid phone numbers (Issue #365: abcxyz)', () => {
  const invalid = [
    'abcxyz',
    '09012345a',
    '12345678', // 8 digits (too short)
    '1234567890123456', // 16 digits (too long)
    '090 123 4567',
    '++84901234567',
    '090-123-4567',
    '😀'.repeat(10),
  ];

  for (const p of invalid) {
    const resVi = validatePhone(p, true);
    assert.strictEqual(resVi.isValid, false, `Expected "${p}" to be invalid`);
    assert.strictEqual(resVi.errorMessage, 'Số điện thoại không đúng định dạng (9-15 chữ số).');

    const resEn = validatePhone(p, false);
    assert.strictEqual(resEn.isValid, false);
    assert.strictEqual(resEn.errorMessage, 'Invalid phone number format (9-15 digits).');
  }
});
