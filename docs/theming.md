# Theming & the shared appearance system

`@neetechs/ui/appearance` is the single appearance system for every
`*.neetechs.com` application. It bootstraps, resolves and applies the
account appearance preference. It is framework-neutral (no Angular, no
React), SSR-safe, and touches no browser global at module import time.

> **The database is the source of truth.**
> **The cookie and local cache only reduce theme flashing.**

## Source-of-truth order

1. **Backend account preference** — stored by the Django backend, edited in
   MyAccount, applied via `setPreference(..., { source: 'backend' })`.
2. **Shared-domain bootstrap cookie** — `nt_theme`, set by the backend.
3. **Optional local cache** — `nt_theme_preference` in `localStorage`.
4. **System preference** — `(prefers-color-scheme: dark)`.
5. **Default fallback** — `dark` (matches the package `:root` tokens).

The cookie and cache are bootstrap mechanisms only. They must never become
independent per-application settings, and this package never persists the
preference to the backend — MyAccount and Django own persistence.

## Values

| Stored preference (`ThemePreference`) | Resolved theme (`ResolvedTheme`) |
| ------------------------------------- | -------------------------------- |
| `system`, `light`, `dark`             | `light`, `dark`                  |

`ResolvedThemeState` carries `{ preference, resolved, source }`, where
`source` is one of `backend | cookie | cache | system | default`.

The `high-contrast` theme remains available by setting
`data-nt-theme="high-contrast"` manually; it is outside the stored
preference contract for now.

## DOM contract

The document root is canonical. The controller sets:

```html
<html data-nt-theme="dark" data-nt-theme-preference="system">
```

- `data-nt-theme="light|dark"` — the attribute the theme CSS renders from.
- `data-nt-theme-preference="system|light|dark"` — informational.

Applications must not set theme attributes on `body` or app roots
independently. The theme token files
(`src/styles/themes/{dark,light,high-contrast}.css`) already select on
`[data-nt-theme='…']`; `:root` defaults to the dark token set.

## Cookie contract

The backend may set the bootstrap cookie:

```text
nt_theme=system | light | dark
Domain=.neetechs.com; Secure; SameSite=Lax   (production)
```

`readThemeCookie(cookieString?)` reads only this cookie, tolerates
malformed values, and rejects anything but the three allowed values. Pass
the request `Cookie` header explicitly during SSR; without an argument it
reads `document.cookie` when a document exists. The frontend never writes
this cookie.

## Cache contract

- Key: `nt_theme_preference` (`NT_THEME_CACHE_KEY`).
- Values: `system | light | dark`; invalid values are deleted on read.
- Read only when no cookie value exists; overridden by backend and cookie.
- All storage access is guarded — storage errors never throw.
- Disable with `useCache: false`.

Legacy app keys (`themeMode`, `selectedTheme`, `aiTheme`, `billingTheme`)
are not read by the controller. Migrate them once at startup:

```ts
import { migrateLegacyThemeCache } from '@neetechs/ui/appearance';

migrateLegacyThemeCache(); // adopts a legacy value only if no canonical
                           // cache exists, then deletes the legacy keys
```

Migration only touches the local cache; it can never overwrite a backend
or cookie preference because the cache sits below both.

## Early bootstrap (anti-flash)

Run before framework rendering — `main.ts`, `main.tsx`, an inline script,
or an Angular initializer:

```ts
import { bootstrapNeetechsTheme } from '@neetechs/ui/appearance';

bootstrapNeetechsTheme(); // cookie → cache → system → default, applies data-nt-theme
```

No network requests, no listeners, no framework dependency. During SSR it
resolves from an explicit cookie string and no-ops on the DOM:

```ts
bootstrapNeetechsTheme({ cookieString: request.headers.cookie ?? '' });
```

## The controller

Create exactly one controller per application:

