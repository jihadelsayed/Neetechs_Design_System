import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { ntAppearanceBootstrapScript } from '../../dist/appearance/index.js';

const pagePath = '/tests/pages/site-chrome.html';

async function load(page, { lang = 'en', dir = 'ltr', theme, contrast } = {}) {
  await page.goto(pagePath);
  await page.waitForFunction(() => window.siteChromeReady === true);
  await page.locator('html').evaluate((html, value) => {
    html.lang = value.lang;
    html.dir = value.dir;
    if (value.theme) html.setAttribute('data-nt-theme', value.theme);
    if (value.contrast) html.setAttribute('data-nt-contrast', value.contrast);
  }, { lang, dir, theme, contrast });
}

/** Waits for running CSS animations so axe and geometry read final, not mid-fade, values. */
const settle = (page) => page.evaluate(() => Promise.all(
  document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
));

const hitTestCenter = (locator) => locator.evaluate((element) => {
  const rect = element.getBoundingClientRect();
  const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  return Boolean(hit && element.contains(hit));
});

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const appearance of [
    { name: 'dark', theme: 'dark' },
    { name: 'light', theme: 'light' },
    { name: 'high contrast', theme: 'dark', contrast: 'high' },
    { name: 'Arabic RTL light', theme: 'light', lang: 'ar', dir: 'rtl' },
  ]) {
    test(`site chrome has no axe violations (${appearance.name}) with menus open`, async ({ page }) => {
      await load(page, appearance);
      await page.locator('#products-trigger').click();
      await settle(page);
      let results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, results.violations.map(({ id, help }) => `${id}: ${help}`).join('\n')).toEqual([]);

      await page.locator('#account-trigger').click();
      await settle(page);
      results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, results.violations.map(({ id, help }) => `${id}: ${help}`).join('\n')).toEqual([]);
    });
  }

  test('navbar disclosure: click toggles, one panel at a time, Escape restores focus', async ({ page }) => {
    await load(page);
    const products = page.locator('#products-trigger');
    const resources = page.locator('#resources-trigger');

    await expect(products).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#products-panel')).toBeHidden();

    await products.click();
    await expect(products).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#products-panel')).toBeVisible();

    await resources.click();
    await expect(products).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#products-panel')).toBeHidden();
    await expect(page.locator('#resources-panel')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#resources-panel')).toBeHidden();
    await expect(resources).toBeFocused();
  });

  test('navbar keyboard: ArrowDown enters the panel, arrows rove, inline arrows follow direction', async ({ page }) => {
    await load(page);
    await page.locator('#products-trigger').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#products-panel')).toBeVisible();
    await expect(page.getByRole('link', { name: /^Billing/ }).first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('link', { name: /^Calendar/ }).first()).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.getByRole('link', { name: /^Neetechs AI/ }).first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('link', { name: /^Billing/ }).first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#products-trigger')).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#resources-trigger')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#products-trigger')).toBeFocused();

    await page.locator('html').evaluate((html) => { html.dir = 'rtl'; });
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#resources-trigger')).toBeFocused();
  });

  test('navbar closes on outside click and when focus leaves it', async ({ page }) => {
    await load(page);
    await page.locator('#products-trigger').click();
    await page.locator('#home').click();
    await expect(page.locator('#products-panel')).toBeHidden();

    await page.locator('#products-trigger').click();
    await page.locator('#nav-pricing').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#products-panel')).toBeHidden();
  });

  test('header dropdowns paint above positioned and hovered page cards', async ({ page }) => {
    await load(page);
    await page.locator('#products-trigger').click();
    const panel = page.locator('#products-panel');
    await expect(panel).toBeVisible();
    expect(await hitTestCenter(panel)).toBe(true);

    await page.locator('#account-trigger').click();
    const account = page.locator('#account-panel');
    await expect(account).toBeVisible();
    expect(await hitTestCenter(account)).toBe(true);

    const box = await account.boundingBox();
    const viewport = page.viewportSize();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);

    const layering = await page.evaluate(() => {
      const z = (selector) => getComputedStyle(document.querySelector(selector)).zIndex;
      return { header: z('#site-header'), panel: z('#products-panel'), card: z('#card-1') };
    });
    expect(layering.header).toBe('200');
    expect(layering.panel).toBe('400');
    expect(layering.card).toBe('auto');
  });

  test('account dropdown: identity, roving actions, Escape and outside click', async ({ page }) => {
    await load(page);
    const trigger = page.locator('#account-trigger');
    await expect(trigger).toHaveAccessibleName('Account: Sara Ali');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#account-panel')).toContainText('sara@example.com');

    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('link', { name: 'Profile' })).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#account-panel')).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await page.mouse.click(20, 400);
    await expect(page.locator('#account-panel')).toBeHidden();

    await trigger.click();
    await page.getByRole('link', { name: 'Account settings' }).click();
    await expect(page.locator('#account-panel')).toBeHidden();
  });

  test('desktop shows the navbar and hides the mobile menu button', async ({ page }) => {
    await load(page);
    await expect(page.locator('#navbar')).toBeVisible();
    await expect(page.locator('#mobile-trigger')).toBeHidden();
  });

  test('wide footer lays brand beside columns and the bottom bar in one row', async ({ page }) => {
    await load(page);
    const layout = await page.evaluate(() => ({
      inner: getComputedStyle(document.querySelector('.nt-footer__inner')).gridTemplateColumns.split(' ').length,
      bottom: getComputedStyle(document.querySelector('.nt-footer__bottom')).flexDirection,
    }));
    expect(layout.inner).toBe(2);
    expect(layout.bottom).toBe('row');
  });

  test('reduced motion removes navbar and mobile drawer animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await load(page);
    await page.locator('#products-trigger').click();
    const animation = await page.locator('#products-panel').evaluate((element) => getComputedStyle(element).animationName);
    expect(animation).toBe('none');
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });

  test('mobile menu: opens as a modal drawer, traps focus, Escape restores focus', async ({ page }) => {
    await load(page);
    await expect(page.locator('#navbar')).toBeHidden();
    const trigger = page.locator('#mobile-trigger');
    await expect(trigger).toBeVisible();

    await trigger.click();
    const drawer = page.locator('#mobile-nav');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(await drawer.evaluate((element) => element.contains(document.activeElement))).toBe(true);

    for (let index = 0; index < 8; index += 1) await page.keyboard.press('Tab');
    expect(await drawer.evaluate((element) => element.contains(document.activeElement))).toBe(true);

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('mobile menu closes on navigation, close button, and backdrop', async ({ page }) => {
    await load(page);
    await page.locator('#mobile-trigger').click();
    await page.locator('#mobile-nav').getByRole('link', { name: 'Billing' }).click();
    await expect(page.locator('#mobile-nav')).toBeHidden();

    await page.locator('#mobile-trigger').click();
    await page.locator('#mobile-close').click();
    await expect(page.locator('#mobile-nav')).toBeHidden();

    await page.locator('#mobile-trigger').click();
    await page.mouse.click(360, 400);
    await expect(page.locator('#mobile-nav')).toBeHidden();
  });

  test('open mobile menu closes when the viewport grows to desktop', async ({ page }) => {
    await load(page);
    await page.locator('#mobile-trigger').click();
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('#mobile-nav')).toBeHidden();
  });

  test('RTL mobile drawer anchors to the inline-start (right) edge', async ({ page }) => {
    await load(page, { lang: 'ar', dir: 'rtl' });
    await page.locator('#mobile-trigger').click();
    await settle(page);
    const box = await page.locator('#mobile-nav').boundingBox();
    expect(Math.round(box.x + box.width)).toBe(375);
  });

  test('touch targets in the site chrome are at least 44px', async ({ page }) => {
    await load(page);
    const trigger = await page.locator('#mobile-trigger').boundingBox();
    const account = await page.locator('#account-trigger').boundingBox();
    expect(trigger.width).toBeGreaterThanOrEqual(44);
    expect(trigger.height).toBeGreaterThanOrEqual(44);
    expect(account.height).toBeGreaterThanOrEqual(44);
    await page.locator('#mobile-trigger').click();
    const item = await page.locator('#mobile-home').boundingBox();
    expect(item.height).toBeGreaterThanOrEqual(44);
  });

  test('footer stacks and nothing scrolls horizontally at 320px in LTR and RTL', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    for (const direction of [{ lang: 'en', dir: 'ltr' }, { lang: 'ar', dir: 'rtl' }]) {
      await load(page, direction);
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        inner: getComputedStyle(document.querySelector('.nt-footer__inner')).gridTemplateColumns.split(' ').length,
        bottom: getComputedStyle(document.querySelector('.nt-footer__bottom')).flexDirection,
      }));
      expect(layout.overflow, direction.dir).toBeLessThanOrEqual(0);
      expect(layout.inner).toBe(1);
      expect(layout.bottom).toBe('column');
    }
  });
});

test('inline appearance bootstrap applies saved appearance before first paint', async ({ page, context }) => {
  const bootstrap = ntAppearanceBootstrapScript();
  await page.route('**/tests/pages/site-chrome.html', async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      '<!--nt-inline-bootstrap-->',
      `<script>${bootstrap}</script><script>window.__ntBeforeStyles = {
        theme: document.documentElement.getAttribute('data-nt-theme'),
        accent: document.documentElement.getAttribute('data-nt-accent'),
        density: document.documentElement.getAttribute('data-nt-density'),
        bodyExists: document.body !== null,
      };</script>`,
    );
    await route.fulfill({ response, body: html });
  });
  await context.addCookies([{ name: 'nt_theme', value: 'v1|light|green|compact|s|s', url: 'http://127.0.0.1:4173' }]);
  await page.goto(pagePath);
  const captured = await page.evaluate(() => window.__ntBeforeStyles);
  expect(captured).toEqual({ theme: 'light', accent: 'green', density: 'compact', bodyExists: false });
});
