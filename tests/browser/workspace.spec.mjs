import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pagePath = '/tests/pages/workspace.html';

async function load(page, { width = 1280, height = 900, attributes = {}, clearStorage = true } = {}) {
  await page.setViewportSize({ width, height });
  await page.goto(pagePath);
  if (clearStorage) {
    await page.evaluate(() => localStorage.removeItem('nt-test-sidebar-collapsed'));
    await page.reload();
  }
  await page.waitForFunction(() => window.fixtureReady === true);
  await page.locator('html').evaluate((html, values) => {
    for (const [name, value] of Object.entries(values)) html.setAttribute(name, value);
  }, attributes);
}

// Infinite animations (loading pulses) never finish; wait only for finite ones.
const settle = (page) => page.evaluate(() => Promise.all(
  document.getAnimations()
    .filter((animation) => Number.isFinite(Number(animation.effect?.getComputedTiming?.().endTime)))
    .map((animation) => animation.finished.catch(() => undefined)),
));

const waitForTransitions = (page) => page.evaluate(() => new Promise((resolve) => {
  const longest = Math.max(0, ...document.getAnimations().map((animation) => {
    const timing = animation.effect?.getComputedTiming?.();
    return Number(timing?.endTime ?? 0) - Number(animation.currentTime ?? 0);
  }).filter((value) => Number.isFinite(value)));
  setTimeout(resolve, Math.min(longest, 2000) + 20);
}));

for (const appearance of [
  { name: 'dark', attributes: {} },
  { name: 'light', attributes: { 'data-nt-theme': 'light', 'data-nt-theme-preference': 'light' } },
  { name: 'high contrast', attributes: { 'data-nt-contrast': 'high' } },
]) {
  test(`workspace dashboard has no axe violations (${appearance.name})`, async ({ page }) => {
    await load(page, { attributes: appearance.attributes });
    await settle(page);
    const results = await new AxeBuilder({ page }).exclude('#stat-loading').analyze();
    expect(results.violations, results.violations.map(({ id, help, nodes }) => `${id}: ${help} ${nodes.map((n) => n.target).join(' ')}`).join('\n')).toEqual([]);
  });
}

test.describe('sidebar rail', () => {
  test('collapse toggle switches to an icon rail that keeps accessible names', async ({ page }) => {
    await load(page);
    const toggle = page.locator('#collapse-toggle');
    const sidebar = page.locator('#workspace-sidebar');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveAttribute('aria-controls', 'workspace-sidebar');
    const expandedWidth = (await sidebar.boundingBox()).width;

    await toggle.click();
    await waitForTransitions(page);
    await expect(page.locator('#shell')).toHaveClass(/nt-app-shell--collapsed/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect((await sidebar.boundingBox()).width).toBeLessThan(expandedWidth / 2);

    // Labels are visually hidden, not removed: links keep their names.
    await expect(page.getByRole('link', { name: 'Invoices', exact: true })).toBeVisible();
    await expect(page.locator('#nav-invoices')).toHaveAttribute('title', 'Invoices');
    // Groups show every item in the rail, even ones collapsed in the full sidebar.
    await expect(page.locator('#nav-suppliers')).toBeVisible();
    await expect(page.locator('#trigger-purchases')).toBeHidden();

    await toggle.click();
    await expect(page.locator('#nav-invoices')).not.toHaveAttribute('title', /.*/);
  });

  test('collapse preference persists across reloads', async ({ page }) => {
    await load(page);
    await page.locator('#collapse-toggle').click();
    await load(page, { clearStorage: false });
    await expect(page.locator('#shell')).toHaveClass(/nt-app-shell--collapsed/);
    await expect(page.locator('#collapse-toggle')).toHaveAttribute('aria-expanded', 'false');
  });

  test('active item shows a shape indicator, not only a color change', async ({ page }) => {
    await load(page);
    const indicator = await page.locator('#nav-dashboard').evaluate((item) => {
      const style = getComputedStyle(item, '::before');
      return { opacity: style.opacity, width: style.width, content: style.content };
    });
    expect(indicator.content).not.toBe('none');
    expect(indicator.opacity).toBe('1');
    expect(Number.parseFloat(indicator.width)).toBeGreaterThan(0);
    const inactive = await page.locator('#nav-invoices').evaluate((item) => getComputedStyle(item, '::before').opacity);
    expect(inactive).toBe('0');
  });
});

test.describe('sidebar groups', () => {
  test('disclosure groups expand and collapse and leave the tab order when closed', async ({ page }) => {
    await load(page);
    const trigger = page.locator('#trigger-purchases');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#nav-suppliers')).toBeHidden();
    const controls = await trigger.getAttribute('aria-controls');
    expect(controls).toBeTruthy();

    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#group-purchases')).toHaveAttribute('data-state', 'open');
    await expect(page.locator('#nav-suppliers')).toBeVisible();

    await page.keyboard.press('Space');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await waitForTransitions(page);
    await expect(page.locator('#nav-suppliers')).toBeHidden();
    await page.keyboard.press('Tab');
    await expect(page.locator('#nav-suppliers')).not.toBeFocused();
  });

  test('a group that contains the current page is expanded on refresh', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      document.querySelector('#nav-dashboard').removeAttribute('aria-current');
      document.querySelector('#nav-suppliers').setAttribute('aria-current', 'page');
      window.sidebarController.refresh();
    });
    await expect(page.locator('#trigger-purchases')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#nav-suppliers')).toBeVisible();
  });
});

