# Consumer migration wave 1 (81–85)

Preparation only. The shared package and MyAccount pilot are still gated; do not install, replace, or deploy consumers based on this document. All baselines below were read from main. Versions are manifest declarations, not proof of the installed package.

| Application | Framework | @neetechs/ui | Global host |
|---|---|---|---|
| Frontend | Angular 20.1 | 0.2.0 | src/app/layouts/header/header.component.ts |
| Apply | Angular 20.1 | ^0.3.0 | same header inside workspace topbar |
| Accounts | Angular 20.1 | not declared | router-outlet only |
| Billing | Angular 20.1 | 0.2.0 | same header inside nt-app-shell |
| Tools | React 18.3, Router 6.30 | 0.2.0 | src/app/AppLayout.tsx |

Frontend, Apply and Billing have identical legacy header wrapper blob 5b3cf48c898fcdb830cad9408000a9f7c271ddc6. Reuse the tested Angular adapter, not a second implementation. Keep each application's distinct state/route adapter.

## 81 — Frontend (neetechs.com)

- Home brand is an internal router link. Map menu-data.ts, preserving localized translation IDs and order: /tools, /apps, /digital-products, /company. Resolve browser href via Angular Location.prepareExternalUrl and dispatch the original router path on accepted internal navigation; do not replace these with external ecosystem URLs.
- Desktop uses AuthStore, ThemeStore, RuntimeConfigService, LogoutService and SiteLanguageSwitcherComponent. Identity picture field is picture, not picture_tag. Preserve the display-name expression and fallback image. Loading is distinct from guest.
- Preserve cross-domain MyAccount and My Products URLs, existing local settingsPath() router behavior and locale-aware account login/signup return URL. Confirm actual settings route before activation. Inspect mobile variant parity rather than assume identical services.
- Preserve app-core-shell initialization, footer, router outlet, scroll-to-top and active navigation. Confirm sticky wrapper and real translated builds.
- Sources: app.component.html 8cb0573c3f3885540defecb98e444c7c5af23950, desktop header TS 898e8cac55a1bfe5bc36fe7ab3d708fdb6a5f5cf, desktop template ada0ab31c0ab7ff2e66bccfe60019472c5a46bf0, menu-data 13913e70835e362ef4b99827d385146604c72639.

## 82 — Apply (apply.neetechs.com)

- Shell owns a separate Apply sidebar and an explicit data-apply-sidebar-toggle with aria-expanded. Desktop header template explicitly states workspace navigation is rendered elsewhere; never copy the old menu-data Home/Dashboard/Applications into a second visible desktop menu.
- Preserve sidebar behavior, glass/cutout mode, dock-tablet breakpoint, local brand route, and all workspace functionality. Use embedded or standard header presentation after verifying shell layout; do not introduce nested sticky positioning or a second competing mobile drawer. If shared drawer cannot coexist with workspace off-canvas control, resolve this in the shared contract before cutover.
- Map AppLocaleService and applyText labels; keep languageHref() behavior and duplicate-hosting-locale canonicalization with query/hash. AuthStore, ThemeStore, LogoutService and RuntimeConfigService stay authoritative. Avatar is picture_tag. MyAccount settings/products remain external.
- Preserve the CV preview exclusion, skip link, right drawer, footer, and shell scroll controls. Test job search, application navigation and workspace sidebar at desktop/tablet/phone; no agent, extension, backend or job workflow changes.
- Sources: app.component.html 86ffc53e423291d548ef5137c03e60d2fb7e9c02, desktop TS a72029eb24ec83aa9b5038398c63b750eb64170c, template 9bc746ff9ff969a0319f8c6c2f88577ccd223939, menu-data 5522844f436488a20cca956ed14919dc30569def.

## 83 — Accounts (accounts.neetechs.com)

- No global header in root template. The root initializes CSRF and renders only RouterOutlet. Keep login, signIn, signup, logout, getCredential, auth/google, reset-password aliases, verify-email aliases and error pages auth-only. Do not add a global account dropdown or trigger extra session calls to match visual appearance.
- This is an explicit exclusion candidate, not a completed migration. Review the auth page brand and local styling separately if needed. Verify return URLs, callbacks, CSRF and direct routes without introducing the header.
- Sources: root template 79be59ce69afbb8c5d28961a7f3323c32858e54a, root TS dc0cd1b8c7f4de4c6a2fabdafd698a9ee2b88eb1, routes e87e0d9d6103f98a4ef90b706c1197c725cd58fb.

## 84 — Billing (billing.neetechs.com)

- Preserve external brand https://neetechs.com and existing Tools, Products, Company links (external ecosystem helper is suitable). Do not introduce a duplicate Billing entry unless desired. Preserve AuthStore, ThemeStore, LogoutService, RuntimeConfigService, LanguageService and picture_tag fallback. Settings and My Products are external localized MyAccount links; keep exact host rules.
- Existing app-header is itself the nt-app-shell__header. Verify shell height, sticky ownership and overlay stacking before using the embedded mode; preserve root skip link, footer, right drawer, CV preview condition and all payment/billing pages. No financial or backend logic changes.
- Sources: app.component.html 7b1b1183bd7dd024fe5e41f27b790e2abb176fcd, desktop TS 24955aacb874d6dfd0694f8384aba8e26d0b08eb, template b60884c5304b7350ff021dd0d99e96292c6edbb8, menu-data dcd7ac74e3cf2f5bbad07e33405b3c7aeb188827.

## 85 — Tools (tools.neetechs.com)

- Replace only AppLayout header after pilot. Keep skip link, Outlet, footer, route guards and auth provider. Use React reference adapter, useNavigate, useLocation, userDisplayName, userAvatarUrl and userIsStaff.
- Explore /tools is public. Create Tool /create, My Tools /my-tools, Favorites /favorites, Developer Settings /settings/developer are authenticated. Reviews /admin/reviews is staff-only. Preserve guard and API authorization regardless of menu visibility. Keep existing external profile link until verified separately.
- AuthProvider has loading, authenticated, unauthenticated, error, and independent loading/refresh/error flags. Do not expose cached/stale identity while initial auth is loading; define refresh/error recovery with provider semantics before cutover. Delegate signIn/signOut; do not create auth logic in renderer. Keep /sign-in and /auth/callback outside AppLayout as current routes require.
- No theme, locale, billing or notification provider verified in this layout: omit new controls unless separately integrated.
- Sources: AppLayout 52edf3b818675b71e40f1db8d86b710e6050bb78, router 78b2dc6b8264cbb95a764e93b5a9c3651ce68bcd, AuthProvider 34e89f78df3d8b8681c4c33f52d94f8e0576df2e.

## Gate for each application

Re-read main and capture commit/dependency lockfile before editing. Run baseline tests; install only the validated package version. Apply one host adapter, not copied markup, and preserve the legacy header until regression parity. Verify role/auth/route behavior, localized links, responsive layouts, keyboard, touch, overlays, actual framework build and SSR where applicable. Tools has npm run validate; Angular consumers use their existing test/build scripts. Record actual results before marking a migration step done. Use no Actions, new branches, speculative package changes or deployments. 
