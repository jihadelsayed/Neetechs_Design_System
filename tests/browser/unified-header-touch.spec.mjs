import { expect, test } from '@playwright/test';

test.describe('unified header touch regression', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('tap opens drawer, delegates an action once, and permits reopening', async ({ page }) => {
    await page.goto('/tests/pages/unified-header.html');
    await page.waitForFunction(() => Boolean(window.headerFixture));
    const trigger = page.locator('#fixture-header-mobile-trigger');
    const drawer = page.locator('#fixture-header-mobile');
    await trigger.tap();
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    await drawer.getByRole('button', { name: 'Light', exact: true }).tap();
    await expect(drawer).toBeHidden();
    expect(await page.evaluate(() => window.headerFixture.actions)).toEqual([{ id: 'light', action: 'light' }]);
    await trigger.tap();
    await expect(drawer).toBeVisible();
    await drawer.getByRole('button', { name: 'Close site menu' }).tap();
    await expect(drawer).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(await page.locator('#main').evaluate(el => el.inert)).toBe(false);
  });

  test('tap account dropdown outside drawer and dispatches one action', async ({ page }) => {
    await page.goto('/tests/pages/unified-header.html');
    await page.waitForFunction(() => Boolean(window.headerFixture));
    const account = page.locator('#fixture-header-account-trigger');
    await account.tap();
    await expect(account).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#fixture-header-account-panel').getByRole('button', { name: 'Sign out' }).tap();
    await expect(account).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => window.headerFixture.actions)).toEqual([{ id: 'logout', action: 'logout' }]);
  });
});
