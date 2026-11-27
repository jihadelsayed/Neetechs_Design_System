import { expect, test } from '@playwright/test';

async function load(page) {
  await page.goto('/tests/pages/unified-header.html');
  await page.waitForFunction(() => Boolean(window.headerFixture));
}

test.describe('unified header controller', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('reuses matching SSR nodes and rejects duplicate mounting', async ({ page }) => {
    await load(page);
    expect(await page.evaluate(() => {
      const f = window.headerFixture;
      return f.before === f.host.firstElementChild;
    })).toBe(true);
    expect(await page.evaluate(() => {
      const f = window.headerFixture;
      try { f.mount(f.host, f.config); return false; } catch { return true; }
    })).toBe(true);
  });

  test('menus coordinate, Escape restores focus, action fires once', async ({ page }) => {
    await load(page);
    const products = page.locator('#fixture-header-nav-1-trigger');
    const account = page.locator('#fixture-header-account-trigger');
    await products.click();
    await expect(products).toHaveAttribute('aria-expanded', 'true');
    await account.click();
    await expect(products).toHaveAttribute('aria-expanded', 'false');
    await expect(account).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(account).toBeFocused();
    await expect(account).toHaveAttribute('aria-expanded', 'false');
    await account.click();
    await page.getByRole('button', { name: 'Sign out' }).click();
    expect(await page.evaluate(() => window.headerFixture.actions)).toEqual([{ id: 'logout', action: 'logout' }]);
    await expect(account).toHaveAttribute('aria-expanded', 'false');
  });

  test('router receives ordinary same-origin internal clicks only', async ({ page }) => {
    await load(page);
    const tools = page.locator('.nt-navbar [data-nt-header-item="tools"]');
    await tools.click();
    expect(await page.evaluate(() => window.headerFixture.navigations)).toEqual([{ id: 'tools', href: '/tools' }]);
    await tools.evaluate(link => {
      document.addEventListener('click', event => event.preventDefault(), { once: true });
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    });
    expect(await page.evaluate(() => window.headerFixture.navigations.length)).toBe(1);
    expect(page.url()).toContain('/tests/pages/unified-header.html');
  });

  test('updates remove stale identity; unchanged config preserves nodes; destroy is idempotent', async ({ page }) => {
    await load(page);
    expect(await page.evaluate(() => {
      const f = window.headerFixture;
      const before = f.host.firstElementChild;
      f.controller.update(f.config);
      return before === f.host.firstElementChild;
    })).toBe(true);
    await page.evaluate(() => {
      const f = window.headerFixture;
      f.controller.update({ ...f.config, account: { state: 'guest', items: [{ kind: 'action', id: 'login', action: 'login', label: 'Sign in' }] } });
    });
    await expect(page.locator('#header-host')).not.toContainText('Example User');
    await page.locator('#fixture-header-account-trigger').click();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await page.evaluate(() => {
      const f = window.headerFixture;
      f.controller.destroy();
      f.controller.destroy();
      f.controller = f.mount(f.host, f.config, f.options);
    });
    await expect(page.locator('#fixture-header')).toHaveCount(1);
  });

  test('broken avatar tries fallback once then leaves initials', async ({ page }) => {
    await load(page);
    await page.route('**/broken-avatar.png', route => route.abort());
    await page.route('**/broken-fallback.png', route => route.abort());
    await page.evaluate(() => {
      const f = window.headerFixture;
      f.controller.update({ ...f.config, account: { ...f.config.account, identity: { name: 'Example User', avatarUrl: '/broken-avatar.png', fallbackAvatarUrl: '/broken-fallback.png' } } });
    });
    await expect(page.locator('#fixture-header .nt-avatar__image')).toHaveCount(0);
    await expect(page.locator('#fixture-header .nt-avatar__fallback')).toHaveText('EU');
  });
});

test('mobile drawer opens, closes on navigation and releases modal state on destroy', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page);
  const trigger = page.locator('#fixture-header-mobile-trigger');
  const drawer = page.locator('#fixture-header-mobile');
  await trigger.click();
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveAttribute('aria-modal', 'true');
  await drawer.getByRole('link', { name: 'Tools' }).click();
  await expect(drawer).toBeHidden();
  expect(await page.evaluate(() => window.headerFixture.navigations.length)).toBe(1);
  await trigger.click();
  await page.evaluate(() => window.headerFixture.controller.destroy());
  await expect(drawer).toHaveCount(0);
  expect(await page.locator('#main').evaluate(el => el.inert)).toBe(false);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test('keyboard moves across navigation in LTR and RTL and restores panel trigger focus', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await load(page);
  const tools = page.locator('.nt-navbar [data-nt-header-item="tools"]');
  const products = page.locator('#fixture-header-nav-1-trigger');
  await tools.focus();
  await page.keyboard.press('ArrowRight');
  await expect(products).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#fixture-header-nav-1-panel a')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(products).toBeFocused();
  await page.evaluate(() => {
    const f = window.headerFixture;
    f.controller.update({ ...f.config, direction: 'rtl' });
  });
  await tools.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(products).toBeFocused();
});

test('mobile focus stays inside drawer and Escape restores trigger and scroll state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page);
  const trigger = page.locator('#fixture-header-mobile-trigger');
  const drawer = page.locator('#fixture-header-mobile');
  const close = drawer.locator('.nt-mobile-nav__close');
  await trigger.click();
  await expect(close).toBeFocused();
  expect(await page.locator('#main').evaluate(el => el.inert)).toBe(true);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.keyboard.press('Shift+Tab');
  await expect(drawer.locator('[data-nt-header-action="logout"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await page.locator('#main').evaluate(el => el.inert)).toBe(false);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test.describe('touch interaction', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test('touch opens drawer, delegates an action once and closes normally', async ({ page }) => {
    await load(page);
    const trigger = page.locator('#fixture-header-mobile-trigger');
    const drawer = page.locator('#fixture-header-mobile');
    await trigger.tap();
    await expect(drawer).toBeVisible();
    await drawer.locator('[data-nt-header-action="logout"]').tap();
    await expect(drawer).toBeHidden();
    expect(await page.evaluate(() => window.headerFixture.actions)).toEqual([{ id: 'logout', action: 'logout' }]);
    expect(await page.locator('#main').evaluate(el => el.inert)).toBe(false);
    await trigger.tap();
    await drawer.locator('.nt-mobile-nav__close').tap();
    await expect(drawer).toBeHidden();
  });
});
