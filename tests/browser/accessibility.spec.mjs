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

test('async actions expose pending state, prevent duplicates, and preserve the accessible name', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { ntCreateAsyncAction } = await import('/dist/index.js');
    const button = document.createElement('button');
    button.className = 'nt-button nt-button--primary';
    button.textContent = 'Save changes';
    document.body.append(button);
    let activations = 0;
    let resolveRun;
    const pending = new Promise((resolve) => {
      resolveRun = resolve;
    });
    const controller = ntCreateAsyncAction({
      control: button,
      successResetDelay: 0,
      run: async () => {
        activations += 1;
        await pending;
      },
    });
    button.focus();
    button.click();
    button.click();
    const pendingState = {
      activations,
      name: button.textContent,
      busy: button.getAttribute('aria-busy'),
      state: button.dataset.ntState,
      focused: document.activeElement === button,
      disabled: button.hasAttribute('disabled'),
    };
    resolveRun();
    await Promise.resolve();
    await Promise.resolve();
    const finalState = { state: controller.state, busy: button.getAttribute('aria-busy') };
    controller.destroy();
    button.remove();
    return { pendingState, finalState };
  });

  expect(result.pendingState).toEqual({
    activations: 1,
    name: 'Save changes',
    busy: 'true',
    state: 'pending',
    focused: true,
    disabled: false,
  });
  expect(result.finalState).toEqual({ state: 'idle', busy: null });
});

test('toast controller dedupes, pauses timers, exposes urgency, and cleans up dismissal listeners', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { ntCreateToastController } = await import('/dist/index.js');
    const viewport = document.createElement('div');
    viewport.className = 'nt-toast-viewport';
    document.body.append(viewport);
    const controller = ntCreateToastController({ viewport, defaultTimeout: 80, maxVisible: 2 });

    const first = document.createElement('section');
    first.className = 'nt-toast nt-toast--success';
    first.innerHTML = '<p>Saved once</p><button class="nt-toast__close" aria-label="Dismiss">×</button>';
    controller.show({ id: 'save', toast: first, tone: 'success' });

    const duplicate = document.createElement('section');
    duplicate.className = 'nt-toast nt-toast--success';
    duplicate.innerHTML = '<p>Saved twice</p><button class="nt-toast__close" aria-label="Dismiss">×</button>';
    controller.show({ id: 'save', toast: duplicate, tone: 'success' });
    const dedupedCount = viewport.querySelectorAll('.nt-toast').length;

    duplicate.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 120));
    const paused = duplicate.isConnected;
    duplicate.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 120));
    const dismissedAfterResume = !duplicate.isConnected;

    const error = document.createElement('section');
    error.className = 'nt-toast nt-toast--danger';
    error.innerHTML = '<p>Delete failed</p><button class="nt-toast__close" aria-label="Dismiss">×</button>';
    controller.show({ id: 'delete-error', toast: error, tone: 'error', critical: true });
    const urgency = {
      role: error.getAttribute('role'),
      live: error.getAttribute('aria-live'),
      critical: error.dataset.ntCritical,
    };
    error.querySelector('button').click();
    const closedByAction = !error.isConnected;
    controller.destroy();
    const cleanedUp = viewport.querySelectorAll('.nt-toast').length === 0;
    viewport.remove();
    return { dedupedCount, paused, dismissedAfterResume, urgency, closedByAction, cleanedUp };
  });

  expect(result).toEqual({
    dedupedCount: 1,
    paused: true,
    dismissedAfterResume: true,
    urgency: { role: 'alert', live: 'assertive', critical: 'true' },
    closedByAction: true,
    cleanedUp: true,
  });
});

