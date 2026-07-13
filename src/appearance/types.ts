/**
 * Stored appearance preference. Persisted by the Django backend and edited
 * in MyAccount. The shared package only bootstraps, resolves and applies it.
 */
export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * Theme actually rendered on the document. `system` always resolves to one
 * of these before touching the DOM.
 */
export type ResolvedTheme = 'light' | 'dark';

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
