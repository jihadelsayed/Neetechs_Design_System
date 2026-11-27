# Changelog

All notable changes to `@neetechs/ui` are documented here. The project follows
[Semantic Versioning](https://semver.org/); while on `0.x`, minor versions may
add features and patch versions fix bugs. Breaking changes are always called
out explicitly and ship with compatibility aliases where feasible.

Releases are cut by `semantic-release` from Conventional Commits, but only
when the package owner manually runs the release workflow with `publish: true`.

## Unreleased

### Unified global header (development preview)

- Added framework-independent ntRenderHeader and ntMountHeader, shared branding
  and logo export, typed account states, configurable ecosystem navigation,
  optional app switcher, appearance/language preferences, notifications summary,
  and mobile drawer account parity.
- Added host-owned action and router delegation, SSR-safe rendering, shared
  avatar fallback, and scoped responsive/RTL/accessibility styling.
- Added Angular 20, React 18 and plain HTML/JavaScript integration references.
- Fixed package validation to resolve exported assets without importing PNG as JS.
- No application cutover or npm release is implied. Full package, framework and
  browser verification remains pending; see docs/unified-header-release.md.


Additive changes on top of the published 0.1.0 contract (no classes, tokens,
exports, or behaviors removed).

### Added
- Glass and motion (see `docs/glass-and-motion.md`), all opt-in:
  - Glass sidebar `.nt-sidebar--glass` with a 300ms rail morph that keeps icons in place,
    and `.nt-sidebar--cutout`: the current item is a light tab that runs into the sidebar
    edge with concave corners, settles into a centered tile in the rail, and joins the
    content panel in connected shells (LTR/RTL, high-contrast outline, forced-colors
    fallback). Hooks: `--nt-sidebar-cutout-surface`, `--nt-sidebar-cutout-fg`. Rail badges
    pin to the icon corner. New slots: `.nt-sidebar__search`, `.nt-sidebar__brand-action`,
    `.nt-sidebar__account` (+ `__account-avatar`, `-text`, `-name`, `-meta`, `-action`).
  - `.nt-app-shell--dock-tablet` keeps the sidebar docked down to 40rem;
    `ntCreateSidebar` detects it and moves its off-canvas query to `ntViewportQuery('sm')`.
    The controller no longer applies the rail class while the sidebar is off-canvas.
  - Roles `--nt-glass-selected-bg` and `--nt-glass-selected-fg` in all three themes.
  - Shell: `.nt-app-shell--glass` (ambient frame, solid content panel) and
    `.nt-app-shell--connected` (sidebar and panel joined into one frame).
  - Glass material roles in all three themes (`--nt-glass-bg`, `-bg-strong`, `-border`,
    `-highlight`, `-item-bg`, `-item-hover`, `-ambient-start`, `-ambient-end`, `-backdrop`)
    and `--nt-glass-blur`, `--nt-glass-blur-strong`, `--nt-glass-saturate`; solid under
    high contrast, `prefers-contrast: more`, reduced transparency, and forced colors.
  - `utilities/glass.css` (`.nt-glass`, `--strong`, `--floating`, `--interactive`,
    `.nt-glass-backdrop`), `.nt-card--glass`, `.nt-card--lift`, `.nt-panel--glass`,
    `.nt-command-palette--glass`.
  - `ntCreateSelectionIndicator()` with `.nt-tabs--sliding` and
    `.nt-segmented-control--sliding`.
  - Dock `.nt-dock` (`components/dock.css`) and floating action menu `.nt-fab`
    (`components/fab.css`, wired with `ntCreateMenuPopover`).
  - Motion tokens `--nt-duration-layout`, `--nt-ease-glide`, `--nt-ease-spring`,
    `--nt-motion-stagger`, `--nt-transition-selection`, `--nt-motion-selection`.
- MyAccount-referenced patterns (see `docs/NEETECHS_UI_UPGRADE_PLAN.md`):
  - Profile header `.nt-profile-header` (`patterns/profile-header.css`): identity, handle,
    headline, detail line, completion meter, side column with actions and a next-step card.
  - Resource card `.nt-resource-card` + `.nt-resource-card-grid`/`-list`
    (`patterns/resource-card.css`) for providers, connected accounts, files, and keys.
  - Editor workspace `.nt-editor-workspace`, `.nt-editor-pane`, `.nt-editor-status`
    (`patterns/editor-workspace.css`) and document preview `.nt-document-preview`
    (`patterns/document-preview.css`) with print geometry.
  - Choice card `.nt-choice-card` + `.nt-choice-group` (`components/choice-card.css`).
  - Disclosure `.nt-disclosure` + `.nt-disclosure-group` (`components/disclosure.css`).
  - `.nt-button--link`, `.nt-avatar--2xl`, `.nt-avatar--editable` + `__overlay`,
    `.nt-badge--info`, `.nt-card--edge`, `.nt-progress--reveal`, `.nt-stat--split`
    (`__body`, `__aside`).
  - Settings navigation: current-item bar, `aria-current="true"|"location"|"step"`,
    `__nav-label`, `__nav-status` (`--complete`, `--attention`, `--error`), `__nav-count`,
    `__nav-group`, `__nav-title`, `__nav--surface`, `.nt-settings-layout--sticky-nav`.
  - Tokens (all three themes): `--nt-document-canvas`, `--nt-document-paper`,
    `--nt-document-ink`, `--nt-document-ink-muted`, `--nt-document-rule`.

### Changed
- Overlay motion: entrances use `--nt-ease-enter`, exits `--nt-ease-exit`; drawers slide in
  over `--nt-duration-layout`; toasts enter with `--nt-ease-spring`.
- Navbar current and hover indicator is an underline that grows from the center (it was
  an instant inset shadow).

### Fixed
- Exit animations of dialogs, drawers, dropdowns, tooltips, popovers, and the command
  palette never played because the behaviors hide the overlay in the same frame; overlays
  now keep `display` for the exit duration where `allow-discrete` transitions are supported.
- Sidebar group wrappers clipped the focus ring of their items.
- Calendar week grid: weekday, time, and event-time labels use secondary text (muted text
  measured 4.26–4.39:1 on the light muted surfaces); the scrolling body has a focus ring
  for `tabindex="0"`.
- Glass sidebar (unreleased): RTL/responsive gate failures, a cutout that could not reach
  the content panel, rail-morph jumps, and fixed-position descendants trapped by
  `backdrop-filter`.
- Light-theme contrast: descriptions in tinted alerts and eyebrow/subtitle/meta text in
  muted or tinted cards now use secondary text (muted text measured 4.23–4.34:1 there).
- `.nt-badge--neutral` and the base/draft `.nt-billing-status` use the neutral tone roles
  (muted text on the muted surface measured 4.34:1 in the light theme).

## 0.1.0 — 2026-11-15

### Added
- Soft navy dark palette with blue as the default brand accent (`--nt-bg-app: #202d42`,
  `--nt-accent: #528ef5`). Orange, green, purple, and neutral accents remain selectable.
- Site chrome (see `docs/site-chrome.md`):
  - Header: `.nt-header__brand`, `__logo`, `__brand-name`, `__nav`, `__account`
    (+ `__account-name`, `__account-chevron`), `.nt-header--sticky`.
  - Navbar: `.nt-navbar` (`@neetechs/ui/shell/navbar.css`) + `ntCreateNavbar()`
    disclosure navigation (Escape/focus restore, outside click, focus-out, arrow keys, RTL).
  - Account dropdown: `ntCreateAccountMenu()` over the existing profile-menu pattern.
  - Mobile navigation: `.nt-mobile-nav--drawer` + `ntCreateMobileNav()` (modal drawer,
    closes on navigate/backdrop/desktop resize, RTL edge, safe areas).
  - Footer: `.nt-footer` (`@neetechs/ui/shell/footer.css`), container-query layout.
- Button group: `.nt-button-group` (`--attached`, `--vertical`, `--full`, `--sm`, `--lg`).
- Popover: `.nt-popover` + `ntCreatePopover()` (implements `NtDisclosureController`).
- Appearance: `ntAppearanceBootstrapScript()` / `ntApplyInlineAppearance()` pre-paint
  bootstrap (no theme flash) and `AppearanceController.updatePreference(partial)`.
- Coarse-pointer 44px targets for header, navbar, mobile nav, footer, and popover controls.
- Docs: `components.md` catalog, `site-chrome.md`, `layering.md`, `design-system-audit.md`,
  0.0.4 → 0.1.0 consumer migration with per-app bridge analysis, `CONTRIBUTING.md`.
- `NEETECHS_UI_VERSION` is generated from `package.json` at build time (`src/version.ts`).
- Quality gates: `check:package` (packs, rejects development artifacts, installs into a
  clean consumer, resolves every export, size budget), `check:docs` (every class/import/CSS
  path in docs exists), `check:api` (no public export, CSS file, class, token, or JS binding
  removed; baseline in `api/public-api.json`, verified against published 0.0.4).

- Billing-referenced workspace upgrade (see `docs/NEETECHS_UI_UPGRADE_PLAN.md`):
  - Stat (KPI) card `.nt-stat` + intrinsic `.nt-stat-grid` (`components/stat.css`): tone bar,
    icon tile, tabular value, trend delta, tones, `--tinted`, `--emphasis`, `--wide`,
    `--sm`/`--lg`, interactive/selected states, and `aria-busy` loading without layout shift.
  - Description list `.nt-description-list` (`components/description-list.css`): responsive
    grid, `--inline` totals with dividers, `--boxed` breakdown tiles, emphasized rows.
  - Record list `.nt-record-list` / `.nt-record` (`patterns/record-list.css`): navigable
    rows with indicator, meta, end-aligned value, direction-aware chevron, container-query
    stacking, selected bar, `--divided`, `--compact`.
  - Page patterns: `.nt-page-header--surface` (document action bar), `--compact`,
    `__title-row`, `__status`; `.nt-page-toolbar--surface` filter panel with `__fields`
    and `__actions`; `.nt-page-section__eyebrow`.
  - Workspace sidebar: collapsible groups (`.nt-sidebar__group`, `__group-trigger`,
    `__group-items`, `__group-inner`, `__group-label`, `__group-chevron`), animated active
    indicator, `.nt-sidebar--floating`, standalone `.nt-sidebar--collapsed` rail.
  - App shell: `.nt-app-shell--offcanvas` (same sidebar slides in below 64rem),
    `.nt-app-shell--inset`, `.nt-app-shell__menu-toggle`, `.nt-app-shell__collapse-toggle`,
    `[data-nt-sidebar-close]`, animated rail width.
  - `ntCreateSidebar()` (`@neetechs/ui/behaviors`): rail with persisted preference,
    disclosure groups, modal off-canvas mode (focus trap, Escape, outside click, scroll
    lock, inert background, focus return, close on navigate and on desktop resize).
  - Cards: `.nt-card--selected` (and `aria-selected`/`aria-pressed`/`aria-current`/
    `aria-checked`), `--info`, `--accent`, `--padded`, pressed state for `--interactive`.
  - Buttons: pending state keeps the button width when the label is wrapped in
    `.nt-button__content`; success and error states play one halo pulse.
  - `.nt-skip-link` (shared skip-to-content link).
  - Billing domain: `.nt-billing-metric__accent`, `--info`, `--prominent`;
    `.nt-billing-document__title-row`, `__status`; generic `.nt-billing-status` tones;
    `.nt-billing-amount-list--divided`, `.nt-billing-amount-row--grand`.

### Changed
- Collapsed sidebar rail labels are now visually hidden instead of `display: none`, so
  icon-only items keep their accessible names (no visual change).
- Active sidebar items show an inline-start indicator bar in addition to the selection fill.
- Skeleton shimmer sweeps in the reading direction under RTL.
- `.nt-header` now establishes its own layer (`position: relative; z-index: var(--nt-z-header)`
  at zero specificity), so header dropdowns always paint above page content. Inside
  `.nt-app-shell__header` the shell's sticky positioning still applies.
- Dark theme default palette is the soft navy set (intentional visual change; consumers'
  bridges already emulate it).

### Fixed
- Dark theme + purple accent focus ring now meets non-text contrast requirements.
- `NEETECHS_UI_VERSION` reported `0.0.2` in the published `0.0.4` package; it now always
  matches the published version.
- Broken regular expressions in the brand-palette unit test that failed CI and blocked
  every release since `0.0.4`.
- Arabic heading browser test no longer treats harmless font-metric overflow (installed
  Noto Sans Arabic) as clipping.

- README samples that used non-existent classes (`nt-field__hint`, `nt-field--error`,
  `nt-shell-main`).

### CI
- Pushes to `main` run the full verification gate (static contracts, build, unit tests,
  Playwright, package check) but no longer publish automatically. Publishing requires a
  manual `workflow_dispatch` run with `publish: true`.

## 0.0.4 — 2026-07-14
- Responsive and page-pattern updates.

## 0.0.3 — 2026-07-13
- Automated npm release configuration.

## 0.0.2 — 2026-06-26
- Initial public package.
