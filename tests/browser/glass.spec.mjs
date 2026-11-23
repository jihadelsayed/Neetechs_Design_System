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

const connect = (page) => page.locator('[data-toggle=connected]').click();

const resolveColor = (page, value) => page.evaluate((color) => {
  const probe = document.createElement('div');
  probe.style.background = color;
  document.body.append(probe);
  const resolved = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return resolved;
}, value);

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

test.describe('curved active item', () => {
  test('floating sidebar: the selected pill runs into the sidebar edge', async ({ page }) => {
    await load(page);
    const tab = await pseudo(page, '#nav-calendar', '::before');
    expect(tab.opacity).toBe(1);
    expect(tab.background).toBe(await resolveColor(page, 'var(--nt-glass-selected-bg)'));
    expect((await pseudo(page, '#nav-calendar', '::after')).opacity).toBe(1);
    expect((await pseudo(page, '#nav-overview', '::before')).opacity).toBe(0);
    // The tab layer ends at the sidebar's inner edge, past the item box.
    const geometry = await page.evaluate(() => {
      const item = document.querySelector('#nav-calendar');
      const nav = document.querySelector('#glass-nav');
      const style = getComputedStyle(item, '::before');
      return {
        itemRight: item.getBoundingClientRect().right - item.clientLeft,
        navInnerRight: nav.getBoundingClientRect().right - nav.clientLeft,
        insetEnd: Number.parseFloat(style.insetInlineEnd),
      };
    });
    expect(geometry.itemRight - geometry.insetEnd).toBeCloseTo(geometry.navInnerRight, 0);
  });

  test('connected shell: the panel adjoins the sidebar and the tab uses its surface', async ({ page }) => {
    await load(page);
    await connect(page);
    await waitForTransitions(page);
    const sidebar = await box(page, '#glass-nav');
    const main = await box(page, '.nt-app-shell__main');
    expect(Math.abs(main.left - sidebar.right)).toBeLessThan(1);
    const tab = await pseudo(page, '#nav-calendar', '::before');
    const panelBackground = await page.locator('.nt-app-shell__main').evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(tab.background).toBe(panelBackground);
  });

  test('selecting another item moves the connection without changing layout', async ({ page }) => {
    await load(page);
    const before = await box(page, '#nav-invoices');
    await page.locator('#nav-invoices').click();
    await waitForTransitions(page);
    expect(await box(page, '#nav-invoices')).toEqual(before);
    expect((await pseudo(page, '#nav-invoices', '::before')).opacity).toBe(1);
    expect((await pseudo(page, '#nav-calendar', '::before')).opacity).toBe(0);
    await expect(page.locator('#breadcrumb-current')).toHaveText('Invoices');
  });

  test('floating rail turns the tab into a centered tile; connected rail keeps the tab', async ({ page }) => {
    await load(page);
    await page.locator('#collapse-toggle').click();
    await waitForTransitions(page);
    expect((await pseudo(page, '#nav-calendar', '::before')).opacity).toBe(1);
    expect((await pseudo(page, '#nav-calendar', '::after')).opacity).toBe(0);
    const insetEnd = await page.locator('#nav-calendar').evaluate((element) => Number.parseFloat(getComputedStyle(element, '::before').insetInlineEnd));
    expect(insetEnd).toBeGreaterThan(-2);

    await connect(page);
    await waitForTransitions(page);
    expect((await pseudo(page, '#nav-calendar', '::after')).opacity).toBe(1);
  });

  test('rail badges pin to the icon corner', async ({ page }) => {
    await load(page);
    await page.locator('#collapse-toggle').click();
    await waitForTransitions(page);
    const badge = page.locator('#nav-inbox .nt-sidebar__item-badge');
    await expect(badge).toBeVisible();
    const icon = await box(page, '#nav-inbox .nt-sidebar__item-icon');
    const rail = await box(page, '#glass-nav');
    const badgeBox = await box(page, '#nav-inbox .nt-sidebar__item-badge');
    expect(badgeBox.left).toBeGreaterThan(icon.left);
    expect(badgeBox.right).toBeLessThanOrEqual(rail.right);
  });

  test('RTL mirrors the shell and the corner geometry', async ({ page }) => {
    await load(page, { attributes: { dir: 'rtl' } });
    await connect(page);
    await waitForTransitions(page);
    const sidebar = await box(page, '#glass-nav');
    const main = await box(page, '.nt-app-shell__main');
    expect(Math.abs(sidebar.left - main.right)).toBeLessThan(1);
    const origin = await page.locator('#glass-nav').evaluate((element) => getComputedStyle(element).getPropertyValue('--nt-sidebar-cutout-x').trim());
    expect(origin).toBe('100%');
  });

  test('keyboard focus stays visible on the current item', async ({ page }) => {
    await load(page);
    await page.locator('#nav-calendar').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    const outline = await page.locator('#nav-calendar').evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(outline).toBe('solid');
  });
});

test.describe('responsive glass shell', () => {
  test('tablet keeps the sidebar docked with the connected pill', async ({ page }) => {
    await load(page, { width: 768, height: 1024 });
    await expect(page.locator('#glass-nav')).toBeVisible();
    await expect(page.locator('#menu-toggle')).toBeHidden();
    await expect(page.locator('#collapse-toggle')).toBeVisible();
    expect(await page.evaluate(() => window.sidebarController.isOffcanvas)).toBe(false);
    const main = await box(page, '.nt-app-shell__main');
    expect(main.left).toBeGreaterThan(200);
    expect((await pseudo(page, '#nav-calendar', '::after')).opacity).toBe(1);

    await page.locator('#collapse-toggle').click();
    await waitForTransitions(page);
    expect((await box(page, '#glass-nav')).width).toBeLessThan(80);
  });

  test('mobile opens off-canvas in full with a plain pill and a close button', async ({ page }) => {
    await load(page);
    await page.locator('#collapse-toggle').click();
    await page.setViewportSize({ width: 390, height: 844 });
    // The rail preference is kept but never applied off-canvas.
    await expect(page.locator('#shell')).not.toHaveClass(/nt-app-shell--collapsed/);
    await page.locator('#menu-toggle').click();
    await waitForTransitions(page);
    await expect(page.getByRole('link', { name: 'Calendar' })).toBeVisible();
    await expect(page.locator('#nav-calendar .nt-sidebar__item-label')).toHaveCSS('opacity', '1');
    const background = await page.locator('#nav-calendar').evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(background).toBe(await resolveColor(page, 'var(--nt-glass-selected-bg)'));
    expect((await pseudo(page, '#nav-calendar', '::after')).display).toBe('none');

    await page.locator('#sidebar-close').click();
    await expect(page.locator('#glass-sidebar')).toHaveAttribute('data-state', 'closed');
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.locator('#shell')).toHaveClass(/nt-app-shell--collapsed/);
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
