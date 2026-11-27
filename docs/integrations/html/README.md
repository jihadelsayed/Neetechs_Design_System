# Plain HTML and JavaScript unified header example

Requires the verified new package exports. Use a bundler that resolves npm imports; this is not a standalone file:// demo and does not require a CDN.

```html
<div id="header-host" style="display: contents"></div>
<main id="main-content">Page content</main>
<script type="module" src="./header.js"></script>
```

```js
import '@neetechs/ui/styles.css';
import { ntCreateHeaderBrand, ntCreateEcosystemNavigation, ntCreateHeaderPreference, ntMountHeader } from '@neetechs/ui';

const host = document.querySelector('#header-host');
const labels = {
  primaryNavigation: 'Main navigation', mobileNavigation: 'Site navigation',
  openNavigation: 'Open navigation', closeNavigation: 'Close navigation',
  account: 'Account', accountLoading: 'Checking account',
};
const navigation = ntCreateEcosystemNavigation({
  labels: { tools: 'Tools', products: 'Products', company: 'Company' },
});

let theme = document.documentElement.dataset.ntTheme === 'light' ? 'light' : 'dark';
function snapshot() {
  const appearance = ntCreateHeaderPreference({
    label: 'Appearance', selectedId: theme,
    choices: [
      { id: 'light', label: 'Light', action: 'theme.light' },
      { id: 'dark', label: 'Dark', action: 'theme.dark' },
    ],
  });
  return { id: 'plain-header', brand: ntCreateHeaderBrand(), ...navigation,
    labels, appearance, presentation: 'sticky' };
}

const controller = ntMountHeader(host, snapshot(), {
  onAction: ({ action }) => {
    if (action !== 'theme.light' && action !== 'theme.dark') return;
    theme = action === 'theme.light' ? 'light' : 'dark';
    document.documentElement.dataset.ntTheme = theme;
    controller.update(snapshot());
  },
});
// When an SPA removes the host, call controller.destroy().
```

This standalone demo deliberately omits account and notifications. Existing apps should delegate appearance changes to their existing appearance store instead of implementing another store. For SSR, use ntRenderHeader(config) in the server response and mount with the same initial snapshot; never insert untrusted HTML. For complete test coverage run the actual package browser suite.
