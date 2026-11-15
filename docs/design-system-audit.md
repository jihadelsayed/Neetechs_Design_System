# Design system audit — `@neetechs/ui` (Stage 1)

Audit date: 2026-11-15. Scope: this repository at `c07e6ed` (start of the
upgrade), the published `0.0.4` tarball, and the consumer repositories on this
machine. It supersedes nothing: [design-system-baseline-audit.md](./design-system-baseline-audit.md)
(2026-07-13) records the earlier state and most of its findings have since been
resolved. Progress is tracked in [NEETECHS_UI_UPGRADE_PLAN.md](./NEETECHS_UI_UPGRADE_PLAN.md).

## 1. Summary

`@neetechs/ui` is a mature, CSS-first, framework-free package: 96 CSS files
(shell, components, patterns, AI, domain), 14 behavior modules, and a tested
SSR-safe appearance controller, guarded by 7 static contract checkers, 112 node
tests (one test file failed to load, see #1), and 41 Playwright tests (axe,
RTL, responsive, visual snapshots). The
architecture was sound. The real problems were in **release engineering**:

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | CI failed at the unit-test step on every push since 0.0.4 (double-escaped regex literals in `tests/brand-palette.test.mjs`), so the navy palette (`feat`) and focus-ring fix (`fix`) were never released. Consumers carry hand-copied "bridges" for it. | High | Fixed |
| 2 | The release workflow published to npm automatically on any green push to `main`. Fixing #1 would have published without owner approval. | High | Fixed: manual `publish` gate |
| 3 | Published `0.0.4` exports `NEETECHS_UI_VERSION = '0.0.2'` (constant never bumped by semantic-release). | Medium | Fixed: generated `src/version.ts` + `prepack` build |
| 4 | Standalone `.nt-header` (no app shell) was unpositioned while its `backdrop-filter` created a stacking context, so header dropdowns could render behind positioned or hovered cards (MyAccount carried a local fix: "account dropdown z-index over Resume Studio"). | Medium | Fixed in package |
| 5 | No pre-paint appearance bootstrap; client-rendered apps could flash the wrong theme before the bundle ran. | Medium | Fixed: `ntAppearanceBootstrapScript()` |
| 6 | `AppearanceController.setPreference` requires a full preference; a light/dark toggle in an app could reset accent/density if written carelessly. | Low | Fixed: `updatePreference(partial)` |
| 7 | `NtDisclosureOptions`/`NtDisclosureController` types exported with no implementation. | Low | Fixed: `ntCreatePopover` implements them |
| 8 | Three README samples used non-existent classes (`nt-field__hint`, `nt-field--error`, `nt-shell-main`). | Low | Fixed; `check:docs` now enforces |
| 9 | `test-results/.last-run.json` tracked in git. | Low | Fixed (ignored) |
| 10 | `src.zip` (1.5 MB, 841 files, stale copy of `src`) is tracked in git. Not published (excluded by `files`). | Low | Open: owner decision to delete |
| 11 | No reusable site header navigation, footer, account dropdown controller, or standalone mobile drawer for websites. | Feature gap | Added (Stage 4) |
| 12 | No plain button group or non-menu popover. | Feature gap | Added (Stage 4) |

## 2. Architecture and exports

- ESM only, `"type": "module"`, zero runtime dependencies. `sideEffects` marks CSS only.
- CSS is shipped from `src/` and also copied to `dist/`; entry files are `@import`
  graphs that consumer bundlers (Angular CLI, Vite, webpack) inline at build time.
  All 36 export keys and 100 CSS files are verified by `check:package` and `check:api`.
- JS entries: `.`, `./appearance`, `./behaviors`, `./behaviors/*`, `./localization`,
  `./types`. TypeScript declarations ship for every entry (`strict`,
  `exactOptionalPropertyTypes`).
- Layers: `styles/` (tokens, themes, appearance selectors, reset, base, utilities),
  `shell/`, `components/`, `patterns/`, `ai/`, `domain/` (calendar, billing,
  companies). Domain modules are scoped to their own directory and export path.

## 3. Tokens, themes, and appearance

- Three-layer tokens (primitive → semantic → component) with deprecated aliases
  in `tokens/compatibility.css`; `check:tokens` reports 0 undefined tokens and 0
  internal uses of deprecated aliases.
