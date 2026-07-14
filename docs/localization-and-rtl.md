# Localization and RTL

## Supported model

`@neetechs/ui` is tested with English (`en`, LTR), Swedish (`sv`, LTR), Arabic (`ar`, RTL), nested direction changes, and mixed Arabic/Latin technical content. Applications provide translated strings, locale selection, fonts, currency, and time zone. The design system owns layout, display, and interaction contracts; it does not provide translations, translation keys, backend persistence, or a translation framework.

Use native metadata. There is no parallel `data-nt-rtl` API:

```html
<html lang="ar" dir="rtl">
<html lang="sv" dir="ltr">
<html lang="en" dir="ltr">
```

Direction is inherited from the nearest native `dir`, so localized islands work:

```html
<section lang="ar" dir="rtl">
  <code lang="en" dir="ltr" class="nt-technical-value">POST /api/v1/invoices</code>
</section>
```

`ntResolveDirection(element, fallback?)` resolves the nearest explicit `ltr`/`rtl` ancestor without `window`, computed styles, or layout reads. `dir="auto"` remains a content feature; behavior roots needing arrow mapping should inherit an explicit direction.

## Logical CSS and reviewed exceptions

Production layout uses `margin-inline-*`, `padding-inline-*`, `border-inline-*`, `inset-inline-*`, logical corners, and `text-align: start/end`. `npm run check:rtl` rejects new unexplained physical declarations, directional `translateX()`, physical origins/background positions, and broad SVG mirroring. Source is authoritative; generated output and dependencies are not scanned.

| Area | Intentional physical reason | Localized contract |
| --- | --- | --- |
| Drawer `--left` / `--right` | Existing east/west public classes | Prefer `inline-start` / `inline-end` |
| Tooltip left/right sides and arrows | Collision and arrow coordinate geometry | `data-align="start|end"` uses logical insets |
| Toast named left/right modifiers | Existing physical public names | Default is inline-end; swipe/progress respond to RTL |
| Detached search results | Public viewport-coordinate custom properties | Attached results start at inline-start |
| Calendar top/size math | Time is a coordinate system | Gutters, boundaries, sticky columns, and event insets are logical |
| Shimmer, shine, stripes | Decorative traversal carries no meaning | Reduced motion remains authoritative |
| Slide-left/right animations | Public names explicitly promise physical motion | Do not use for logical navigation |

The narrow authoritative allowlist and reasons are in `scripts/check-rtl.mjs`.

## Directional components

- App-shell/sidebar use inline-start placement and inline-end boundaries. Header leading/trailing groups retain DOM priority.
- Dropdown and tooltip start/end alignment is logical. Dialog action DOM order is not reversed by script.
- `NtDrawerSide` adds `inline-start` and `inline-end`; physical sides remain compatible.
- Sticky-first data-grid columns mean inline-start; resize handles are inline-end. Numeric cells use end alignment.
- Calendar grids follow visual inline order. Absolute event top/height math remains physical and isolated.
- Assistant/user message roles use logical start/end rather than assuming user means right.

## Icon mirroring

Never mirror every SVG. Mark only language-directional icons:

```html
<svg class="nt-icon--directional" aria-hidden="true">...</svg>
```

The class uses individual `scale`, composing safely with transform rotations/animations. Back/forward, previous/next, inline disclosure, language-sensitive reply, and inline collapse icons commonly mirror. Search, settings, calendar, delete, add/remove, status, upload/download, play/pause, external-link marks, and logos normally do not. Product semantics decide chronological arrow meaning.

## Arabic typography and fonts

`--nt-font-sans` prefers Inter, Noto Sans Arabic, Noto Sans, platform UI fonts, Segoe UI, and Arial. No font files are bundled; applications must load approved licensed fonts. Under `:lang(ar)`, heading/label tracking becomes normal, uppercase presentation is removed, and label/caption line-height is increased to reduce diacritic clipping.

Avoid fixed block sizes where localized content wraps. `.nt-button--wrap` is the opt-in multi-line action contract; it keeps the density minimum height. Normal buttons retain a single-line contract.

## Bidirectional content

```html
<bdi>اسم المستخدم — user@example.com</bdi>
<span dir="auto" class="nt-bidi-auto">User supplied text</span>
<code dir="ltr" class="nt-technical-value">C:\billing\invoice-2026.json</code>
```