test.describe('off-canvas sidebar', () => {
  test('phones hide the sidebar and the collapse toggle, and show the menu toggle', async ({ page }) => {
    await load(page, { width: 375, height: 760 });
    await expect(page.locator('#workspace-sidebar')).toBeHidden();
    await expect(page.locator('#menu-toggle')).toBeVisible();
    await expect(page.locator('#collapse-toggle')).toBeHidden();
  });

  test('menu opens a modal panel; Escape closes it and returns focus', async ({ page }) => {
    await load(page, { width: 375, height: 760 });
    const sidebar = page.locator('#workspace-sidebar');
    const menu = page.locator('#menu-toggle');
    await menu.click();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveAttribute('role', 'dialog');
    await expect(sidebar).toHaveAttribute('aria-modal', 'true');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#shell-backdrop')).toBeVisible();
    expect(await page.evaluate(() => document.querySelector('#workspace-sidebar').contains(document.activeElement))).toBe(true);
    await waitForTransitions(page);
    const box = await sidebar.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x).toBeLessThan(20);

    await page.keyboard.press('Escape');
    await expect(sidebar).toBeHidden();
    await expect(sidebar).not.toHaveAttribute('role', 'dialog');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeFocused();
  });

  test('backdrop, close button, and navigation close the panel', async ({ page }) => {
    await load(page, { width: 375, height: 760 });
    const sidebar = page.locator('#workspace-sidebar');
    await page.locator('#menu-toggle').click();
    await page.mouse.click(360, 400);
    await expect(sidebar).toBeHidden();

    await page.locator('#menu-toggle').click();
    await page.locator('#sidebar-close').click();
    await expect(sidebar).toBeHidden();

    await page.locator('#menu-toggle').click();
    await page.locator('#nav-dashboard').click();
    await expect(sidebar).toBeHidden();
  });

  test('a desktop rail preference does not leak into the off-canvas panel', async ({ page }) => {
    await load(page);
    await page.locator('#collapse-toggle').click();
    await page.setViewportSize({ width: 375, height: 760 });
    await page.locator('#menu-toggle').click();
    await expect(page.locator('#nav-dashboard .nt-sidebar__item-label')).toBeVisible();
    await expect(page.locator('#trigger-sales')).toBeVisible();
    const labelWidth = (await page.locator('#nav-dashboard .nt-sidebar__item-label').boundingBox()).width;
    expect(labelWidth).toBeGreaterThan(20);
  });

  test('growing to desktop closes an open panel', async ({ page }) => {
    await load(page, { width: 375, height: 760 });
    await page.locator('#menu-toggle').click();
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect.poll(() => page.evaluate(() => window.sidebarController.isOpen)).toBe(false);
    await expect(page.locator('#workspace-sidebar')).not.toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('#shell-backdrop')).toBeHidden();
  });

  test('RTL panel slides in from the inline-start (right) edge', async ({ page }) => {
    await load(page, { width: 375, height: 760 });
    await page.locator('html').evaluate((html) => { html.dir = 'rtl'; });
    await page.locator('#menu-toggle').click();
    await waitForTransitions(page);
    const box = await page.locator('#workspace-sidebar').boundingBox();
    expect(Math.round(box.x + box.width)).toBeGreaterThanOrEqual(370);
  });
});

