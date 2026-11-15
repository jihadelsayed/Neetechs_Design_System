import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pagePath = '/tests/pages/actions-overlays.html';

async function load(page, attributes = {}) {
  await page.goto(pagePath);
  await page.waitForFunction(() => window.fixtureReady === true);
  await page.locator('html').evaluate((html, values) => {
    for (const [name, value] of Object.entries(values)) html.setAttribute(name, value);
  }, attributes);
}

const settle = (page) => page.evaluate(() => Promise.all(
  document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
));

for (const appearance of [
  { name: 'light', attributes: {} },
  { name: 'dark', attributes: { 'data-nt-theme': 'dark' } },
  { name: 'high contrast', attributes: { 'data-nt-theme': 'dark', 'data-nt-contrast': 'high' } },
]) {
  test(`button groups and open popover pass axe (${appearance.name})`, async ({ page }) => {
    await load(page, appearance.attributes);
    await page.locator('#filters-trigger').click();
    await settle(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, results.violations.map(({ id, help }) => `${id}: ${help}`).join('\n')).toEqual([]);
  });
}

test('attached button group joins borders and mirrors corners in RTL', async ({ page }) => {
  await load(page);
  const radii = () => page.evaluate(() => {
    const [first, , last] = document.querySelectorAll('#attached-group .nt-button');
    const style = (element) => getComputedStyle(element);
    return {
      firstLeft: style(first).borderTopLeftRadius,
      firstRight: style(first).borderTopRightRadius,
      lastLeft: style(last).borderTopLeftRadius,
      lastRight: style(last).borderTopRightRadius,
      gap: style(document.querySelector('#attached-group')).columnGap,
    };
  });
  const ltr = await radii();
  expect(ltr.firstRight).toBe('0px');
  expect(ltr.lastLeft).toBe('0px');
  expect(ltr.firstLeft).not.toBe('0px');
  expect(ltr.gap).toBe('0px');

  await page.locator('html').evaluate((html) => { html.dir = 'rtl'; });
  const rtl = await radii();
  expect(rtl.firstLeft).toBe('0px');
  expect(rtl.firstRight).not.toBe('0px');
});

test('pressed toggle state is exposed and not color-only', async ({ page }) => {
  await load(page);
  await page.locator('#align-center').click();
  await expect(page.locator('#align-center')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#align-start')).toHaveAttribute('aria-pressed', 'false');
  const shadow = await page.locator('#align-center').evaluate((element) => getComputedStyle(element).boxShadow);
  expect(shadow).toContain('inset');
});

test('popover is a non-modal dialog that moves focus in and restores it on Escape', async ({ page }) => {
  await load(page);
  const trigger = page.locator('#filters-trigger');
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await trigger.click();
  const content = page.locator('#filters');
  await expect(content).toBeVisible();
  await expect(content).toHaveAttribute('role', 'dialog');
  expect(await content.getAttribute('aria-modal')).toBeNull();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#filters-close')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(content).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('popover closes on outside click, close button, and focus leaving', async ({ page }) => {
  await load(page);
  await page.locator('#filters-trigger').click();
  await page.locator('h1').click();
  await expect(page.locator('#filters')).toBeHidden();

  await page.locator('#filters-trigger').click();
  await page.locator('#filters-close').click();
  await expect(page.locator('#filters')).toBeHidden();
  await expect(page.locator('#filters-trigger')).toBeFocused();

  await page.locator('#filters-trigger').click();
  await page.locator('#apply-filters').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#filters')).toBeHidden();
});

test('open popover paints above positioned cards and stays in the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await load(page);
  await page.locator('#filters-trigger').click();
  await settle(page);
  const result = await page.locator('#filters').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.bottom - 8);
    return { topmost: Boolean(hit && element.contains(hit)), right: rect.right, left: rect.left };
  });
  expect(result.topmost).toBe(true);
  expect(result.left).toBeGreaterThanOrEqual(0);
  expect(result.right).toBeLessThanOrEqual(360);
});
