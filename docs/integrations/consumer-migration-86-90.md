# Consumer migration wave 2 (86–90)

Source review only. Do not activate any candidate until the package and MyAccount pilot gates pass. All source baselines below are from main; package versions are manifest declarations.

| Consumer | Framework | @neetechs/ui | Header ownership |
|---|---|---|---|
| Companies | Angular 20.3.25 | 0.2.0 | Root site header plus company center sidebar |
| Calendar | Angular 20.1 | 0.2.0 | Calendar workspace topbar; root site header is conditional |
| Resume | Angular 15.2 | 0.2.0 | Public personal profile hero and anchor navigation |
| AI / Neenee | React 18.3 | 0.2.0 | Authenticated ChatHeader |
| Phone | Angular 20.1 | 0.2.0 | Phone workspace topbar; root site header is conditional |

## 86 — Companies

Root shell includes app-header, skip link, footer, right drawer and CV-preview exclusion. The actual desktop header uses dashboardPath(), companiesPath() and createCompanyPath() internal links with localized labels and exact active-route handling, not the stale ecosystem menu-data. Preserve localized dashboard brand and existing AuthStore, ThemeStore, LogoutService, RuntimeConfigService, picture_tag avatar and external MyAccount settings/profile/products. Preserve authGuard and callback routes. CompanyCenterShell separately owns the active-company selector, its loading/error/empty states, role display, country/currency, and company-dependent routes (profile/edit/team/email-senders/subscription/branding). Never replace these with a generic application switcher. Avoid duplicating sidebar navigation when deciding which desktop/mobile entries to retain. Verify route IDs and selected company state across navigation and reload.
Source blobs: root HTML 45e71f5861448bb22683224b8b90c862c1465897; routes 2211713db892c7049c3a976ec35b9d5ba76f2772; desktop template fee4d3fcf4817e7860f7e2912357155aa818ad71; shell template fb10818aca589efdf2c78a5b123cde1819648e9f; shell TS 75746dc55008f6c6dad8679a8741422fc698e49b.

## 87 — Calendar

Root isCalendarApp excludes global chrome for root, month/week/day and calendar aliases (optional en/sv/ar prefix). Actual CalendarPage owns sidebar, topbar, and workspace with personal/company calendar contexts, selected context, loading/error, canWrite, New menu, event/task/focus/goal creation, availability, AI planner, refresh, and sidebar collapse. Do not insert a second global header or drawer in workspace routes. Retain the specialized topbar and use shared tokens/compatible slots only after proving action and permission parity. Preserve auth callback and CV conditions; audit whether local account settingsPath exists rather than silently introduce a route. Test all views, aliases, date and context switching, read-only contexts, dialogs, mobile/keyboard and SSR.
Source blobs: root HTML fa733567f1d4b9eea31e623b8faacb729e7a11bd; root TS 9039bd32b25c5c9b7a0cc3dad7d7cd740b940ad6; calendar routes 80ba7c2011e370d05e4a15342c8610abca6fad71; page template ad314b9655e97b55bef0fdd8938ff2315a9f8939.

## 88 — Resume

Public profile app, not MyAccount Resume Studio. Root renders loading/retry UI and mounts app-header only once a resume is available. The header is a profile hero with name, description, conditional experience/work/publication/contact section links, #home/#about anchors, resume download, social links and local mobile nav. Preserve personal identity and conditional section structure; do not insert account controls or auth calls. If the navigation row adopts the generic renderer, keep the hero and all download/social functions outside it and verify anchor navigation, missing sections and layout. Angular 15 cannot use the current Angular 20 afterNextRender adapter; a separately tested lifecycle adapter is required, not an Angular upgrade as a side effect. No migration until that compatibility gate passes.
Source blobs: root HTML 851cb5b24ca15384d5f487e5baf4e28482856681; header TS 1b5bf10fd5aa1d2b28652a22ba2359b2714a9a7a; header HTML cfb20a1f81df54004815318518e1d600ec29b1e8.

## 89 — AI / Neenee

ChatPage gates on auth readiness and authentication before mounting its shell. ChatHeader owns sidebar toggle, conversation title, CompanySelector, ModelMenu, and conditional account button; the account action opens the existing settings overlay. Preserve company loading/error/retry and disabled behavior during direct chat, model/provider defaults and overrides, company-scoped conversation remount, mobile sidebar scrim, and all ChatWorkspace/ChatOverlays behavior. The generic header currently accepts structured entries, not arbitrary live React components. Do not replace CompanySelector/ModelMenu with static dropdown data or mount a second global header. Shared styling/slot contract is a future integration option; verify it with actual company/model switching and direct-chat locks. Keep sign-in/loading screens separate. No chat, AI backend, n8n or conversation changes.
Source blobs: ChatHeader c73796edef9f2dad5d720a3774983a91d63e7436; ChatPage 6a2f5a4f374a57f0ed7131b3736216fdf16a8c5b.

## 90 — Phone

Root conditionally omits generic site shell when isPhonePlatform is true. Actual protected route tree mounts AppLayout with sidebar/backdrop and TopbarComponent; topbar owns menu event, company name, WorkspaceSelectorComponent, environment-specific Billing link (new tab), user name/email/initials and LogoutService. Preserve all workspace state, authGuard, actual billing behavior and mobile sidebar; do not add a competing generic drawer or duplicate account menu.

Existing root classifier recognizes only dashboard, phone-numbers, call-logs, routing, publish, settings. Protected route tree additionally includes leads, contacts, followups, calendar, bookings, automations, integrations, webhooks and billing, so these can render both generic root chrome and workspace chrome. Its regex also handles query but not hash-only boundaries. Correct shell ownership before migration. Phone main contains an inactive candidate at docs/unified-header/phone-workspace-route.candidate.ts (2beb8f7) with the full first-segment inventory, locale and query/hash handling; prefer route metadata in final integration to avoid future drift. Verify empty redirects, child detail routes, callbacks, unknown routes and all locale variants. No active route or shell logic changed.
Source blobs: root TS ca1018b1aac39b25b4c6114a3ddf69b4ff3b73c5; root HTML 5f11d105ef36812b30afa921c576f13613b87961; routes 0fd8a34e25cdd55371cbc04b31c15c958c791f0a; app layout HTML 3837f97df4c6a4578c129c35de038972a4affd3b; topbar TS c9c14fb44c05dcf6ff4b88e43ca1219345b7c795; topbar HTML 23f645a7c3c472c866c8e0ee67c30de77da9826c.

## Verification gates

Run each consumer's existing tests/build and design tests where declared; verify framework compatibility and role/route/overlay behavior in real browsers, then record exact commits and package versions. The special-purpose headers may require explicit exclusion or shared style-only integration rather than direct replacement. No production modifications, package upgrades, publication, deployment or framework test runs in this preparation.
