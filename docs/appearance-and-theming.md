# Appearance and theming

`@neetechs/ui/appearance` is the framework-neutral appearance authority for Neetechs applications. MyAccount/the shared backend owns permanent preferences. The package resolves, applies, observes, and caches those values; it does not call an API or make browser storage authoritative.

## Preference and resolved contracts

```ts
type NtThemePreference = 'system' | 'light' | 'dark';
type NtResolvedTheme = 'light' | 'dark';
type NtAccentPreference = 'orange' | 'blue' | 'green' | 'purple' | 'neutral';
type NtDensityPreference = 'compact' | 'comfortable' | 'spacious';

interface NtAppearancePreference {
  theme: NtThemePreference;
  accent: NtAccentPreference;
  density: NtDensityPreference;
  reduceMotion?: boolean | 'system';
  highContrast?: boolean | 'system';
}
```

`system` color theme resolves from `prefers-color-scheme`. High contrast is a separate accessibility dimension layered on the resolved light/dark theme. Motion and contrast resolve to `full|reduced` and `normal|high`. Forced colors always activates the high-contrast layer, even when the manual contrast preference is false.

Safe defaults are `system`, `orange`, `comfortable`, system motion, and system contrast. Without browser globals, system color falls back to dark (the package `:root` foundation), motion to full, and contrast to normal.

## Public DOM contract

The controller owns these public attributes on `document.documentElement`:

```html
<html
  data-nt-theme="dark"
  data-nt-theme-preference="system"
  data-nt-accent="orange"
  data-nt-density="comfortable"
  data-nt-contrast="normal"
  data-nt-motion="full"
>
```

Applications must not set competing attributes on `body` or app roots. `data-nt-theme="high-contrast"` remains a deprecated CSS compatibility selector only; controllers never emit it.

## Resolution and startup precedence

1. `serverPreference`, when SSR/backend settings are already available.
2. Valid `nt_theme` bootstrap cookie.
3. Valid `nt_appearance_preference` local cache; legacy `nt_theme_preference` expands with safe defaults.
4. Safe defaults plus operating-system media preferences.
5. An authenticated backend result applied with `applyResolvedPreference`; this refreshes the startup cache.

Cookie and cache values prevent a flash and are never permanent truth. Applications must route permanent changes through MyAccount/the shared backend, then apply the returned preference.

```ts
import {
  bootstrapNeetechsAppearance,
  createAppearanceController,
  type NtAppearancePreference,
} from '@neetechs/ui/appearance';

bootstrapNeetechsAppearance();
const appearance = createAppearanceController();
appearance.initialize();

const backendPreference: NtAppearancePreference = await loadAccountPreference();
appearance.applyResolvedPreference(backendPreference, { source: 'backend' });

const unsubscribe = appearance.subscribe(state => {
  console.log(state.resolved.theme, state.resolved.contrast);
});
unsubscribe();
appearance.destroy();
```

Initialization is idempotent. `destroy()` removes color-scheme, motion, contrast, and forced-color listeners and subscribers. Invalid complete preferences are ignored. Storage, cookies, media queries, and DOM globals are injectable and guarded when unavailable.

## Accent semantics

Orange is the Neetechs default. Blue, green, purple, and neutral remap primary action, selected surface, link, product focus, and interactive-border roles. Components consume semantic tokens and contain no accent-specific selectors. Status, AI, and financial roles do not follow the accent: green selection is not success, purple selection is not AI origin, and financial positive stays financial positive.

## Density semantics

Density remaps semantic sizing roles for control heights/padding, rows, cards, panels, navigation, forms, toolbars, and list items. Comfortable preserves the pre-density baseline. Compact common controls remain at least `2rem`; medium controls/navigation rows are `2.25rem`. Spacious increases whitespace without changing typography hierarchy.

Local component size variants still describe the use case. Global density changes the measurements behind those roles; it does not remove local variants.

## Contrast, forced colors, and motion

`data-nt-contrast="high"` strengthens boundaries and removes shadow-dependent hierarchy for either light or dark. `prefers-contrast: more` supplies system behavior. Forced-colors mode maps semantic roles to system colors; no `forced-color-adjust: none` exception exists.

`data-nt-motion="reduced"` shortens semantic durations, removes decorative transforms/travel, and disables decorative AI/slide animations. Essential state and progress feedback remain visible. `prefers-reduced-motion` supplies system behavior unless a manual boolean preference is applied. Detailed component contrast/focus remediation remains scheduled for Prompt 5.

## Cookie and cross-subdomain configuration

`nt_theme` is the frozen public cookie name. It accepts legacy raw `system|light|dark` values and a compact versioned appearance payload containing presentation data only.

```ts
const setCookieValue = createAppearanceCookie(preference, {
  domain: '.neetechs.com', // omit in local development
  path: '/',
  sameSite: 'Lax',
  secure: true,
  maxAge: 60 * 60 * 24 * 365,
});
```

The package does not hardcode `.neetechs.com`, write authentication data, or depend on a backend route. Production infrastructure may use the result as `Set-Cookie`; local development omits `domain` and usually `secure`.

## SSR and framework integration

On the server, pass a validated backend preference as `serverPreference` or a request cookie string and emit the resolved attributes on `<html>`. On the client, bootstrap before Angular startup or React `createRoot`, then initialize one shared controller. Hydration sees the same server hint/cookie and avoids an avoidable mismatch.

Angular should provide the controller through an application initializer/injection token; React should place one controller in context and subscribe through an external-store hook. The package intentionally ships no framework dependency.

## Compatibility and unsupported patterns

`bootstrapNeetechsTheme`, `createThemeController`, `applyThemeToDocument`, `ThemePreference`, `ResolvedThemeState`, `nt_theme_preference`, and raw theme cookie values remain compatible. The theme controller is deprecated for new integrations because it exposes only the color-theme view while applying safe defaults for other dimensions.

Unsupported: per-app permanent stores, writing resolved light/dark over `system`, application-specific theme controllers, component accent selectors, high contrast as a fourth ordinary theme, sensitive cookie fields, and direct root-attribute mutation after the shared controller initializes.
