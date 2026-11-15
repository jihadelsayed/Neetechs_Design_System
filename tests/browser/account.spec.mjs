import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pagePath = '/tests/pages/account.html';

async function load(page, { width = 1366, height = 900, attributes = {} } = {}) {
  await page.setViewportSize({ width, height });
  await page.goto(pagePath);
  await page.waitForFunction(() => window.fixtureReady === true);
  await page.locator('html').evaluate((html, values) => {
    for (const [name, value] of Object.entries(values)) html.setAttribute(name, value);
  }, attributes);
}

// Infinite animations never finish; wait only for finite ones.
const settle = (page) => page.evaluate(() => Promise.all(
  document.getAnimations()
    .filter((animation) => Number.isFinite(Number(animation.effect?.getComputedTiming?.().endTime)))
    .map((animation) => animation.finished.catch(() => undefined)),
));

const rect = (locator) => locator.evaluate((element) => {
  const box = element.getBoundingClientRect();
  return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
});

for (const appearance of [
  { name: 'dark', attributes: {} },
  { name: 'light', attributes: { 'data-nt-theme': 'light', 'data-nt-theme-preference': 'light' } },
  { name: 'high contrast', attributes: { 'data-nt-contrast': 'high' } },
  { name: 'dark RTL', attributes: { dir: 'rtl', lang: 'ar' } },
]) {
  test(`account patterns have no axe violations (${appearance.name})`, async ({ page }) => {
    await load(page, { attributes: appearance.attributes });
    await page.locator('#archived-summary').click();
    await settle(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, results.violations.map(({ id, help, nodes }) => `${id}: ${help} ${nodes.map((n) => n.target).join(' ')}`).join('\n')).toEqual([]);
  });
}

