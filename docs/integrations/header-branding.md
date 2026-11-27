# Shared Neetechs header branding

Use `ntCreateHeaderBrand()` for the canonical Neetechs identity. Pass an optional product suffix such as MyAccount, Apply, Billing or Tools. The same name and image appear in the header and mobile drawer. Keep existing app-specific navigation and route handling.

```ts
import { ntCreateHeaderBrand } from '@neetechs/ui';

const brand = ntCreateHeaderBrand({
  appName: 'MyAccount',
  href: 'https://neetechs.com/',
});
```

The default logo URL is the existing main website's logo path. The exact PNG from Neetechs_Frontend/main/public/logo - 128.png is also shipped as `@neetechs/ui/assets/neetechs-logo.png` (Git blob 3589b6aeede14161046c1a178e9206f08fba5e66). Prefer a same-origin copy for offline or restrictive CSP deployments: use the consumer build's asset-copy pipeline or asset URL import, and pass its final public URL as `logoUrl`. Do not pass a bare npm package specifier as an image URL. The export will be available after a tested package release.

Pass `logoUrl: null` for text-only branding, or a custom `NtHeaderBrand` directly for an intentionally distinct public profile or workspace. The renderer still validates URLs and escapes names. The logo is decorative alongside visible text. No app-specific route, authentication or styling change is implied.

The public URL is inferred from the current main website source, not verified against the live host. Confirm asset delivery and packaging in the consumer build and browser gate before deployment.
