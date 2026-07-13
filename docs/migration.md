# Appearance migration

## Theme-only to complete appearance

```ts
// Before (still compatible)
const theme = createThemeController();
theme.initialize();
theme.setPreference('dark');

// After
const appearance = createAppearanceController();
appearance.initialize();
appearance.applyResolvedPreference({
  theme: 'dark',
  accent: 'orange',
  density: 'comfortable',
  reduceMotion: 'system',
  highContrast: 'system',
}, { source: 'backend' });
```

Permanent changes belong in MyAccount/the shared backend. The controller cache is bootstrap-only.

## High contrast

Replace deprecated `data-nt-theme="high-contrast"` with a light/dark theme plus `data-nt-contrast="high"`, preferably by setting the typed `highContrast` preference through the controller.

## Persistence

The `nt_theme` cookie and `nt_theme_preference` cache key remain readable. A versioned cookie payload and `nt_appearance_preference` cache add accent, density, motion, and contrast. Raw theme cookies expand with safe defaults. Do not create another application-local key.