test.describe('profile header', () => {
  test('wide: identity and side column share a row; narrow: side column wraps under', async ({ page }) => {
    await load(page);
    const identity = await rect(page.locator('#profile .nt-profile-header__identity'));
    const side = await rect(page.locator('#profile-side'));
    expect(side.left).toBeGreaterThan(identity.left + identity.width / 2);
    expect(side.top).toBeLessThan(identity.bottom);

    await page.setViewportSize({ width: 390, height: 900 });
    const narrowIdentity = await rect(page.locator('#profile .nt-profile-header__identity'));
    const narrowSide = await rect(page.locator('#profile-side'));
    expect(narrowSide.top).toBeGreaterThanOrEqual(narrowIdentity.bottom - 1);
    const avatar = await rect(page.locator('#avatar-edit'));
    const name = await rect(page.locator('#profile-name'));
    expect(name.top).toBeGreaterThanOrEqual(avatar.bottom - 1);
  });

  test('handle keeps its reading order in RTL', async ({ page }) => {
    await load(page, { attributes: { dir: 'rtl' } });
    const order = await page.locator('.nt-profile-header__handle').evaluate((handle) => {
      const range = document.createRange();
      range.setStart(handle.firstChild, 0);
      range.setEnd(handle.firstChild, 1);
      const at = range.getBoundingClientRect().left;
      range.setStart(handle.firstChild, 1);
      range.setEnd(handle.firstChild, 2);
      return { at, next: range.getBoundingClientRect().left };
    });
    expect(order.at).toBeLessThan(order.next);
  });

  test('editable avatar reveals its overlay on keyboard focus and keeps its name', async ({ page }) => {
    await load(page);
    const overlay = page.locator('#avatar-edit .nt-avatar__overlay');
    expect(await overlay.evaluate((element) => getComputedStyle(element).opacity)).toBe('0');
    await page.locator('#avatar-edit').focus();
    await settle(page);
    expect(await overlay.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
    await expect(page.getByRole('button', { name: 'Change profile photo' })).toBeFocused();
    const outline = await page.locator('#avatar-edit').evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(outline).toBe('solid');
  });

  test('link buttons underline on hover and keep a visible focus ring', async ({ page }) => {
    await load(page);
    const link = page.locator('#add-website');
    expect(await link.evaluate((element) => getComputedStyle(element).textDecorationColor)).toBe('rgba(0, 0, 0, 0)');
    await link.hover();
    await settle(page);
    expect(await link.evaluate((element) => getComputedStyle(element).textDecorationColor)).not.toBe('rgba(0, 0, 0, 0)');
    await link.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    expect(await link.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
  });

  test('completion meter fills from zero to its value without moving the track', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(pagePath);
    const track = await rect(page.locator('#completion .nt-progress__track'));
    await settle(page);
    const bar = await rect(page.locator('#completion .nt-progress__bar'));
    expect(bar.width / track.width).toBeCloseTo(0.72, 1);
    const trackAfter = await rect(page.locator('#completion .nt-progress__track'));
    expect(trackAfter.width).toBe(track.width);
  });
});

test.describe('section navigation', () => {
  test('current section shows an indicator bar and a status dot', async ({ page }) => {
    await load(page);
    const current = await page.locator('#nav-bio').evaluate((item) => {
      const bar = getComputedStyle(item, '::before');
      return { opacity: bar.opacity, background: getComputedStyle(item).backgroundColor };
    });
    expect(current.opacity).toBe('1');
    const other = await page.locator('#nav-connections').evaluate((item) => getComputedStyle(item, '::before').opacity);
    expect(other).toBe('0');
    await expect(page.locator('#nav-bio')).toHaveAccessibleName(/Bio \(complete\)/);
  });

  test('navigation is sticky on wide layouts and static on phones', async ({ page }) => {
    await load(page);
    const nav = page.locator('#settings .nt-settings-layout__nav');
    expect(await nav.evaluate((element) => getComputedStyle(element).position)).toBe('sticky');
    await page.setViewportSize({ width: 390, height: 900 });
    expect(await nav.evaluate((element) => getComputedStyle(element).position)).toBe('static');
  });
});

test.describe('resource cards', () => {
  test('the card in use carries a selection ring; narrow cards stack actions', async ({ page }) => {
    await load(page);
    const shadow = await page.locator('#card-openai').evaluate((card) => getComputedStyle(card).boxShadow);
    expect(shadow).toMatch(/0px 0px 0px 1px/);
    const deleteButton = await rect(page.locator('#openai-actions .nt-button--danger'));
    const testButton = await rect(page.locator('#openai-actions .nt-button--secondary'));
    expect(Math.abs(deleteButton.top - testButton.top)).toBeLessThan(2);

    await page.setViewportSize({ width: 390, height: 900 });
    const narrowDelete = await rect(page.locator('#openai-actions .nt-button--danger'));
    const narrowTest = await rect(page.locator('#openai-actions .nt-button--secondary'));
    expect(narrowDelete.top).toBeGreaterThan(narrowTest.bottom - 1);
    const card = await rect(page.locator('#card-openai'));
    expect(narrowTest.width).toBeGreaterThan(card.width * 0.7);
  });

  test('split stat keeps the alert on its own full row', async ({ page }) => {
    await load(page);
    const wallet = await rect(page.locator('#wallet'));
    const alert = await rect(page.locator('#wallet-alert'));
    expect(alert.width).toBeGreaterThan(wallet.width * 0.85);
  });
});

test.describe('choice cards', () => {
  test('arrow keys move selection and the card reflects it with a ring and indicator', async ({ page }) => {
    await load(page);
    await page.locator('#choice-pro input').focus();
    const ring = await page.locator('#choice-pro').evaluate((card) => getComputedStyle(card).outlineStyle);
    expect(ring).toBe('solid');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#choice-modern input')).toBeChecked();
    await settle(page);
    const modern = await page.locator('#choice-modern').evaluate((card) => ({
      shadow: getComputedStyle(card).boxShadow,
      dot: getComputedStyle(card.querySelector('.nt-choice-card__indicator'), '::after').transform,
    }));
    expect(modern.shadow).toMatch(/inset/);
    expect(modern.dot).toBe('matrix(1, 0, 0, 1, 0, 0)');
    // The disabled option is skipped by the browser's radio group navigation.
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#choice-disabled input')).not.toBeChecked();
  });

  test('checkbox cards toggle with Space and clicks anywhere on the card', async ({ page }) => {
    await load(page);
    await page.locator('#choice-check').click();
    await expect(page.locator('#choice-check input')).toBeChecked();
    await page.keyboard.press('Space');
    await expect(page.locator('#choice-check input')).not.toBeChecked();
  });
});

test.describe('disclosure', () => {
  test('summary toggles with keyboard, chevron rotates, content leaves the tree when closed', async ({ page }) => {
    await load(page);
    await expect(page.locator('#restore')).toBeHidden();
    await page.locator('#archived-summary').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#archived')).toHaveAttribute('open', '');
    await settle(page);
    await expect(page.locator('#restore')).toBeVisible();
    const chevron = await page.locator('#archived .nt-disclosure__chevron').evaluate((element) => getComputedStyle(element).transform);
    expect(chevron).not.toBe('none');
    const button = await rect(page.locator('#restore'));
    const content = await rect(page.locator('#archived-content'));
    expect(button.width).toBeLessThan(content.width / 2);
    await page.keyboard.press('Enter');
    await expect(page.locator('#archived')).not.toHaveAttribute('open', '');
  });
});

test.describe('editor workspace and document preview', () => {
  test('panes sit side by side on desktop and stack on narrow widths', async ({ page }) => {
    await load(page);
    const source = await rect(page.locator('#source-pane'));
    const preview = await rect(page.locator('#preview-pane'));
    expect(Math.abs(source.top - preview.top)).toBeLessThan(2);
    expect(preview.left).toBeGreaterThan(source.right - 1);

    await page.setViewportSize({ width: 768, height: 900 });
    const stackedSource = await rect(page.locator('#source-pane'));
    const stackedPreview = await rect(page.locator('#preview-pane'));
    expect(stackedPreview.top).toBeGreaterThan(stackedSource.bottom - 1);
  });

  test('the page keeps A4 width and the canvas scrolls instead of squeezing it', async ({ page }) => {
    await load(page, { width: 390, height: 900 });
    const widths = await page.evaluate(() => {
      const viewport = document.querySelector('#viewport');
      const pageElement = document.querySelector('#page');
      return {
        page: pageElement.getBoundingClientRect().width,
        scroll: viewport.scrollWidth,
        client: viewport.clientWidth,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(Math.round(widths.page)).toBe(794);
    expect(widths.scroll).toBeGreaterThan(widths.client);
    expect(widths.overflow).toBeLessThanOrEqual(0);
  });

  test('the paper stays white in every theme', async ({ page }) => {
    for (const attributes of [{}, { 'data-nt-theme': 'light' }, { 'data-nt-contrast': 'high' }]) {
      await load(page, { attributes });
      const colors = await page.locator('#page').evaluate((element) => ({
        background: getComputedStyle(element).backgroundColor,
      }));
      expect(colors.background).toBe('rgb(255, 255, 255)');
    }
  });

  test('editing marks the pane and the saved status pops once', async ({ page }) => {
    await load(page);
    const idle = await page.locator('#preview-pane').evaluate((pane) => getComputedStyle(pane).borderTopColor);
    await page.locator('#source').focus();
    // The border color transitions; poll until it settles away from the idle color.
    await expect.poll(() => page.locator('#source-pane').evaluate((pane) => getComputedStyle(pane).borderTopColor)).not.toBe(idle);
    const status = await page.locator('#save-status').evaluate((element) => ({
      name: getComputedStyle(element, '::before').animationName,
      text: element.textContent.trim(),
    }));
    expect(status.name).toBe('nt-editor-status-pop');
    expect(status.text).toBe('Saved');
  });

  test('print keeps only the document', async ({ page }) => {
    await load(page);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#source-pane')).toBeHidden();
    await expect(page.locator('#page')).toBeVisible();
    const shadow = await page.locator('#page').evaluate((element) => getComputedStyle(element).boxShadow);
    expect(shadow).toBe('none');
  });
});

test.describe('navbar', () => {
  test('current link has an underline; hover previews it on other links', async ({ page }) => {
    await load(page);
    const underline = (selector) => page.locator(selector).evaluate((link) => getComputedStyle(link, '::after').transform);
    expect(await underline('#nav-profile')).toBe('matrix(1, 0, 0, 1, 0, 0)');
    expect(await underline('#nav-settings')).toBe('matrix(0, 0, 0, 1, 0, 0)');
    await page.locator('#nav-settings').hover();
    await settle(page);
    expect(await underline('#nav-settings')).toBe('matrix(1, 0, 0, 1, 0, 0)');
  });
});

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('new transitions and animations are disabled', async ({ page }) => {
    await load(page, { attributes: { 'data-nt-motion': 'system' } });
    const values = await page.evaluate(() => {
      const style = (selector, pseudo) => getComputedStyle(document.querySelector(selector), pseudo ?? null);
      return [
        style('#avatar-edit .nt-avatar__overlay').transitionDuration,
        style('#choice-pro .nt-choice-card__indicator', '::after').transitionDuration,
        style('#nav-bio', '::before').transitionDuration,
        style('#nav-profile', '::after').transitionDuration,
        style('#archived .nt-disclosure__chevron').transitionDuration,
        style('#completion .nt-progress__bar').transitionDuration,
        style('#save-status', '::before').animationName,
      ];
    });
    const [animation] = values.splice(-1);
    for (const value of values) {
      expect(value.split(',').every((part) => Number.parseFloat(part) === 0), values.join(' | ')).toBe(true);
    }
    expect(animation).toBe('none');
  });
});

test.describe('visual regression', () => {
  // Liberation Sans (Linux CI) and Arial (Windows) share metrics, so pinning
  // the stack makes the snapshot geometry identical on both platforms.
  test('profile header renders stably', async ({ page }) => {
    await load(page, { width: 1600 });
    await page.addStyleTag({ content: ':root { --nt-font-sans: "Liberation Sans", Arial, sans-serif; }' });
    await settle(page);
    await expect(page.locator('#profile')).toHaveScreenshot('account-profile-header.png', {
      animations: 'disabled',
      threshold: 0.3,
      maxDiffPixelRatio: 0.04,
    });
  });
});
