import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pagePath = '/tests/pages/glass.html';
const STORAGE_KEY = 'nt-test-glass-sidebar-collapsed';

async function load(page, { width = 1280, height = 900, attributes = {} } = {}) {
  await page.setViewportSize({ width, height });
  await page.goto(pagePath);
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.reload();
  await page.waitForFunction(() => window.fixtureReady === true);
  await page.locator('html').evaluate((html, values) => {
    for (const [name, value] of Object.entries(values)) html.setAttribute(name, value);
  }, attributes);
}

// Wait two frames so transitions triggered by the last change have started,
// then wait for the longest one to finish.
const waitForTransitions = (page) => page.evaluate(() => new Promise((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(() => {
  const longest = Math.max(0, ...document.getAnimations().map((animation) => {
    const timing = animation.effect?.getComputedTiming?.();
    return Number(timing?.endTime ?? 0) - Number(animation.currentTime ?? 0);
  }).filter((value) => Number.isFinite(value)));
  setTimeout(resolve, Math.min(longest, 2000) + 40);
  }));
}));

const box = (page, selector) => page.locator(selector).evaluate((element) => {
  const rect = element.getBoundingClientRect();
  return { left: rect.left, right: rect.right, top: rect.top, width: rect.width, center: rect.left + rect.width / 2 };
});

const pseudo = (page, selector, which) => page.locator(selector).evaluate((element, name) => {
  const style = getComputedStyle(element, name);
  return { opacity: Number(style.opacity), background: style.backgroundColor, display: style.display };
}, which);

for (const appearance of [
  { name: 'dark', attributes: {} },
  { name: 'light', attributes: { 'data-nt-theme': 'light', 'data-nt-theme-preference': 'light' } },
  { name: 'high contrast', attributes: { 'data-nt-contrast': 'high' } },
]) {
  test(`glass workspace has no axe violations (${appearance.name})`, async ({ page }) => {
    await load(page, { attributes: appearance.attributes });
    await waitForTransitions(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, results.violations.map(({ id, help, nodes }) => `${id}: ${help} ${nodes.map((n) => n.target).join(' ')}`).join('\n')).toEqual([]);
  });
}

test.describe('glass sidebar rail morph', () => {
  test('icons keep their position and end centered in the rail', async ({ page }) => {
    await load(page);
    const before = await box(page, '#nav-calendar .nt-sidebar__item-icon');

    await page.locator('#collapse-toggle').click();
    // Mid-transition the icon must not jump toward the center.
    await page.waitForTimeout(90);
    const during = await box(page, '#nav-calendar .nt-sidebar__item-icon');
    expect(Math.abs(during.left - before.left)).toBeLessThan(2);

    await waitForTransitions(page);
    const rail = await box(page, '#glass-nav');
    const after = await box(page, '#nav-calendar .nt-sidebar__item-icon');
    expect(rail.width).toBeLessThan(80);
    expect(Math.abs(after.center - rail.center)).toBeLessThan(1.5);
    expect(Math.abs(after.left - before.left)).toBeLessThan(2);
  });

  test('rail keeps accessible names and removes hidden controls from tab order', async ({ page }) => {
    await load(page);
    await page.locator('#collapse-toggle').click();
    await waitForTransitions(page);

    await expect(page.getByRole('link', { name: 'Invoices', exact: true })).toBeVisible();
    await expect(page.locator('#nav-invoices')).toHaveAttribute('title', 'Invoices');
    // Closed groups open in the rail so every destination stays reachable.
    await expect(page.locator('#nav-people')).toBeVisible();
    await expect(page.locator('#trigger-billing')).toBeHidden();
    await expect(page.locator('#sidebar-search')).toBeHidden();

    const focusable = await page.evaluate(() => {
      const trigger = document.querySelector('#trigger-billing');
      trigger.focus();
      return document.activeElement === trigger;
    });
    expect(focusable).toBe(false);
  });

  test('section labels keep their height so items do not jump', async ({ page }) => {
    await load(page);
    const label = page.locator('.nt-sidebar__section-label').first();
    const heightBefore = (await label.boundingBox()).height;
    await page.locator('#collapse-toggle').click();
    await waitForTransitions(page);
    expect((await label.boundingBox()).height).toBeCloseTo(heightBefore, 0);
  });
});