test('form controller preserves data, focuses summary, and prevents duplicate submission', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { ntCreateFormController } = await import('/dist/index.js');
    const form = document.createElement('form');
    form.innerHTML = `
      <div id="summary" role="region" aria-label="Check the form" hidden>
        <a href="#company">Company is required</a>
      </div>
      <label for="company">Company</label>
      <input id="company" name="company" required />
      <button type="submit">Save company</button>
    `;
    document.body.append(form);
    const summary = form.querySelector('#summary');
    const input = form.querySelector('#company');
    let submits = 0;
    let resolveSubmit;
    const pending = new Promise((resolve) => {
      resolveSubmit = resolve;
    });
    const controller = ntCreateFormController({
      form,
      errorSummary: summary,
      successResetDelay: 0,
      submit: async () => {
        submits += 1;
        await pending;
      },
    });

    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    const invalidState = {
      controllerState: controller.state,
      formState: form.dataset.ntSubmissionState,
      focusedSummary: document.activeElement === summary,
      summaryHidden: summary.hasAttribute('hidden'),
      submits,
      value: input.value,
    };

    input.value = 'Neetechs AB';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    const pendingState = {
      submits,
      formBusy: form.getAttribute('aria-busy'),
      buttonBusy: form.querySelector('button').getAttribute('aria-busy'),
      buttonState: form.querySelector('button').dataset.ntState,
      dirty: input.dataset.ntDirty,
      value: input.value,
    };

    resolveSubmit();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const finalState = {
      controllerState: controller.state,
      formBusy: form.getAttribute('aria-busy'),
      value: input.value,
    };
    controller.destroy();
    form.remove();
    return { invalidState, pendingState, finalState };
  });

  expect(result.invalidState).toEqual({
    controllerState: 'failure',
    formState: 'failure',
    focusedSummary: true,
    summaryHidden: false,
    submits: 0,
    value: '',
  });
  expect(result.pendingState).toEqual({
    submits: 1,
    formBusy: 'true',
    buttonBusy: 'true',
    buttonState: 'pending',
    dirty: 'true',
    value: 'Neetechs AB',
  });
  expect(result.finalState).toEqual({
    controllerState: 'editing',
    formBusy: null,
    value: 'Neetechs AB',
  });
});

test('content-state variants expose compact recoverable states without color-only meaning', async ({ page }) => {
  const result = await page.evaluate(() => {
    const states = ['empty', 'error', 'offline', 'maintenance', 'success'];
    const samples = states.map((state) => {
      const section = document.createElement('section');
      section.className = 'nt-content-state nt-content-state--inline';
      section.dataset.ntContentState = state;
      section.setAttribute('aria-labelledby', `${state}-title`);
      section.innerHTML = `
        <span class="nt-content-state__icon" aria-hidden="true">!</span>
        <div class="nt-content-state__body">
          <h2 id="${state}-title" class="nt-content-state__title">${state}</h2>
          <p class="nt-content-state__description">Recovery guidance for ${state}.</p>
          <div class="nt-content-state__actions">
            <button class="nt-button nt-button--secondary">Retry ${state}</button>
          </div>
        </div>
      `;
      document.body.append(section);
      const style = getComputedStyle(section);
      const iconStyle = getComputedStyle(section.querySelector('.nt-content-state__icon'));
      const record = {
        state,
        display: style.display,
        borderColor: style.borderColor,
        iconColor: iconStyle.color,
        hasHeading: Boolean(section.querySelector('.nt-content-state__title')?.textContent),
        hasAction: Boolean(section.querySelector('button')?.textContent),
      };
      section.remove();
      return record;
    });
    return {
      samples,
      distinctErrorSuccess:
        samples.find((sample) => sample.state === 'error')?.borderColor !==
        samples.find((sample) => sample.state === 'success')?.borderColor,
    };
  });

  expect(result.samples).toHaveLength(5);
  for (const sample of result.samples) {
    expect(sample.display).toBe('flex');
    expect(sample.hasHeading).toBe(true);
    expect(sample.hasAction).toBe(true);
    expect(sample.iconColor).not.toBe('');
  }
  expect(result.distinctErrorSuccess).toBe(true);
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
