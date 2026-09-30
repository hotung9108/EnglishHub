import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeFullName,
  validateFullName,
  MIN_FULL_NAME_LENGTH,
  MAX_FULL_NAME_LENGTH,
} from '../../utils/nameValidation';

test('normalizeFullName - trims and collapses consecutive whitespace', () => {
  assert.strictEqual(normalizeFullName('  Nguyen   Van   A  '), 'Nguyen Van A');
  assert.strictEqual(normalizeFullName('Trần  Thị\t Mai \n Lan'), 'Trần Thị Mai Lan');
});

test('validateFullName - accepts valid Vietnamese and international names', () => {
  const validNames = [
    'Nguyễn Văn A',
    'Trần Thị Mai Lan',
    'Đoàn Thái Sơn',
    'Võ Ê Vo',
    'Lê Thị Mỹ Duyên',
    'Ngô Bảo Châu',
    'Phan Đình Phùng',
    'John Doe',
    'Jean-Luc Picard',
    "Shaquille O'Neal",
    "d'Artagnan",
    'René Descartes',
    'Marie-Curie',
    'Mary Jane Watson',
  ];

  for (const name of validNames) {
    const resultVi = validateFullName(name, true);
    assert.strictEqual(resultVi.isValid, true, `Expected "${name}" to be valid in VI`);
    assert.strictEqual(resultVi.errorMessage, null);

    const resultEn = validateFullName(name, false);
    assert.strictEqual(resultEn.isValid, true, `Expected "${name}" to be valid in EN`);
    assert.strictEqual(resultEn.errorMessage, null);
  }
});

test('validateFullName - rejects empty or blank input', () => {
  assert.strictEqual(validateFullName('', true).errorKey, 'required');
  assert.strictEqual(validateFullName('   ', true).errorKey, 'required');
  assert.strictEqual(validateFullName(null, true).errorKey, 'required');
  assert.strictEqual(validateFullName(undefined, true).errorKey, 'required');
  assert.strictEqual(validateFullName('', false).errorMessage, 'Please enter your full name.');
});

test('validateFullName - rejects names that are too short or too long', () => {
  const tooShort = validateFullName('A', true);
  assert.strictEqual(tooShort.isValid, false);
  assert.strictEqual(tooShort.errorKey, 'tooShort');
  assert.match(tooShort.errorMessage ?? '', new RegExp(`${MIN_FULL_NAME_LENGTH}`));

  const tooLongStr = 'A'.repeat(MAX_FULL_NAME_LENGTH + 1);
  const tooLong = validateFullName(tooLongStr, true);
  assert.strictEqual(tooLong.isValid, false);
  assert.strictEqual(tooLong.errorKey, 'tooLong');
  assert.match(tooLong.errorMessage ?? '', new RegExp(`${MAX_FULL_NAME_LENGTH}`));
});

test('validateFullName - rejects names containing numbers/digits', () => {
  const namesWithDigits = [
    'Nguyen Van 123',
    'Student01',
    'Lan 2',
    '99 Nguyen',
  ];

  for (const name of namesWithDigits) {
    const result = validateFullName(name, true);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.errorKey, 'hasDigits');
    assert.strictEqual(result.errorMessage, 'Họ và tên không được chứa chữ số.');

    const resultEn = validateFullName(name, false);
    assert.strictEqual(resultEn.errorMessage, 'Full name cannot contain numbers.');
  }
});

test('validateFullName - rejects forbidden special characters and HTML/script injection', () => {
  const namesWithSpecialChars = [
    'Nguyen <script>',
    'Tran & Lan',
    'User@EnglishHub',
    'Nguyen $ Son',
    'Mai #Tag',
    'John (Admin)',
    'Nguyen_Van_A',
    'Tran.Van.B',
    'Pham+Hung',
    'Hoang*Minh',
    'Doan%Thanh',
    'Vo!Thao',
  ];

  for (const name of namesWithSpecialChars) {
    const result = validateFullName(name, true);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.errorKey, 'hasSpecialChars');
    assert.strictEqual(result.errorMessage, 'Họ và tên không được chứa ký tự đặc biệt.');

    const resultEn = validateFullName(name, false);
    assert.strictEqual(resultEn.errorMessage, 'Full name cannot contain special characters.');
  }
});

test('validateFullName - rejects malformed separator placement', () => {
  const malformed = [
    '-Nguyen Van A',
    'Nguyen Van A-',
    "'Nguyen Van A",
    'Nguyen Van A\'',
    'Nguyen--Van A',
    "Nguyen''Van A",
    "Nguyen '- Van A",
  ];

  for (const name of malformed) {
    const result = validateFullName(name, true);
    assert.strictEqual(result.isValid, false, `Expected "${name}" to be rejected`);
    assert.strictEqual(result.errorKey, 'invalidFormat');
  }
});
