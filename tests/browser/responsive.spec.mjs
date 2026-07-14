import { expect, test } from '@playwright/test';

const fixturePath = '/tests/pages/patterns.html';

async function open(page, { width, height = 800 }) {
  await page.setViewportSize({ width, height });
  await page.goto(fixturePath);
  await page.waitForFunction(() => window.pagesReady === true);
}

test('desktop shell shows the sidebar and hides the mobile trigger', async ({ page }) => {
  await open(page, { width: 1280 });
  await expect(page.locator('#fixture-app-shell .nt-app-shell__sidebar')).toBeVisible();
  await expect(page.locator('#fixture-mobile-trigger')).toBeHidden();
});

test('mobile shell hides the sidebar, shows the trigger, and keeps no stale offset', async ({ page }) => {
  await open(page, { width: 375, height: 700 });
  await expect(page.locator('#fixture-app-shell .nt-app-shell__sidebar')).toBeHidden();
  await expect(page.locator('#fixture-mobile-trigger')).toBeVisible();

  const columns = await page
    .locator('#fixture-app-shell')
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  expect(columns.trim().split(' ').length).toBe(1);
});

test('no page-level horizontal scrolling at narrow phone width', async ({ page }) => {
  await open(page, { width: 320, height: 700 });
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
});

test('table priority columns hide as the container narrows', async ({ page }) => {
  await open(page, { width: 1280 });
  await expect(page.getByRole('columnheader', { name: 'Reference' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Issued' })).toBeVisible();

  await page.setViewportSize({ width: 375, height: 700 });
  await expect(page.getByRole('columnheader', { name: 'Reference' })).toBeHidden();
  await expect(page.getByRole('columnheader', { name: 'Issued' })).toBeHidden();
  await expect(page.getByRole('columnheader', { name: 'Amount' })).toBeVisible();
});

test('two-column form rows become one column from the form container width', async ({ page }) => {
  await open(page, { width: 1280 });
  const row = page.locator('.nt-form__row--2').first();
  const wide = await row.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
  expect(wide).toBe(2);

  await page.setViewportSize({ width: 375, height: 700 });
  const narrow = await row.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
  expect(narrow).toBe(1);
});

test('master-detail becomes single-pane with a working back control on phones', async ({ page }) => {
  await open(page, { width: 1280 });
  const masterDetail = page.locator('#fixture-master-detail');
  await expect(masterDetail.locator('.nt-master-detail__list')).toBeVisible();
  await expect(masterDetail.locator('.nt-master-detail__detail')).toBeVisible();
  await expect(masterDetail.locator('.nt-master-detail__back')).toBeHidden();

  await page.setViewportSize({ width: 375, height: 700 });
  await expect(masterDetail.locator('.nt-master-detail__list')).toBeHidden();
  await expect(masterDetail.locator('.nt-master-detail__detail')).toBeVisible();
  await expect(masterDetail.locator('.nt-master-detail__back')).toBeVisible();
});

test('workflow step indicator keeps the current step readable on phones', async ({ page }) => {
  await open(page, { width: 375, height: 700 });
  await expect(page.locator('.nt-step-indicator__step[aria-current="step"] .nt-step-indicator__label')).toBeVisible();
  await expect(
    page.locator('.nt-step-indicator__step--completed .nt-step-indicator__label'),
  ).toBeHidden();
  await expect(page.locator('.nt-workflow__progress')).toBeVisible();
});

test('agenda events keep safe touch targets inside a narrow container', async ({ page }) => {
  await open(page, { width: 1280 });
  const event = page.locator('.nt-calendar-agenda__event').first();
  const box = await event.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);

  const container = page.locator('.nt-calendar-agenda');
  const width = (await container.boundingBox())?.width ?? 0;
  expect(width).toBeLessThanOrEqual(360);
});

test('Arabic RTL page header lays out without overflow and keeps RTL direction', async ({ page }) => {
  await open(page, { width: 375, height: 700 });
  const rtlHeader = page.locator('[dir="rtl"] .nt-page-header');
  await expect(rtlHeader).toBeVisible();
  const metrics = await rtlHeader.evaluate((element) => ({
    direction: getComputedStyle(element).direction,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(metrics.direction).toBe('rtl');
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
});

test('200%-zoom-equivalent width keeps forms and actions reachable', async ({ page }) => {
  // 1280px desktop at 200% zoom exposes a 640px layout viewport.
  await open(page, { width: 640, height: 400 });
  await expect(page.getByRole('button', { name: 'Create invoice' }).first()).toBeVisible();
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
});

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('agenda interactions do not animate under prefers-reduced-motion', async ({ page }) => {
    await open(page, { width: 375, height: 700 });
    const duration = await page
      .locator('.nt-calendar-agenda__event')
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(duration.split(',').every((value) => parseFloat(value) === 0)).toBe(true);
  });
});

test.describe('visual regression', () => {
  test('shell adapts between desktop and mobile', async ({ page }) => {
    await open(page, { width: 1280 });
    await expect(page.locator('#fixture-app-shell')).toHaveScreenshot('patterns-shell-desktop.png');

    await page.setViewportSize({ width: 375, height: 700 });
    await expect(page.locator('#fixture-app-shell')).toHaveScreenshot('patterns-shell-mobile.png');
  });

  test('agenda renders stably in a narrow container', async ({ page }) => {
    await open(page, { width: 1280 });
    await expect(page.locator('.nt-calendar-agenda')).toHaveScreenshot('patterns-agenda-narrow.png');
  });
});
