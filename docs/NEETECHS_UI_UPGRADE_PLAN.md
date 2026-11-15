# Neetechs UI upgrade plan

Single progress tracker for the 8-stage `@neetechs/ui` upgrade. Site chrome
(Header, Navbar, Account dropdown, Mobile navigation, Footer) is part of
Stages 4–6 below; there is no separate plan.

**Current stage:** 8: consumer readiness verified; Billing-referenced design upgrade added to the 0.1.0 candidate (see below); awaiting owner approval to publish 0.1.0.

## Billing-referenced design upgrade (2026-11-15)

Neetechs_Billing (Angular, consuming 0.0.4) was audited as the visual quality
reference: global styles, `billing-shell`, `_billing-page-theme`,
`_billing-detail-theme`, dashboard, invoice detail, stat/action/page-header
cards, overlays, right drawer, desktop/mobile header, and status badges.
Billing was not modified. Its reusable patterns were rebuilt on semantic
tokens; nothing was copied verbatim.

### Comparison

| Area | Billing | Design System before | Result |
|---|---|---|---|
| KPI / stat cards | Compact cards, sentence-case labels, large tabular values, short tone bar, tinted exceptional states, skeleton loading, featured full-width card | Only `.nt-billing-metric` (finance-only, small value, no tone bar, no loading contract) | **Added** `.nt-stat` + intrinsic `.nt-stat-grid`; enhanced `.nt-billing-metric` |
| Detail fields, totals | `dl` grids with muted labels, inline totals with dividers, boxed grand total, breakdown tiles | `.nt-billing-amount-list` only | **Added** `.nt-description-list`; enhanced amount list (`--divided`, `--grand`) |
| Recent items / health list | Bordered rows with title + meta + end-aligned amount, status dot, calm hover | Tables, data grid, notification center only | **Added** `.nt-record-list` |
| Action bar (document header) | Eyebrow, title, inline status, contextual actions on a surface | `.nt-page-header` (no surface or status slot) | **Enhanced** `--surface`, `--compact`, `__title-row`, `__status` |
| Filter toolbar | Bordered surface, auto-fit field grid, actions aligned to fields | `.nt-page-toolbar` (inline only) | **Enhanced** `--surface`, `__fields`, `__actions` |
| Sidebar | Collapsible groups with chevrons, icon rail with section dividers, floating panel, off-canvas on mobile, selection-styled active item | Flat sections; rail used `display: none` on labels (accessible names lost); no groups; hidden on mobile | **Enhanced** groups, indicator, rail a11y fix, floating, off-canvas + `ntCreateSidebar` |
| Skip link | Pill sliding from the top | None | **Added** `.nt-skip-link` |
| Dialog, drawer, dropdown, tooltip, toast motion | Billing re-implements entry animations locally | Already richer in the DS (open/closed keyframes, swipe toasts, mobile sheets, focus management) | **Kept DS**; Billing should drop its local copies |
| Inputs, focus halo, tabular numerals, status badges | Local tag-level styles | Already in the DS | **Kept DS**; added generic billing status tones |