```ts
import { createThemeController } from '@neetechs/ui/appearance';

const themeController = createThemeController();

themeController.initialize();       // bootstrap sources + system listener
themeController.getState();         // { preference, resolved, source }
themeController.subscribe(state => { /* react to changes */ });

// After the app fetches account settings (the app owns the API call):
themeController.setPreference(settings.appearance, {
  source: 'backend',
  updateCache: true,
});

themeController.destroy();          // removes listeners; re-initializable
```

### System mode

When the preference is `system`, the controller listens to
`(prefers-color-scheme: dark)` via `addEventListener` (with an
`addListener` fallback for older engines) and re-applies the resolved
theme immediately on change. The stored preference stays `system` — the
resolved value is never written back as the preference or to the cache. A
non-`system` preference ignores system changes. `initialize()` is
idempotent; `destroy()` removes the listener.

## Angular SSR integration

```ts
// app.config.ts (application, not this package)
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import {
  bootstrapNeetechsTheme,
  createThemeController,
  type ThemeController,
} from '@neetechs/ui/appearance';

export const NT_THEME_CONTROLLER = new InjectionToken<ThemeController>('nt-theme');

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: NT_THEME_CONTROLLER, useFactory: () => createThemeController() },
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [NT_THEME_CONTROLLER],
      useFactory: (controller: ThemeController) => () => {
        controller.initialize(); // SSR-safe: no-ops without document/window
      },
    },
  ],
};
```

- On the server, pass the request cookie so the rendered HTML already
  carries the right attribute: `createThemeController({ cookieString:
  requestCookieHeader })` (or call `bootstrapNeetechsTheme` with it).
- Hydration is safe because client bootstrap reads the same `nt_theme`
  cookie and sets the same root attribute the server rendered.
- After the app's own settings service loads the account, call
  `controller.setPreference(appearance, { source: 'backend' })`.
- Wrap the controller in an app-local injectable exposing signals if
  desired; the design-system package intentionally ships no Angular code.

## React / Vite integration

```tsx
// main.tsx (application, not this package)
import { bootstrapNeetechsTheme, createThemeController } from '@neetechs/ui/appearance';

bootstrapNeetechsTheme(); // before createRoot — prevents flash

const themeController = createThemeController();
themeController.initialize();

createRoot(document.getElementById('root')!).render(<App />);
```

In components, subscribe with `useSyncExternalStore` so Strict Mode
mount/unmount cycles cannot leak listeners (the controller also tolerates
repeated `initialize()`/`destroy()`):

```tsx
function useNeetechsTheme() {
  const state = useSyncExternalStore(
    themeController.subscribe,
    themeController.getState,
    themeController.getState,
  );
  return { ...state, applyBackendPreference: (p) =>
    themeController.setPreference(p, { source: 'backend' }) };
}
```

## Migrating existing app code

| Replace                                                        | With                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------- |
| `localStorage.getItem('themeMode')` (and similar keys)         | `migrateLegacyThemeCache()` once, then the controller    |
| `document.body.setAttribute('data-nt-theme', mode)`            | `bootstrapNeetechsTheme()` / controller (root `<html>`) |
| `document.querySelector('app-root')?.setAttribute(...)`        | same — the document root is canonical                    |
| per-app `matchMedia('(prefers-color-scheme: dark)')` listeners | the controller's built-in system listener                |
| per-app resolved-theme persistence (`dark`/`light` written back) | keep `system` stored; only the DOM attribute resolves   |

Old `body`/`app-root` attribute selectors keep working while the CSS
matches `[data-nt-theme]` on any element, but they are deprecated:
migrate to the document root and remove app-local theme stores. Duplicate
APIs will not be preserved once all apps are migrated.

## What this package deliberately does not do

- No calls to `/api/v1/account/settings/` or any endpoint.
- No knowledge of authentication, users, or companies.
- No writing of the shared-domain cookie.
- No JavaScript color mapping — colors live only in the CSS token files.
