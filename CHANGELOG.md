# Changelog

All notable changes to `@neetechs/ui` are documented here. The project follows
[Semantic Versioning](https://semver.org/); while on `0.x`, minor versions may
add features and patch versions fix bugs. Breaking changes are always called
out explicitly and ship with compatibility aliases where feasible.

Releases are cut by `semantic-release` from Conventional Commits, but only
when the package owner manually runs the release workflow with `publish: true`.

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
