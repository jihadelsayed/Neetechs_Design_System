import {
  getDefaultThemeStorage,
  readAppearanceCache,
  writeAppearanceCache,
  type ThemeStorage,
} from './cache.js';
import { readAppearanceCookie } from './cookie.js';
import {
  NT_DEFAULT_APPEARANCE_PREFERENCE,
  normalizeAppearancePreference,
  normalizeThemePreference,
  resolveTheme,
} from './preference.js';
import type {
  NtAppearancePreference,
  NtResolvedAppearance,
  NtResolvedAppearanceState,
  ResolvedTheme,
  ResolvedThemeState,
  ThemePreference,
  ThemeSource,
} from './types.js';

export const NT_THEME_ATTRIBUTE = 'data-nt-theme';
export const NT_THEME_PREFERENCE_ATTRIBUTE = 'data-nt-theme-preference';
export const NT_ACCENT_ATTRIBUTE = 'data-nt-accent';
export const NT_DENSITY_ATTRIBUTE = 'data-nt-density';
export const NT_CONTRAST_ATTRIBUTE = 'data-nt-contrast';
export const NT_MOTION_ATTRIBUTE = 'data-nt-motion';

export const NT_THEME_DEFAULT_RESOLVED: ResolvedTheme = 'dark';

export const NT_APPEARANCE_MEDIA_QUERIES = Object.freeze({
  dark: '(prefers-color-scheme: dark)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  highContrast: '(prefers-contrast: more)',
  forcedColors: '(forced-colors: active)',
});

export type MatchMediaRef = (query: string) => MediaQueryList;

export interface ThemeEnvironmentOptions {
  documentRef?: Document | null;
  matchMediaRef?: MatchMediaRef | null;
  storage?: ThemeStorage | null;
  cookieString?: string;
  useCache?: boolean;
  fallbackResolved?: ResolvedTheme;
  /** Backend/server-resolved value. When supplied it outranks cookie and cache. */
  serverPreference?: NtAppearancePreference | null;
}

export type AppearanceControllerOptions = ThemeEnvironmentOptions;
export type ThemeControllerOptions = ThemeEnvironmentOptions;
export type BootstrapAppearanceOptions = ThemeEnvironmentOptions;
export type BootstrapThemeOptions = ThemeEnvironmentOptions;

export interface SetPreferenceOptions {
  source?: ThemeSource;
  updateCache?: boolean;
}

export type AppearanceChangeListener = (state: NtResolvedAppearanceState) => void;
export type ThemeChangeListener = (state: ResolvedThemeState) => void;

export interface AppearanceController {
  getPreference(): NtAppearancePreference;
  getResolvedAppearance(): NtResolvedAppearanceState;
  initialize(): NtResolvedAppearanceState;
  setPreference(
    preference: NtAppearancePreference,
    options?: SetPreferenceOptions,
  ): NtResolvedAppearanceState;
  applyResolvedPreference(
    preference: NtAppearancePreference,
    options?: SetPreferenceOptions,
  ): NtResolvedAppearanceState;
  subscribe(listener: AppearanceChangeListener): () => void;
  destroy(): void;
}

/** @deprecated Use AppearanceController/createAppearanceController for new integrations. */
export interface ThemeController {
  getState(): ResolvedThemeState;
  initialize(): ResolvedThemeState;
  setPreference(
    preference: ThemePreference,
    options?: SetPreferenceOptions,
  ): ResolvedThemeState;
  subscribe(listener: ThemeChangeListener): () => void;
  destroy(): void;
}

export function applyThemeToDocument(
  documentRef: Document,
  state: ResolvedThemeState,
): void {
  const root = documentRef?.documentElement;

  if (!root) return;

  root.setAttribute(NT_THEME_ATTRIBUTE, state.resolved);
  root.setAttribute(NT_THEME_PREFERENCE_ATTRIBUTE, state.preference);
}