### Strongest Billing patterns adopted
1. Compact, calm workspace density: radius-xl panels, subtle borders, no heavy shadows.
2. One headline figure per card with a tone bar instead of tinting the whole card.
3. Sentence-case labels (Billing's own final override dropped uppercase labels).
4. Selection-fill active navigation.
5. Collapsible navigation groups and an icon rail with dividers.
6. Inline status beside the document reference.
7. A boxed grand total in totals cards.
8. Tabular numerals everywhere amounts appear.

### Motion and microinteractions
- Sidebar: active indicator grows in (`--nt-duration-normal`, `--nt-ease-emphasized`);
  group height animates through `grid-template-rows` and closed items leave the tab
  order through delayed `visibility`; chevron rotation is direction-aware; rail width
  animates on the shell grid; off-canvas slides in with `--nt-ease-enter` and out
  with `--nt-ease-exit`; the backdrop fades.
- Buttons: pending state keeps the button width (no layout shift); success and error play one halo pulse.
- Cards and stats: hover lift, pressed reset, selection ring.
- Stats: the loading pulse keeps the value footprint.
- Records: a border-strengthening hover and a chevron nudge toward the reading direction.
- Skeleton shimmer follows RTL. The skip link slides in.
- Every new transition and animation is disabled under `prefers-reduced-motion`, and the
  shell honors `data-nt-motion`.

### Intentionally not copied
| Billing pattern | Reason |
|---|---|
| Orange radial-gradient invoice header with a 5rem invoice number | Hardcoded `#f7931a`/rgba; conflicts with the blue default accent and token rules |
| Tag-level form styling inside `.billing-workspace` (`label`, `input`, `dt`) | The DS styles opt-in classes; global tag rules would leak into consumers |
| Modal backdrops with literal rgba and blur, z-index literals (40, 1000, 2200) | The DS has semantic backdrop and z-index scales (`docs/layering.md`) |
| Emoji language menu in `<details>` | Covered by `.nt-dropdown`/`ntCreateMenu` with keyboard support |
| Go-to-top button, radial-gradient page spinner, light-only `selection-loader` | Low reuse value or hardcoded colors; skeleton and loading-state already cover loading |
| RUT/ROT tax-reduction card markup | Swedish-tax-specific; generalized as `.nt-stat--wide` + `.nt-description-list--boxed` |
| Uppercase micro labels | Billing itself moved to sentence case; the DS keeps uppercase only for eyebrows |
| `::ng-deep`, `!important` overrides, Angular services and routing | Framework code and business logic stay out of the package |

### Tests (2026-11-15, Windows, Node 24, Chromium; local, after `npm ci`)
| Command | Result |
|---|---|
| `npm test` (static contracts, build, `check:docs`, `check:api`, unit) | pass: 124/124 unit (+7 new) |
| `npx playwright test` | pass: 93/93 (+25 new in `workspace.spec.mjs`, including axe in 3 themes and a stat-grid snapshot); all 4 pre-existing snapshots unchanged |
| `npm run check:package` | pass: 282.7 kB packed, 381 files, clean consumer install + import |
| `check:api` baseline update | +127 additions, 0 removals |

### Unresolved issues
- Billing still ships local duplicates (`.billing-sidenav`, `.finance-stat-card`,
  `.finance-filter-toolbar`, `.dashboard-record`, `.action-bar`, `.totals-card`, a
  right-drawer animation). Remove them during the Billing migration (Prompt 14);
  Billing was intentionally not modified here.
- `.nt-mobile-only` sets `display: none` at the utility layer and loses to components
  loaded later (for example `.nt-button`). This predates this work and was left
  unchanged because raising utility specificity affects every consumer; the shell uses
  scoped toggle classes instead.
- `grid-template-rows`/`grid-template-columns` transitions and `:has()` need current
  evergreen browsers. Older engines fall back to instant state changes and to the
  previous pending-button behavior; nothing breaks.
- The rail uses `title` for icon-only labels; a positioned flyout tooltip would be
  clipped by the scrolling nav and was not added.
- The new snapshot was recorded on Windows with the same cross-platform tolerance as
  the existing ones; the first Linux CI run confirms it (see the commit status).
- `src.zip` is still tracked (owner decision, unchanged).

## Release safety

- Pushes to `main` run verification only. npm publishing requires the owner to
  run the release workflow manually with `publish: true` (see CONTRIBUTING.md).
- No consumer has been switched to the unpublished version. Consumer trials run
  in throwaway clones in a temp directory; consumer repos are untouched.

## Stage status

| Stage | Status | Evidence |
|---|---|---|
| 1. Package audit | done | `docs/design-system-audit.md` |
| 2. Design tokens | done (verified; no change needed) | 0 undefined tokens, z-index/breakpoint/motion scales, aliases in `tokens/compatibility.css`, `docs/design-token-contract.md`, `docs/layering.md` |
| 3. Theme system | done | Pre-paint bootstrap (`ntAppearanceBootstrapScript`), `updatePreference(partial)`; dark/light/high-contrast × 5 accents already supported; 140 contrast pairs checked |
| 4. Components | done | Audit vs. requested catalog: all present except button group and popover → added. **Site chrome:** header brand/nav/account slots, navbar, account dropdown, mobile drawer, footer |
| 5. Responsive & a11y | done | Header stacking fix, disclosure keyboard contracts, Escape/outside-click/focus-out, focus restore, modal mobile drawer, RTL (logical props + direction-aware arrows), 44px coarse targets, reduced motion, forced colors; `docs/layering.md` |
| 6. QA, tests, docs | done | +5 unit tests (bootstrap parity across 140 cases), +27 browser tests, `check:docs`, `check:api`, `check:package`; docs: components, site-chrome, layering, migration, CONTRIBUTING, README |
| 7. Release preparation | done (release candidate 0.1.0) | CHANGELOG, version 0.1.0, `npm pack` contents verified, clean consumer install, API superset of 0.0.4 |
| 8. Consumer integration | readiness verified; migrations blocked on publish | See "Consumer readiness" |

## Site chrome deliverables (Stages 4–6)

| Requirement | Implementation | Verified by |
|---|---|---|
| Responsive header & footer on tokens | `shell/header.css` additions, `shell/footer.css` (container queries) | `site-chrome.spec.mjs` 320/375/1280px, LTR+RTL |
| Desktop / tablet / mobile | Navbar ≥ 64rem, mobile drawer below; account collapses to avatar < 40rem | desktop/mobile tests, viewport-grow test |
| Dark/light/high contrast, RTL, a11y | Semantic tokens only; logical properties; disclosure pattern | axe in dark, light, high contrast, Arabic RTL with menus open |
| Configurable logos, nav, account, footer, social | Plain markup slots; no routes/URLs/auth in package | `tests/pages/site-chrome.html` working example |
| Dropdown positioning, z-index, keyboard, outside click | Header layer, `--nt-z-dropdown` panels, `ntCreateNavbar`/`ntCreateAccountMenu` | elementFromPoint hit tests over cards; keyboard and dismissal tests |
| Framework independence | Plain DOM controllers with `destroy()`/`refresh()` | `check:architecture`, no framework imports |
| Preserve existing styling | Additive classes; `.nt-header` layer at zero specificity; existing snapshots unchanged | 41 pre-existing browser tests incl. visual snapshots pass |

## Discovered bugs

| Bug | Status |
|---|---|
| CI blocked since 0.0.4 by double-escaped regexes in `tests/brand-palette.test.mjs` | fixed (`38b6f31`) |
| CI would auto-publish to npm on any green push to `main` | fixed (`38b6f31`) |
| Published 0.0.4 exports `NEETECHS_UI_VERSION = '0.0.2'` | fixed (`38b6f31`) |
| Arabic heading test false positive when Noto Sans Arabic is installed | fixed (`38b6f31`) |
| `test-results/` tracked in git | fixed (`38b6f31`) |
| Standalone header dropdowns could render behind positioned/hovered cards | fixed (`d69d0c9`) |
| Theme flash before app bundle runs (no pre-paint bootstrap) | fixed (`03abaf4`) |
| `NtDisclosureController` types had no implementation | fixed (`57ef4a6`) |
| README samples used non-existent classes | fixed (`d69d0c9`) |
| Stale `src.zip` (1.5 MB) tracked in git | open (owner decision; not published) |

## Tests executed (2026-11-15, Windows, Node 24.22, Chromium 149)

| Command | Result |
|---|---|
| `npm test` (7 static contracts, build, `check:docs`, `check:api`, unit) | pass: 117/117 unit |
| `npx playwright test` | pass: 68/68 |
| `npm run check:package` | pass: 0.1.0 tarball 258.9 kB, 370 files, clean consumer install + import |
| `node scripts/check-api.mjs --compare <0.0.4 tarball>` | pass: nothing removed; 83 additions |
| GitHub Actions on `38b6f31`, `d69d0c9`, `57ef4a6`, `3fca265` (ubuntu, full gate incl. Playwright, publish skipped) | pass; npm still at 0.0.4 |
| MyAccount trial: `ng build` ×3, `ng test` ×2 | build pass; tests identical 140/161 on 0.0.4 and 0.1.0 |

## Consumer readiness (Stage 8)

| App | Current | Bridge tokens identical to 0.1.0 | Trial build with 0.1.0 |
|---|---|---|---|
| Neetechs_Myaccount | 0.0.4 | 47 / 47 | `ng build` passes on 0.0.4, on 0.1.0, and on 0.1.0 with the bridge deleted; `ng test` 140/161 on both 0.0.4 and 0.1.0 (identical 21 pre-existing failures) |
| Neetechs_Apply | 0.0.4 | 50 / 51 (keep `--nt-text-label-xs`) | not run |
| Neetechs_Billing | 0.0.4 | 50 / 52 (keep label-xs, review selection border) | not run |
| Neetechs_AI | 0.0.4 | 45 / 49 (4 near-identical deltas) | not run |
| Neetechs_devices | 0.0.4 | no bridge | not run |
| Neetechs_Frontend, Neetechs_Accounts | not consumers | — | — |

### MyAccount trial details (throwaway clone of `d7658b0`, packed 0.1.0 tarball)

- Initial bundle: 1.04 MB (0.0.4) → 1.06 MB (0.1.0, +18.8 kB raw CSS for new modules
  because the app imports the full stylesheet) → 1.06 MB minus 1.8 kB with the bridge
  deleted. The app's 1.00 MB budget warning pre-exists on 0.0.4.
- Tests: the same 21 specs fail on 0.0.4 and 0.1.0 (`NullInjectorError: No provider for
  ActivatedRoute` and similar missing test providers in component specs). Not caused by
  `@neetechs/ui`; recorded as a MyAccount migration issue to fix in that repo.
- Header z-index: MyAccount's last commit hand-fixed an account dropdown z-index; the
  package header layer covers this case once adopted.

### Recorded migration issues

| App | Issue | Owner |
|---|---|---|
| Neetechs_Myaccount | 21 component specs fail from missing test providers (pre-existing) | MyAccount |
| Neetechs_Myaccount | Initial bundle budget (1 MB) already exceeded on 0.0.4 | MyAccount |
| Neetechs_Billing | Local `.site-header` z-index rule duplicates the new package header layer | Billing (remove after upgrade) |
| Neetechs_AI | Own `useTheme` hook writes `data-nt-theme`; consider the shared controller and `updatePreference` | AI |

## Blockers

- **npm publish authorization** (owner): required before any consumer migration.

## Next actions

1. Owner: run the release workflow with `publish: true` to publish 0.1.0.
2. Migrate MyAccount (delete the 47-token bridge), then Billing, Apply, AI, devices.
3. Owner: decide whether to delete `src.zip`.
