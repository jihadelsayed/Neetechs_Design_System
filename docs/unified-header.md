# Unified global header

**Release status:** additive implementation on main, not yet verified as an npm release. The source manifest is 0.3.0; confirm npm availability and root exports before adopting. Existing apps using 0.2.0 must keep their working headers until validation.

Import the shared stylesheet once and use the framework-independent API at the package root. All navigation, account, appearance, notification and app-switcher controls use one renderer and one controller. The UI does not authenticate users, determine permissions, call APIs, persist settings or perform logout itself.

## Minimal configuration

```ts
import { ntCreateHeaderBrand, ntCreateEcosystemNavigation, type NtHeaderConfig } from '@neetechs/ui';
import '@neetechs/ui/styles.css';

const config: NtHeaderConfig = {
  id: 'site-header',
  brand: ntCreateHeaderBrand({ appName: 'MyAccount' }),
  ...ntCreateEcosystemNavigation({
    labels: { tools: 'Tools', products: 'Products', company: 'Company' },
  }),
  labels: {
    primaryNavigation: 'Main navigation',
    mobileNavigation: 'Site navigation',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    account: 'Account',
    accountLoading: 'Checking account',
  },
  account: { state: 'loading' },
  direction: 'ltr',
  presentation: 'sticky',
};
```

Use a stable unique ID, including across independently rendered headers. Supply immutable snapshots. The application may supply translated labels, explicit workspace/context slots, and a permission-filtered application catalog. Billing, product dropdown and app switcher are opt-in; omit them where unsupported.

## Lifecycle

```ts
import { ntMountHeader, ntRenderHeader, type NtHeaderConfig } from '@neetechs/ui';

export function renderOnServer(config: NtHeaderConfig): string {
  return ntRenderHeader(config);
}

export function attachInBrowser(host: HTMLElement, config: NtHeaderConfig) {
  return ntMountHeader(host, config, {
    onAction: ({ action }) => {
      // Dispatch recognized IDs to the application's existing services.
      // Unknown IDs are ignored.
      void action;
    },
    onNavigate: () => false, // Browser follows links unless the host router accepts them.
  });
}
```

Call controller.update(nextConfig) after a verified state change, closeMenus() when integrating other overlays if necessary, and destroy() before unmounting. Do not mount twice into one host. The host must be connected and dedicated to header DOM. Use the same initial snapshot and ID on server/client, with loading auth until verified. Keep browser access out of server rendering.

## Integration references

- [Angular 20 adapter and tests](integrations/angular/README.md).
- [React 18 adapter and tests](integrations/react/README.md).
- [Plain HTML/JavaScript example](integrations/html/README.md).
- [Account, logout, preference and notification contract](integrations/header-account.md).
- [Verification and release runbook](unified-header-release.md).

## Design and migration rules

Use the canonical brand or a deployed local logo URL. The package asset is exported at @neetechs/ui/assets/neetechs-logo.png; a bundler or static host must copy/resolve that asset into a browser URL. Never pass a bare package specifier as an image src.

One semantic global header per shell. Preserve page-specific headers, CV/document exclusions, skip links, workspace controls, app sidebar and existing routes. The shared drawer must not be trapped inside a lower stacking context, transformed ancestor or short sticky wrapper. Verify page-local overlays, focus, scroll locking, RTL, responsive breakpoints and touch in the real application.

The design system provides no backend authorization. Do not pass secrets, raw HTML, tokens, or private data into a server-rendered header. Host code owns logout, permissions, navigation, localization and theme state. Do not set a parallel theme store just for the header.

**Adoption is gated:** no consumer migration, npm publication or deployment is considered complete until the complete package and actual framework/browser tests pass. MyAccount is the first pilot.
