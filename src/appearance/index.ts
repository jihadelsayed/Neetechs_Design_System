export type {
  NtAccentPreference,
  NtAppearancePreference,
  NtContrastMode,
  NtDensityPreference,
  NtMotionMode,
  NtResolvedAppearance,
  NtResolvedAppearanceState,
  NtResolvedTheme,
  NtSystemPreference,
  NtThemePreference,
  ResolvedTheme,
  ResolvedThemeState,
  ThemePreference,
  ThemeSource,
} from './types.js';

export {
  NT_DEFAULT_APPEARANCE_PREFERENCE,
  appearanceFromTheme,
  normalizeAccentPreference,
  normalizeAppearancePreference,
  normalizeDensityPreference,
  normalizeSystemPreference,
  normalizeThemePreference,
  resolveTheme,
} from './preference.js';

export {
  NT_THEME_COOKIE_NAME,
  createAppearanceCookie,
  readAppearanceCookie,
  readThemeCookie,
  serializeAppearanceCookieValue,
} from './cookie.js';
export type { NtAppearanceCookieOptions } from './cookie.js';

export {
  NT_APPEARANCE_CACHE_KEY,
  NT_LEGACY_THEME_CACHE_KEYS,
  NT_THEME_CACHE_KEY,
  clearAppearanceCache,
  clearThemeCache,
  getDefaultThemeStorage,
  migrateLegacyThemeCache,
  readAppearanceCache,
  readThemeCache,
  writeAppearanceCache,
  writeThemeCache,
} from './cache.js';
export type { MigrateLegacyThemeCacheOptions, ThemeStorage } from './cache.js';

export {
  NT_ACCENT_ATTRIBUTE,
  NT_APPEARANCE_MEDIA_QUERIES,
  NT_CONTRAST_ATTRIBUTE,
  NT_DENSITY_ATTRIBUTE,
  NT_MOTION_ATTRIBUTE,
  NT_THEME_ATTRIBUTE,
  NT_THEME_DEFAULT_RESOLVED,
  NT_THEME_PREFERENCE_ATTRIBUTE,
  applyAppearanceToDocument,
  applyThemeToDocument,
  bootstrapNeetechsAppearance,
  bootstrapNeetechsTheme,
  createAppearanceController,
  createThemeController,
} from './theme-controller.js';
export type {
  AppearanceChangeListener,
  AppearanceController,
  AppearanceControllerOptions,
  BootstrapAppearanceOptions,
  BootstrapThemeOptions,
  MatchMediaRef,
  SetPreferenceOptions,
  ThemeChangeListener,
  ThemeController,
  ThemeControllerOptions,
} from './theme-controller.js';