test.describe('connected active item', () => {
  test('the content panel adjoins the sidebar and the tab uses its surface', async ({ page }) => {
    await load(page);
    const sidebar = await box(page, '#glass-nav');
    const main = await box(page, '.nt-app-shell__main');
    expect(Math.abs(main.left - sidebar.right)).toBeLessThan(1);

    const tab = await pseudo(page, '#nav-overview', '::before');
    const panelBackground = await page.locator('.nt-app-shell__main').evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(tab.opacity).toBe(1);
    expect(tab.background).toBe(panelBackground);
    expect((await pseudo(page, '#nav-overview', '::after')).opacity).toBe(1);
    expect((await pseudo(page, '#nav-calendar', '::before')).opacity).toBe(0);
  });

  test('selecting another item moves the connection without changing layout', async ({ page }) => {
    await load(page);
    const before = await box(page, '#nav-invoices');
    await page.locator('#nav-invoices').click();
    await waitForTransitions(page);
    expect(await box(page, '#nav-invoices')).toEqual(before);
    expect((await pseudo(page, '#nav-invoices', '::before')).opacity).toBe(1);
    expect((await pseudo(page, '#nav-overview', '::before')).opacity).toBe(0);
  });

  test('the connection survives the collapsed rail', async ({ page }) => {
    await load(page);
    await page.locator('#collapse-toggle').click();
    await waitForTransitions(page);
    expect((await pseudo(page, '#nav-overview', '::before')).opacity).toBe(1);
  });

  test('RTL mirrors the shell and the corner geometry', async ({ page }) => {
    await load(page, { attributes: { dir: 'rtl' } });
    await waitForTransitions(page);
    const sidebar = await box(page, '#glass-nav');
    const main = await box(page, '.nt-app-shell__main');
    expect(Math.abs(sidebar.left - main.right)).toBeLessThan(1);
    const origin = await page.locator('#glass-nav').evaluate((element) => getComputedStyle(element).getPropertyValue('--nt-sidebar-cutout-x').trim());
    expect(origin).toBe('100%');
  });

  test('keyboard focus stays visible on the connected item', async ({ page }) => {
    await load(page);
    await page.locator('#nav-overview').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    const outline = await page.locator('#nav-overview').evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(outline).toBe('solid');
  });

  test('mobile off-canvas uses the regular pill, not the desktop cutout', async ({ page }) => {
    await load(page, { width: 390, height: 800 });
    await page.locator('#menu-toggle').click();
    await waitForTransitions(page);
    const background = await page.locator('#nav-overview').evaluate((element) => getComputedStyle(element).backgroundColor);
    const inverse = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.background = 'var(--nt-bg-inverse)';
      document.body.append(probe);
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    });
    expect(background).toBe(inverse);
  });
});

test.describe('sliding selection indicator', () => {
  test('tabs indicator follows the selected trigger in both directions', async ({ page }) => {
    await load(page);
    const list = page.locator('#tabs-underline .nt-tabs__list');
    await expect(list).toHaveAttribute('data-nt-indicator', 'ready');
    await page.locator('#tabs-underline .nt-tabs__trigger').nth(2).click();
    await waitForTransitions(page);
    const { offset, x } = await list.evaluate((element) => ({
      offset: element.querySelectorAll('.nt-tabs__trigger')[2].offsetLeft,
      x: Number.parseFloat(element.style.getPropertyValue('--nt-indicator-x')),
    }));
    expect(x).toBeCloseTo(offset, 0);

    await page.locator('html').evaluate((html) => html.setAttribute('dir', 'rtl'));
    await expect.poll(() => list.evaluate((element) => Number.parseFloat(element.style.getPropertyValue('--nt-indicator-x')))).toBeLessThan(0);
  });

  test('segmented thumb follows radio changes', async ({ page }) => {
    await load(page);
    const control = page.locator('#segmented');
    await expect(control).toHaveAttribute('data-nt-indicator', 'ready');
    await page.locator('#segmented .nt-segmented-control__label').nth(2).click();
    await expect.poll(() => control.evaluate((element) => {
      const label = element.querySelectorAll('.nt-segmented-control__label')[2];
      return Math.round(Number.parseFloat(element.style.getPropertyValue('--nt-indicator-x')) - label.parentElement.offsetLeft - label.offsetLeft);
    })).toBe(0);
  });
});

test.describe('floating action menu', () => {
  test('opens as a menu, closes on Escape, and returns focus', async ({ page }) => {
    await load(page);
    const trigger = page.locator('#fab-trigger');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('menuitem', { name: 'New customer' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
    await expect(page.locator('#fab-actions')).toBeHidden();
  });
});

test('reduced motion setting collapses sidebar and indicator durations', async ({ page }) => {
  await load(page, { attributes: { 'data-nt-motion': 'reduced' } });
  const durations = await page.evaluate(() => {
    const list = document.querySelector('#tabs-underline .nt-tabs__list');
    const shell = document.querySelector('#shell');
    return [
      getComputedStyle(list, '::after').transitionDuration,
      getComputedStyle(shell).transitionDuration,
      getComputedStyle(document.querySelector('#nav-overview'), '::before').transitionDuration,
    ].join(',');
  });
  for (const duration of durations.split(',')) {
    expect(Number.parseFloat(duration)).toBeLessThan(0.001);
  }
});
