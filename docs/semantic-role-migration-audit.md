# Semantic role migration audit

Audit date: 2026-07-13. This report records the Prompt 3 role decisions for production CSS under `src/components`, `src/patterns`, `src/ai`, `src/domain`, and `src/shell`. Token-definition and theme files are intentionally analyzed separately because they are allowed to select primitive values.

## Baseline and result

| Production use | Before Prompt 3 | After Prompt 3 | Enforcement |
| --- | ---: | ---: | --- |
| Primitive palette references (`var(--nt-color-*)`) | 0 | 0 | `prohibited-primitive-token` |
| Raw shadow-scale references | 63 in 34 files | 0 | `prohibited-raw-shadow` |
| Raw radius-scale references | 229 in 51 files | 0 | `prohibited-raw-radius` |
| Hardcoded hex/RGB/HSL/named colors | 3 in one file | 0 | `hardcoded-color` |
| Deprecated Prompt 2 aliases | 0 | 0 | `deprecated-internal-usage` |
| Undefined tokens | 0 | 0 | `undefined-token` |

The pre-migration raw shadow set was `--nt-shadow-xs`, `--nt-shadow-sm`, `--nt-shadow-md`, `--nt-shadow-lg`, `--nt-shadow-xl`, and `--nt-shadow-overlay`. The pre-migration raw radius set was `--nt-radius-sm`, `--nt-radius-md`, `--nt-radius-lg`, `--nt-radius-xl`, `--nt-radius-2xl`, and `--nt-radius-full`. No `none` or `3xl` raw radius was used by a production component.

## Role decision report

| File / selector or selector family | Previous value or token | Intended role | Replacement |
| --- | --- | --- | --- |
| `src/components/button/button.css`: `.nt-button--primary` and hover/active | `--nt-accent*` | Primary product action | `--nt-action-primary-*` |
| `src/components/button/button.css`: secondary/ghost/danger variants | control, surface, and danger tokens selected locally | Secondary, neutral, and destructive actions | `--nt-action-secondary-*`, `--nt-action-neutral-*`, `--nt-action-danger-*` |
| `src/components/icon-button/icon-button.css`: all variants | Same local choices as button | Same action contract as text buttons | Action roles matching the variant |
| `src/components/split-button/split-button.css`: main/toggle variants | control, accent, danger, and surface tokens | Secondary, primary, destructive, and neutral actions | Matching `--nt-action-*` roles |
| `src/ai/ai-action-button/ai-action-button.css`: primary action | Orange product accent | Explicitly AI-powered action | `--nt-ai-action`, `--nt-ai-action-hover`, `--nt-ai-action-fg` |
| `src/ai/**/*.css`: AI identity, generated artifacts, processing, and borders | Product accent and legacy AI presentation names | AI origin/processing, not generic selection or status | `--nt-ai-fg`, `--nt-ai-bg-subtle`, `--nt-ai-border`, `--nt-ai-processing`, `--nt-ai-generated-surface` |
| Menu, chip, tabs, segmented control, pagination, switchers, command palette, data grid, app navigation active selectors | `--nt-accent*`, `--nt-border-interactive`, or generic surface hover | Selected/current state | `--nt-selection-bg`, `--nt-selection-bg-hover`, `--nt-selection-border`, `--nt-selection-fg`, `--nt-selection-indicator` |
| Button/form/control disabled selectors | `--nt-disabled-bg`, `--nt-disabled-border`, `--nt-disabled-text` | Shared disabled surface, border, and text | `--nt-bg-surface-disabled`, `--nt-border-disabled`, `--nt-text-disabled` |
| Dialog/modal/drawer backdrops and shell/loading scrims | `--nt-bg-overlay` | Backdrop/scrim | `--nt-bg-backdrop` |
| Dialog, modal, drawer, dropdown, tooltip, toast, search results, switchers, menu, command palette, notification center | Generic base surface | Overlay surface at the component's established color value | `--nt-bg-surface-overlay` |
| `src/domain/billing/index.css`: amount row muted/success/danger values | generic muted/success/danger text | Financial neutral/positive/negative meaning | `--nt-financial-neutral`, `--nt-financial-positive`, `--nt-financial-negative` |
| `src/components/progress/progress.css`: `.nt-progress__bar--striped` gradient | three `rgba(255, 255, 255, 0.18)` occurrences | Theme-owned progress stripe color | `--nt-progress-stripe-color` |

