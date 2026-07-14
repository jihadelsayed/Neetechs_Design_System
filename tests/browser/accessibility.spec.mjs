import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const galleryPath = '/tests/accessibility/gallery.html';

test.beforeEach(async ({ page }) => {
  await page.goto(galleryPath);
  await page.waitForFunction(() => window.galleryReady === true);
});

test('representative gallery has no automatically detectable axe violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, results.violations.map(({ id, help }) => `${id}: ${help}`).join('\n')).toEqual([]);
});

test('keyboard focus is visible and primary targets meet the documented size', async ({ page }) => {
  const primary = page.getByLabel('Controls and forms').getByRole('button', { name: 'Save changes' });
  await primary.focus();
  const focus = await primary.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, height: rect.height };
  });
  expect(focus.outlineStyle).toBe('solid');
  expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(2);
  expect(focus.height).toBeGreaterThanOrEqual(44);

  const icon = page.getByRole('button', { name: 'Open settings' });
  const box = await icon.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
});

test('tabs use roving focus and automatic arrow-key activation', async ({ page }) => {
  const overview = page.getByRole('tab', { name: 'Overview' });
  const activity = page.getByRole('tab', { name: 'Activity' });
  await overview.focus();
  await page.keyboard.press('ArrowRight');
  await expect(activity).toBeFocused();
  await expect(activity).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Activity' })).toBeVisible();
  await page.keyboard.press('End');
  await expect(activity).toBeFocused();
  await page.keyboard.press('Home');
  await expect(overview).toBeFocused();
});

test('menu supports arrows, typeahead, activation, Escape, and trigger focus return', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Account menu' });
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeFocused();
  await page.getByRole('menuitem', { name: 'Billing unavailable' }).dispatchEvent('click');
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('p');
  await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('menu')).toBeHidden();
});

test('modal focus is trapped, nested Escape closes only the top overlay, and focus returns', async ({ page }) => {
  const dialogTrigger = page.getByRole('button', { name: 'Open confirmation' });
  await dialogTrigger.click();
  const dialog = page.getByRole('dialog', { name: 'Confirm account change' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await expect(page.locator('header').first()).toHaveAttribute('inert', '');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Review details' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Confirm change' })).toBeFocused();

  await page.getByRole('button', { name: 'Review details' }).click();
  const drawer = page.getByRole('dialog', { name: 'Change details' });
  await expect(drawer).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close details' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review details' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(dialogTrigger).toBeFocused();
  await expect(page.locator('header').first()).not.toHaveAttribute('inert', '');
});

test('deprecated modal classes and controller delegate to canonical dialog behavior', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Open legacy modal' });
  await trigger.click();
  const modal = page.getByRole('dialog', { name: 'Legacy modal compatibility' });
  await expect(modal).toBeVisible();
  await expect(modal).toHaveAttribute('aria-modal', 'true');
  await expect(page.getByRole('button', { name: 'Close legacy modal' })).toBeFocused();
  const style = await modal.evaluate((element) => {
    const computed = getComputedStyle(element);
    return { display: computed.display, radius: computed.borderRadius, shadow: computed.boxShadow };
  });
  expect(style.display).toBe('flex');
  expect(style.radius).not.toBe('0px');
  expect(style.shadow).not.toBe('none');
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.evaluate(() => window.galleryControllers.modal.destroy());
  await trigger.click();
  await expect(modal).toBeHidden();
});

test('nonmodal dialog mode does not trap focus or claim modal background semantics', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { ntCreateDialog } = await import('/dist/index.js');
    const trigger = document.createElement('button');
    trigger.textContent = 'Nonmodal trigger';
    const dialog = document.createElement('section');
    dialog.innerHTML = '<h2>Nonmodal details</h2><button>Inside</button>';
    document.body.append(trigger, dialog);
    const controller = ntCreateDialog({ trigger, dialog, modal: false });
    controller.open();
    const state = {
      role: dialog.getAttribute('role'),
      ariaModal: dialog.getAttribute('aria-modal'),
      headerInert: document.querySelector('header')?.hasAttribute('inert') ?? false,
    };
    controller.destroy();
    trigger.remove();
    dialog.remove();
    return state;
  });

  expect(result).toEqual({ role: 'dialog', ariaModal: null, headerInert: false });
});

