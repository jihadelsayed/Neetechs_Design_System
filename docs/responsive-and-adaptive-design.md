# Responsive and adaptive design

Responsive behavior is part of every component contract. Reusable components
respond to the width of the region that contains them — a page column, a
drawer, a dialog, a dashboard cell — not to the viewport. Only app-shell-level
layout responds to the viewport.

## Principles

1. Intrinsic first: flexible sizing, wrapping, logical properties, and
   min/max constraints before any query.
2. Container over viewport: a component must work identically on a phone and
   inside a desktop drawer of the same width.
3. Change the interaction model, not just the size, when shrinking desktop UI
   would produce broken UX.
4. No fixed heights around translated or user-supplied text.
5. Accessibility, keyboard behavior, RTL, themes, density, and reduced motion
   are preserved in every mode.

## Adaptive categories

Every component belongs to one category:

| Category | Meaning | Examples |
| --- | --- | --- |
| Intrinsic | Works at any sensible width without changing its model | button, badge, chip, avatar, input, checkbox/radio/switch, alert, toast, skeleton, progress, breadcrumb, pagination, empty/error/content states |
| Reflowing | Same interaction model, reorganized layout | card, panel, page header, page toolbar, dialog/drawer footers, form rows (`.nt-form__row--2/3`), data-grid toolbar/footer, AI proposal/suggestion/approval cards, billing document |
| Adaptive | Interaction model changes at constrained widths | app shell (sidebar → mobile nav drawer), header (search collapses, trigger appears), settings layout (side nav → scrollable row), master-detail (two panes → single pane), tabs (scrollable), step indicator (labels collapse), menus/popovers (viewport-capped) |
| Alternative view | A different representation is required | calendar month/week grid → agenda list or day timeline, interactive data grid → constrained mode or record list |

## Viewport versus container queries

- **Viewport media queries** are reserved for shell-level layout
  (`app-shell`, `header`, `mobile-nav`, page-level utilities) and as safe
  fallbacks for patterns that may render outside any query container.
- **Container queries** drive reusable components. The shell content area
  (`.nt-app-shell__content`), dialog body, and drawer body are query
  containers; components inside them adapt to their actual space.

Browsers without container-query support fall back safely: narrow-container
refinements simply do not apply, and the viewport fallbacks still cover
phones.

## Breakpoint strategy

Media queries cannot read custom properties, so the scale is a documented
list of literal rem values, enforced by `npm run check:responsive` and
mirrored by `NT_VIEWPORTS` in `@neetechs/ui/behaviors`:

| Bound | Meaning |
| --- | --- |
| `30rem` (480px) | small phone upper bound |
| `40rem` (640px) | large phone upper bound |
| `48rem` (768px) | tablet upper bound |
| `64rem` (1024px) | shell collapses the sidebar below this |
| `80rem` (1280px) | wide desktop lower bound |
| `96rem` (1536px) | maximum content rationale |

Rules: rem only (so browser text scaling shifts ranges consistently), no
device-brand widths, no new one-off breakpoints without updating the scale,
container thresholds are content-driven per component (commonly 30/40/48rem).

## Container setup

```html
<div class="nt-region">            <!-- container-type: inline-size -->
  <div class="nt-region--named">   <!-- container-name: nt-region -->
```

Built-in containers: `.nt-app-shell__content`, `.nt-dialog__body`,
`.nt-drawer__body`, `.nt-table-container`, `.nt-data-grid`, `.nt-form`,
`.nt-settings-layout`, `.nt-master-detail`, `.nt-workflow`,
`.nt-calendar-agenda`, `.nt-ai-conversation-panel`.

Do not make every element a container; add `.nt-region` to dashboard columns
and split panes. `container-type: inline-size` means the element cannot size
itself from its children's inline size.

## Shell behavior

- Desktop (`≥64rem`): sidebar grid column + sticky header; `--collapsed`
  switches to the icon rail. Content gutters come from `.nt-content-frame`.
- Below `64rem`: the sidebar column is removed entirely (no stale offset),
  `.nt-header__mobile-trigger` appears, and navigation becomes the modal
  `.nt-mobile-nav` drawer driven by `ntCreateDrawer` (focus trap, inert
  background, Escape, scroll locking, RTL placement via logical `placement`).
