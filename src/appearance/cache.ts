import {
  appearanceFromTheme,
  normalizeAppearancePreference,
  normalizeThemePreference,
} from './preference.js';
import type { NtAppearancePreference, ThemePreference } from './types.js';

/** Complete appearance cache. This remains a startup optimization, never account truth. */
export const NT_APPEARANCE_CACHE_KEY = 'nt_appearance_preference';

/**
 * Canonical local-storage cache key. The cache is a bootstrap fallback
 * only — the backend account setting and the `nt_theme` cookie always
 * override it.
 */
export const NT_THEME_CACHE_KEY = 'nt_theme_preference';

/**
 * Legacy app-specific keys replaced by NT_THEME_CACHE_KEY. Read once by
 * migrateLegacyThemeCache and then deleted.
 */
export const NT_LEGACY_THEME_CACHE_KEYS: readonly string[] = [
  'themeMode',
  'selectedTheme',
  'aiTheme',
  'billingTheme',
];

export type ThemeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Returns `window.localStorage` when it is available and accessible,
 * otherwise `null`. Never throws (storage access can throw under blocked
 * third-party storage or strict privacy settings).
 */
export function getDefaultThemeStorage(): ThemeStorage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Reads the cached preference. Invalid cached values are removed and
 * reported as `null`. Storage errors never throw.
 */
export function readThemeCache(
  storage: ThemeStorage | null = getDefaultThemeStorage(),
): ThemePreference | null {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(NT_THEME_CACHE_KEY);

    if (raw === null) {
      return null;
    }

    const preference = normalizeThemePreference(raw);

    if (preference === null) {
      storage.removeItem(NT_THEME_CACHE_KEY);
    }

    return preference;
  } catch {
    return null;
  }
}

/**
 * Caches a preference for the next bootstrap. Storage errors never throw.
 */
export function writeThemeCache(
  preference: ThemePreference,
  storage: ThemeStorage | null = getDefaultThemeStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(NT_THEME_CACHE_KEY, preference);
  } catch {
    /* Cache is best-effort only. */
  }
}

export function readAppearanceCache(
  storage: ThemeStorage | null = getDefaultThemeStorage(),
): NtAppearancePreference | null {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(NT_APPEARANCE_CACHE_KEY);

    if (raw !== null) {
      try {
        const preference = normalizeAppearancePreference(JSON.parse(raw));

        if (preference !== null) {
          return preference;
        }
      } catch {
        /* Removed below. */
      }

      storage.removeItem(NT_APPEARANCE_CACHE_KEY);
    }

    const legacyTheme = readThemeCache(storage);
    return legacyTheme === null ? null : appearanceFromTheme(legacyTheme);
  } catch {
    return null;
  }
}

export function writeAppearanceCache(
  preference: NtAppearancePreference,
  storage: ThemeStorage | null = getDefaultThemeStorage(),
): void {
  if (!storage) {
    return;
  }

  const normalized = normalizeAppearancePreference(preference);

  if (normalized === null) {
    return;
  }

  try {
    storage.setItem(NT_APPEARANCE_CACHE_KEY, JSON.stringify(normalized));
    // Keep the frozen theme-only key synchronized for older applications.
    storage.setItem(NT_THEME_CACHE_KEY, normalized.theme);
  } catch {
    /* Cache is best-effort only. */
  }
}

export function clearAppearanceCache(
  storage: ThemeStorage | null = getDefaultThemeStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(NT_APPEARANCE_CACHE_KEY);
    storage.removeItem(NT_THEME_CACHE_KEY);
  } catch {
    /* Cache is best-effort only. */
  }
}

/**
 * Removes the cached preference. Storage errors never throw.
 */
export function clearThemeCache(
  storage: ThemeStorage | null = getDefaultThemeStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(NT_THEME_CACHE_KEY);
  } catch {
    /* Cache is best-effort only. */
  }
}

export interface MigrateLegacyThemeCacheOptions {
  storage?: ThemeStorage | null;
  legacyKeys?: readonly string[];
}

/**
 * One-time migration from legacy app-specific storage keys to
 * NT_THEME_CACHE_KEY.
 *
 * - A legacy value is adopted only when no valid canonical value exists.
 * - All legacy keys are deleted either way.
 * - Only touches the local cache — it never overwrites a backend or
 *   cookie preference, because the cache sits below both in the
 *   source-of-truth order.
 *
 * Returns the canonical cached preference after migration, or `null`.
 */
export function migrateLegacyThemeCache(
  options: MigrateLegacyThemeCacheOptions = {},
): ThemePreference | null {
  const storage =
    options.storage !== undefined ? options.storage : getDefaultThemeStorage();
  const legacyKeys = options.legacyKeys ?? NT_LEGACY_THEME_CACHE_KEYS;

  if (!storage) {
    return null;
  }

  try {
    const existing = readThemeCache(storage);
    let migrated: ThemePreference | null = null;

    if (existing === null) {
      for (const key of legacyKeys) {
        migrated = normalizeThemePreference(storage.getItem(key));

        if (migrated !== null) {
          break;
        }
      }

      if (migrated !== null) {
        storage.setItem(NT_THEME_CACHE_KEY, migrated);
      }
    }

    for (const key of legacyKeys) {
      storage.removeItem(key);
    }

    return existing ?? migrated;
  } catch {
    return null;
  }
}
