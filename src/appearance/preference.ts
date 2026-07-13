import type {
  NtAccentPreference,
  NtAppearancePreference,
  NtDensityPreference,
  NtSystemPreference,
  ResolvedTheme,
  ThemePreference,
} from './types.js';

export const NT_DEFAULT_APPEARANCE_PREFERENCE: Readonly<NtAppearancePreference> =
  Object.freeze({
    theme: 'system',
    accent: 'orange',
    density: 'comfortable',
    reduceMotion: 'system',
    highContrast: 'system',
  });

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

export function normalizeAccentPreference(
  value: unknown,
): NtAccentPreference | null {
  return value === 'orange' ||
    value === 'blue' ||
    value === 'green' ||
    value === 'purple' ||
    value === 'neutral'
    ? value
    : null;
}

export function normalizeDensityPreference(
  value: unknown,
): NtDensityPreference | null {
  return value === 'compact' ||
    value === 'comfortable' ||
    value === 'spacious'
    ? value
    : null;
}

export function normalizeSystemPreference(
  value: unknown,
): NtSystemPreference | null {
  return value === true || value === false || value === 'system' ? value : null;
}

/** Validates an untrusted backend, cookie or cache appearance payload. */
export function normalizeAppearancePreference(
  value: unknown,
  fallback: NtAppearancePreference = NT_DEFAULT_APPEARANCE_PREFERENCE,
): NtAppearancePreference | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const input = value as Record<string, unknown>;
  const theme = normalizeThemePreference(input.theme);
  const accent = normalizeAccentPreference(input.accent);
  const density = normalizeDensityPreference(input.density);
  const reduceMotion =
    input.reduceMotion === undefined
      ? fallback.reduceMotion ?? 'system'
      : normalizeSystemPreference(input.reduceMotion);
  const highContrast =
    input.highContrast === undefined
      ? fallback.highContrast ?? 'system'
      : normalizeSystemPreference(input.highContrast);

  if (
    theme === null ||
    accent === null ||
    density === null ||
    reduceMotion === null ||
    highContrast === null
  ) {
    return null;
  }

  return { theme, accent, density, reduceMotion, highContrast };
}

/** Expands a legacy theme preference into the complete safe appearance defaults. */
export function appearanceFromTheme(
  theme: ThemePreference,
): NtAppearancePreference {
  return { ...NT_DEFAULT_APPEARANCE_PREFERENCE, theme };
}
