# Neetechs unified global header — 100-step roadmap

Status: Phase 1 remains open; Phase 2 in progress (45/100 completed at source-implementation level; host sign-out, preferences, notification summary and mobile drawer parity implemented; full package and framework verification pending).
Updated: 2026-11-27. Work on existing main branches only. MyAccount is the pilot.

## Scope and safety gates

Reuse @neetechs/ui site chrome and behavior controllers rather than rebuilding them. Centralize actual markup, interaction and styling, with app-provided state, route/action callbacks and optional features. Keep framework independence and SSR support. Do not move auth, permissions, API calls or locale routing into the generic UI layer. Keep a single responsive global header; page headers, chat headers, workspace toolbars and intentionally headerless screens are not duplicates. No Django changes, branches, GitHub Actions or unrelated refactors. Do not publish or deploy an untested change. Each app migration requires build and relevant browser/regression tests, with rollback to the previous version if necessary.

## Initial audit (main)

| Repository | Declared @neetechs/ui | Framework | Header observation |
| --- | --- | --- | --- |
| Neetechs_Design_System | 0.3.0 (package itself) | Framework independent | Existing header CSS, navbar/account/mobile drawer behaviors; markup supplied by each app |
| Neetechs_Myaccount | 0.2.0 | Angular 20 | Separate desktop/mobile components |
| Neetechs_Frontend | 0.2.0 | Angular 20 | Separate desktop/mobile components |
| Neetechs_Apply | ^0.3.0 | Angular 20 | Separate desktop/mobile components with nt-header wrapper |
| Neetechs_Billing | 0.2.0 | Angular 20 | Separate desktop/mobile components with nt-header wrapper |
| Neetechs_Companies | 0.2.0 | Angular 20 | Separate desktop/mobile components |
| Neetechs_Calendar | 0.2.0 | Angular 20 | Separate desktop/mobile components |
| Neetechs_Phone | 0.2.0 | Angular 20 | Separate desktop/mobile components |
| Neetechs_ticket | 0.2.0 | Angular 20 | Separate desktop/mobile components |
| Neetechs_Proof | 0.2.0 | Angular 20 | Separate desktop/mobile components |
| Neetechs_BrandKit | 0.2.0 | Angular 20 | Product-specific nt-header |
| Neetechs_Boost | 0.2.0 | Angular 20 | App-specific nt-header |
| Neetechs_devices | 0.2.0 | Angular 20 | Product-specific nt-header |
| Neetechs_Accounts | Not declared | Angular 20 | Auth shell needs further review |
| Neetechs_Resume | 0.2.0 | Angular 15 | src/app/header/header.component.html |
| Neetechs_Data | 0.2.0 | Angular 14 | src/app/header/header.component.html and user menus |
| Neetechs_Vault | 0.2.0 | Angular 20 | Vault shell candidate |
| Neetechs_Agent | 0.2.0 | Angular 20 | Agent shell candidate |
| Neetechs_DaySlice | 0.2.0 | Angular 21 | Planner shell candidate |
| Neetechs_Policies | Not declared | Angular 14 | Global header presence unconfirmed |
| Neetechs_Tools | 0.2.0 | React 18 | AppLayout candidate |
| Neetechs_AI | 0.2.0 | React 18 | ChatHeader is not necessarily global chrome |

Versions are declared dependencies from package.json, not installed lockfile resolutions or npm registry verification. Tracker, Restaurant, legacy React/MVC, native mobile, desktop agent and extension projects require separate classification. Do not force web markup into native applications. Full repository activity and lockfile inventory remain open.

## MyAccount baseline and non-regression contract

