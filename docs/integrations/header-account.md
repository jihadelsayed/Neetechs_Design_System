# Unified header account configuration

Use `ntCreateHeaderAccount` to construct the shared menu from an application-owned authentication snapshot. Do not call auth endpoints from the design system.

- Before auth verification, supply `{ state: 'loading' }`.
- Once a session is verified as absent, supply `{ state: 'guest' }`.
- For verified authenticated sessions, map the current profile into `{ state: 'authenticated', identity: ... }`.
- On sign-out or account switch, immediately replace the snapshot; never retain an old identity until a new profile loads.
- Omit destinations the application does not support. The caller decides link visibility and permissions.
- Pass the existing translated labels and complete, locale-correct hrefs or action IDs. The design system does not create return URLs or choose the account domain.
- Email is not emitted separately unless `showEmail: true`. The caller must also avoid supplying an email as displayName when it should not be shown.

## MyAccount migration notes

The existing Angular desktop and mobile headers use AuthStore, LogoutService, ThemeStore, LanguageService and localized-path helpers. Desktop additionally uses RuntimeConfigService and picture_tag. Preserve these services; do not replace them with a UI-layer auth implementation.

Map the existing display-name expression into displayName to retain the legacy order (full_name, fullName, name, username, handle, first/last name, first name, email). Supply picture_tag as avatarUrl and assets/img/avatar-default.png as fallbackAvatarUrl. A host may instead choose the privacy-preserving generic identity fallback.

For Login and Sign Up, retain the existing goToAuth callbacks so language and normalized returnUrl are maintained. For My Account and My Products, derive links from the existing RuntimeConfigService and localized-path logic. For Settings, use an action that calls the existing Angular router with /settings/profile-privacy, or supply a fully localized browser href with an adapter that maps it correctly to the Angular base href. Do not double-prefix the language or use a root-relative unlocalized href inadvertently.

Use the optional signOut configuration with the existing LogoutService action ID. Do not duplicate logout in authenticatedItems. The shared controller emits the host action once per activation; the host owns session clearing, pending state and error handling. Use signOut.disabled while a logout request is pending. Existing theme actions may remain in authenticatedItems until the preference menu is adopted. Verify mobile and desktop menu availability, sign-out, keyboard focus, guest/loading transitions, and the CV-preview header exclusion during the pilot.

No application is migrated by adding this helper.

## Preferences and notifications

Use ntCreateHeaderPreference for appearance and language. MyAccount currently supports light/dark and English/Swedish/Arabic; supply only supported choices. The action callback invokes ThemeStore or LanguageService; after the host confirms the change, supply a fresh config including selectedId and direction. Never guess a language, change storage or perform routing inside the header package.

Optional notifications take a host-provided label, emptyLabel, items and unreadCount. Use a localized accessibleLabel for the full count; the visual badge caps at 99+. Omit the entire configuration if there is no notification provider. Do not place sensitive notification content in SSR HTML. The host owns fetching, read state, permissions and navigation. This is a summary UI, not a notification service.

The mobile drawer includes existing account actions, preferences and notification entries. A verified guest sees guest actions; an authenticated user sees the current account name and authenticated actions. While loading, no account actions render. Reuse existing controller focus, modal and dismissal behavior. Verify actual drawer and desktop-menu behavior before deployment.
