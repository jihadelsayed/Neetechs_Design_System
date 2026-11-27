import { expect, test } from '@playwright/test';

async function load(page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/tests/pages/unified-header.html');
  await page.waitForFunction(() => Boolean(window.headerFixture));
}

for (const theme of ['dark', 'light']) {
  test('header follows glass and typography tokens in ' + theme, async ({ page }) => {
    await load(page);
    await page.evaluate(theme => {
      document.documentElement.dataset.ntTheme = theme;
      document.documentElement.dataset.ntContrast = 'normal';
      const f = window.headerFixture;
      f.controller.update({ ...f.config, brand: { ...f.config.brand, subtitle: 'Account settings' } });
    }, theme);
    const values = await page.locator('#fixture-header').evaluate(el => {
      const probe = document.createElement('span');
      el.append(probe);
      probe.style.backgroundColor = 'var(--nt-glass-bg-strong)';
      const tint = getComputedStyle(probe).backgroundColor;
      probe.style.font = 'var(--nt-text-title-sm)';
      const title = getComputedStyle(probe).fontSize;
      probe.style.font = 'var(--nt-text-caption)';
      const caption = getComputedStyle(probe).fontSize;
      const computed = getComputedStyle(el);
      const result = {
        tint, background: computed.backgroundColor, blur: computed.backdropFilter,
        title, actualTitle: getComputedStyle(el.querySelector('.nt-header__brand-name')).fontSize,
        caption, actualCaption: getComputedStyle(el.querySelector('.nt-header__subtitle')).fontSize,
      };
      probe.remove();
      return result;
    });
    expect(values.background).toBe(values.tint);
    expect(values.blur).toMatch(/blur\(/);
    expect(values.actualTitle).toBe(values.title);
    expect(values.actualCaption).toBe(values.caption);
  });
}

test('sticky header stays visible while content scrolls', async ({ page }) => {
  await load(page);
  await page.evaluate(() => {
    const f = window.headerFixture;
    f.controller.update({ ...f.config, presentation: 'sticky' });
    document.querySelector('#main').style.minHeight = '2000px';
    window.scrollTo(0, 400);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const header = page.locator('#fixture-header');
  await expect(header).toHaveCSS('position', 'sticky');
  expect(Math.abs((await header.boundingBox()).y)).toBeLessThanOrEqual(1);
});

test('density changes tablet and mobile spacing using existing tokens', async ({ page }) => {
  await load(page);
  for (const [width, density, expected] of [[768, 'compact', '12px'], [768, 'spacious', '20px'], [390, 'compact', '10px'], [390, 'spacious', '16px']]) {
    await page.setViewportSize({ width, height: 800 });
    await page.evaluate(density => document.documentElement.dataset.ntDensity = density, density);
    await expect(page.locator('#fixture-header')).toHaveCSS('padding-inline-start', expected);
  }
});

test('high contrast resolves glass to an opaque surface and zero blur', async ({ page }) => {
  await load(page);
  await page.evaluate(() => document.documentElement.dataset.ntContrast = 'high');
  const values = await page.locator('#fixture-header').evaluate(el => {
    const style = getComputedStyle(el);
    return { blur: style.backdropFilter, background: style.backgroundColor };
  });
  expect(values.blur).toMatch(/^(none|blur\(0px\) saturate\(1\))$/);
  expect(values.background).toMatch(/^rgb\(/);
});

test('forced colors removes blur and legacy headers retain their existing material rule', async ({ page }) => {
  await load(page);
  await page.evaluate(() => {
    const legacy = document.createElement('header');
    legacy.className = 'nt-header';
    legacy.id = 'legacy-header';
    document.querySelector('#main').append(legacy);
  });
  await expect(page.locator('#legacy-header')).toHaveCSS('backdrop-filter', 'blur(18px)');
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(page.locator('#fixture-header')).toHaveCSS('backdrop-filter', 'none');
});
