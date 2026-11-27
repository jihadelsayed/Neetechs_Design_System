import { expect, test } from '@playwright/test';
import { ntRenderHeader } from '../../dist/shell/header/unified-header.js';

const config = {
  id: 'ssr-header',
  brand: { label: 'Neetechs', href: '/', internal: true, appName: 'MyAccount' },
  navigation: [
    { kind: 'link', id: 'tools', label: 'Tools', href: '/tools', internal: true, current: true },
    { kind: 'group', id: 'products', label: 'Products', children: [{ kind: 'link', id: 'billing', label: 'Billing', href: 'https://billing.neetechs.com' }] },
  ],
  labels: {
    primaryNavigation: 'Primary', mobileNavigation: 'Site', openNavigation: 'Open menu',
    closeNavigation: 'Close menu', account: 'Account', accountLoading: 'Checking account',
  },
  account: { state: 'loading' },
};
const authenticated = {
  ...config,
  account: {
    state: 'authenticated',
    identity: { name: 'Example User', email: 'example@example.test' },
    items: [{ kind: 'action', id: 'logout', label: 'Sign out', action: 'logout' }],
  },
};
const guest = {
  ...config,
  account: { state: 'guest', items: [{ kind: 'action', id: 'login', label: 'Sign in', action: 'login' }] },
};

function documentHtml(markup) {
  return '<!doctype html><html lang="en"><body><div id="host">' + markup + '</div></body></html>';
}

test('server-generated loading HTML does not expose account actions before verification', async ({ page }) => {
  await page.setContent(documentHtml(ntRenderHeader(config)));
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.getByRole('status')).toHaveAttribute('aria-label', 'Checking account');
  await expect(page.locator('[data-nt-header-action]')).toHaveCount(0);
});

test('server HTML and client template parser produce equivalent DOM', async ({ page }) => {
  const html = ntRenderHeader(config);
  await page.setContent(documentHtml(html));
  expect(await page.evaluate(markup => {
    const template = document.createElement('template');
    template.innerHTML = markup;
    const actual = [...document.querySelector('#host').childNodes];
    const expected = [...template.content.childNodes];
    return actual.length === expected.length && actual.every((node, i) => node.isEqualNode(expected[i]));
  }, html)).toBe(true);
});

test('two independent instances have unique accessible references and preserve RTL', async ({ page }) => {
  const rtl = { ...authenticated, id: 'rtl-header', direction: 'rtl', brand: { label: 'نيتكس', href: '/' } };
  await page.setContent(documentHtml(ntRenderHeader(authenticated) + ntRenderHeader(rtl)));
  await expect(page.locator('header')).toHaveCount(2);
  expect(await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    return ids.length === new Set(ids).size &&
      [...document.querySelectorAll('[aria-controls], [aria-labelledby]')].every(el =>
        ['aria-controls', 'aria-labelledby'].every(attr =>
          (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean).every(id => document.getElementById(id))));
  })).toBe(true);
  await expect(page.locator('#rtl-header')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('#rtl-header-mobile')).toHaveAttribute('dir', 'rtl');
});

test('guest markup contains neither authenticated identity nor logout action', async ({ page }) => {
  await page.setContent(documentHtml(ntRenderHeader(guest)));
  await expect(page.locator('#host')).not.toContainText('Example User');
  await expect(page.locator('[data-nt-header-action="login"]')).toHaveCount(2);
  await expect(page.locator('[data-nt-header-action="logout"]')).toHaveCount(0);
  await expect(page.locator('#ssr-header-account-panel [data-nt-header-action="login"]')).toHaveCount(1);
  await expect(page.locator('#ssr-header-mobile [data-nt-header-action="login"]')).toHaveCount(1);
  await expect(page.locator('#ssr-header-account-panel')).toBeHidden();
  await expect(page.locator('#ssr-header-mobile')).toBeHidden();
});

test('hostile labels and URLs remain inert when parsed as a document', async ({ page }) => {
  const hostile = {
    ...config, id: 'hostile-header',
    brand: { label: '<script>window.__injected=true</script>', href: 'javascript:window.__injected=true', logoUrl: 'data:image/svg+xml,evil' },
    navigation: [{ kind: 'link', id: 'unsafe', label: '<img src=x onerror="window.__injected=true">', href: 'java\nscript:window.__injected=true' }],
  };
  await page.setContent(documentHtml(ntRenderHeader(hostile)));
  await expect(page.locator('script, img, [onerror]')).toHaveCount(0);
  await expect(page.locator('a[href]')).toHaveCount(0);
  await expect(page.locator('button[disabled]')).toHaveCount(2);
  expect(await page.evaluate(() => window.__injected === undefined)).toBe(true);
});

// Real mount integration: the HTML is produced by Node, not by a browser import.
// This test uses the package's existing HTTP test gallery to resolve ESM imports.
test('mount reuses real server markup and replaces a stale snapshot before attaching', async ({ page }) => {
  await page.goto('/tests/pages/unified-header.html');
  await page.waitForFunction(() => Boolean(window.headerFixture));
  await page.evaluate(() => window.headerFixture.controller.destroy());
  const rendered = ntRenderHeader(authenticated);
  await page.evaluate(async ({ html, config, guest }) => {
    const { ntMountHeader } = await import('/dist/index.js');
    const host = document.querySelector('#header-host');
    host.innerHTML = html;
    const before = host.firstElementChild;
    const matching = ntMountHeader(host, config);
    window.__ssrReused = host.firstElementChild === before;
    matching.destroy();
    host.innerHTML = html;
    window.__ssrController = ntMountHeader(host, guest);
  }, { html: rendered, config: authenticated, guest });
  expect(await page.evaluate(() => window.__ssrReused)).toBe(true);
  await expect(page.locator('#header-host')).not.toContainText('Example User');
  await expect(page.locator('[data-nt-header-action="logout"]')).toHaveCount(0);
  await expect(page.locator('[data-nt-header-action="login"]')).toHaveCount(2);
  await page.locator('#ssr-header-account-trigger').click();
  await expect(page.locator('#ssr-header-account-panel')).toBeVisible();
  await page.evaluate(() => window.__ssrController.destroy());
  await expect(page.locator('#header-host header')).toHaveCount(0);
});

test('SSR preserves optional notification and preference controls in RTL', async ({ page }) => {
  const html = ntRenderHeader({
    ...authenticated, direction: 'rtl',
    appearance: { label: 'Appearance', selectedId: 'dark', choices: [{ id: 'dark', label: 'Dark', action: 'dark' }] },
    language: { label: 'Language', selectedId: 'ar', choices: [{ id: 'ar', label: 'العربية', action: 'ar' }] },
    notifications: { label: 'Notifications', unreadCount: 120, emptyLabel: 'Nothing new', items: [{ kind: 'action', id: 'notice', label: 'Open notifications', action: 'notice' }] },
  });
  await page.setContent(documentHtml(html));
  await expect(page.locator('[data-nt-header-item="notice"]')).toHaveCount(2);
  await expect(page.locator('.nt-header__notification-count')).toHaveText(['99+', '99+']);
  await expect(page.locator('#ssr-header-notifications-trigger')).toHaveAttribute('aria-label', 'Notifications (120)');
  await expect(page.locator('[aria-pressed="true"]')).toHaveCount(4);
  await expect(page.locator('#ssr-header')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('#ssr-header-mobile')).toHaveAttribute('dir', 'rtl');
});
