import { expect, test } from '@playwright/test';

const galleryPath = '/tests/accessibility/gallery.html';

async function setLocale(page, lang, dir) {
  await page.goto(galleryPath);
  await page.waitForFunction(() => window.galleryReady === true);
  await page.locator('html').evaluate((element, value) => {
    element.lang = value.lang;
    element.dir = value.dir;
  }, { lang, dir });
}

test('direction resolver honors the nearest nested native dir attribute', async ({ page }) => {
  await setLocale(page, 'ar', 'rtl');
  const directions = await page.evaluate(async () => {
    const { ntResolveDirection } = await import('/dist/behaviors/direction.js');
    const outer = document.createElement('section');
    outer.dir = 'ltr';
    const inner = document.createElement('button');
    outer.append(inner);
    document.body.append(outer);
    return [ntResolveDirection(document.body), ntResolveDirection(inner)];
  });
  expect(directions).toEqual(['rtl', 'ltr']);
});

test('horizontal tabs, grids, and calendar follow visual inline order in RTL', async ({ page }) => {
  await setLocale(page, 'ar', 'rtl');
  await page.getByRole('tab', { name: 'Overview' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Activity' })).toBeFocused();

  await page.evaluate(() => window.galleryControllers.grid.focusCell(1, 0));
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#data-grid [role="gridcell"]').nth(1)).toBeFocused();

  await page.locator('[data-nt-calendar-date]').first().focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[data-nt-calendar-date]').nth(1)).toBeFocused();
});

test('forms, vertical menus, dialogs, and AI approval inherit RTL without remapping vertical keys', async ({ page }) => {
  await setLocale(page, 'ar', 'rtl');
  expect(await page.locator('select.nt-select').evaluate((element) => getComputedStyle(element).direction)).toBe('rtl');

  const menuTrigger = page.getByRole('button', { name: 'Account menu' });
  await menuTrigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menuTrigger).toBeFocused();

  await expect(page.getByRole('button', { name: 'Approve and create event' })).toHaveCSS('direction', 'rtl');
  await page.getByRole('button', { name: 'Open confirmation' }).click();
  await expect(page.getByRole('dialog', { name: 'Confirm account change' })).toHaveCSS('direction', 'rtl');
});

test('logical drawer edge and directional icons respond to inherited RTL', async ({ page }) => {
  await setLocale(page, 'ar', 'rtl');
  await page.getByRole('button', { name: 'Open confirmation' }).click();
  await page.getByRole('button', { name: 'Review details' }).click();
  const drawer = page.getByRole('dialog', { name: 'Change details' });
  const box = await drawer.boundingBox();
  expect(box?.x).toBeLessThan(2);
  expect(await page.locator('#directional-icon').evaluate((element) => getComputedStyle(element).scale)).toBe('-1 1');
});

test('shell, sidebar, header, pagination, toast, and sticky leading columns use logical edges', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await setLocale(page, 'ar', 'rtl');
  const geometry = await page.evaluate(() => {
    const shell = document.querySelector('#shell-fixture');
    const sidebar = shell.querySelector('.nt-sidebar').getBoundingClientRect();
    const main = shell.querySelector('.nt-app-shell__main').getBoundingClientRect();
    const leading = shell.querySelector('.nt-header__left').getBoundingClientRect();
    const trailing = shell.querySelector('.nt-header__right').getBoundingClientRect();
    const viewport = document.createElement('div');
    viewport.className = 'nt-toast-viewport';
    document.body.append(viewport);
    const toast = viewport.getBoundingClientRect();
    viewport.remove();
    return { sidebarX: sidebar.x, mainX: main.x, leadingX: leading.x, trailingX: trailing.x, toastX: toast.x };
  });
  expect(geometry.sidebarX).toBeGreaterThan(geometry.mainX);
  expect(geometry.leadingX).toBeGreaterThan(geometry.trailingX);
  expect(geometry.toastX).toBeLessThan(24);
  expect(await page.getByRole('button', { name: 'Previous page' }).locator('.nt-pagination__icon').evaluate((element) => getComputedStyle(element).scale)).toBe('-1 1');
});

test('Arabic typography and bidi utilities preserve technical and numeric reading order', async ({ page }) => {
  await setLocale(page, 'ar', 'rtl');
  const values = await page.evaluate(() => {
    const technical = document.querySelector('#technical-value');
    const numeric = document.querySelector('#numeric-value');
    const heading = document.querySelector('#localization-heading');
    const mixed = document.querySelector('#mixed-user-text');
    return {
      technicalDirection: getComputedStyle(technical).direction,
      numericDirection: getComputedStyle(numeric).direction,
      numericVariant: getComputedStyle(numeric).fontVariantNumeric,
      headingTransform: getComputedStyle(heading).textTransform,
      headingClipped: heading.scrollHeight > heading.clientHeight,
      mixedUnicodeBidi: getComputedStyle(mixed).unicodeBidi,
    };
  });
  expect(values).toMatchObject({
    technicalDirection: 'ltr',
    numericDirection: 'ltr',
    numericVariant: 'tabular-nums',
    headingTransform: 'none',
    headingClipped: false,
    mixedUnicodeBidi: 'plaintext',
  });
});

for (const { lang, dir } of [
  { lang: 'en', dir: 'ltr' },
  { lang: 'sv', dir: 'ltr' },
  { lang: 'ar', dir: 'rtl' },
]) {
  test(`${lang}/${dir} stays usable at 320px and 200% text zoom`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await setLocale(page, lang, dir);
    await page.locator('html').evaluate((element) => { element.style.fontSize = '200%'; });
    await page.locator('#long-label').scrollIntoViewIfNeeded();
    const metrics = await page.evaluate(() => ({
      sectionWidth: document.querySelector('#localization-heading').parentElement.clientWidth,
      sectionScrollWidth: document.querySelector('#localization-heading').parentElement.scrollWidth,
      labelWidth: document.querySelector('#long-label').getBoundingClientRect().width,
      labelVisible: document.querySelector('#long-label').getBoundingClientRect().bottom > 0,
    }));
    expect(metrics.sectionScrollWidth).toBeLessThanOrEqual(metrics.sectionWidth + 1);
    // clientWidth is integer-rounded while getBoundingClientRect is fractional;
    // allow 1 CSS pixel of browser subpixel rounding, nothing more.
    expect(metrics.labelWidth).toBeLessThanOrEqual(metrics.sectionWidth + 1);
    expect(metrics.labelVisible).toBe(true);
  });
}

test('locale matrix renders at mobile, tablet, and desktop widths in representative appearances', async ({ page }) => {
  for (const locale of [
    { lang: 'en', dir: 'ltr' },
    { lang: 'sv', dir: 'ltr' },
    { lang: 'ar', dir: 'rtl' },
  ]) {
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await setLocale(page, locale.lang, locale.dir);
      for (const [theme, density] of [['light', 'compact'], ['dark', 'comfortable']]) {
        await page.locator('html').evaluate((element, appearance) => {
          element.dataset.ntTheme = appearance.theme;
          element.dataset.ntDensity = appearance.density;
        }, { theme, density });
        const label = await page.locator('#long-label').boundingBox();
        expect(label?.width).toBeLessThanOrEqual(width);
        expect(label?.height).toBeGreaterThan(0);
      }
    }
  }
});

test('representative RTL shell has a targeted visual snapshot', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await setLocale(page, 'ar', 'rtl');
  await expect(page.locator('#shell-fixture')).toHaveScreenshot('rtl-shell.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.08,
    threshold: 0.3,
  });
});