- All full-height shell surfaces pair `100vh` with a `100dvh` override;
  `.nt-fill-viewport` / `.nt-fill-viewport--fixed` provide the same contract
  to applications. Safe-area insets pad the mobile-nav footer, overlay
  footers, and `.nt-page-footer-actions--sticky`.
- One navigation data structure feeds both sidebar and mobile nav; never
  maintain two copied navigation systems.

Content width: reading content uses `.nt-content-frame` defaults (max
`--nt-container-lg`), prose uses the 52rem description ceiling, operational
data may opt into `--wide` or `--full`. Do not stretch forms across wide
displays.

## Headers, breadcrumbs, and toolbars

Priority order: page identity → primary action → status/context → secondary
actions → low-frequency actions.

- `.nt-page-header` wraps; the title group keeps a readable measure
  (`flex-basis: 20rem`) and actions wrap below it. Titles wrap
  (`overflow-wrap: anywhere`) instead of truncating record identity.
- Low-frequency actions move into an overflow menu (`ntCreateMenu` +
  "More actions"); they are `display: none` when hidden, never merely
  visually hidden while focusable.
- The shell `.nt-header` hides its center search below `64rem` and its
  subtitle/breadcrumb below `40rem`; the title itself never disappears.
- Breadcrumbs may collapse middle items but keep the parent and current
  location.

## Responsive forms

`.nt-form` (see `src/patterns/form-layout/form-layout.css`):

- Rows are single-column by default; `--2`/`--3` collapse to one column below
  a `40rem` container width. DOM order is the visual, keyboard, and
  screen-reader order — CSS never reorders fields.
- Labels, hints, and errors stay attached to their field (`.nt-field`);
  no fixed heights ever clip validation text.
- `.nt-form__actions` keeps the safe action last in reading order and
  destructive actions separated in `.nt-form__actions-start`; below `30rem`
  the footer stacks (safe action on top via `column-reverse`) and buttons
  stretch. Buttons are not full-width by default anywhere else.
- Long forms never go inside horizontally scrolling containers.
- Compact density never shrinks touch targets below the coarse-pointer
  minimums (see Touch and pointer).

## Dialogs, drawers, and sheets

- Dialogs cap at `min(44rem, calc(100dvh - …))`, scroll internally, and at
  `≤40rem` stack their footer with safe-area padding. Purpose decides the
  mobile form: constrained dialog, near-full-screen, or full-screen task
  view. Not every dialog becomes a bottom sheet — sheets are for action
  selection, filters, and short confirmations only.
- Drawers use logical `placement` (`inline-start`/`inline-end`); they are
  full-width at `≤40rem`, cap at `90dvh` for top/bottom sheets, keep close
  controls visible, and pad footers with safe-area insets. Focus and scroll
  contracts come from `ntCreateDrawer`.
- Dialog and drawer bodies are query containers, so nested tables, grids,
  and forms adapt to the overlay width automatically.

## Menus, popovers, selects, tooltips

Floating surfaces cap at `calc(100vw - gutter)` and `calc(100dvh - gutter)`,
scroll when tall, and use collision-aware placement from the behavior
helpers. Touch interaction never depends on hover; submenus do not require
precise pointer paths; tooltips are never the only path to information — on
touch, the same content must exist as visible text or an accessible label.

## Tables

Choose one strategy per table (`src/components/table/table.css`):

1. **Horizontal overflow** (default): `.nt-table-container` scrolls; when it
   can scroll, give it `tabindex="0"`, `role="region"`, and an accessible
   name. Use `--sticky-leading` for identity columns (logical inline-start,
   RTL-correct).