export function applyAppearanceToDocument(
  documentRef: Document,
  state: NtResolvedAppearanceState,
): void {
  const root = documentRef?.documentElement;

  if (!root) return;

  root.setAttribute(NT_THEME_ATTRIBUTE, state.resolved.theme);
  root.setAttribute(NT_THEME_PREFERENCE_ATTRIBUTE, state.preference.theme);
  root.setAttribute(NT_ACCENT_ATTRIBUTE, state.resolved.accent);
  root.setAttribute(NT_DENSITY_ATTRIBUTE, state.resolved.density);
  root.setAttribute(NT_CONTRAST_ATTRIBUTE, state.resolved.contrast);
  root.setAttribute(NT_MOTION_ATTRIBUTE, state.resolved.motion);
}

interface AppearanceEnvironment {
  getDocument(): Document | null;
  getMatchMedia(): MatchMediaRef | null;
  getStorage(): ThemeStorage | null;
  readCookie(): NtAppearancePreference | null;
  useCache: boolean;
  fallbackResolved: ResolvedTheme;
  serverPreference: NtAppearancePreference | null;
}

function createEnvironment(options: ThemeEnvironmentOptions): AppearanceEnvironment {
  const getDocument = (): Document | null => {
    if (options.documentRef !== undefined) return options.documentRef;
    return typeof document === 'undefined' ? null : document;
  };

  const getMatchMedia = (): MatchMediaRef | null => {
    if (options.matchMediaRef !== undefined) return options.matchMediaRef;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
    return window.matchMedia.bind(window);
  };

  const getStorage = (): ThemeStorage | null =>
    options.storage !== undefined ? options.storage : getDefaultThemeStorage();

  const readCookie = (): NtAppearancePreference | null => {
    if (options.cookieString !== undefined) return readAppearanceCookie(options.cookieString);
    const doc = getDocument();
    if (!doc) return null;
    try {
      return readAppearanceCookie(doc.cookie);
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
    serverPreference: normalizeAppearancePreference(options.serverPreference),
  };
}

function mediaMatches(environment: AppearanceEnvironment, query: string): boolean | null {
  const matchMedia = environment.getMatchMedia();
  if (!matchMedia) return null;
  try {
    return matchMedia(query).matches;
  } catch {
    return null;
  }
}

function computeState(
  environment: AppearanceEnvironment,
  preference: NtAppearancePreference,
  source: ThemeSource,
): NtResolvedAppearanceState {
  const systemDark = mediaMatches(environment, NT_APPEARANCE_MEDIA_QUERIES.dark);
  const forcedColors = mediaMatches(environment, NT_APPEARANCE_MEDIA_QUERIES.forcedColors) === true;
  const systemContrast = mediaMatches(environment, NT_APPEARANCE_MEDIA_QUERIES.highContrast) === true;
  const systemReducedMotion = mediaMatches(environment, NT_APPEARANCE_MEDIA_QUERIES.reducedMotion) === true;
  const theme =
    preference.theme === 'system'
      ? resolveTheme('system', systemDark ?? environment.fallbackResolved === 'dark')
      : preference.theme;
  const highContrast =
    forcedColors ||
    preference.highContrast === true ||
    (preference.highContrast !== false && systemContrast);
  const reduceMotion =
    preference.reduceMotion === true ||
    (preference.reduceMotion !== false && systemReducedMotion);

  return {
    preference: { ...preference },
    resolved: {
      theme,
      accent: preference.accent,
      density: preference.density,
      contrast: highContrast ? 'high' : 'normal',
      motion: reduceMotion ? 'reduced' : 'full',
      forcedColors,
    },
    source:
      preference.theme === 'system' && systemDark === null && source === 'system'
        ? 'default'
        : source,
  };
}

function resolveBootstrapState(environment: AppearanceEnvironment): NtResolvedAppearanceState {
  if (environment.serverPreference) {
    return computeState(environment, environment.serverPreference, 'backend');
  }

  const cookiePreference = environment.readCookie();
  if (cookiePreference) return computeState(environment, cookiePreference, 'cookie');

  if (environment.useCache) {
    const cached = readAppearanceCache(environment.getStorage());
    if (cached) return computeState(environment, cached, 'cache');
  }

  return computeState(environment, { ...NT_DEFAULT_APPEARANCE_PREFERENCE }, 'system');
}

export function bootstrapNeetechsAppearance(
  options: BootstrapAppearanceOptions = {},
): NtResolvedAppearanceState {
  const environment = createEnvironment(options);
  const state = resolveBootstrapState(environment);
  const doc = environment.getDocument();
  if (doc) applyAppearanceToDocument(doc, state);
  return state;
}

/** Legacy theme-only bootstrap; it also applies accent, density, contrast and motion defaults. */
export function bootstrapNeetechsTheme(
  options: BootstrapThemeOptions = {},
): ResolvedThemeState {
  return toThemeState(bootstrapNeetechsAppearance(options));
}

function toThemeState(state: NtResolvedAppearanceState): ResolvedThemeState {
  return {
    preference: state.preference.theme,
    resolved: state.resolved.theme,
    source: state.source,
  };
}

export function createAppearanceController(
  options: AppearanceControllerOptions = {},
): AppearanceController {
  const environment = createEnvironment(options);
  const listeners = new Set<AppearanceChangeListener>();
  const detachMediaListeners: Array<() => void> = [];
  let initialized = false;
  let state = computeState(
    environment,
    { ...NT_DEFAULT_APPEARANCE_PREFERENCE },
    'default',
  );

  function commit(next: NtResolvedAppearanceState): NtResolvedAppearanceState {
    state = next;
    const doc = environment.getDocument();
    if (doc) applyAppearanceToDocument(doc, state);
    for (const listener of [...listeners]) listener(state);
    return state;
  }

  function handleMediaChange(): void {
    const next = computeState(environment, state.preference, state.source);
    if (JSON.stringify(next.resolved) !== JSON.stringify(state.resolved)) commit(next);
  }

  function attachMediaListeners(): void {
    if (detachMediaListeners.length > 0) return;
    const matchMedia = environment.getMatchMedia();
    if (!matchMedia) return;

    for (const query of Object.values(NT_APPEARANCE_MEDIA_QUERIES)) {
      let mediaQueryList: MediaQueryList;
      try {
        mediaQueryList = matchMedia(query);
      } catch {
        continue;
      }

      if (typeof mediaQueryList.addEventListener === 'function') {
        mediaQueryList.addEventListener('change', handleMediaChange);
        detachMediaListeners.push(() =>
          mediaQueryList.removeEventListener('change', handleMediaChange),
        );
      } else if (typeof mediaQueryList.addListener === 'function') {
        mediaQueryList.addListener(handleMediaChange);
        detachMediaListeners.push(() => mediaQueryList.removeListener(handleMediaChange));
      }
    }
  }

  function applyPreference(
    preference: NtAppearancePreference,
    setOptions: SetPreferenceOptions = {},
  ): NtResolvedAppearanceState {
    const normalized = normalizeAppearancePreference(preference);
    if (!normalized) return state;

    if (environment.useCache && setOptions.updateCache !== false) {
      writeAppearanceCache(normalized, environment.getStorage());
    }

    attachMediaListeners();
    return commit(computeState(environment, normalized, setOptions.source ?? 'backend'));
  }

  return {
    getPreference: () => ({ ...state.preference }),
    getResolvedAppearance: () => state,
    initialize(): NtResolvedAppearanceState {
      if (initialized) return state;
      initialized = true;
      attachMediaListeners();
      return commit(resolveBootstrapState(environment));
    },
    setPreference: applyPreference,
    applyResolvedPreference: applyPreference,
    subscribe(listener: AppearanceChangeListener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy(): void {
      for (const detach of detachMediaListeners.splice(0)) detach();
      listeners.clear();
      initialized = false;
    },
  };
}

/** @deprecated New applications should create one AppearanceController. */
export function createThemeController(
  options: ThemeControllerOptions = {},
): ThemeController {
  const controller = createAppearanceController(options);

  return {
    getState: () => toThemeState(controller.getResolvedAppearance()),
    initialize: () => toThemeState(controller.initialize()),
    setPreference(preference, setOptions = {}) {
      const theme = normalizeThemePreference(preference);
      if (!theme) return toThemeState(controller.getResolvedAppearance());
      return toThemeState(
        controller.setPreference(
          { ...controller.getPreference(), theme },
          setOptions,
        ),
      );
    },
    subscribe(listener) {
      return controller.subscribe((next) => listener(toThemeState(next)));
    },
    destroy: () => controller.destroy(),
  };
}
