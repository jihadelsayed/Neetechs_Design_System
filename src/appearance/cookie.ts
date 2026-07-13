import {
  appearanceFromTheme,
  normalizeAppearancePreference,
  normalizeThemePreference,
} from './preference.js';
import type {
  NtAppearancePreference,
  NtSystemPreference,
  ThemePreference,
} from './types.js';

/**
 * Shared-domain bootstrap cookie set by the backend
 * (`Domain=.neetechs.com; Secure; SameSite=Lax` in production).
 * It only reduces theme flashing; the backend account setting is the
 * source of truth.
 */
export const NT_THEME_COOKIE_NAME = 'nt_theme';
const COOKIE_VERSION = 'v1';

export interface NtAppearanceCookieOptions {
  domain?: string;
  path?: string;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
  maxAge?: number;
}

/**
 * Reads the `nt_theme` bootstrap cookie. Only reads this single cookie —
 * never authentication or other sensitive cookies.
 *
 * Pass `cookieString` explicitly during SSR (e.g. the request `Cookie`
 * header). When omitted, `document.cookie` is used if a document exists;
 * otherwise `null` is returned.
 */
export function readThemeCookie(cookieString?: string): ThemePreference | null {
  return readAppearanceCookie(cookieString)?.theme ?? null;
}

/** Reads either the versioned appearance payload or the legacy raw theme value. */
export function readAppearanceCookie(
  cookieString?: string,
): NtAppearancePreference | null {
  const source = cookieString ?? readDocumentCookieString();

  if (!source) {
    return null;
  }

  for (const pair of source.split(';')) {
    const separatorIndex = pair.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    if (pair.slice(0, separatorIndex).trim() !== NT_THEME_COOKIE_NAME) {
      continue;
    }

    const value = decodeCookieValue(pair.slice(separatorIndex + 1).trim());
    const legacyTheme = normalizeThemePreference(value);

    if (legacyTheme !== null) {
      return appearanceFromTheme(legacyTheme);
    }

    const parsed = parseVersionedAppearance(value);

    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function encodeSystemPreference(value: NtSystemPreference | undefined): string {
  return value === true ? '1' : value === false ? '0' : 's';
}

function decodeSystemPreference(value: string): NtSystemPreference | null {
  return value === '1' ? true : value === '0' ? false : value === 's' ? 'system' : null;
}

function parseVersionedAppearance(value: string): NtAppearancePreference | null {
  const parts = value.split('|');

  if (parts.length !== 6 || parts[0] !== COOKIE_VERSION) {
    return null;
  }

  const [, theme, accent, density, motion, contrast] = parts as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];

  return normalizeAppearancePreference({
    theme,
    accent,
    density,
    reduceMotion: decodeSystemPreference(motion),
    highContrast: decodeSystemPreference(contrast),
  });
}

export function serializeAppearanceCookieValue(
  preference: NtAppearancePreference,
): string | null {
  const normalized = normalizeAppearancePreference(preference);

  if (normalized === null) {
    return null;
  }

  return [
    COOKIE_VERSION,
    normalized.theme,
    normalized.accent,
    normalized.density,
    encodeSystemPreference(normalized.reduceMotion),
    encodeSystemPreference(normalized.highContrast),
  ].join('|');
}

/**
 * Produces a browser cookie assignment / Set-Cookie value. Domain is optional
 * so local development works; production may pass `.neetechs.com`.
 */
export function createAppearanceCookie(
  preference: NtAppearancePreference,
  options: NtAppearanceCookieOptions = {},
): string | null {
  const value = serializeAppearanceCookieValue(preference);

  if (value === null) {
    return null;
  }

  const parts = [
    `${NT_THEME_COOKIE_NAME}=${encodeURIComponent(value)}`,
    `Path=${options.path ?? '/'}`,
    `SameSite=${options.sameSite ?? 'Lax'}`,
  ];

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  if (options.secure) {
    parts.push('Secure');
  }

  if (Number.isFinite(options.maxAge)) {
    parts.push(`Max-Age=${Math.max(0, Math.trunc(options.maxAge ?? 0))}`);
  }

  return parts.join('; ');
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function readDocumentCookieString(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  try {
    return document.cookie;
  } catch {
    return null;
  }
}