| Utility | Contract |
| --- | --- |
| `.nt-bidi-auto` | `unicode-bidi: plaintext`; pair with `dir="auto"` |
| `.nt-bidi-isolate` | Isolates an inline run without choosing direction |
| `.nt-text-ltr` / `.nt-text-rtl` | Explicit isolated direction without forcing alignment |
| `.nt-technical-value` | LTR technical content with emergency wrapping |
| `.nt-numeric-value` | LTR numeric run with tabular figures |

Use explicit LTR for URLs, emails, paths, API routes, code, JSON, hashes, model IDs, IBAN/BIC, and similar identifiers—not surrounding prose. Direction and alignment are separate.

## Numbers, financial values, dates, and times

Formatting helpers require an explicit locale and delegate grammar/order to `Intl`:

```ts
import {
  ntFormatCurrency,
  ntFormatDate,
  ntFormatDateRange,
  ntFormatList,
  ntFormatNumber,
  ntFormatRelativeTime,
} from '@neetechs/ui/localization';

ntFormatCurrency(-1234.5, 'EUR', 'ar-EG');
ntFormatDate(date, locale, { dateStyle: 'long', timeZone });
ntFormatDateRange(start, end, locale, { dateStyle: 'medium', timeZone });
```

The package never guesses locale, currency, or time zone and never concatenates a translated range. Keep a formatted amount/sign/currency in one isolated run. Financial meaning still uses financial semantic tokens plus a non-color cue. Do not add display separators to editable numeric input while the user types without a dedicated tested input model.

## Long content and translation-safe APIs

Wrap prose, labels, errors, dialog titles, and essential actions. Truncate secondary identifiers only when complete accessible content remains available without relying solely on a tooltip. Tables and calendars may use contained scrolling rather than crushing data. At 200% text size, actions remain reachable; broader calendar/data-grid mobile adaptation is deferred to the responsive migration.

Pass complete translated labels, descriptions, announcements, and confirmations. Do not concatenate sentence fragments. Calendar range and data-grid sort behavior accept complete application-provided announcements.

State and recovery messages follow the same rule. Content-state headings, empty explanations, retry labels, permission errors, maintenance notices, toast text, form errors, and AI confirmation copy are application-provided complete strings. The design system exposes state attributes and layout; it does not provide English fallback strings or assemble sentences. Use `dir="auto"` or bidi utilities for user-generated names inside recovery messages, and keep technical identifiers such as invoice IDs, API routes, and provider names isolated with `.nt-technical-value` where appropriate.

## Keyboard behavior in RTL

`ntGetInlineArrowKeys(element)` maps visual inline movement. Horizontal tabs, interactive grids, and calendar grids use it. Vertical menus keep Up/Down; Home/End retain component meaning. Native inputs are untouched. Never globally swap ArrowLeft/ArrowRight.

## Testing commands

```bash
npm run check:tokens
npm run check:a11y
npm run check:rtl
npm run check:states
npm test
npm run test:browser
```

Tests cover explicit-locale formatting, validator failures, nested direction, RTL tabs/grid/calendar keys, logical drawer/shell/sidebar/header/toast edges, state-contract source validation, selective icon mirroring, bidi utilities, Arabic typography, AI messages and approval, 320px localized content, 200% text size, axe/focus/overlay behavior, and a rendered RTL review image.

## Manual QA checklist

- Test `en/ltr`, `sv/ltr`, and `ar/rtl` at 320px, mobile, tablet, and desktop.
- Test 200% text size in light/dark and compact/comfortable density.
- Load the approved Arabic font and inspect diacritics, buttons, badges, chips, tables, and calendar events.
- Keyboard-test tabs, menus, grids, calendars, drawers, and dialogs.
- Inspect mixed names, email, URLs, code, invoice IDs, IBAN, amounts, dates, and time zones with a native Arabic screen reader.
- Verify each previous/next icon's meaning instead of mirroring automatically.
- Confirm critical translated content is not available only through truncation or a tooltip.
- Confirm empty, error, offline, permission, maintenance, unsaved-change, and AI approval copy remains understandable in Swedish and Arabic without sentence-fragment concatenation.

## Known limitations

- Applications must load fonts, translate content, and choose/persist locale, time zone, and currency.
- Tooltip/calendar collision and event layout retain reviewed physical coordinate math.
- Full calendar/data-grid narrow-layout redesign is deferred.
- Complex browser bidi rendering and native Arabic screen-reader speech require product-level manual QA.
- Automated checks prevent regressions but do not prove localization quality.
