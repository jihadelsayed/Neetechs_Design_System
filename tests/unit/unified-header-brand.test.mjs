import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ntCreateHeaderBrand, NT_HEADER_BRAND_NAME, NT_HEADER_LOGO_URL } from '../../dist/shell/header/unified-header.brand.js';
import { ntRenderHeader } from '../../dist/shell/header/unified-header.js';

const labels = { primaryNavigation: 'Primary', mobileNavigation: 'Site', openNavigation: 'Open', closeNavigation: 'Close', account: 'Account', accountLoading: 'Checking account' };
const render = brand => ntRenderHeader({ id: 'brand-test', brand, labels, navigation: [] });

test('canonical brand has a single default name, home and logo URL', () => {
  assert.deepEqual(ntCreateHeaderBrand(), { label: NT_HEADER_BRAND_NAME, href: 'https://neetechs.com/', logoUrl: NT_HEADER_LOGO_URL });
  assert.equal(NT_HEADER_BRAND_NAME, 'Neetechs');
});

test('app name, local logo and internal route are preserved', () => {
  const brand = ntCreateHeaderBrand({ appName: 'MyAccount', subtitle: 'Account settings', href: '/en/', internal: true, logoUrl: '/assets/neetechs-logo.png' });
  const html = render(brand);
  assert.equal((html.match(/Neetechs MyAccount/g) || []).length, 2);
  assert.equal((html.match(/src="\/assets\/neetechs-logo.png"/g) || []).length, 2);
  assert.match(html, /href="\/en\/" data-nt-header-internal/);
  assert.match(html, /Account settings/);
});

test('main site may omit application name; explicit null omits both logos', () => {
  const brand = ntCreateHeaderBrand({ logoUrl: null });
  assert.equal('appName' in brand, false);
  assert.equal('logoUrl' in brand, false);
  assert.doesNotMatch(render(brand), /<img /);
});

test('unsafe logo and app labels cannot introduce active HTML', () => {
  const html = render(ntCreateHeaderBrand({ appName: '<script>alert(1)</script>', logoUrl: 'javascript:alert(1)' }));
  assert.doesNotMatch(html, /<script>|<img /);
  assert.equal((html.match(/&lt;script&gt;/g) || []).length, 2);
});

test('explicit custom brand remains supported', () => {
  const html = render({ label: 'Public profile', href: '#home', logoUrl: '/profile.png' });
  assert.equal((html.match(/Public profile/g) || []).length, 2);
  assert.equal((html.match(/src="\/profile.png"/g) || []).length, 2);
});
