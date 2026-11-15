# Neetechs UI upgrade plan

Single progress tracker for the 8-stage `@neetechs/ui` upgrade. Site chrome
(Header, Navbar, Account dropdown, Mobile navigation, Footer) is folded into
Stages 4–6 below; there is no separate plan.

**Current stage:** 1 (in progress)

## Release safety

- Pushes to `main` run verification only. npm publishing requires the owner to
  run the release workflow manually with `publish: true`.
- No consumer is switched to an unpublished version.

## Stage status

| Stage | Status |
|---|---|
| 1. Package audit | in progress |
| 2. Design tokens | pending |
| 3. Theme system | pending |
| 4. Components (incl. site chrome) | pending |
| 5. Responsive & accessibility (incl. site chrome) | pending |
| 6. QA, tests, docs (incl. site chrome) | pending |
| 7. Release preparation | pending |
| 8. Consumer integration | pending |

## Discovered bugs

| Bug | Status |
|---|---|
| CI publish blocked since 0.0.4: double-escaped regexes in `tests/brand-palette.test.mjs` | fixed |
| Published 0.0.4 exports `NEETECHS_UI_VERSION = '0.0.2'` | fixed (generated `src/version.ts`) |
| CI would auto-publish to npm on any green push to `main` | fixed (manual `publish` gate) |
| Arabic heading test false positive when Noto Sans Arabic is installed | fixed (test checks real clipping) |
| `test-results/` artifact tracked in git | fixed (untracked + ignored) |

## Tests executed

| Date | Command | Result |
|---|---|---|
| 2026-11-15 | `npm test` (7 static contracts + build + unit) | pass, 112/112 unit |
| 2026-11-15 | `npx playwright test` | pass, 41/41 |
| 2026-11-15 | `npm run check:package` | pass (221.9 kB, clean consumer install) |

## Commits on `main`

Recorded as stages land.

## Blockers

None so far.
