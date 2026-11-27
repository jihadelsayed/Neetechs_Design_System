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

Until step 46, authenticatedItems may carry the existing host-owned theme and logout action entries; the new helper does not invoke them. Verify mobile and desktop menu availability, sign-out, keyboard focus, guest/loading transitions, and the CV-preview header exclusion during the pilot.

No application is migrated by adding this helper.
