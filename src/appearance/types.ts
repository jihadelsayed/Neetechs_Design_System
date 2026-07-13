/**
 * Stored appearance preference. Persisted by the Django backend and edited
 * in MyAccount. The shared package only bootstraps, resolves and applies it.
 */
export type NtThemePreference = 'system' | 'light' | 'dark';
export type ThemePreference = NtThemePreference;

/**
 * Theme actually rendered on the document. `system` always resolves to one
 * of these before touching the DOM.
 */
export type NtResolvedTheme = 'light' | 'dark';
export type ResolvedTheme = NtResolvedTheme;

export type NtAccentPreference =
  | 'orange'
  | 'blue'
  | 'green'
  | 'purple'
  | 'neutral';

export type NtDensityPreference = 'compact' | 'comfortable' | 'spacious';

export type NtSystemPreference = boolean | 'system';
export type NtContrastMode = 'normal' | 'high';
export type NtMotionMode = 'full' | 'reduced';

export interface NtAppearancePreference {
  theme: NtThemePreference;
  accent: NtAccentPreference;
  density: NtDensityPreference;
  reduceMotion?: NtSystemPreference;
  highContrast?: NtSystemPreference;
}

export interface NtResolvedAppearance {
  theme: NtResolvedTheme;
  accent: NtAccentPreference;
  density: NtDensityPreference;
  contrast: NtContrastMode;
  motion: NtMotionMode;
  forcedColors: boolean;
}

/**
 * Where the currently applied preference came from, in source-of-truth
 * order: backend > cookie > cache > system > default.
 */
export type ThemeSource = 'backend' | 'cookie' | 'cache' | 'system' | 'default';

export interface ResolvedThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  source: ThemeSource;
}

export interface NtResolvedAppearanceState {
  preference: NtAppearancePreference;
  resolved: NtResolvedAppearance;
  source: ThemeSource;
}
