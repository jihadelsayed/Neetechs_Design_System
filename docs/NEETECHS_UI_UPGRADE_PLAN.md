# Neetechs UI upgrade plan

Single progress tracker for the 8-stage `@neetechs/ui` upgrade. Site chrome
(Header, Navbar, Account dropdown, Mobile navigation, Footer) is part of
Stages 4–6 below; there is no separate plan.

**Current stage:** 8: 0.1.0 published to npm on 2026-11-15 (local `npm publish` by the owner account, tagged `v0.1.0`); consumer migrations can start. MyAccount design adoption is on `main` for the next release (see below).

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
| GitHub Actions on `235e000` (ubuntu) | **failed**: only the new stat-grid snapshot (Linux fallback font wrapped labels at a 1280px viewport; reproduced locally with Verdana) |
| GitHub Actions on `57ebc72` (ubuntu, full gate incl. Playwright and package check; publish skipped) | pass |

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
- The stat-grid snapshot is captured at 1600px so text never wraps under either
  platform's font metrics; it passes on Windows and Linux CI.
- `src.zip` is still tracked (owner decision, unchanged).

## MyAccount Design Adoption (2026-11-15)

Neetechs_Myaccount (Angular, consuming 0.0.4, commit `d7658b0`) was audited as
read-only reference material after the Billing upgrade and the 0.1.0 release:
profile hero and profile page, settings shell, AI settings (provider cards,
connection overview, credit wallet, usage summary), CV library, CV preview and
template picker, Resume Studio, desktop/mobile header, and global styles.
MyAccount was not modified. The work targets the next release: 0.1.0 stays
exactly as published, and every change is additive (verified against the
published tarball).

### Comparison results

