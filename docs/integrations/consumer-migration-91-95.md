# Consumer migration wave 3 (91–95)

Source inventory on main, not a production migration. Do not activate shared header candidates until the package and MyAccount pilot gates pass. Versions below are manifest declarations.

| App | Framework | @neetechs/ui | Existing header ownership |
|---|---|---|---|
| Data | Angular 14.3 | 0.2.0 | Root app-header with legacy auth/notification menus |
| Vault | Angular 20.1 | 0.2.0 | Protected VaultShell, own sidebar/mobile drawer |
| BrandKit | Angular 20.1 | 0.2.0 | Root site header |
| Agent | Angular 20.1 | 0.2.0 | Protected AgentShell workspace topbar |
| Ticket | Angular 20.1 | 0.2.0 | Root site header |
| Boost | Angular 20.1 | 0.2.0 | Product navigation and native mobile dialog |
| DaySlice | Angular 21 | 0.2.0 | Standalone PlannerShell |
| Proof | Angular 20.1 | 0.2.0 | Root localized product header |
| Devices | Angular 20.1 | 0.2.0 | Root product header |
| Policies | Angular 14 | not declared | Legacy header and login iframe |
| Tracker | unverified | unverified | Root package.json not found |

## 91 — Data
Preserve app-authorization, spinner, direction, main-content and hash-router behavior (home, /home, /404, catch-all HomeComponent). Header uses localStorage userToken presence as userExist, not verified session state. Do not treat that flag as authenticated identity; audit the existing authorization flow and notification/user menu providers before adoption. Do not copy tokens into header config or invent unread counts. Existing app-menu, app-login-menu, app-user-notifications-menu and app-user-menu require parity review. Angular 14 cannot use the current Angular 20 adapter; prepare compatible lifecycle integration separately. No auth or router rewrite.
Evidence: package 28a0a62d537230f32d4c8972f0220fca27a122e7; app HTML 4b6759042cdbb4a477b461ebc0c113210e3534a6; header HTML 0c5491ab9f2434c588cc23af1cc916645e4e2369; header TS 608886ecac5d4dfa0081ad5a9e41d6be783f8a0f; routing adacebbe1077a717cfca2e49bc153b5b62c49e56.

## 92 — Vault
Root contains CoreShell and RouterOutlet only. /vault and descendants use guarded VaultShell, which owns grouped desktop sidebar, mobile drawer, personal vault title, user label and LogoutService. Preserve navigation sections, item/folder/document routes, confirm host, private scope and guard. Avoid a second drawer; the app should either retain workspace topbar or integrate the shared controls inside the existing shell after testing. No vault item content, private labels, or secret material in SSR header state. Verify mobile close/focus, active route and logout.
Evidence: package 7cb1bce3d5eb866e2b830ac5b99bb4fe7746c840; root ad541325ace67a8a09f4f75f08aabafbdfece911; routes 570ec1b1b22aa7173d0d10a595e4902633989729; inline shell a16581f51e55352b63b6517eef4716be4565543f.

## 93 — BrandKit
Root product-app-shell has app-header, core shell, skip link, footer and scroll-to-top. Existing desktop uses external Tools/Products/Company menu, global brand, auth readiness, profile/products, settings routerLink, theme and logout. Preserve local brandkit routes and existing authorization. Verify whether settingsPath() resolves to a real local route before changing it. Use ecosystem helper only for actual external entries; preserve mobile parity and editor/workspace functions.
Evidence: package 4ba38a6ff4be40835849ccd6eb4d85c9ce36358c; root 65a50305fce20de89b6ed3758766f18b0176d70b; header 46b6d8a91e95ee82bd6618be5ce6fabc1f1d6038; routes 443271fcf942e5eb1fd24df5459056783d05dbd7.

