import { expect, test } from '@playwright/test';

async function load(page, width, direction = 'ltr') {
  await page.setViewportSize({ width, height: 844 });
  await page.goto('/tests/pages/unified-header.html');
  await page.waitForFunction(() => Boolean(window.headerFixture));
  await page.evaluate(dir => {
    const f = window.headerFixture;
    f.controller.update({
      ...f.config,
      direction: dir,
      brand: { ...f.config.brand, appName: 'MyAccount Professional Workspace' },
      appearance: { label: 'Appearance', selectedId: 'dark', choices: [{ id: 'dark', label: 'Dark', action: 'dark' }] },
      language: { label: 'Language', selectedId: 'en', choices: [{ id: 'en', label: 'English', action: 'english' }] },
      appSwitcher: { kind: 'group', id: 'apps', label: 'Applications', children: [{ kind: 'link', id: 'billing-app', label: 'Billing app', href: '/billing', internal: true }] },
      actions: [{ kind: 'action', id: 'notify', label: 'Notifications', action: 'notify' }],
    });
  }, direction);
}

for (const width of [320, 390, 768, 1024, 1025, 1280, 1440]) {
  test('unified header fits viewport ' + width, async ({ page }) => {
    await load(page, width);
    const header = page.locator('#fixture-header');
    const mobile = width <= 1024;
    if (mobile) await expect(header.locator('.nt-header__mobile-trigger')).toBeVisible();
    else await expect(header.locator('.nt-header__mobile-trigger')).toBeHidden();
    if (mobile) await expect(header.locator('.nt-header__extras')).toBeHidden();
    else await expect(header.locator('.nt-header__extras')).toBeVisible();
    if (mobile) await expect(header.locator('.nt-header__nav')).toBeHidden();
    else await expect(header.locator('.nt-header__nav')).toBeVisible();
    await expect(header.locator('#fixture-header-account-trigger')).toBeVisible();
    expect(await header.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    if (mobile) {
      await header.locator('.nt-header__mobile-trigger').click();
      const drawer = page.locator('#fixture-header-mobile');
      await expect(drawer).toBeVisible();
      await expect(drawer.getByRole('button', { name: 'Notifications' })).toBeVisible();
      await expect(drawer.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
      await expect(drawer.getByRole('button', { name: 'English' })).toBeVisible();
      await expect(drawer.getByRole('link', { name: 'Billing app' })).toBeVisible();
      await drawer.getByRole('button', { name: 'Notifications' }).click();
      await expect(drawer).toBeHidden();
      expect(await page.evaluate(() => window.headerFixture.actions.filter(a => a.action === 'notify').length)).toBe(1);
    }
  });
}

test('RTL mobile drawer preserves all controls', async ({ page }) => {
  await load(page, 390, 'rtl');
  await page.locator('#fixture-header-mobile-trigger').click();
  const drawer = page.locator('#fixture-header-mobile');
  await expect(drawer).toHaveAttribute('dir', 'rtl');
  await expect(drawer.getByRole('button', { name: 'English' })).toBeVisible();
  expect(await drawer.evaluate(el => el.getBoundingClientRect().right <= window.innerWidth + 1)).toBe(true);
});

test('switching viewport clears open menus and releases modal background', async ({ page }) => {
  await load(page, 1280);
  const theme = page.locator('#fixture-header-appearance-trigger');
  await theme.click();
  await expect(theme).toHaveAttribute('aria-expanded', 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(theme).toHaveAttribute('aria-expanded', 'false');
  await page.locator('#fixture-header-mobile-trigger').click();
  await expect(page.locator('#fixture-header-mobile')).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 844 });
  await expect(page.locator('#fixture-header-mobile')).toBeHidden();
  expect(await page.locator('#main').evaluate(el => el.inert)).toBe(false);
});
