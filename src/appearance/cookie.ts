import { normalizeThemePreference } from './preference.js';
import type { ThemePreference } from './types.js';

/**
 * Shared-domain bootstrap cookie set by the backend
 * (`Domain=.neetechs.com; Secure; SameSite=Lax` in production).
 * It only reduces theme flashing; the backend account setting is the
 * source of truth.
 */
export const NT_THEME_COOKIE_NAME = 'nt_theme';

/**
 * Reads the `nt_theme` bootstrap cookie. Only reads this single cookie —
 * never authentication or other sensitive cookies.
 *
 * Pass `cookieString` explicitly during SSR (e.g. the request `Cookie`
 * header). When omitted, `document.cookie` is used if a document exists;
 * otherwise `null` is returned.
 */
export function readThemeCookie(cookieString?: string): ThemePreference | null {
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

    const preference = normalizeThemePreference(
      decodeCookieValue(pair.slice(separatorIndex + 1).trim()),
    );

    if (preference !== null) {
      return preference;
    }
  }

  return null;
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