## 94 — Agent
Root contains only router outlet, core shell, skip link, right-drawer and confirmation hosts. Protected AgentShell owns visibleNavItems, sidebar toggle/backdrop, company name, app-workspace-selector, environment billing link in new tab, user label and logout. Preserve authGuard/canActivateChild, workspace scope and all voice agent controls. Do not replace live company selection with static ecosystem data, add a second global header, or modify agent execution/backend. Verify monitoring, templates, agents, knowledge, providers and role-filtered navigation.
Evidence: package 4ba38a6ff4be40835849ccd6eb4d85c9ce36358c; root c7bfcf1a3e6e5fc03c6f87a31c59bd83c3a05a2d; routes ebe5d744b7e220aade8685f46e1be105986d255b; shell afd161479b0a118a1fc75fbc6d9b5e1fc7f3b913.

## 95 — Remaining consumers

- Ticket: root conditional CV preview, skip link, footer, right drawer. Existing header includes Ticket badge, external Tools/Products/Company, verified account name/email/avatar, profile/products/settings, logout and guest actions. Preserve actual focus/menu lifecycle and current route handling. Root dea3c6e081a53ac19da9a19b7c0cb14a9fe483da; desktop d89c2a38a049e36ca1e62fcddb01bba26b13d2d8; routes 535b09b95cbc30183e29ee27e90da23eab38297d.
- Boost: actual internal navigation Dashboard, Post generator, Google Business, Review requests, Campaigns, Settings. Existing native mobile dialog, auth state, RuntimeConfigService destinations and core shell remain authoritative. Preserve dialog focus and return navigation; use one controller after parity. Root uses ngSkipHydration on app-header; verify scoped hydration with the reference adapter. Root 475611a85ecb62d29c16495d7aa76a7cda1a7; header TS c1a60360dd2bf7a4f3b7a095fb64765e86277dbb; template 2b7823cb469f28d2cf668f90120a1b4b73f5714a.
- DaySlice: root mounts PlannerShell directly; router routes empty. Specialized topbar has day actions, print-hidden behavior, settings dialogs and local planner controls. No global header or account flow should be introduced without explicit product design. Verify Angular 21 adapter compatibility separately and preserve planner data, print and shared appearance. Root 70c182051b8af61d690d252ee827cd8226066884; routes dc39edb5f23a35f788cba146dd7337127ba6c5ab; planner 5e8d6aa9da00bbd8d73d654801c14ce6c640c71c.
- Proof: localized internal Dashboard, Reports, Customers, Templates; external brand, MyAccount/products links, theme and logout. Preserve navLink locale normalization, translation IDs, auth, preview exclusion, footer and drawer. Root dc79436eba35f7d147dc24ee96509c2231c2cfe4; header 84ec1abee69622e9c71bd5aa3280f8f617a5af8a; menu 32d7baf5068fe6e1e347d9f378fa0a3cae2114b3.
- Devices: root header, skip link, footer, right drawer. Existing menuItems external links, account/guest controls, ThemeStore and RuntimeConfigService. Preserve guarded devices routes, historical tools redirects, localized callback and theme even for guests. Root b090f4d1a697d0b560a353007fe665edd154a8c5; routes 42caf7c54354da746d7ec3e31a8729c8d11a7bff; header TS ed701900c6e455b79c9226066866dac64952e3a9; template 161e80da56af82d957d8d98f0851d72dff148e36.
- Policies: Angular 14 and no shared package dependency. Root has hidden login iframe, legacy search/header, spinner and footer; hash-router routes empty. Do not treat commented-out menu markup as implemented functionality. Confirm actual active deployment, auth handshake and product scope before adding a dependency or navigation. Root 7f929a9d08375f6490399ae8276c509ef330aa03; header 6bb070f23eb12c15a5042b7042e3432c137a2014; routes 8d7fbb3ff42699c7e66ee24e99190667262ac4f6.
- Tracker: repository exists, default main, README only title in retrieved source (6b39f2ae5676e1aa69de4886988a303174015e60); root package.json returned 404. Cannot infer frontend framework or deployment from this evidence. Inventory remains open.

## Gates and scope

Use actual app tests, builds, route guards and design checks where declared. Re-read the latest main and lockfile before any change. Legacy Angular 14/15 and Angular 21 compatibility, Tracker eligibility, additional active repos, specialized workspace integration and package verification remain open. No active code, authentication, dependencies, deployment or publication changed in this wave. Steps 91–95 remain open.
