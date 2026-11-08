/**
 * EnglishHub - Theme Utilities
 * Pure helper functions for resolving, validating, and managing dual themes (Light & Dark).
 */

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'eh_theme';

/**
 * Checks whether a value is a valid supported theme string.
 */
export function isValidTheme(val: unknown): val is Theme {
  return val === 'light' || val === 'dark';
}

/**
 * Resolves the effective theme based on user stored preference and OS system dark mode.
 */
export function resolveEffectiveTheme(
  savedPreference: string | null | undefined,
  systemPrefersDark: boolean
): Theme {
  if (savedPreference === 'light' || savedPreference === 'dark') {
    return savedPreference;
  }
  return systemPrefersDark ? 'dark' : 'light';
}

/**
 * Returns localized theme label and metadata for display.
 */
export function getThemeMeta(theme: Theme, isVi: boolean): { label: string; nextTheme: Theme; nextLabel: string } {
  if (theme === 'dark') {
    return {
      label: isVi ? 'Giao diện Tối' : 'Dark Mode',
      nextTheme: 'light',
      nextLabel: isVi ? 'Chuyển sang giao diện Sáng' : 'Switch to Light Mode'
    };
  }
  return {
    label: isVi ? 'Giao diện Sáng' : 'Light Mode',
    nextTheme: 'dark',
    nextLabel: isVi ? 'Chuyển sang giao diện Tối' : 'Switch to Dark Mode'
  };
}
