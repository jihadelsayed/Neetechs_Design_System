export type {
  ResolvedTheme,
  ResolvedThemeState,
  ThemePreference,
  ThemeSource,
} from './types.js';

export { normalizeThemePreference, resolveTheme } from './preference.js';

export { NT_THEME_COOKIE_NAME, readThemeCookie } from './cookie.js';

export {
  NT_LEGACY_THEME_CACHE_KEYS,
  NT_THEME_CACHE_KEY,
  clearThemeCache,
  getDefaultThemeStorage,
  migrateLegacyThemeCache,
  readThemeCache,
  writeThemeCache,
} from './cache.js';
export type { MigrateLegacyThemeCacheOptions, ThemeStorage } from './cache.js';

export {
  NT_THEME_ATTRIBUTE,
  NT_THEME_DEFAULT_RESOLVED,
  NT_THEME_PREFERENCE_ATTRIBUTE,
  applyThemeToDocument,
  bootstrapNeetechsTheme,
  createThemeController,
} from './theme-controller.js';
export type {
  BootstrapThemeOptions,
  MatchMediaRef,
  SetPreferenceOptions,
  ThemeChangeListener,
  ThemeController,
  ThemeControllerOptions,
} from './theme-controller.js';
