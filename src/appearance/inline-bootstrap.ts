import type { ResolvedTheme } from './types.js';

/**
 * Pre-paint appearance bootstrap.
 *
 * `ntApplyInlineAppearance` is deliberately self-contained (no imports, no
 * module-level references) so `ntAppearanceBootstrapScript()` can serialize it
 * into a tiny inline `<script>` for the document `<head>`. It runs before the
 * application bundle and before first paint, which removes the light/dark
 * flash on client-rendered pages. It mirrors the resolution order of
 * `createAppearanceController().initialize()` (cookie → local cache → system
 * defaults) and is verified against it by unit tests.
 *
 * It only reads storage; it never writes or deletes anything. Once the
 * application boots, the AppearanceController remains the single owner of
 * appearance state.
 */
export function ntApplyInlineAppearance(
  doc: Document,
  win: Window,
  fallbackResolved: ResolvedTheme = 'dark',
): void {
  const themes = ['system', 'light', 'dark'];
  const accents = ['orange', 'blue', 'green', 'purple', 'neutral'];
  const densities = ['compact', 'comfortable', 'spacious'];
  type Flag = boolean | 'system';
  interface Pref { theme: string; accent: string; density: string; reduceMotion: Flag; highContrast: Flag }
  const defaults: Pref = {
    theme: 'system', accent: 'blue', density: 'comfortable', reduceMotion: 'system', highContrast: 'system',
  };

  const theme = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    return themes.indexOf(normalized) === -1 ? null : normalized;
  };
  const flag = (value: unknown): Flag | null =>
    value === true || value === false || value === 'system' ? value : null;
  const normalize = (input: Record<string, unknown>): Pref | null => {
    const t = theme(input.theme);
    const a = accents.indexOf(input.accent as string) === -1 ? null : (input.accent as string);
    const d = densities.indexOf(input.density as string) === -1 ? null : (input.density as string);
    const m = input.reduceMotion === undefined ? 'system' : flag(input.reduceMotion);
    const c = input.highContrast === undefined ? 'system' : flag(input.highContrast);
    return t === null || a === null || d === null || m === null || c === null
      ? null
      : { theme: t, accent: a, density: d, reduceMotion: m, highContrast: c };
  };
  const decodeFlag = (value: string | undefined): Flag | null =>
    value === '1' ? true : value === '0' ? false : value === 's' ? 'system' : null;

  const fromCookie = (): Pref | null => {
    let source = '';
    try {
      source = doc.cookie;
    } catch {
      return null;
    }
    const pairs = source ? source.split(';') : [];
    for (let index = 0; index < pairs.length; index += 1) {
      const pair = pairs[index] as string;
      const separator = pair.indexOf('=');
      if (separator === -1 || pair.slice(0, separator).trim() !== 'nt_theme') continue;
      let value = pair.slice(separator + 1).trim();
      try {
        value = decodeURIComponent(value);
      } catch {
        /* Keep the raw value, as the cookie reader does. */
      }
      const legacy = theme(value);
      if (legacy !== null) return { ...defaults, theme: legacy };
      const parts = value.split('|');
      if (parts.length !== 6 || parts[0] !== 'v1') continue;
      const motion = decodeFlag(parts[4]);
      const contrast = decodeFlag(parts[5]);
      if (motion === null || contrast === null) continue;
      const parsed = normalize({
        theme: parts[1], accent: parts[2], density: parts[3], reduceMotion: motion, highContrast: contrast,
      });
      if (parsed) return parsed;
    }
    return null;
  };

  const fromCache = (): Pref | null => {
    try {
      const storage = win.localStorage;
      if (!storage) return null;
      const raw = storage.getItem('nt_appearance_preference');
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const normalized = normalize(parsed as Record<string, unknown>);
            if (normalized) return normalized;
          }
        } catch {
          /* Invalid JSON falls through to the legacy theme key. */
        }
      }
      const legacy = theme(storage.getItem('nt_theme_preference'));
      return legacy === null ? null : { ...defaults, theme: legacy };
    } catch {
      return null;
    }
  };

  const matches = (query: string): boolean | null => {
    try {
      return typeof win.matchMedia === 'function' ? win.matchMedia(query).matches : null;
    } catch {
      return null;
    }
  };

  const preference = fromCookie() ?? fromCache() ?? defaults;
  const systemDark = matches('(prefers-color-scheme: dark)');
  const forcedColors = matches('(forced-colors: active)') === true;
  const systemContrast = matches('(prefers-contrast: more)') === true;
  const systemMotion = matches('(prefers-reduced-motion: reduce)') === true;
  const resolvedTheme = preference.theme === 'system'
    ? ((systemDark ?? fallbackResolved === 'dark') ? 'dark' : 'light')
    : preference.theme;
  const highContrast = forcedColors || preference.highContrast === true
    || (preference.highContrast !== false && systemContrast);
  const reducedMotion = preference.reduceMotion === true
    || (preference.reduceMotion !== false && systemMotion);

  const root = doc.documentElement;
  if (!root) return;
  root.setAttribute('data-nt-theme', resolvedTheme);
  root.setAttribute('data-nt-theme-preference', preference.theme);
  root.setAttribute('data-nt-accent', preference.accent);
  root.setAttribute('data-nt-density', preference.density);
  root.setAttribute('data-nt-contrast', highContrast ? 'high' : 'normal');
  root.setAttribute('data-nt-motion', reducedMotion ? 'reduced' : 'full');
}

export interface NtAppearanceBootstrapScriptOptions {
  /** Theme used when `system` is preferred but the media query is unavailable. Default `dark`. */
  fallbackResolved?: ResolvedTheme;
}

/**
 * Returns JavaScript source for an inline `<script>` placed in `<head>` before
 * any stylesheet-dependent content. Wrapped in try/catch so a hostile storage
 * environment can never block rendering. Under a strict CSP, emit it with a
 * nonce or hash.
 */
export function ntAppearanceBootstrapScript(
  options: NtAppearanceBootstrapScriptOptions = {},
): string {
  const fallback = options.fallbackResolved === 'light' ? 'light' : 'dark';
  // Safe compaction: no string literal spans lines, so trimming each line and
  // dropping whole-line comments cannot change behavior.
  const source = ntApplyInlineAppearance
    .toString()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('//') && !/^\/\*.*\*\/$/.test(line))
    .join('\n');
  return `try{(${source})(document,window,${JSON.stringify(fallback)})}catch(e){}`;
}