2. **Priority columns**: mark `.nt-table__cell--tertiary` (hides below a
   `40rem` container) and `--secondary` (hides below `30rem`). Hidden values
   must remain reachable (row details or the record's page).
3. **Expandable details**: `.nt-table__details-row` + `.nt-table__details`
   host secondary values below the identity row.
4. **List/card alternative**: only when cross-row comparison is not central;
   use the record-list pattern rather than converting every table to cards.

Numeric alignment (`--numeric`), header associations, selection, and sorting
behavior are unchanged in every strategy.

## Data grid

Three documented modes (`src/components/data-grid/data-grid.css`):

- **Desktop grid**: the existing interactive table (min 48rem inside its own
  scroller — a reviewed exception).
- **Constrained** (automatic below a `48rem` container, or `--constrained`):
  tertiary then secondary columns hide, resize handles disappear (also on all
  coarse-pointer devices), sticky first column keeps record identity.
- **Mobile record mode**: applications render `.nt-data-grid__record-list`
  *instead of* the table — never both at once, so assistive technology sees
  one set of content. Records keep title, status, key fields
  (term/value), selection (`--selected`), and the same critical actions.
  Inline editing moves to a dialog or full-screen editor.

Applications choose the mode based on data meaning; grids are not forced
into one card template.

## Calendar

| Width | Views |
| --- | --- |
| Desktop | month grid, week grid, day timeline |
| Tablet | month grid (scrolls), reduced week, day timeline, agenda |
| Phone | **agenda list** (`.nt-calendar-agenda`), day timeline (now intrinsic — no forced 36–42rem), event detail |

The month/week grids keep desktop geometry inside a scroll container at
narrow widths — that is a reviewed exception, not the phone experience.
The agenda list provides: compact date navigator (previous/today/next +
date-picker trigger), sticky day headers, a labeled "Today" indicator (not
color alone), tabular event times with duration, all-day events, category
dot + text label, selected state, and ≥44px event targets. Locale
formatting, grouping, and data remain application responsibilities; event
creation on phones opens a full-screen dialog or task view.

## Search and filters

Desktop: search field + primary filters + sort in `.nt-page-toolbar`.
Narrow: visible search, a "Filter" trigger with an accessible active count,
filters in a drawer/sheet or full-screen dialog, and the
`.nt-page-toolbar__applied` row keeping applied filters visible with a
clear-all action. No-results states distinguish "no search matches" from "no
filtered results" (see states doc). The design system owns presentation;
query execution and debouncing are application concerns.

## Pagination

`.nt-pagination` keeps labeled Previous/Next at all widths; page numbers may
reduce; `aria-current="page"` announces the current page; icon-only controls
need accessible names and directional icons follow semantic previous/next in
RTL (`.nt-icon--directional`). "Load more"/cursor navigation is a separate
application pattern — semantics never switch automatically.

## Cards, panels, dashboards

- `.nt-grid--fit` sizes columns from `--nt-grid-min-item` (declare the
  widget's real minimum) instead of fixed column counts; `--2/--3/--4`
  collapse below `48rem` viewport or `40rem` container.
- Cards keep readable measures; card actions wrap or move to overflow;
  full-card click areas preserve nested-action behavior; source order stays
  meaningful.

## Neenee AI

- `.nt-ai-conversation-panel--fullscreen` fills a `.nt-fill-viewport--fixed`
  wrapper (dvh with vh fallback) so the composer stays visible above the
  mobile keyboard; its footer pads with safe-area insets.
- The panel is a query container: in split panes and drawers it compacts
  exactly as it does on phones (single-column messages, full-width bubbles,
  stacked header).
- Composer tools may collapse into a labeled menu; the send action stays
  immediately available. Attachments wrap; code/JSON/URLs scroll inside
  `.nt-scroll-inline` technical regions instead of expanding the page.
- Tool-call details collapse but the human-readable summary never hides.
  Sidebars become drawers on phones; never multiple permanent sidebars.

## Touch and pointer

- `.nt-hover-reveal` inside a `.nt-hover-reveal-scope` fades secondary
  actions in on fine pointers but keeps them always visible on touch and
  keyboard (`:focus-within`) — hover is never the only path to an action.
- `@media (pointer: coarse)` raises small controls (`--sm` buttons and icon
  buttons, sort buttons, interactive chips) to `--nt-target-size-default`
  and hides column-resize handles.
- Hover styles stay scoped, not globally disabled; pressed/active states do
  not depend on hover.

## Safe areas and mobile keyboards

- Never rely on plain `100vh`: pair it with `100dvh` (enforced by
  `check:responsive`) or use the `.nt-fill-viewport*` utilities.
- Safe-area utilities: `.nt-safe-area-block-start/-end`,
  `.nt-safe-area-inline` (physical by nature — device cutouts do not flip
  with direction).
- Overlay footers, the mobile-nav footer, sticky page footers, and the
  fullscreen AI composer already pad for the home indicator.
- Scroll locking comes from the overlay behaviors and is released on
  cleanup; focused fields inside overlays scroll into view because overlay
  bodies are the scroll containers.

## Zoom and text scaling

At 200% zoom (a 640px layout viewport on a 1280px screen): no information
loss, no two-dimensional scrolling for ordinary content (tables and
technical regions scroll inside their own labeled containers), dialogs stay
dismissible, and toolbars wrap. Because every breakpoint is rem-based,
increased root font size shifts layouts toward their narrow modes instead of
breaking them. Never fix zoom failures by shrinking fonts.

## RTL and localization interaction

All responsive CSS uses logical properties; drawers, sticky columns, step
indicators, and record lists follow `dir`. Long Swedish compounds and Arabic
text wrap via `overflow-wrap: anywhere` on titles and record values instead
of overflowing. Time values stay tabular; technical values use the existing
LTR isolation utilities.

## Accessibility requirements

- Hidden-by-adaptation content uses `display: none` (removed from both the
  accessibility tree and tab order) — never visually hidden but focusable.
- Only one of table/record-list renders at a time.
- Scrollable regions that can trap content get `tabindex="0"` + a name.
- Touch targets: ≥44px primary controls everywhere, coarse-pointer expansion
  for compact controls.
- Focus entry/return for the mobile nav drawer follows the drawer behavior
  contract.

## Testing

```bash
npm run check:responsive   # source contract (breakpoint scale, dvh, min-widths)
npm test                   # includes tests/responsive-validation.test.mjs
npm run test:browser       # tests/browser/responsive.spec.mjs + visual snapshots
```

Browser coverage: shell at 1280/375/320, table priority columns, form-row
collapse, master-detail single-pane + back control, step-indicator collapse,
agenda touch targets in a 22rem container, Arabic RTL header overflow, 200%
zoom equivalence, reduced motion, and three visual snapshots
(`patterns-shell-desktop/mobile`, `patterns-agenda-narrow`). To update
snapshots intentionally: delete the stale file under
`tests/browser/__screenshots__/` (or run `npx playwright test
--update-snapshots`), rerun, and review the diff before accepting.

## Component acceptance checklist

A component is mobile-ready only when:

- [ ] It renders correctly at a 17.5rem (280px) container width or documents
      an alternative view.
- [ ] It uses container queries (or is intrinsic) rather than viewport
      queries, unless it is shell-level.
- [ ] Any `100vh` has a dvh companion; edge-anchored surfaces pad safe areas.
- [ ] No hover-only actions; coarse-pointer targets are safe.
- [ ] DOM order equals visual order in every mode.
- [ ] RTL, density, themes, reduced motion verified in narrow modes.
- [ ] Behavior at the documented widths is covered by a browser test.

## Migration guidance

See [migration.md](./migration.md) — "Responsive and adaptive architecture
(Prompt 9)" for before/after examples (viewport-only sidebar → adaptive
shell, fixed toolbar → wrapping header, multi-column form → `.nt-form`,
table strategies, data-grid record mode, calendar agenda, AI composer).

## Known limitations

- Container queries need a Chromium/Firefox/Safari from 2023+; older
  browsers keep the viewport fallbacks and desktop presentation inside
  narrow containers.
- The agenda list and record list are styling + semantics contracts; view
  switching, data grouping, and date pickers are application logic.
- The month/week grids intentionally remain desktop grids inside scrollers;
  applications must switch to agenda/day views on phones.
- `interactive-widget=resizes-content` and VirtualKeyboard-API tuning stay
  application-level (meta viewport ownership).
- Visual snapshots cover three high-risk layouts; broader matrices
  (density × theme × RTL × zoom) run as behavioral assertions instead.
