# Unified header — final preparation ledger (2026-11-27)

Status: 100-step roadmap reviewed, **implementation and rollout incomplete**. This ledger records source/test evidence and outstanding gates, not a release sign-off.

## Changes on main

| Repository | Recorded commit | Scope |
|---|---|---|
| Design System | 788d0b4f58a51276b3ca9d793cdb3f3e76a40acd | Shared source, framework reference adapters, migration inventories, audit helper and browser tests |
| MyAccount | fb3b75a80b4cdc88614ba463cc2bcdd87a74754c | Pure host mapper, staged adapter and shell rules, tests and cutover checklist |
| Tools | b87f446833cbdb1b6284544f946bcc2a6dca4a77 | Inactive role-aware React candidate |
| Phone | 2beb8f768b57f0d249191a4765ca037757c738df | Inactive workspace route classifier |

Source version 0.3.0 in the design system manifest/lockfile/generated version; actual published npm availability unverified. MyAccount still declares 0.2.0. No package published, no live header cutover, no deployment verified, no Actions used. Other consumer work is source audit only.

## 96 — Duplicate global headers

Audit source ownership in the three consumer migration inventories. Do not count page-level headings, profile hero, print/document headers or legitimate workspace controls as duplicate global headers. Phone currently has a root layout route mismatch that can cause duplicates. Apply, Calendar, Vault, Agent and Neenee require explicit workspace ownership decisions. On each actual route use the browser audit below with app-specific legacy selectors, and also check visible headers and nested overlay/scroll locks manually. No production route crawl performed.

## 97 — Authentication and routing

For each real consumer in an isolated test environment, verify initial loading (no cached identity or guest flash), guest login/signup, successful callback and localized return URL, authenticated identity, logout and subsequent guest state, session expiration, refresh/error, staff/role changes and forbidden route guards. Verify cross-domain settings/profile/products, same-origin router links, modifier clicks, query/hash and locale preservation. Test using test accounts and existing auth services; do not log tokens, cookies, personal data or account URLs with sensitive query values. Never treat header visibility as authorization. Existing MyAccount logout endpoint concern, unsupported locales and Data/Policies legacy auth remain open. No live cross-domain login test performed.

## 98 — Visual consistency

Capture desktop and mobile screenshots on each actual app with the same shared version; compare brand, height, typography, spacing, accent/theme, menu states, focus and drawer layering. Exercise 320/390/768/980/1024/1025/1280/1440 px, RTL, zoom, high contrast/forced colors, keyboard and touch. Respect app-specific actions and explicit exclusions. Compare the same viewport, theme, locale and auth state; do not force identical workspace layouts. No consumer screenshot sign-off performed.

## 99 — Automated anti-drift audit

Copy docs/integrations/header-audit.mjs into a consumer test directory, or import from a verified local copy. The function is browser-serializable and reports only counts and problem codes; it does not read or return identity text, URLs or tokens.

```js
import { expect, test } from '@playwright/test';
import { auditGlobalHeader } from './header-audit.mjs';

test('one shared global header', async ({ page }) => {
  await page.goto('/');
  // Wait for the actual app's auth/route readiness before checking.
  await page.locator('[data-nt-header]').waitFor();
  const result = await page.evaluate(auditGlobalHeader, {
    expectedCount: 1,
    legacySelectors: ['.legacy-global-header'],
  });
  expect(result).toEqual({ count: 1, unifiedCount: 1, problems: [] });
});
```

Use exact legacy global-header selectors for each consumer, not every header element. For explicitly excluded routes, expect count 0; for specialized retained workspace topbars, specify their real selector and the expected unifiedCount separately. The helper checks DOM count (including hidden duplicates), relevant ID uniqueness, ARIA references, drawer parts, header overflow and configured required item IDs/forbidden action IDs. It cannot detect unmarked legacy headers without selectors, test route authorization, prove visibility/focus behavior, or verify visual parity. Add app-specific interaction and screenshot assertions.

The exact helper blob d89cb7cd38e47dea9c1586bf4049b0f189e17b8a (2ec70d7) passed nine isolated cases in Chromium 144.0.7559.96 via Python Playwright: one global with page heading, document exclusion, duplicate legacy header, duplicate ID, missing drawer, forbidden action, missing item, overflow, and missing drawer-root ARIA reference. Integrated the same cases and one actual shared fixture test into the repository Playwright suite (788d0b4). That full suite has not run in this environment.

## 100 — Release blockers and next execution order

1. Complete repository inventory (Tracker and any newly discovered frontends) and baseline/route audit.
2. Obtain actual full checkout and dependencies; local GitHub DNS still fails. Run package unit/API/type/docs/build, full Playwright and clean tarball consumer checks. Fix failures before counting test gates.
3. Test and activate MyAccount in a disposable main checkout; verify login/logout, shell, locale, SSR, desktop/mobile, CV and overlays. Keep legacy components until parity.
4. Confirm version availability, manually publish the verified tarball, install exact version in MyAccount and deploy only when approved.
5. Migrate remaining consumers in waves; validate older Angular 14/15 and Angular 21 adapters, preserve workspace headers and auth-only exclusions, and run the anti-drift audit with real selectors.
6. Record real per-app commit, installed package version, test counts, screenshot evidence, release/deploy status and rollback reference. Do not mark steps 96–98 or final deployment report complete until actual results exist.

Start from the design-system main checkout with:

```bash
git switch main
git pull --ff-only
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run check:package
```

Stop on failure; no publish or deploy commands are in this gate. See unified-header-release.md for the manual release sequence. 