test('workspace switcher and right-drawer compatibility classes receive canonical styling', async ({ page }) => {
  const result = await page.evaluate(() => {
    const company = document.createElement('div');
    company.className = 'nt-company-switcher';
    const workspace = document.createElement('div');
    workspace.className = 'nt-workspace-switcher';
    const rightDrawer = document.createElement('aside');
    rightDrawer.className = 'nt-right-drawer';
    document.body.append(company, workspace, rightDrawer);
    const companyStyle = getComputedStyle(company);
    const workspaceStyle = getComputedStyle(workspace);
    const drawerStyle = getComputedStyle(rightDrawer);
    return {
      switcherBackgroundsMatch: companyStyle.backgroundColor === workspaceStyle.backgroundColor,
      switcherRadiiMatch: companyStyle.borderRadius === workspaceStyle.borderRadius,
      drawerDisplay: drawerStyle.display,
      drawerBorder: drawerStyle.borderInlineStartWidth,
    };
  });

  expect(result.switcherBackgroundsMatch).toBe(true);
  expect(result.switcherRadiiMatch).toBe(true);
  expect(result.drawerDisplay).toBe('flex');
  expect(parseFloat(result.drawerBorder)).toBeGreaterThan(0);
});

test('form errors have stable associations and the summary receives focus', async ({ page }) => {
  const email = page.getByRole('textbox', { name: 'Email' });
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAttribute('aria-describedby', /email-help/);
  await expect(email).toHaveAttribute('aria-describedby', /email-error/);
  const readonly = page.getByRole('textbox', { name: 'Notes' });
  await expect(readonly).toHaveAttribute('readonly', '');
  await expect(readonly).toBeEnabled();
  await page.locator('#example-form').dispatchEvent('submit');
  const summary = page.getByRole('region', { name: 'Check the form' });
  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
});

test('data grid supports roving cell navigation, selection, and sort announcements', async ({ page }) => {
  const companyHeader = page.getByRole('columnheader', { name: 'Company' });
  await companyHeader.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('columnheader', { name: 'Balance' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const balance = page.getByRole('gridcell', { name: '1,250 SEK' });
  await expect(balance).toBeFocused();
  await page.keyboard.press('Space');
  await expect(balance).toHaveAttribute('aria-selected', 'true');
  await page.evaluate(() => {
    const header = document.querySelector('[role="columnheader"][aria-sort]');
    window.galleryControllers.grid.setSort(header, 'ascending', 'Balance sorted ascending');
  });
  await expect(page.locator('#grid-live')).toHaveText('Balance sorted ascending');
});

test('calendar exposes date names, keyboard movement, selection, and range announcements', async ({ page }) => {
  const first = page.getByRole('gridcell', { name: 'Wednesday 1 July 2026' });
  await first.focus();
  await page.keyboard.press('ArrowDown');
  const nextWeek = page.getByRole('gridcell', { name: /Wednesday 8 July 2026/ });
  await expect(nextWeek).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(nextWeek).toHaveAttribute('aria-selected', 'true');
  await page.evaluate(() => window.galleryControllers.calendar.announceRange('July 2026 is visible'));
  await expect(page.locator('#calendar-live')).toHaveText('July 2026 is visible');
});

test('toast, loading, and AI approval expose meaningful status and action names', async ({ page }) => {
  await expect(page.locator('#toast')).toHaveAttribute('role', 'status');
  await expect(page.locator('#toast')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#loading')).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('button', { name: 'Save changes', disabled: true })).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('button', { name: 'Approve and create event' })).toHaveAttribute('aria-describedby', 'ai-impact');
  await expect(page.getByRole('status', { name: '' }).filter({ hasText: 'Awaiting approval' })).toBeVisible();
});

test('reduced motion and forced colors retain a usable focus boundary', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const cardTransition = await page.locator('.nt-ai-approval-card').evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(Math.max(...cardTransition.split(',').map((value) => parseFloat(value)))).toBeLessThanOrEqual(0.001);

  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  const button = page.getByLabel('Controls and forms').getByRole('button', { name: 'Save changes' });
  await button.focus();
  const outline = await button.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(outline.style).toBe('solid');
  expect(outline.width).toBeGreaterThanOrEqual(2);
});
