# Theming compatibility guide

The canonical guide is [appearance-and-theming.md](./appearance-and-theming.md).

Legacy `bootstrapNeetechsTheme`, `createThemeController`, and theme-only persistence remain available. New applications should use `bootstrapNeetechsAppearance` and `createAppearanceController` so accent, density, contrast, and motion are typed and applied together. `data-nt-theme="high-contrast"` is deprecated; use a resolved light/dark theme with `data-nt-contrast="high"` through the controller.
