import {
  getDefaultThemeStorage,
  readThemeCache,
  writeThemeCache,
  type ThemeStorage,
} from './cache.js';
import { readThemeCookie } from './cookie.js';
import { normalizeThemePreference, resolveTheme } from './preference.js';
import type {
  ResolvedTheme,
  ResolvedThemeState,
  ThemePreference,
  ThemeSource,
} from './types.js';

/** Canonical rendering attribute consumed by the theme CSS. */
export const NT_THEME_ATTRIBUTE = 'data-nt-theme';

/** Informational attribute exposing the stored preference. */
export const NT_THEME_PREFERENCE_ATTRIBUTE = 'data-nt-theme-preference';

const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Fallback resolved theme when the system preference cannot be detected
 * (SSR, no matchMedia). Matches the package `:root` default token set.
 */
export const NT_THEME_DEFAULT_RESOLVED: ResolvedTheme = 'dark';

export type MatchMediaRef = (query: string) => MediaQueryList;

export interface ThemeEnvironmentOptions {
  /** Explicit document (or `null` to force SSR behavior). Defaults to the global `document` when one exists. */
  documentRef?: Document | null;
  /** Explicit matchMedia (or `null` to disable system detection). Defaults to `window.matchMedia` when available. */
  matchMediaRef?: MatchMediaRef | null;
  /** Explicit storage (or `null` to disable the cache). Defaults to `window.localStorage` when accessible. */
  storage?: ThemeStorage | null;
  /** Explicit cookie string for SSR (e.g. the request `Cookie` header). Defaults to `document.cookie`. */
  cookieString?: string;
  /** Set to false to skip reading and writing the local cache. Default true. */
  useCache?: boolean;
  /** Resolved theme used when the system preference is unknown. Default `'dark'`. */
  fallbackResolved?: ResolvedTheme;
}

export type ThemeControllerOptions = ThemeEnvironmentOptions;

export type BootstrapThemeOptions = ThemeEnvironmentOptions;

export interface SetPreferenceOptions {
  /** Where the preference came from. Default `'backend'`. */
  source?: ThemeSource;
  /** Set to false to skip updating the local cache. Default true. */
  updateCache?: boolean;
}

export type ThemeChangeListener = (state: ResolvedThemeState) => void;

export interface ThemeController {
  /** Current state without side effects. */
  getState(): ResolvedThemeState;
  /**
   * Reads bootstrap sources (cookie, then cache, then system), applies the
   * theme to the document and attaches the system-theme listener. Calling
   * it again while initialized is a no-op returning the current state.
   */
  initialize(): ResolvedThemeState;
  /**
   * Applies a preference, typically the backend account setting after it
   * loads. Overrides whatever bootstrap source is active. Invalid values
   * are ignored.
   */
  setPreference(
    preference: ThemePreference,
    options?: SetPreferenceOptions,
  ): ResolvedThemeState;
  /** Notifies on every applied state change. Returns an unsubscribe function. */
  subscribe(listener: ThemeChangeListener): () => void;
  /** Removes listeners and subscribers. The controller can be initialized again. */
  destroy(): void;
}

/**
 * Applies the resolved theme to the document root:
 *
 *   <html data-nt-theme="dark" data-nt-theme-preference="system">
 *
 * The document root is the canonical target — applications must not set
 * theme attributes on `body` or app roots independently.
 */
export function applyThemeToDocument(
  documentRef: Document,
  state: ResolvedThemeState,
): void {
  const root = documentRef?.documentElement;

  if (!root) {
    return;
  }

  root.setAttribute(NT_THEME_ATTRIBUTE, state.resolved);
  root.setAttribute(NT_THEME_PREFERENCE_ATTRIBUTE, state.preference);
}

interface ThemeEnvironment {
  getDocument(): Document | null;
  getMatchMedia(): MatchMediaRef | null;
  getStorage(): ThemeStorage | null;
  readCookie(): ThemePreference | null;
  useCache: boolean;
  fallbackResolved: ResolvedTheme;
}

function createEnvironment(options: ThemeEnvironmentOptions): ThemeEnvironment {
  const getDocument = (): Document | null => {
    if (options.documentRef !== undefined) {
      return options.documentRef;
    }

    return typeof document === 'undefined' ? null : document;
  };

  const getMatchMedia = (): MatchMediaRef | null => {
    if (options.matchMediaRef !== undefined) {
      return options.matchMediaRef;
    }

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return null;
    }

    return window.matchMedia.bind(window);
  };

  const getStorage = (): ThemeStorage | null => {
    if (options.storage !== undefined) {
      return options.storage;
    }

    return getDefaultThemeStorage();
  };

  const readCookie = (): ThemePreference | null => {
    if (options.cookieString !== undefined) {
      return readThemeCookie(options.cookieString);
    }

    const doc = getDocument();

    if (!doc) {
      return null;
    }

    try {
      return readThemeCookie(doc.cookie);
    } catch {
      return null;
    }
  };

  return {
    getDocument,
    getMatchMedia,
    getStorage,
    readCookie,
    useCache: options.useCache !== false,
    fallbackResolved: options.fallbackResolved ?? NT_THEME_DEFAULT_RESOLVED,
  };
}