- Complete scales: color roles, typography (composite `font` shorthands), spacing,
  radius roles, elevation, motion, breakpoints (documentation contract mirrored
  by `NT_VIEWPORTS`), z-index (12 named layers).
- Root-attribute contract: `data-nt-theme`, `data-nt-theme-preference`,
  `data-nt-accent` (blue, orange, green, purple, neutral), `data-nt-density`,
  `data-nt-contrast`, `data-nt-motion`; system color scheme, contrast, forced
  colors, and reduced motion are honoured. Cookie (`nt_theme`, cross-subdomain)
  and local cache provide startup hints; the backend remains the source of truth.
- `check:a11y` verifies 140 contrast pairs across themes and accents.

## 4. Components and duplication

- Canonical overlays: dialog (modal is an alias), drawer (`right-drawer` alias),
  menu/dropdown on one popover foundation; workspace switcher aliases company
  switcher. `check:architecture` keeps 3 compatibility exports pointing at
  canonical files and prevents re-copying retired implementations.
- Table (read-only) and data grid (interactive) are intentionally distinct, as
  are badge (informational) and chip (interactive).
- No conflicting selectors found: every block is BEM-namespaced `nt-`.

## 5. Framework compatibility

- Angular (current consumers, v20): CSS via `styles.scss` `@import`, behaviors via
  `@neetechs/ui/behaviors` in components (Billing overlays, devices header/drawer),
  appearance via `bootstrapNeetechsTheme` in `main.ts` (devices).
- React: `Neetechs_AI` (Vite/React) consumes tokens and the `data-nt-theme`
  convention. Controllers are plain DOM functions that fit `useEffect`
  cleanups. No framework code exists in the package.

## 6. Accessibility and responsive

Already strong: focus-visible ring tokens, 44px primary targets, coarse-pointer
upgrades, reduced-motion blocks, forced-colors support, logical properties
(`check:rtl`), container-query components (`check:responsive`), Arabic
typography adjustments. Gaps found and fixed are #4–#6 above, plus site chrome
(navbar, account, mobile drawer, footer) with full keyboard and dismissal contracts.

## 7. Versioning

- Published: 0.0.1–0.0.4 (2026-06-26 → 2026-07-14). Tags `v0.0.2`–`v0.0.4`.
- Unreleased since 0.0.4: one `feat`, one `fix` → semantic-release will compute
  **0.1.0** (minor on 0.x). The repo `package.json` now states `0.1.0` so the
  build, `NEETECHS_UI_VERSION`, and tarball agree before publishing.
- Stay on `0.x` until the four real-application migrations in `todo.txt` succeed.

## 8. Consumers

| Repository | Uses `@neetechs/ui` | Version | Integration |
|---|---|---|---|
| `Neetechs_Myaccount` (top-level checkout) | yes | 0.0.4 | `styles.scss` import + 47-token navy bridge + `--brand-rgb` |
| `Neetechs_Apply` | yes | 0.0.4 | `styles.scss` import + 51-token bridge |
| `Neetechs_Billing` | yes | 0.0.4 | import, 52-token bridge, `ntCreateFocusTrap`/`ntLockScroll` |
| `Neetechs_AI` (React) | yes | 0.0.4 | 49-token bridge in `brand-theme.css`, own `useTheme` on `data-nt-theme` |
| `Neetechs_devices` | yes | 0.0.4 | import, appearance bootstrap/controller, dialog/drawer behaviors |
| `Neetechs/Neetechs_Frontend` | **no** | — | Own styling; adoption would be a new integration |
| `Neetechs/Neetechs_Accounts` | **no** | — | Own styling; adoption would be a new integration |
| `Neetechs/Neetechs_Myaccount` (nested checkout) | **no** | — | Older checkout; the top-level `Neetechs_Myaccount` is the consumer |

Bridge analysis (browser-computed, Stage 8) is in [migration.md](./migration.md#upgrading-consumers-from-004-to-010).

## 9. Recommendations (all implemented unless noted)

1. Gate publishing behind explicit approval; keep full verification on every push.
2. Generate the runtime version constant from `package.json`.
3. Add automated checks for docs accuracy (`check:docs`), public API stability
   against a baseline and against 0.0.4 (`check:api`), and the packed tarball in a
   clean consumer (`check:package`).
4. Provide site chrome components so apps stop rebuilding headers, menus, and footers.
5. After publishing 0.1.0, delete consumer palette bridges (MyAccount first).
6. Owner decision: delete the stale tracked `src.zip`.