| Area | MyAccount | Design System before | Better / result |
|---|---|---|---|
| Profile hero | 96px rounded avatar, name + handle, headline/location with inline "Add …" actions, completion bar, CV call-to-action panel | Avatar up to 4rem, no profile header, no inline text action | **MyAccount** → added `.nt-profile-header`, `.nt-avatar--2xl`, `--editable`, `.nt-button--link`, `.nt-progress--reveal` |
| Section navigation | Card-wrapped nav, completion dots, inline-start bar that grows in, in-page anchors | `.nt-settings-layout` nav with selection fill only | **MyAccount** → enhanced settings-layout nav (bar, status, groups, surface, sticky, `aria-current="location"`) |
| Section cards | Accent edge on core sections, contextual Edit/Manage | Card header with actions | **Combined** → `.nt-card--edge`; actions already covered by `nt-card__actions` |
| Provider / CV cards | Icon tile, badges, status pill, fact tiles, action row; "in use" border; document tile for CVs | None | **MyAccount** (hardcoded colors) → `.nt-resource-card` on tokens, reusing the Billing-derived description list |
| Credit wallet / usage | Large balance with side facts and a threshold warning; 4-up stat grid; breakdown rows | `.nt-stat`, `.nt-stat-grid`, `.nt-description-list` (from Billing) | **DS for stats and breakdowns**; added `.nt-stat--split` for the wallet layout |
| Template picker | Selectable option cards | None (only `.nt-card--selected`) | **MyAccount** → `.nt-choice-card` on native inputs |
| Archived CVs / history | Native `<details>` with ad-hoc styling | None | **MyAccount idea, DS quality** → `.nt-disclosure` (also fits Billing's RUT claims) |
| Resume Studio | Split editor/preview, pane headings, status footer, A4 paper on a grey canvas, horizontal scroll on phones, print-only page | None | **MyAccount** (hardcoded colors) → `.nt-editor-workspace`, `.nt-editor-status`, `.nt-document-preview`, `--nt-document-*` tokens |
| Header nav | Underline that scales in from the center on hover/current | Instant inset bar | **MyAccount** → navbar underline |
| Account dropdown, mobile nav, footer, drawers, toasts | Local re-implementations with a z-index hot-fix | Package versions with keyboard, layering, RTL, and tests | **DS already better**; no change |
| Buttons, forms, badges, alerts, tables | Package classes plus local overrides | Package | **DS already better**; added link button and info badge |
| Motion | Blur fade-ins, pop-in avatar, shimmer sweep, looping pulses (most disabled by MyAccount's own final overrides) | Token-driven motion | **DS**; adopted only the purposeful ones (below) |

### Components improved or added
- **Added:** `.nt-profile-header`, `.nt-resource-card` (+ `-grid`, `-list`), `.nt-editor-workspace`
  / `.nt-editor-pane` / `.nt-editor-status`, `.nt-document-preview`, `.nt-choice-card` /
  `.nt-choice-group`, `.nt-disclosure` / `.nt-disclosure-group`.
- **Improved:** button (`--link`), avatar (`--2xl`, `--editable` + `__overlay`), badge (`--info`),
  card (`--edge`; contrast of muted text on tinted cards), progress (`--reveal`), stat
  (`--split`), alert (tinted description contrast), settings layout navigation, navbar.
- **Tokens:** `--nt-document-canvas`, `--nt-document-paper`, `--nt-document-ink`,
  `--nt-document-ink-muted`, `--nt-document-rule` in dark, light, and high-contrast themes.
- **Billing additions reused, not duplicated:** the credit wallet is `.nt-stat--split` with a
  `.nt-description-list--boxed` aside; resource-card facts use the description list; usage
  metrics use `.nt-stat-grid`; profile sections use `.nt-card--padded`.

### Animations and interaction improvements
- Section-nav current bar grows in (`--nt-ease-emphasized`); in narrow row mode it becomes an
  underline.
- Navbar underline grows from the center: neutral on hover, accent for the current page.
- Avatar "Change" overlay fades in on hover and keyboard focus (always visible on touch).
- Link buttons fade their underline in.
- The completion bar fills from zero on first render without moving the track.
- Choice-card dot or tick grows in; checked cards get a selection ring.
- Disclosure chevron rotates, and the height animates where `::details-content` exists.
- Editor status pulses while saving and pops once when saved. The focused editor pane is
  marked without layout change.
- All of these use the existing duration/easing tokens, have no layout shift, and are
  disabled under `prefers-reduced-motion` (tested).

### Patterns already covered by the Design System
Promotional/next-step panels (card `--muted --padded` with eyebrow/title/subtitle), usage
breakdown rows (`.nt-description-list--inline`), dashed empty states (`.nt-empty-state`),
overflow action menus (`.nt-dropdown`/`ntCreateMenu`), skeletons, toasts, dialogs and drawers,
account dropdown, mobile navigation, footer, quota meters (`.nt-progress`).

### Intentionally excluded
| MyAccount pattern | Reason |
|---|---|
| Blur-in `fadeSlideUp`/`popIn` entrances and staggered card delays | Motion for its own sake; MyAccount's final overrides already disabled them |
| Hover shimmer sweep on profile cards, looping `brandPulse` on the active nav dot | Decorative, distracting, and repeated; no information value |
| Scroll-driven card entrances (`animation-timeline: view()`) | Content should be readable immediately; adds motion without feedback value |
| Radial-gradient hero and nav-card backgrounds, `--brand-rgb` alpha tints | Bridge-era literals; tokens and accent preferences already cover tinting |
| Resume Studio's literal palette (`#0c1523`, `#f97316`, …) and Arial résumé typography | Hardcoded; the résumé's own typography is application content, not design-system chrome |
| `@page` named margins and résumé break rules | Document-specific print rules stay in the application; the pattern provides sheet, margins, page breaks, and print visibility |
| CV upload/processing, wallet API states, provider connection logic | Business logic and services |
| `<details>`-based CV action menu | Replaced by the existing accessible menu/dropdown |

### Tests and compatibility (2026-11-15, Windows, Node 24, Chromium; local after `npm ci`)
| Command | Result |
|---|---|
| `npm test` | pass: 131/131 unit (+7 in `tests/account-patterns.test.mjs`) and all static contracts |
| `npx playwright test` | pass: 117/117 (+24 in `account.spec.mjs`: axe in dark, light, high contrast, and RTL; keyboard, focus, responsive, print, and reduced motion; one new snapshot). All 5 pre-existing snapshots unchanged |
| `npm run check:package` | pass: 299.6 kB packed, 393 files, clean consumer install + import |
| `check-api --compare` against the published `@neetechs/ui@0.1.0` tarball | pass: nothing removed |
| `check-api --update` | +123 additions, 0 removals |
| GitHub Actions `c8247d7`, `4169bc1` (ubuntu) | **failed**: first a real light-theme contrast bug in `.nt-badge--neutral` (fixed in `16ae4f8`), then a timing race in one new test (fixed in `0824ca6`) |
| GitHub Actions `0824ca6` (ubuntu, full gate incl. Playwright and package check; publish skipped) | pass |

Issues found and fixed during testing:
- Profile header overlapped on phones: a container query cannot restyle its own container.
  The root now wraps intrinsically and only descendants use the query; a unit test guards
  against self-referencing queries.
- Profile handle rendered `jamie@` in RTL: switched to `unicode-bidi: plaintext`.
- Light-theme contrast (muted text 4.23–4.34:1) in tinted alerts and muted/tinted cards,
  both predating this work: they now use secondary text.
- Linux CI (`c8247d7`) flagged `.nt-badge--neutral` at 4.34:1 in the light theme (muted
  text on the muted surface); Windows axe had not. The neutral badge and the base/draft
  `.nt-billing-status` now use the `--nt-neutral-*` tone roles (`fix(badge)` commit).
- The profile snapshot's height varied with platform font metrics (246px vs 267px). The
  snapshot pins a metric-compatible stack (`"Liberation Sans", Arial`).

### Remaining issues
- `.nt-settings-layout` (from before 0.1.0) also queries its own container; its `@media`
  fallback keeps it working at viewport level, but inside narrow panes on wide screens the
  nav does not switch to row mode. Fixing it needs a wrapper or a layout change, which is a
  breaking markup change; left for a deliberate decision.
- `::details-content` height animation and `@starting-style` progress reveal need current
  evergreen browsers. Others open instantly or show the final width; nothing breaks.
- The light theme's `--nt-text-muted` reaches 4.5:1 only on white. Components were fixed
  case by case; a token-level adjustment would be a visible theme change for every consumer.
- `.nt-mobile-only` utility specificity (see the Billing section) and the tracked `src.zip`
  are unchanged.
- One local run failed `actions-overlays.spec.mjs` "pass axe (high contrast)" once (it
  predates this work and its page has no changed components); 15 repeated runs and the
  following full run passed. Treated as an intermittent flake; not changed.
- The package version stays 0.1.0 in `package.json`. The release workflow (semantic-release)
  will compute the next version from these `feat` commits (0.2.0) when the owner runs it;
  nothing was published.

### Commits
`7a56e6f`, `e55c051`, `bb4514a`, `cde3c92`, `997c183`, `896dafd`, `7a73f3c`, `c8247d7`
(docs), `16ae4f8` (neutral badge contrast), `4169bc1` (docs), `0824ca6` (test race fix), and
the documentation commit recording these CI results.

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

- None. 0.1.0 was published on 2026-11-15 at the owner's request.

## Next actions

1. Migrate MyAccount (delete the 47-token bridge), then Billing, Apply, AI, devices.
2. Owner: decide whether to delete `src.zip`.
