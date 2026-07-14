# Appearance migration

## Page patterns, workflows, and content (Prompt 10)

No public class was removed. New structural patterns are additive: `.nt-page-header`, `.nt-page-toolbar`, `.nt-page-body`, `.nt-page-section`, `.nt-page-footer-actions`, `.nt-form` (+ rows/sections/actions), `.nt-settings-layout`, `.nt-settings-section`, `.nt-master-detail`, `.nt-workflow`, `.nt-step-indicator`.

```html
<!-- Before: ad-hoc page heading and mixed action row -->
<div class="nt-cluster nt-cluster--between">
  <h1>Invoices</h1>
  <div><button class="nt-button nt-button--primary">New</button></div>
</div>

<!-- After: page anatomy with specific labels and action hierarchy -->
<header class="nt-page-header">
  <div class="nt-page-header__main">
    <h1 class="nt-page-header__title">Invoices</h1>
  </div>
  <div class="nt-page-header__actions">
    <button class="nt-button nt-button--secondary">Export invoices</button>
    <button class="nt-button nt-button--primary">Create invoice</button>
  </div>
</header>
```

Multi-column form markup migrates from `.nt-grid--2` to `.nt-form__row--2` inside `.nt-form` so columns respond to the form's own width. Generic labels (`Submit`, `OK`, `Are you sure?`) in owned fixtures are rejected by `npm run check:content`; see [content-and-terminology.md](./content-and-terminology.md) for replacements. See [page-patterns-and-workflows.md](./page-patterns-and-workflows.md) for list/detail/settings/master-detail/workflow composition.

## Responsive and adaptive architecture (Prompt 9)

No public class was removed; behavior changes are listed here.

- **Breakpoints**: hardcoded px queries were normalized to the documented rem scale (`640px → 40rem`, `760px → 48rem`, `480px → 30rem`). At default font size these are identical; with browser text scaling, layouts now shift consistently. `--nt-breakpoint-xs` changed from `0` to `30rem` (small-phone bound).
- **Container queries**: shell content, dialog/drawer bodies, tables, data grids, forms, and the AI panel are query containers. Add `.nt-region` to dashboard columns and split panes so nested components adapt; markup without containers keeps the viewport fallbacks.
- **Sidebar → adaptive shell**: below `64rem` the sidebar column is removed and navigation must render through `.nt-mobile-nav` + `ntCreateDrawer` (same data, drawer semantics). The header's `.nt-header__mobile-trigger` rule now wins over `.nt-header__action` regardless of class order.
- **Tables**: opt into priority columns (`.nt-table__cell--secondary/--tertiary`) and row details (`.nt-table__details*`); scrollable `.nt-table-container` should get `tabindex="0"` + an accessible name.
- **Data grid**: new `--constrained` mode (automatic below a 48rem container) and `.nt-data-grid__record-list` mobile record mode — render list *or* table, never both. Resize handles disappear on coarse pointers.
- **Calendar**: `.nt-calendar-agenda` (new) is the phone view; the day timeline no longer forces 36–42rem min-width. Month/week grids stay desktop views inside scrollers.
- **Viewport height**: any `100vh` sizing now pairs with `100dvh`; use `.nt-fill-viewport(--fixed)` and the safe-area utilities for full-height and edge-anchored surfaces (AI composer, sticky footers).
- **Hover**: move hover-revealed row/card actions to the `.nt-hover-reveal-scope` / `.nt-hover-reveal` contract so they stay visible on touch.
- Validation: `npm run check:responsive` rejects px/undocumented media breakpoints, plain `100vh`, and undocumented `min-width ≥ 30rem`. See [responsive-and-adaptive-design.md](./responsive-and-adaptive-design.md).

## States, feedback, and recovery (Prompt 8)

No public state class was removed. Adopt the canonical state contract incrementally:

```html
<!-- Before: still styled for compatibility, but modifier-only state is not behavior -->
<button class="nt-button nt-button--primary nt-button--loading">Save changes</button>

<!-- After: native name stays visible; behavior owns pending state -->
<button class="nt-button nt-button--primary" data-nt-state="pending" aria-busy="true">
  Save changes
</button>
```

Use `ntCreateAsyncAction()` for owned action controls that need duplicate-activation prevention, `aria-busy`, success/error transition, cancellation only when a real `AbortSignal` exists, and listener cleanup. Do not set native `disabled` merely because a request is pending.

Use `ntCreateFormController()` with `ntConnectField()` and `ntFocusErrorSummary()` for forms that need touched/dirty tracking, duplicate-submit prevention, error-summary focus, and failure that preserves entered data. Applications still own validation rules, server errors, routing, and persistence.

Use `.nt-content-state` plus `data-nt-content-state` for new loading, empty, error, offline, unauthenticated, forbidden, not-found, maintenance, and success regions. Existing `.nt-empty-state`, `.nt-error-state`, and `.nt-loading-state` remain compatible public patterns.

Use `ntCreateToastController()` only for brief noncritical feedback or recoverable errors that can be safely dismissed. Critical blocking failures belong in inline state, an alert/banner, a form summary, or a confirmation/result dialog, not only a disappearing toast.

See [states-feedback-and-recovery.md](./states-feedback-and-recovery.md) for the state dimensions, feedback-channel matrix, confirmation levels, AI write-action states, unsaved-change patterns, and recovery rules.

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