function readSystemDark(environment: ThemeEnvironment): boolean | null {
  const matchMedia = environment.getMatchMedia();

  if (!matchMedia) {
    return null;
  }

  try {
    return matchMedia(PREFERS_DARK_QUERY).matches;
  } catch {
    return null;
  }
}

function computeState(
  environment: ThemeEnvironment,
  preference: ThemePreference,
  source: ThemeSource,
): ResolvedThemeState {
  if (preference !== 'system') {
    return { preference, resolved: preference, source };
  }

  const systemDark = readSystemDark(environment);

  if (systemDark === null) {
    return {
      preference,
      resolved: environment.fallbackResolved,
      source: source === 'system' ? 'default' : source,
    };
  }

  return { preference, resolved: resolveTheme('system', systemDark), source };
}

function resolveBootstrapState(environment: ThemeEnvironment): ResolvedThemeState {
  const cookiePreference = environment.readCookie();

  if (cookiePreference !== null) {
    return computeState(environment, cookiePreference, 'cookie');
  }

  if (environment.useCache) {
    const cachedPreference = readThemeCache(environment.getStorage());

    if (cachedPreference !== null) {
      return computeState(environment, cachedPreference, 'cache');
    }
  }

  return computeState(environment, 'system', 'system');
}

/**
 * Minimal early bootstrap, safe to run before framework rendering (from
 * `main.ts`, `main.tsx`, an inline script or an Angular initializer).
 * Reads the `nt_theme` cookie, then the local cache, then the system
 * preference; applies `data-nt-theme` to the document root and returns
 * the resolved state. No network requests, no listeners, SSR-safe no-op
 * on the DOM when no document exists.
 */
export function bootstrapNeetechsTheme(
  options: BootstrapThemeOptions = {},
): ResolvedThemeState {
  const environment = createEnvironment(options);
  const state = resolveBootstrapState(environment);
  const doc = environment.getDocument();

  if (doc) {
    applyThemeToDocument(doc, state);
  }

  return state;
}

/**
 * Creates the single per-application theme controller. Framework-neutral:
 * no browser globals are touched until `initialize`, `setPreference` or
 * `getState` run, and every global can be injected for SSR and tests.
 */
export function createThemeController(
  options: ThemeControllerOptions = {},
): ThemeController {
  const environment = createEnvironment(options);
  const listeners = new Set<ThemeChangeListener>();

  let state: ResolvedThemeState = {
    preference: 'system',
    resolved: environment.fallbackResolved,
    source: 'default',
  };
  let initialized = false;
  let detachSystemListener: (() => void) | null = null;

  function commit(next: ResolvedThemeState): ResolvedThemeState {
    state = next;

    const doc = environment.getDocument();

    if (doc) {
      applyThemeToDocument(doc, state);
    }

    for (const listener of [...listeners]) {
      listener(state);
    }

    return state;
  }

  function handleSystemChange(event: MediaQueryListEvent): void {
    if (state.preference !== 'system') {
      return;
    }

    const resolved: ResolvedTheme = event.matches ? 'dark' : 'light';

    if (resolved === state.resolved) {
      return;
    }

    // The stored preference stays `system`; only the resolved theme moves.
    commit({ ...state, resolved });
  }

  function attachSystemListener(): void {
    if (detachSystemListener) {
      return;
    }

    const matchMedia = environment.getMatchMedia();

    if (!matchMedia) {
      return;
    }

    let mediaQueryList: MediaQueryList;

    try {
      mediaQueryList = matchMedia(PREFERS_DARK_QUERY);
    } catch {
      return;
    }

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handleSystemChange);
      detachSystemListener = () => {
        mediaQueryList.removeEventListener('change', handleSystemChange);
      };
    } else if (typeof mediaQueryList.addListener === 'function') {
      // Fallback for engines without MediaQueryList EventTarget support.
      mediaQueryList.addListener(handleSystemChange);
      detachSystemListener = () => {
        mediaQueryList.removeListener(handleSystemChange);
      };
    }
  }

  return {
    getState(): ResolvedThemeState {
      return state;
    },

    initialize(): ResolvedThemeState {
      if (initialized) {
        return state;
      }

      initialized = true;
      attachSystemListener();

      return commit(resolveBootstrapState(environment));
    },

    setPreference(
      preference: ThemePreference,
      setOptions: SetPreferenceOptions = {},
    ): ResolvedThemeState {
      const normalized = normalizeThemePreference(preference);

      if (normalized === null) {
        return state;
      }

      if (environment.useCache && setOptions.updateCache !== false) {
        writeThemeCache(normalized, environment.getStorage());
      }

      attachSystemListener();

      return commit(
        computeState(environment, normalized, setOptions.source ?? 'backend'),
      );
    },

    subscribe(listener: ThemeChangeListener): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    destroy(): void {
      detachSystemListener?.();
      detachSystemListener = null;
      listeners.clear();
      initialized = false;
    },
  };
}
