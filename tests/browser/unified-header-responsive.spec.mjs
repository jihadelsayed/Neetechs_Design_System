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

test('desktop width constraints start immediately above the mobile breakpoint', async ({ page }) => {
  for (const width of [1024, 1025]) {
    await load(page, width);
    const left = page.locator('#fixture-header .nt-header__left');
    expect(await left.evaluate(el => getComputedStyle(el).maxWidth)).toBe(width > 1024 ? '30%' : 'none');
    expect(await page.evaluate(() => matchMedia('not all and (max-width: 64rem)').matches)).toBe(width > 1024);
  }
});

test('explicit root theme preserves native color scheme and header foreground', async ({ page }) => {
  await load(page, 1280);
  const header = page.locator('#fixture-header');
  for (const [theme, scheme, foreground] of [
    ['dark', 'dark', 'rgb(248, 250, 252)'],
    ['light', 'light', 'rgb(2, 6, 23)'],
    ['high-contrast', 'dark', 'rgb(255, 255, 255)'],
  ]) {
    await page.evaluate(value => { document.documentElement.dataset.ntTheme = value; }, theme);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(scheme);
    await expect(header).toHaveCSS('color', foreground);
    if (theme === 'high-contrast') await expect(header).toHaveCSS('background-color', 'rgb(5, 5, 5)');
  }
  await page.evaluate(() => { delete document.documentElement.dataset.ntTheme; });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark');
});

test('forced colors disable glass filtering and preserve disclosure controls', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await load(page, 1280);
  await expect(page.locator('#fixture-header')).toHaveCSS('backdrop-filter', 'none');
  const account = page.locator('#fixture-header-account-trigger');
  await account.focus();
  await page.keyboard.press('Enter');
  await expect(account).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(account).toBeFocused();
});

test('RTL drawer anchors to the viewport inline start', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await load(page, 390, 'rtl');
  await page.locator('#fixture-header-mobile-trigger').click();
  const drawer = page.locator('#fixture-header-mobile');
  await expect(drawer).toBeVisible();
  expect(await drawer.evaluate(el => Math.abs(el.getBoundingClientRect().right - document.documentElement.clientWidth))).toBeLessThan(2);
});

for (const [width, height] of [[320, 240], [390, 300], [1280, 240], [1280, 400]]) {
  for (const direction of ['ltr', 'rtl']) {
    test('long account menu scrolls within ' + width + 'x' + height + ' ' + direction, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await load(page, width, direction);
      await page.setViewportSize({ width, height });
      await page.evaluate(dir => {
        const f = window.headerFixture;
        f.controller.update({
          ...f.config, direction: dir,
          account: {
            ...f.config.account,
            items: Array.from({ length: 20 }, (_, i) => ({
              kind: 'action', id: 'item-' + i, action: 'item-' + i, label: 'Action ' + i,
            })),
          },
        });
      }, direction);
      await page.locator('#fixture-header-account-trigger').click();
      const panel = page.locator('#fixture-header-account-panel');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveCSS('overflow-y', 'auto');
      expect(await panel.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= innerHeight + 1 && el.scrollHeight > el.clientHeight;
      })).toBe(true);
      await panel.evaluate(el => { el.scrollTop = el.scrollHeight; });
      const last = panel.locator('[data-nt-header-action="item-19"]');
      expect(await last.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const bounds = el.closest('.nt-profile-menu').getBoundingClientRect();
        return rect.top >= bounds.top && rect.bottom <= bounds.bottom + 1 && rect.bottom <= innerHeight + 1;
      })).toBe(true);
      await last.click();
      await expect(panel).toBeHidden();
      expect(await page.evaluate(() => window.headerFixture.actions.at(-1))).toEqual({ id: 'item-19', action: 'item-19' });
    });
  }
}

for (const width of [1025, 1280, 1440]) {
  for (const direction of ['ltr', 'rtl']) {
    for (const contextualAction of [false, true]) {
      test('desktop disclosure controls fit ' + width + ' ' + direction + ' contextual=' + contextualAction, async ({ page }) => {
        await load(page, width, direction);
        await page.evaluate(({ direction, contextualAction }) => {
          const f = window.headerFixture;
          f.controller.update({
            ...f.config, direction,
            brand: { ...f.config.brand, appName: 'MyAccount Professional Workspace Long Title' },
            account: { ...f.config.account, identity: { name: 'Very Long Account Holder Name With Many Words' } },
            appearance: { ...f.config.appearance, label: 'Long appearance label' },
            language: { label: 'Long language selection label', selectedId: 'en', choices: [{ id: 'en', label: 'English', action: 'english' }] },
            appSwitcher: { kind: 'group', id: 'apps', label: 'Long applications label', children: [{ kind: 'link', id: 'billing-app', label: 'Billing', href: '/billing' }] },
            actions: contextualAction ? [{ kind: 'action', id: 'context', action: 'context', label: 'Long contextual action label' }] : [],
            notifications: { label: 'Long notification label', unreadCount: 99, items: [], emptyLabel: 'No new notifications' },
          });
        }, { direction, contextualAction });
        const controls = page.locator('#fixture-header .nt-header__right button').filter({ visible: true });
        expect(await controls.evaluateAll(elements => elements.every((el, i) => {
          const a = el.getBoundingClientRect();
          return el.scrollWidth <= el.clientWidth + 1 && elements.slice(i + 1).every(other => {
            const b = other.getBoundingClientRect();
            return Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1;
          });
        }))).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        const notification = page.locator('#fixture-header-notifications-trigger');
        await expect(notification).toHaveAccessibleName('Long notification label (99)');
        await expect(notification.locator('.nt-header__notification-count')).toBeVisible();
        if (width <= 1280) await expect(notification.locator('.nt-header__control-label')).toBeHidden();
        else await expect(notification.locator('.nt-header__control-label')).toBeVisible();
        await notification.click();
        await expect(page.locator('#fixture-header-notifications-panel')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(notification).toBeFocused();
      });
    }
  }
}
