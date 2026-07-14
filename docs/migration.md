# Appearance migration

## Component consolidation (Prompt 7)

No public import path was removed. Migrate deprecated aliases without changing product behavior:

```ts
// Before: still compatible
import { ntCreateModal } from '@neetechs/ui';
const controller = ntCreateModal({ dialog, backdrop, title });

// After: canonical
import { ntCreateDialog } from '@neetechs/ui';
const controller = ntCreateDialog({ dialog, backdrop, title, modal: true });
```

```ts
// Before: still translated
ntCreateDrawer({ drawer, side: 'right' });

// After: direction-aware
ntCreateDrawer({ drawer, placement: 'inline-end' });
```

Replace `.nt-modal*` markup with `.nt-dialog*` and `@neetechs/ui/components/modal.css` with `@neetechs/ui/components/dialog.css` during the 0.x migration window. Replace `.nt-right-drawer*` with `.nt-drawer*` plus `.nt-drawer--inline-end`; its old CSS path remains resolvable. Workspace-switcher classes and path remain supported but now resolve to the shared company/workspace switcher source.

Use `ntCreateMenu` for application command menus and `ntCreateMenuPopover` when explicitly choosing menu versus listbox semantics. `ntCreateDropdown` still delegates to the same controller. Use the newly functional `table.css` for native read-only tables; do not migrate a semantic table to data grid unless it needs two-dimensional interaction.

See [component-architecture.md](./component-architecture.md) for the complete matrix and 0.x deprecation policy.

## Native direction and localization utilities (Prompt 6)

Set `lang` and `dir` on the document or localized section; do not add `data-nt-rtl`. Replace physical customization with logical properties. Prefer drawer `placement: 'inline-start' | 'inline-end'` for localized placement; deprecated `side` and physical `left/right` remain compatible. Mark only directional arrows with `.nt-icon--directional`, wrap unknown text with `dir="auto"`/`.nt-bidi-auto`, and isolate code/URLs/IDs with `.nt-technical-value`. Locale display helpers from `@neetechs/ui/localization` require an explicit locale.

## Accessibility behavior migration (Prompt 5)

Existing CSS classes and package export paths remain available. Adopt the strengthened contracts incrementally:

- Replace clickable generic elements with native buttons/links. CSS classes alone are not interaction contracts.
- Use `ntCreateTabs`, `ntCreateDataGrid`, and `ntCreateCalendarGrid` for documented composite keyboard behavior. Keep display-only data as semantic tables.
- Dialogs and modal drawers now isolate background branches, use nested overlay/focus stacks, and restore focus after inert state is removed. Destroy controllers during teardown.
- Nonblocking drawers opt into `modal: false` with `role: 'region'` or `'navigation'`.
- Dropdown behavior declares `menu` or `listbox`, supplies typeahead, skips disabled items, and returns focus on Escape. Navigation links stay in a labelled nav.
- `ntConnectField` establishes stable label/help/error references and `ntFocusErrorSummary` moves focus after validation; neither invents copy.
- `ntCreateAnnouncer` and `ntConfigureToastSemantics` provide deliberate polite/assertive feedback. Do not make every error-styled block an alert.
- Controls now expose at least a 40px dense target and 44px primary/icon target. Review layouts that assumed a 32px clickable box.
- Unsafe `outline: none/0` fails `npm run check:a11y`; semantic contrast is checked across light/dark and every accent.

No public class was renamed. New behavior exports are additive. Visually review restored rings, stronger boundaries, and larger targets in constrained layouts.

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