test.describe('dashboard layout', () => {
  const columnCount = (page) => page.locator('#stat-grid').evaluate((grid) => (
    getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length
  ));

  test('stat grid uses up to four columns and collapses intrinsically', async ({ page }) => {
    await load(page, { width: 1440 });
    expect(await columnCount(page)).toBe(4);
    await page.setViewportSize({ width: 800, height: 900 });
    expect(await columnCount(page)).toBeGreaterThanOrEqual(2);
    expect(await columnCount(page)).toBeLessThan(4);
    await page.setViewportSize({ width: 375, height: 800 });
    expect(await columnCount(page)).toBe(1);
  });

  test('stat values are tabular and loading keeps the value footprint', async ({ page }) => {
    await load(page);
    const loading = page.locator('#stat-loading .nt-stat__value');
    const style = await loading.evaluate((value) => ({
      numeric: getComputedStyle(value).fontVariantNumeric,
      color: getComputedStyle(value).color,
      height: value.getBoundingClientRect().height,
    }));
    expect(style.numeric).toContain('tabular-nums');
    expect(style.color).toBe('rgba(0, 0, 0, 0)');
    const before = await page.locator('#stat-loading').boundingBox();
    await page.locator('#stat-loading').evaluate((stat) => stat.removeAttribute('aria-busy'));
    const after = await page.locator('#stat-loading').boundingBox();
    expect(after.height).toBe(before.height);
  });

  test('narrow record lists stack the trailing value under the title', async ({ page }) => {
    await load(page, { width: 375, height: 800 });
    const geometry = await page.locator('#record-first').evaluate((record) => ({
      title: record.querySelector('.nt-record__title').getBoundingClientRect().top,
      trailing: record.querySelector('.nt-record__trailing').getBoundingClientRect().top,
    }));
    expect(geometry.trailing).toBeGreaterThan(geometry.title);

    await page.setViewportSize({ width: 1440, height: 900 });
    const wide = await page.locator('#record-first').evaluate((record) => ({
      title: record.querySelector('.nt-record__main').getBoundingClientRect(),
      trailing: record.querySelector('.nt-record__trailing').getBoundingClientRect(),
    }));
    expect(wide.trailing.left).toBeGreaterThan(wide.title.right - 1);
  });

  for (const width of [320, 768]) {
    test(`no page-level horizontal scrolling at ${width}px`, async ({ page }) => {
      await load(page, { width, height: 800 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('emphasized totals row is boxed, not only recolored', async ({ page }) => {
    await load(page);
    const border = await page.locator('#totals .nt-description-list__item--emphasis').evaluate((item) => getComputedStyle(item).borderTopWidth);
    expect(Number.parseFloat(border)).toBeGreaterThan(0);
  });
});

test.describe('microinteractions', () => {
  test('pending buttons keep their width and accessible name', async ({ page }) => {
    await load(page);
    const button = page.locator('#record-payment');
    const before = await button.boundingBox();
    await button.evaluate((element) => {
      const spinner = document.createElement('span');
      spinner.className = 'nt-button__spinner';
      spinner.setAttribute('aria-hidden', 'true');
      element.append(spinner);
      element.dataset.ntState = 'pending';
      element.setAttribute('aria-busy', 'true');
    });
    const after = await button.boundingBox();
    expect(Math.abs(after.width - before.width)).toBeLessThan(0.5);
    await expect(page.getByRole('button', { name: 'Record payment' })).toBeVisible();
  });

  test('success feedback settles on the documented ring', async ({ page }) => {
    await load(page);
    const button = page.locator('#record-payment');
    await button.evaluate((element) => { element.dataset.ntState = 'success'; });
    await settle(page);
    const shadow = await button.evaluate((element) => getComputedStyle(element).boxShadow);
    expect(shadow).toMatch(/0px 0px 0px 1px/);
  });

  test('skip link is revealed on first Tab and targets main content', async ({ page }) => {
    await load(page);
    await page.keyboard.press('Tab');
    const link = page.locator('.nt-skip-link');
    await expect(link).toBeFocused();
    await waitForTransitions(page);
    const box = await link.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#workspace-main$/);
  });
});

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('shell, sidebar, and stat transitions are disabled', async ({ page }) => {
    await load(page, { attributes: { 'data-nt-motion': 'system' } });
    const durations = await page.evaluate(() => ({
      shell: getComputedStyle(document.querySelector('#shell')).transitionDuration,
      item: getComputedStyle(document.querySelector('#nav-dashboard')).transitionDuration,
      group: getComputedStyle(document.querySelector('#group-sales .nt-sidebar__group-items')).transitionDuration,
      loading: getComputedStyle(document.querySelector('#stat-loading .nt-stat__value')).animationName,
    }));
    for (const value of [durations.shell, durations.item, durations.group]) {
      expect(value.split(',').every((part) => Number.parseFloat(part) === 0), JSON.stringify(durations)).toBe(true);
    }
    expect(durations.loading).toBe('none');
  });
});

test.describe('visual regression', () => {
  // 1600px leaves each of the four cards enough room that no label or value
  // wraps with either Windows or Linux fallback font metrics, so the
  // snapshot height is platform-independent.
  test('dashboard stat grid renders stably', async ({ page }) => {
    await load(page, { width: 1600 });
    await settle(page);
    await page.locator('#stat-loading').evaluate((stat) => stat.removeAttribute('aria-busy'));
    await expect(page.locator('#stat-grid')).toHaveScreenshot('workspace-stat-grid.png', {
      animations: 'disabled',
      threshold: 0.3,
      maxDiffPixelRatio: 0.04,
    });
  });
});
