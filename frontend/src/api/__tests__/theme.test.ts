import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidTheme,
  resolveEffectiveTheme,
  getThemeMeta,
  THEME_STORAGE_KEY
} from '../../utils/theme.utils';

test('theme - THEME_STORAGE_KEY is consistent', () => {
  assert.strictEqual(THEME_STORAGE_KEY, 'eh_theme');
});

test('theme - isValidTheme correctly identifies valid themes', () => {
  assert.strictEqual(isValidTheme('light'), true);
  assert.strictEqual(isValidTheme('dark'), true);
  assert.strictEqual(isValidTheme('system'), false);
  assert.strictEqual(isValidTheme(''), false);
  assert.strictEqual(isValidTheme(null), false);
  assert.strictEqual(isValidTheme(undefined), false);
  assert.strictEqual(isValidTheme(123), false);
});

test('theme - resolveEffectiveTheme prioritizes valid user preference', () => {
  assert.strictEqual(resolveEffectiveTheme('light', true), 'light');
  assert.strictEqual(resolveEffectiveTheme('light', false), 'light');
  assert.strictEqual(resolveEffectiveTheme('dark', true), 'dark');
  assert.strictEqual(resolveEffectiveTheme('dark', false), 'dark');
});

test('theme - resolveEffectiveTheme falls back to system preference when no preference saved', () => {
  assert.strictEqual(resolveEffectiveTheme(null, true), 'dark');
  assert.strictEqual(resolveEffectiveTheme(null, false), 'light');
  assert.strictEqual(resolveEffectiveTheme(undefined, true), 'dark');
  assert.strictEqual(resolveEffectiveTheme(undefined, false), 'light');
  assert.strictEqual(resolveEffectiveTheme('invalid_theme', true), 'dark');
  assert.strictEqual(resolveEffectiveTheme('invalid_theme', false), 'light');
});

test('theme - getThemeMeta provides accurate metadata for light theme', () => {
  const metaVi = getThemeMeta('light', true);
  assert.strictEqual(metaVi.label, 'Giao diện Sáng');
  assert.strictEqual(metaVi.nextTheme, 'dark');
  assert.strictEqual(metaVi.nextLabel, 'Chuyển sang giao diện Tối');

  const metaEn = getThemeMeta('light', false);
  assert.strictEqual(metaEn.label, 'Light Mode');
  assert.strictEqual(metaEn.nextTheme, 'dark');
  assert.strictEqual(metaEn.nextLabel, 'Switch to Dark Mode');
});

test('theme - getThemeMeta provides accurate metadata for dark theme', () => {
  const metaVi = getThemeMeta('dark', true);
  assert.strictEqual(metaVi.label, 'Giao diện Tối');
  assert.strictEqual(metaVi.nextTheme, 'light');
  assert.strictEqual(metaVi.nextLabel, 'Chuyển sang giao diện Sáng');

  const metaEn = getThemeMeta('dark', false);
  assert.strictEqual(metaEn.label, 'Dark Mode');
  assert.strictEqual(metaEn.nextTheme, 'light');
  assert.strictEqual(metaEn.nextLabel, 'Switch to Light Mode');
});