Status UI in alerts, badges, billing status blocks, timelines, toasts, and error/success patterns continues to use the established semantic families `--nt-info-*`, `--nt-success-*`, `--nt-warning-*`, and `--nt-danger-*`. Those names already express foreground/background/border meaning and were not replaced by duplicate synonyms.

Calendar event-category and availability styling remains status/accent-semantic rather than being forced into generic selection. Consumer-selected calendar color inputs are legitimate component data and are not converted to a fixed palette by this migration.

## Elevation mapping

Every prior occurrence was reviewed by selector context. The scale-to-role conversion preserved light/dark values, then overlay/control cases were narrowed further.

| Previous token | Default migration role | Context-specific role |
| --- | --- | --- |
| `--nt-shadow-xs` | `--nt-elevation-inline` | Small event or inline raised detail |
| `--nt-shadow-sm` | `--nt-elevation-card` | `--nt-elevation-control` for selected controls |
| `--nt-shadow-md` | `--nt-elevation-card-hover` | Interactive card/event hover |
| `--nt-shadow-lg` | `--nt-elevation-raised` | Tooltip uses `--nt-elevation-popover` |
| `--nt-shadow-xl` | `--nt-elevation-popover` | Toast uses `--nt-elevation-toast` |
| `--nt-shadow-overlay` | `--nt-elevation-dialog` | Drawers use `--nt-elevation-drawer` |

Dark and light themes map semantic elevation to the same primitive shadow values that components previously used. High contrast maps semantic elevation to `none`; its existing strong border roles carry hierarchy instead.

## Radius mapping

The values are unchanged. The migration replaces scale selection with purpose selection.

| Previous token | Semantic role | Typical selectors |
| --- | --- | --- |
| `--nt-radius-sm` | `--nt-radius-indicator` | Small focus target, key hint, compact marker |
| `--nt-radius-md` | `--nt-radius-control` | Controls and compact interactive rows |
| `--nt-radius-lg` | `--nt-radius-item` | List items and nested content items |
| `--nt-radius-xl` | `--nt-radius-card` | Cards and content surfaces |
| `--nt-radius-2xl` | `--nt-radius-dialog` | Dialog-scale or large overlay surfaces |
| `--nt-radius-full` | `--nt-radius-pill` | Pills, dots, rings, and circular geometry |

Popover and toast roots were narrowed to `--nt-radius-popover` and `--nt-radius-toast`. Existing component-specific roles such as `--nt-radius-button`, `--nt-radius-input`, `--nt-radius-avatar`, and `--nt-radius-drawer` remain canonical.

## Files migrated

Fifty-seven production CSS files now reference at least one Prompt 3 semantic role: all seven AI modules; 29 non-empty core component modules except the empty table module; all seven domain modules; all nine patterns; and five shell modules. `src/patterns/loading-state/loading-state.css`, `src/shell/app-shell/app-shell.css`, and the shell drawers are included because their scrims/elevation were migrated. Index-only CSS files and the empty table file contain no role decision to migrate.

## Legitimate exceptions

The production literal-color allowlist is empty. The validator supports only exact `{ filePath, value, reason }` entries for future legitimate swatches, user-selected calendar colors, visualization palettes, syntax highlighting, or brand assets. Transparent values, `currentColor`, and CSS system keywords are not treated as palette literals.

Primitive values remain permitted in `src/styles/tokens/color.css` and theme values remain permitted in `src/styles/themes/*.css`; those are the architecture's palette-to-semantic boundary, not component exceptions.
