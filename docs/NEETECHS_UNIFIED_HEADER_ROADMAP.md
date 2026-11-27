# Neetechs unified global header — 100-step roadmap

Status: Phase 1 remains open; Phase 2 in progress (14/100 completed; interactive controller implemented as follow-up to step 18; browser verification and deployment pending).
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
- [ ] 19. Implement Angular adapter
- [ ] 20. Implement React adapter
- [ ] 21. Implement SSR-safe rendering and hydration
- [ ] 22. Implement brand logo
- [ ] 23. Implement optional app name
- [ ] 24. Implement desktop navigation
- [ ] 25. Implement mobile responsive layout
- [ ] 26. Implement tablet layout
- [ ] 27. Use existing glass tokens
- [ ] 28. Implement sticky behavior
- [ ] 29. Use shared spacing/dimensions
- [ ] 30. Use shared typography
- [ ] 31. Use shared icons
- [ ] 32. Implement hover and current states
- [ ] 33. Use shared motion tokens
- [ ] 34. Use shared overlay layers
- [ ] 35. Implement extension slots

## Shared functionality

- [ ] 36. Centralize ecosystem navigation configuration separate from generic UI
- [ ] 37. Implement Products navigation
- [ ] 38. Implement Tools navigation
- [ ] 39. Implement Billing navigation
- [ ] 40. Implement app switcher
- [ ] 41. Implement authenticated state
- [ ] 42. Implement guest and loading states
- [ ] 43. Implement avatar and name
- [ ] 44. Implement account menu
- [ ] 45. Implement MyAccount/settings links
- [ ] 46. Delegate sign-out to auth adapter
- [ ] 47. Integrate appearance options
- [ ] 48. Integrate locale options
- [ ] 49. Implement optional notification UI
- [ ] 50. Implement mobile drawer

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
