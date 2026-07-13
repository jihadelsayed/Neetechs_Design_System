import type { ResolvedTheme, ThemePreference } from './types.js';

/**
 * Validates an untrusted value (cookie, cache, backend payload) into a
 * ThemePreference. Anything other than `system`, `light` or `dark` is
 * rejected with `null`.
 */
export function normalizeThemePreference(value: unknown): ThemePreference | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'system' || normalized === 'light' || normalized === 'dark') {
    return normalized;
  }

  return null;
}

/**
 * Resolves a stored preference to the theme rendered on the document.
 * `systemDark` is the current `(prefers-color-scheme: dark)` match state.
 */
export function resolveTheme(
  preference: ThemePreference,
  systemDark: boolean,
): ResolvedTheme {
  if (preference === 'system') {
    return systemDark ? 'dark' : 'light';
  }

  return preference;
}
