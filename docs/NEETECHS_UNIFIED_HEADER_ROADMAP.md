# Neetechs unified global header — 100-step roadmap

Status: Phase 1 in progress (5/100 verified audit tasks; no runtime implementation or deployment yet).
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

## Progress and evidence

Audit reads performed directly on GitHub main. Steps checked below refer only to source inspection. No local clone, npm build, browser test, publication or deployment was performed. Steps 1–2 remain open because local synchronization and exhaustive active-app classification are not verified. Step 3 covers the initial declared dependency matrix; lockfile/install verification remains a release prerequisite. Steps 7–11 and 13–15 remain open pending complete source-level comparison. Step 12 records MyAccount auth dependencies; verify each app's adapter during migration.

## Audit and architecture

- [ ] 1. Read current main branches and record baselines
- [ ] 2. Inventory all applicable active frontends
- [x] 3. Record package versions and framework compatibility
- [x] 4. Audit shared header CSS and behaviors
- [x] 5. Audit MyAccount desktop header
- [x] 6. Audit MyAccount mobile header
- [ ] 7. Audit main website header
- [ ] 8. Audit Apply header
- [ ] 9. Audit Billing header
- [ ] 10. Audit remaining headers
- [ ] 11. Identify duplicate markup, CSS and state
- [x] 12. Inventory authentication dependencies
- [ ] 13. Inventory URLs and navigation
- [ ] 14. Record app-specific behavior and exclusions
- [ ] 15. Define public API and architecture

## Shared header development

- [ ] 16. Create component directory
- [ ] 17. Define typed configuration interfaces
- [ ] 18. Implement framework-independent renderer/component
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