- src/app/layouts/header/header.component.ts selects desktop or mobile at <=640px and adds a fixed sticky state after scrolling >180px; shared CSS uses a 64rem nav breakpoint. Reconcile intentionally rather than changing silently.
- desktop-header and mobile-header duplicate AuthStore display-name logic, LogoutService calls, ThemeStore toggling, LanguageService login redirects and localized paths. Desktop also uses RuntimeConfigService and avatar fallback.
- Preserve guest Login/Sign Up, returnUrl, authenticated My Profile/My Account, My Products, Settings (/settings/profile-privacy), theme toggle and Logout. Preserve auth readiness checks, avatar fallback, routing and environment-aware domains. Do not invent new auth behavior.
- Existing menu-data.ts lists Tools (https://neetechs.com/tools), Products (https://neetechs.com/digital-products), Company (https://neetechs.com/company). Preserve existing links; evaluate Billing and other proposed additions separately.
- app.component.html explicitly omits global header/footer for CV document preview; preserve skip link, main landmark, right drawer, footer, and back-to-top functionality.
- ThemeStore currently supports light/dark only and preserves accent/density. LanguageService currently handles English, Swedish and Arabic; app localization routing must be checked before extending supported choices.
- Existing header SCSS has local layering fixes. Verify Resume Studio and right drawer stacking before removing them. Preserve app-specific sidebar and page headers.
- Design system reference: docs/site-chrome.md, src/shell/header/header.css, src/behaviors/navigation.ts and src/behaviors/index.ts. Existing navbar, account menu and mobile drawer already cover keyboard, focus and dismissal behavior. No global component renderer yet verified.


## Detailed comparison — pilot and priority apps

| App | Brand destination | Primary navigation | Account/localization differences |
| --- | --- | --- | --- |
| MyAccount | neetechs.com | External Tools, Products, Company | Local settings route without locale prefix (Angular base href); normalized returnUrl; picture_tag; light/dark |
| Frontend | Angular router home | Internal /tools, /apps, /digital-products, /company | SiteLanguageSwitcherComponent in both variants; $localize keys; picture; preserve routerLink and active state |
| Apply | Angular router home | Internal /, /dashboard, /applications and external neetechs.com | AppLocaleService, applyText and languageHref; preserve path/query/hash and locale prefixes; cross-domain account settings; separate Apply sidebar |
| Billing | neetechs.com | External Tools, Products, Company | Cross-domain localized account settings; picture_tag; RuntimeConfigService host on desktop |

All four duplicate account name fallbacks, sign-in/sign-up redirects, guest/authenticated branches, sign-out, theme toggle, and mobile/desktop menu state. CSS files repeat account avatar, brand, navigation, menu, hamburger and drawer styles. MyAccount has approximately 744 lines of local header SCSS (70 + 297 + 377 as returned by source line splitting); remove only after equivalent behavior is tested. Frontend, Apply and Billing have their own related SCSS files; shared tokens alone do not eliminate duplication.

## Additional application observations

- Companies: Company Center brand and internal dashboard/companies/create-company routes; existing i18n labels and route-active handling.
- Calendar, Phone, Ticket, Proof: separate desktop/mobile variants. Proof has localized labels and product routes; Ticket has explicit trigger/panel focus and hidden state.
- BrandKit, Boost, Devices: existing product-specific single headers; retain subtitles, loading state, workspace links and mobile drawer behavior through adapters.
- Data: header includes its own notification and user menu components; expose extension points rather than replacing their domain behavior.
- Tools: React AppLayout; Explore, Create Tool, My Tools, Favorites, developer settings and staff-only Reviews; retain React Router and authorization filtering.
- Vault: workspace shell header with sidebar toggle and secure workspace identity; adapt existing shell rather than add another topbar.
- Agent: workspace topbar includes company name, workspace selector, sidebar toggle and logout.
- DaySlice: planner topbar has product-specific actions and print-hidden behavior; preserve planner tools and print layout.
- Resume: public profile hero navigation uses section anchors and conditional Experience, Work, Publications, Contact links. Treat as a public profile variant, not as a logged-in dashboard.
- AI: ChatHeader owns sidebar toggle, company/model selectors and account action; do not replace chat functionality or force a second global header.
- Accounts: authentication-only routes require explicit exclusion review; do not introduce a global account menu into login/signup without a justified requirement.
- Policies, Tracker, Restaurant, legacy projects and full native/extension scope remain open pending further inventory.

## Architecture decision and proposed public API

Use a framework-independent renderer plus the existing navigation controllers in the design system. Do not create separate copies of markup in Angular and React. Proposed source path: src/shell/header/unified-header.ts, with adjacent types and tests. Keep existing CSS exports and behavior contracts backward compatible. Export the new API from the existing package root after implementation and checks; do not introduce a mandatory framework dependency.

- Proposed API: ntRenderHeader(config) returns deterministic escaped markup for SSR; ntMountHeader(root, config, options) attaches or mounts the same markup and returns a controller with update(config), closeMenus(), and destroy(). Exact signatures may evolve during implementation and tests. No document/window access at module import. Use caller-provided stable instance IDs (unique within the page) for SSR/ARIA consistency. Hydrate existing compatible markup instead of recreating it unnecessarily.
- Configuration: brand {label, href, logoUrl?, appName?, subtitle?}, navigation items (stable id, localized label, href or action, current/disabled, optional grouped children), account as a discriminated loading/guest/authenticated state, localized accessibility labels, optional appearance/language/app-switcher/notification/actions, sticky/embedded presentation and app-owned workspace slots. No embedded auth token, network request, permissions checks, or app-router dependency.
- Link contract: preserve real hrefs, fragment links, modified clicks, external navigation and keyboard activation. Adapters may intercept only unmodified supported internal links through a supplied navigation handler. Application decides the active route and permitted menu items. Do not put authorization decisions in the UI registry.
- Account/actions: adapters provide login/signup/logout/settings/theme/locale handlers or links; no hardcoded returnUrl, runtime host or locale normalization in the renderer. State updates must remove stale authenticated identity immediately on sign-out. Support avatar error fallback without error loops. Loading is distinct from guest.
- Ecosystem registry: separate optional Neetechs link configuration from generic header rendering. Existing links are the baseline. New Billing/app switcher/language/notification features require verified route or provider support; hide unsupported controls, not fake them. Preserve existing app-specific destinations and role filtering.
- Behavior: reuse ntCreateNavbar, ntCreateAccountMenu and ntCreateMobileNav. Coordinate menus, use shared breakpoint and layering tokens, preserve escape/outside click/focus restoration, ensure mobile drawer is not clipped by a backdrop-filter stacking context, destroy listeners and overlays on teardown.
- Security: escape all text/attributes in SSR; validate allowed href and image URL schemes (no javascript or executable data URLs); no unsanitized HTML configuration. Extension slots are trusted application-owned nodes/components, not arbitrary HTML strings. No authentication/authorization changes.
- Compatibility: Angular 14/15/20/21, React 18 and plain HTML consumers must be validated. Thin adapters keep their own lifecycle, router, state and localization integrations; no framework-specific imports in the generic package. Existing public API gate allows additive exports.
- MyAccount pilot acceptance: header remains absent for CV preview; one responsive global header; preserve existing auth and route behavior, settings, theme, profile/avatar fallback, overlay stacking, skip link, footer, right drawer and application content. Test guest/loading/authenticated, logout, localized paths, mobile/desktop/RTL, keyboard and Resume Studio before deleting old code.
- Release acceptance: run design-system test/build/browser/API/package gates and local package integration with MyAccount before manual npm publication. No app deployments until the published package and lockfiles are verified.

## Progress and evidence

Audit reads performed directly on GitHub main. Steps checked below refer only to source inspection. No local clone, npm build, browser test, publication or deployment was performed. Steps 1–2 remain open because local synchronization and exhaustive active-app classification are not verified. Step 3 covers the initial declared dependency matrix; lockfile/install verification remains a release prerequisite. Steps 7–9, 11, 14 and 15 now have source comparison and architecture evidence. Steps 10 and 13 remain open because the remaining-app audit and full route inventory are not exhaustive; verify each migration independently. Step 12 records MyAccount auth dependencies; verify each app's adapter during migration.


### Phase 2 — typed contract (2026-11-27)

- Added `src/shell/header/unified-header.types.ts` (commit 22a958e), creating the implementation location alongside header.css. Link/action/group discriminated unions, loading/guest/authenticated account state, localized labels, brand, appearance/language choices, app switcher, optional actions, presentation and direction are defined without framework dependencies.
- Added `tests/types/unified-header.test.ts` (commit 00a9566), covering valid configuration and four expected compile failures; exposed the types through the package root (commit 4cdffb3). This is additive and does not change runtime exports.
- Isolated TypeScript 5.8.3 compilation passed with strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, isolatedModules and verbatimModuleSyntax, ES2022/DOM and Bundler resolution. The two tested source files match GitHub blob hashes a5305c2eef2d15f4bbc8fe8d936d66006cfb8bb7 and 5a4bdf5b3d449a89fb87692ecbe2935ab7fc69c6. Run locally from repository root: `npx tsc --noEmit --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --isolatedModules --verbatimModuleSyntax --module ESNext --moduleResolution Bundler --target ES2022 --lib ES2022,DOM,DOM.Iterable tests/types/unified-header.test.ts`.
- The type fixture is not yet wired into the package's default test script. Step 51 remains open for comprehensive public API testing. URL validation, escaping, lifecycle, extension slots, notification integration and all runtime behavior are pending. The full repository cannot be cloned in the current execution environment (GitHub DNS unavailable), so no full build, package tests, publication or deployment is claimed.
- Next: implement the framework-independent renderer and runtime tests, preserving the existing CSS and behavior controllers. Keep remaining audit steps open until verified.


### Phase 2 — pure markup renderer (2026-11-27)

- Added `src/shell/header/unified-header.ts` (376a0ce), implementing `ntRenderHeader(config)`: one semantic header with shared site-chrome CSS, navigation groups, separate mobile drawer markup, branding, loading/guest/authenticated account views, optional appearance/language/app switcher/actions, sticky/embedded variants and direction.
- Renderer escapes text and attributes, rejects executable and protocol-relative URL schemes, uses deterministic IDs and has no DOM access. The drawer and backdrop are siblings of the header, not inside its backdrop-filter stacking context.
- Added `tests/unit/unified-header.test.mjs` (b05bf72) and additive package-root runtime export (0f83369). Isolated strict TypeScript 5.8.3 compilation and 8/8 Node 22 tests passed. Verified the exact renderer and unit test file Git blob hashes against GitHub: 2e05044e61f808cbe4d3302ed2a4a288829a6db1 and c5cb527150560f92eaf18d10b6504625528add1e. Isolated compilation used a structurally matching subset of the current header types, not the full package build.
- Step 18 covers the pure renderer. Interactive mount/controller, menu coordination, route callbacks, avatar error handling, focus, hydration, responsive overflow, group active-state styling, optional feature accessibility and workspace slots are not complete; do not integrate or deploy yet. SSR/browser and comprehensive package test steps remain open. Full clone still blocked by GitHub DNS in the execution environment.
- Next: implement and test the framework-independent client controller using the existing navigation behaviors, then validate framework adapters and MyAccount.


### Phase 2 — interactive mount controller (2026-11-27)

- Implemented `src/shell/header/unified-header.controller.ts` (2c7dbbe), exported `ntMountHeader` at package root (d1552d5). Mounts into a dedicated connected host; reuses matching SSR DOM, rejects duplicate mount or conflicting IDs, coordinates existing navbar/account/mobile drawer controllers, delegates actions and ordinary same-origin internal links, retries avatar fallback once, updates snapshots and removes listeners/overlay state on destroy.
- The controller passes isolated TypeScript 5.8.3 strict compilation with ES2022, DOM, Bundler resolution, noUncheckedIndexedAccess, exactOptionalPropertyTypes, isolatedModules and verbatimModuleSyntax. The exact tested controller blob is d2e059ecd24981a3a6a1c958d40428225da3030d (verified on GitHub). The imported dependencies were represented by matching narrow type declarations; this is not a full repository build or integration test.
- Added `tests/pages/unified-header.html` (aa14908) and `tests/browser/unified-header.spec.mjs` (23eae54), six browser test cases for SSR node reuse, duplicate mounting, menu coordination/keyboard and action dispatch, internal navigation/modifier behavior, auth updates/teardown, broken avatar recovery and mobile drawer cleanup.
- Browser tests are written but not executed; GitHub DNS still blocks full clone in the local execution environment. Run from a complete checkout with the package dependencies installed: `npm run test:browser -- tests/browser/unified-header.spec.mjs`. Full build and existing regression suite remain mandatory before adoption.
- Count stays 14/100 because this finishes the implementation follow-up to already-counted step 18; no separate browser/hydration or interaction verification step is marked complete. Remaining visual, SSR framework adapter, accessibility, notification and workspace-slot work is open. No npm publication or deployment.
- Next: build the Angular adapter with SSR/hydration-safe lifecycle and test the existing MyAccount state/routing contract without removing its legacy header prematurely.


### Phase 2 — Angular 20 reference adapter (2026-11-27)

- Added `docs/integrations/angular/nt-header.component.ts` (43f7047): standalone Angular wrapper using the package renderer/controller, afterNextRender, reactive input snapshots, navigation callback, action output and explicit teardown. The reference source stays outside the framework-independent package's TypeScript build; it is not yet an importable Angular package entry.
- SSR strategy: initial markup comes only from the shared escaped renderer; the scoped ngSkipHydration host opts out of Angular hydration for controller-owned DOM. Actual Angular SSR/AOT and hydration behavior are not verified. Angular 14/15 require a legacy lifecycle adapter review.
- Isolated TypeScript 5.8.3 strict checking passed using narrow Angular API declarations and the exact header type contract. Verified adapter blob 31d1d0c1e29c82359bffa028522dd4d5dd93f4d0 on GitHub. This is not a real Angular compiler or integration test.
- Added four Jasmine integration specs (de06222) for one header/action dispatch, latest route callback, state update and teardown, plus integration instructions (4175185). These tests are not executed because the Angular dependencies and repository clone are unavailable in the execution environment.
- MyAccount still declares @neetechs/ui 0.2.0 and enables hydration. No changes to MyAccount, its legacy headers, package versions, auth or deployment. Step 19 records the reference adapter implementation only. Actual package adoption and framework verification remain gated by steps 21, 59–60 and 61–75.
- Next: implement the React reference adapter, then address SSR, packaging and shared responsive behavior before MyAccount migration.


### Phase 2 — React 18 reference adapter (2026-11-27)

- Added `docs/integrations/react/nt-header.tsx` (a1a9ea0): stable initial HTML host, shared controller, committed callback refs, config updates, StrictMode-oriented mount/cleanup, keyed instance-ID changes and server-safe effect selection. No duplicated header markup or mandatory React dependency.
- Isolated TypeScript 5.8.3 strict compilation passed with narrow React/JSX and shared-header declarations (not actual React dependencies). Verified the exact tested adapter blob a44c8c416ed4a44310aaa5563a734052c3805029 on GitHub.
- Added five jsdom integration cases (8eb36f0) and one server-rendering case (f065fba). Tests are authored but not executed: the current environment cannot resolve the npm registry/GitHub and lacks React dependencies. Real framework hydration, StrictMode and lifecycle behavior remain unverified.
- Added integration and consumer gates (08d15bc). Tools declares React 18.3.1, React Router 6 and @neetechs/ui 0.2.0. Preserve role-filtered navigation, developer settings, sign-in/sign-out, skip link, Outlet and footer. Neenee chat-specific company/model controls must remain intact.
- No consumer repositories, dependency versions or deployed apps changed. Step 20 counts reference implementation only. Step 21 (SSR/hydration verification) remains open. Next: address SSR and hydration integration, then branding and responsive header tasks; prioritize the MyAccount pilot after package verification.


### Phase 2 — Step 21 SSR and hydration verification (partial, 2026-11-27)

- Recovered the actual renderer and complete header type source into the isolated test workspace and matched GitHub blob SHAs `2e05044e61f808cbe4d3302ed2a4a288829a6db1` and `a5305c2eef2d15f4bbc8fe8d936d66006cfb8bb7`. Compiled these exact sources together using TypeScript 5.8.3, strict/noUncheckedIndexedAccess/exactOptionalPropertyTypes/isolatedModules/verbatimModuleSyntax, ES2022 and Bundler resolution. No stub types for this renderer check.
- Ran five checks against Node-generated HTML in real Chromium 144.0.7559.96 via Python Playwright: loading state with no account actions; document/template DOM equivalence; two instances with unique IDs and valid ARIA references plus RTL; guest snapshot without authenticated identity/actions; hostile markup/URL safety. All five passed. Browser HTTP navigation is restricted by environment policy, so checks used setContent (document parsing, not live HTTP SSR).
- Added six permanent Playwright cases in `tests/browser/unified-header-ssr.spec.mjs` (4d752bd): five document parsing checks corresponding to the isolated browser checks, plus a controller integration case that mounts Node-generated markup and replaces a stale snapshot. The repository's actual Playwright suite has not been executed here.
- SSR rule for consumers: supply the same stable instance ID and initial configuration on server and first client render. For unverified sessions use loading, not cached authenticated identity or guessed guest state. After verification, update the controller with a new immutable snapshot. Never embed session secrets or raw API HTML in header configuration. Angular adapter deliberately opts out of Angular hydration for its owned DOM; React requires matching initial snapshots. Verify real framework integration before changing MyAccount.
- Step 21 remains open: real Angular SSR/hydration and React hydrateRoot/StrictMode runs, controller mount from server HTML, actual package build and browser layout testing are not yet verified. GitHub and npm DNS unavailable in the execution environment; browser HTTP navigation blocked. No consumer changes, npm release or deployment. Next: continue independent branding/responsive implementation while retaining the hydration gate.


### Phase 2 — Steps 22–23 common branding (2026-11-27)

- Copied the existing 128px PNG from Neetechs_Frontend/main/public/logo - 128.png to `src/shell/header/assets/neetechs-logo.png` without modification. Source and copied Git blob SHA: 3589b6aeede14161046c1a178e9206f08fba5e66. Added a package asset export pointing to the shipped src file.
- Added `ntCreateHeaderBrand`, canonical name/logo URL constants and optional app suffix, subtitle, destination and local logo override. Desktop and mobile drawer now share escaped branding and the same validated logo markup. Explicit custom branding and text-only mode remain supported. Existing apps must opt into the helper during migration.
- Strict TypeScript compilation of the actual renderer, helper and types passed. All 13 isolated Node unit tests passed (five new branding tests and eight existing renderer tests). Tested source blobs: helper 72e85228dc4c70bf84987e03e96c4873af7cd9f0; renderer 981766182ac0d2407279d107ff0d414d24104ae8; branding tests 1ac1fcfee9678722887f87f98d3e1d2e1005cbd7.
- Default logo URL follows existing Frontend source; live URL availability, npm tarball asset export, actual app asset-copy configuration and visual layout still need verification. No consumer changed or deployment performed. Step 21 remains open.
- Next: desktop navigation and responsive layout (steps 24–26), then shared visual styles.

### Phase 2 — Steps 24–26 responsive layouts (source implementation)

- Scope CSS changes to the unified header. Retain existing 64rem breakpoint: desktop primary navigation and optional controls; tablet/mobile menu, brand and account. Optional controls (appearance, language, apps and configured actions) remain available inside the mobile drawer. Group labels and selected choices are visible, and active child routes mark their desktop group.
- Use shared sizing tokens, flex shrink and text truncation for long labels; ensure button-based drawer items match links. Close menus on breakpoint changes and release modal state through existing controllers. No change to legacy header styles or app routing.
- Added nine Playwright cases spanning 320–1440px, RTL and breakpoint transitions. These cases are authored, not executed. Full build and actual visual/interaction verification remain open; the source implementation count is not a test pass count.
- Next: verify shared glass, sticky behavior, spacing and typography. Steps 21 and 53–60 remain verification gates; no application or npm deployment.

### Phase 2 — Steps 27–30 material and typography

- Scoped unified header material to the existing strong glass tint and blur/saturation tokens, with solid fallback for unsupported backdrop filters, reduced transparency and forced colors. Legacy header rules remain unchanged.
- Sticky presentation explicitly uses logical block-start positioning and the shared header stacking token. Browser fixture uses a display: contents host, matching reference adapters; real consumer shells must still be checked for sticky constraints.
- Existing density roles control navigation gaps and responsive padding. Brand and subtitle use the existing title and caption typography roles. No new theme tokens or fixed color palette.
- Six isolated Chromium 144 checks passed using the new CSS block with a minimal fixture and representative existing token values: glass, sticky, typography, tablet/mobile density, legacy isolation and forced colors. This is not the complete stylesheet or controller suite. Added six package-level Playwright tests, not executed in the repository environment.
- Step 21 and the full build, responsive, accessibility and application integration gates remain open. No package release or application deployment.
- Next: shared icons, hover/current states, motion, overlay layering and extension slots.

### Phase 2 — Steps 31–35 interaction and extension contracts

- Introduced a closed named SVG icon registry, decorative and inaccessible to the focus order; common appearance/language/apps/account/menu icons share the same source. Optional typed icons can be used for links/actions/groups.
- Preserved existing hover and route-current styles; selected menu choices, disabled controls, reduced motion and forced-color selection styling are scoped to the unified header. Avatar image is positioned over the fallback.
- Retained shared header/dropdown/drawer stacking tokens. Controller fits open panels within viewport horizontally on open/resize; actual consumer stacking contexts and narrow-layout overflow remain verification gates.
- Added optional structured workspace and contextual action slots. They use the existing configuration and host callbacks in both desktop and mobile layouts, not arbitrary HTML. Framework-owned custom DOM/widget slots are not implemented; assess any real consumer that cannot be represented by typed entries before adopting.
- Isolated icon registry strict TypeScript compilation passed; the exact local source Git blob matched 447b24c7d66de249201c2c40bfdc18d82c813ea5. Node assertions passed for all 12 supported icons and five rejected inputs (including prototype keys and malicious SVG strings). Added four unit tests and four Playwright cases; the repository's complete suites were not executed. Renderer/controller changes require full compile and browser regression validation. No consumer changes, publication or deployment.
- Next: ecosystem navigation registry and shared product links (steps 36–40). Step 21 and all remaining validation gates remain open.

### Shared functionality — Steps 36–40 ecosystem navigation

- Added `src/shell/header/unified-header.ecosystem.ts` and package-root exports. The optional helper centralizes existing Tools, Products and Company destinations; Billing and the Products dropdown are explicitly opt-in.
- The host supplies the already-filtered application catalog and localized labels. The shared helper creates independent stable entry IDs for Products and app switcher, marks the current app, and omits empty controls. Invalid IDs, blank labels, duplicate IDs, non-HTTPS destinations and embedded URL credentials are rejected. No permission decisions or backend requests are moved into UI.
- Existing consumers are unchanged. A complete verified ecosystem application catalog, live destination checks, localization and adapter integration remain pending; the helper does not guess unknown domains or expose every app to every account. Billing uses the previously identified billing.neetechs.com destination.
- Added five unit tests including shared renderer integration. Tests authored but not run in the full repository environment. No release or deployment. Next: account states, identity, account menu and settings destinations (steps 41–45).

### Shared functionality — Steps 41–45 account state and menu

- Added `ntCreateHeaderAccount` in `src/shell/header/unified-header.account.ts`, with additive root exports. Converts a host-verified loading, guest or authenticated snapshot into the existing shared account renderer configuration. Loading and guest do not retain authenticated identity or actions.
- Normalizes display name, partial names, username and avatar inputs. Retains shared image fallback and initials. Email is optional, not separately rendered by default. An application may pass its existing display-name expression for parity.
- Shared menu supports Login, Sign Up, My Account/Profile, My Products and Settings, with localized labels and host-provided URLs or action IDs. Omit unsupported destinations. No auth, permission or router logic is moved into the package.
- Re-read MyAccount desktop/mobile TypeScript and templates. Documented the existing AuthStore, LogoutService, ThemeStore, LanguageService, RuntimeConfigService, picture_tag, localized returnUrl and Angular base-href settings behavior in `docs/integrations/header-account.md`. No consumer files changed.
- Added five unit tests for state isolation, identity, exact route preservation and escaping. Tests authored, not executed; local GitHub DNS resolution remains unavailable (git ls-remote failed). Full package/framework and actual account transition verification are pending. No npm publication or deployment.
- Next: steps 46–50, host sign-out, appearance, language, optional notifications and mobile drawer. Keep the MyAccount migration and all test gates open.

### Shared functionality — Steps 46–50 host actions and responsive parity

- Added explicit optional signOut configuration to the account helper, emitted only for verified authenticated snapshots, with host-controlled disabled state. Existing controller dispatches the action; auth service owns actual sign-out and clearing identity. Do not duplicate the sign-out entry in authenticatedItems.
- Added ntCreateHeaderPreference, exported from package root, for host-supported appearance and locale choices. Invalid or duplicate choice IDs are filtered, empty choices omit the control, and unknown current selection does not guess. Existing controller dispatches actions and host supplies updated selection and direction.
- Added optional NtHeaderNotifications configuration and shared desktop/mobile summary with escaped entries and empty state, visual count capped at 99+, localized accessible summary, and bounded valid positive integer count. No notification fetching, mutation, polling or backend integration. Omit unsupported notification controls.
- Mobile drawer now exposes current account actions in addition to product navigation, preferences and notifications. Loading never exposes guest or authenticated account entries. Uses the existing modal drawer and controller cleanup; desktop account disclosure remains accessible when the drawer is closed.
- Added four unit tests and two browser tests. Updated account integration docs. Local git ls-remote again failed to resolve github.com. Full package compilation, unit/browser execution, real framework integration and mobile interaction verification remain open. No consumer changes, npm release or deployment.
- Next: steps 51–60 design-system testing; keep all failed or unexecuted gates explicitly open. MyAccount migration follows a successful local package gate.

### Testing — Steps 51–55 partial verification

- Recovered the exact GitHub blobs for renderer (e82aa15a2be6150645c606d4249ec1e3dd996cc1), types (e96813399fe6d4a842a7522a3a07165c06032694), icons (447b24c7d66de249201c2c40bfdc18d82c813ea5), account (53a6bba8f4d7ee4d1276c358804abb0ee62cd435), and preferences (332c3974422b28db2f9d9f84ff8ad4215fa30d63). Strict TypeScript 5.8.3 isolated compilation passed without stub dependencies for these five modules.
- Ran 17/17 Node 22 unit tests from three exact repository files (renderer c5cb527150560f92eaf18d10b6504625528add1e, account f1d0a88752652719a1768eb22a2760ba8f24dc15, features 476fe7303ebd405ce1dfdf904901c6a42f34e2b8). All passed.
- Compiled the original and new strict type fixtures successfully; nine expected invalid configurations are rejected. Added check:header-types to the default npm test gate and a package-root runtime export test. The complete root export/API compatibility gate is not run.
- Existing browser tests cover dropdown coordination, keyboard Escape, focus restoration and DOM state updates. Added two touch browser regression cases. None of those browser controller tests were executed in this iteration; do not mark them passed.
- GitHub DNS still prevents a full checkout; the local environment lacks the repository Playwright npm dependencies. Steps 51–55 remain open for full API/package and browser verification. Progress remains 45/100; isolated success is evidence, not full gate completion. No runtime code changes, publication, deployment or app migration.
- Next: steps 56–60 responsive/theme/RTL/SSR/package verification. Revisit all outstanding test gates before MyAccount migration.

### Testing — Steps 56–60 partial verification and package fixes

- Re-ran the 17 isolated unit tests against the same exact recovered source blobs from the preceding iteration: 17/17 passed. Local Node 22.16.0 and Chromium 144.0.7559.96 are available.
- Six isolated Chromium document-parsing checks passed using actual Node-rendered header HTML: loading state, server/template equivalence, unique instance IDs and valid ARIA references with RTL, guest desktop/mobile account parity with hidden disclosures, inert hostile markup/URLs, and optional notification/preferences parity including RTL. These checks use setContent and do not mount the real controller or run framework hydration.
- The actual mobile trigger and unified-header visibility media-query rules were checked in isolation at 320, 390, 768, 1024, 1025, 1280 and 1440px: all seven passed. Full stylesheet, overflow, density, touch, real theme and high-contrast verification remain open. Existing comprehensive responsive/material browser specifications are not executed.
- Fixed two stale SSR browser assertions that expected a single login action despite intentional desktop/mobile parity; now verify two actions, exactly one in each surface, with panels initially hidden. Added an RTL notification/preference SSR case. These repository Playwright cases still require a full run.
- Fixed a release-gate defect in scripts/check-package.mjs: the new PNG asset export was included in the consumer JS import probe. Asset exports are now verified through Node import.meta.resolve and file existence, not imported as JavaScript. The package smoke probe also checks the new root header functions and renders a header without browser globals. A local mock installed-package test confirms Node rejects PNG import with ERR_UNKNOWN_FILE_EXTENSION but resolves the asset successfully. This is not validation of the real tarball.
- Local GitHub DNS resolution remains blocked. The actual package build, full test suite, pack/clean-consumer validation, Angular/React hydration and MyAccount migration remain unverified. No runtime production changes, version bump, publishing, deployment or new branches. Progress remains 45/100; steps 51–60 and 21 remain open.

### Required full-checkout gate before MyAccount

Run on an environment with repository and dependencies available, on main:

```bash
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run check:package
```

Use the repository's configured Playwright projects and install any additional browsers they require. If any check fails, repair the existing shared implementation, rerun the gate, and record actual results before using the local package in MyAccount. Do not publish an unverified package.

### MyAccount — staged preparation, no activation (2026-11-27)

- MyAccount main now has a pure host mapping (c7f9275), five Jasmine cases (2d83962), inactive Angular reference candidate (a614019), and integration checklist (4b6baa6). Verified exact pure mapper and existing localized-path blobs cf040cbbc0cc6201032c019d782db697b268071f and eef8beed9e23d14954c598aa0b417e6950c210f5; strict TypeScript 5.8.3 compile and five isolated Node assertions passed.
- Candidate maps verified AuthStore state, existing name/avatar precedence, RuntimeConfigService destinations, localized returnUrl, Angular Location/router settings, LogoutService and ThemeStore. Language switching deliberately deferred until existing reload and locale routing behavior is reconciled. Candidate uses environment-specific login URL, localized profile root, shared brand/app label, 64rem breakpoint and sticky-from-top behavior; confirm parity or approve these differences before activation.
- Dependency remains 0.2.0; existing header and shell are untouched. Steps 61–75 remain open because package gates and real Angular integration are not run. Progress remains 45/100; no npm publication or deployment.

### MyAccount — steps 66–70 staged refinement

- MyAccount main: added host auth and language URL helpers (cf77756), staged Angular language actions (2457414), five additional Jasmine regression cases (c64a8cc), and updated pilot checklist (b7366fc). No active header, package version, authentication service or routing changes.
- Verified Accounts main declares login, signup and logout sibling routes. Candidate uses runtime-configured login URL, validates signup pairing, preserves query/hash and uses existing AuthStore, LogoutService and ThemeStore. Existing LogoutService appears to append /logout to a URL ending /login; this is a separate unresolved endpoint issue, not changed here.
- The candidate exposes English, Swedish and Arabic only on matching Angular localized builds and preserves selectedLanguage storage while navigating the locale URL rather than invoking reload-only LanguageService. Six other declared Angular locales remain unsupported by the current localized-path helper; verify or reconcile before activation.
- Exact host mapper blob 3898ae2eb6b018910e5dd4f79b5ed44346a87e78 and localized-path blob eef8beed9e23d14954c598aa0b417e6950c210f5 compiled in strict TypeScript 5.8.3; eight isolated Node tests passed. Ten Jasmine cases are committed but not run with Angular. Full checkout remains blocked by DNS, so package and actual integration gates remain open.
- Steps 61–75 remain open and progress remains 45/100. Next: shell/sidebar, CV preview and overlay compatibility review, route parity and rollback preparation (71–75). No publishing or deployment.

### MyAccount — steps 71–75 shell and cutover preparation

- Audited AppComponent, profile/Resume Studio, settings sidebar, right drawer host and route configuration on main. Both CV document modes intentionally omit global chrome; preserve the CV library and all page-specific headers, skip link, settings route outlet, footer and right drawer.
- MyAccount main replaces stale starter-template AppComponent tests with four actual-shell regression cases (7efc0c7); tests use the Angular router and stub child services. No actual Angular run. Staged shell-cutover.scss (014e533) removes the candidate wrapper's sticky/stacking constraint while retaining the legacy path and isolates page content; validate local overlays before activation.
- Isolated Chromium 144.0.7559.96 representative fixture reproduced the wrapper failure (header y=-400px at scroll 400), corrected it (y=0), and passed mobile drawer/backdrop layering, right drawer above navigation, unaffected legacy wrapper and desktop header/dropdown layering checks. Not a real consumer build.
- Cutover/rollback checklist committed to MyAccount (fb3b75a). Noted existing substring CV-route matching, independent body-scroll locks, localized logout endpoint and unsupported locale gaps as remaining verification items. Existing app shell and dependencies remain unchanged.
- Steps 61–75 remain open because the verified package and full Angular/browser run are unavailable; local DNS still blocks git clone. Progress remains 45/100. Next: release preparation steps 76–80 without publishing, deploying or removing legacy files until the test gates pass.

## Audit and architecture

- [ ] 1. Read current main branches and record baselines
- [ ] 2. Inventory all applicable active frontends
- [x] 3. Record package versions and framework compatibility
- [x] 4. Audit shared header CSS and behaviors
- [x] 5. Audit MyAccount desktop header
- [x] 6. Audit MyAccount mobile header
- [x] 7. Audit main website header
- [x] 8. Audit Apply header
- [x] 9. Audit Billing header
- [ ] 10. Audit remaining headers
- [x] 11. Identify duplicate markup, CSS and state
- [x] 12. Inventory authentication dependencies
- [ ] 13. Inventory URLs and navigation
- [x] 14. Record app-specific behavior and exclusions
- [x] 15. Define public API and architecture

## Shared header development

- [x] 16. Create component directory
- [x] 17. Define typed configuration interfaces
- [x] 18. Implement framework-independent renderer/component (pure renderer; client controller pending in subsequent behavior and hydration steps)
- [x] 19. Implement Angular adapter (Angular 20 reference source; actual Angular compilation, packaging and older-version compatibility pending)
- [x] 20. Implement React adapter (React 18 reference source; actual framework compilation, packaging and integration tests pending)
- [ ] 21. Implement SSR-safe rendering and hydration
- [x] 22. Implement brand logo
- [x] 23. Implement optional app name
- [x] 24. Implement desktop navigation
- [x] 25. Implement mobile responsive layout
- [x] 26. Implement tablet layout
- [x] 27. Use existing glass tokens
- [x] 28. Implement sticky behavior
- [x] 29. Use shared spacing/dimensions
- [x] 30. Use shared typography
- [x] 31. Use shared icons
- [x] 32. Implement hover and current states
- [x] 33. Use shared motion tokens
- [x] 34. Use shared overlay layers
- [x] 35. Implement extension slots

## Shared functionality

- [x] 36. Centralize ecosystem navigation configuration separate from generic UI
- [x] 37. Implement Products navigation
- [x] 38. Implement Tools navigation
- [x] 39. Implement Billing navigation
- [x] 40. Implement app switcher
- [x] 41. Implement authenticated state
- [x] 42. Implement guest and loading states
- [x] 43. Implement avatar and name
- [x] 44. Implement account menu
- [x] 45. Implement MyAccount/settings links
- [x] 46. Delegate sign-out to auth adapter
- [x] 47. Integrate appearance options
- [x] 48. Integrate locale options
- [x] 49. Implement optional notification UI
- [x] 50. Implement mobile drawer

## Design system testing

- [ ] 51. Test typed public API
- [ ] 52. Test rendering and updates
- [ ] 53. Test dropdown behavior
- [ ] 54. Test keyboard and focus
- [ ] 55. Test touch interactions
- [ ] 56. Test breakpoints
- [ ] 57. Test light/dark/high contrast
- [ ] 58. Test RTL
- [ ] 59. Test SSR/hydration/cleanup
- [ ] 60. Build and validate local npm package

## MyAccount migration

- [ ] 61. Install local package
- [ ] 62. Create MyAccount adapter configuration
- [ ] 63. Integrate with Angular shell
- [ ] 64. Replace desktop rendering
- [ ] 65. Replace mobile rendering
- [ ] 66. Connect existing auth state
- [ ] 67. Connect profile and avatar
- [ ] 68. Connect account settings and sign-out
- [ ] 69. Connect ThemeStore
- [ ] 70. Connect localization
- [ ] 71. Verify shell/sidebar
- [ ] 72. Verify Resume Studio overlays and CV preview
- [ ] 73. Verify routes and settings
- [ ] 74. Remove superseded headers only after parity
- [ ] 75. Run MyAccount build/regression/browser suite

## Package release

- [ ] 76. Update documentation
- [ ] 77. Add Angular/React/HTML examples
- [ ] 78. Update changelog/version
- [ ] 79. Validate and manually publish package
- [ ] 80. Install published version in MyAccount and verify deployment

## Application migration

- [ ] 81. Neetechs_Frontend
- [ ] 82. Neetechs_Apply
- [ ] 83. Neetechs_Accounts (preserve auth-only pages)
- [ ] 84. Neetechs_Billing
- [ ] 85. Neetechs_Tools
- [ ] 86. Neetechs_Companies
- [ ] 87. Neetechs_Calendar
- [ ] 88. Neetechs_Resume
- [ ] 89. Neetechs_AI (preserve chat header)
- [ ] 90. Neetechs_Phone
- [ ] 91. Neetechs_Data
- [ ] 92. Neetechs_Vault
- [ ] 93. Neetechs_BrandKit
- [ ] 94. Neetechs_Agent
- [ ] 95. Remaining applicable frontends: Ticket, Boost, DaySlice, Proof, Devices, Policies, Tracker and any newly discovered apps

## Final verification

- [ ] 96. Audit duplicate global headers
- [ ] 97. Verify cross-domain auth and routing
- [ ] 98. Verify visual consistency
- [ ] 99. Add automated anti-drift checks
- [ ] 100. Record final commits, tests, versions and deployments
