# Neetechs UI upgrade plan

Single progress tracker for the 8-stage `@neetechs/ui` upgrade. Site chrome
(Header, Navbar, Account dropdown, Mobile navigation, Footer) is part of
Stages 4–6 below; there is no separate plan.

**Current stage:** 8: consumer readiness verified; awaiting owner approval to publish 0.1.0.

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
