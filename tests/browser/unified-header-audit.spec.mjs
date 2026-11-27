import { expect, test } from '@playwright/test';
import { auditGlobalHeader } from '../../docs/integrations/header-audit.mjs';

test('audit real shared header across desktop and mobile, including guest transition', async ({ page }) => {
  await page.goto('/tests/pages/unified-header.html');
  await page.waitForFunction(() => Boolean(window.headerFixture));
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(auditGlobalHeader, { requiredItems: ['tools', 'logout'] }))
      .toEqual({ count: 1, unifiedCount: 1, problems: [] });
  }
  await page.evaluate(() => {
    const f = window.headerFixture;
    f.controller.update({ ...f.config, account: { state: 'loading' } });
  });
  expect(await page.evaluate(auditGlobalHeader, { forbiddenActions: ['logout', 'login'] }))
    .toEqual({ count: 1, unifiedCount: 1, problems: [] });
  await page.evaluate(() => {
    const f = window.headerFixture;
    f.controller.update({ ...f.config, account: { state: 'guest', items: [
      { kind: 'action', id: 'login', action: 'login', label: 'Sign in' },
    ] } });
  });
  expect(await page.evaluate(auditGlobalHeader, { requiredItems: ['login'], forbiddenActions: ['logout'] }))
    .toEqual({ count: 1, unifiedCount: 1, problems: [] });
});

const header = '<header id="h" data-nt-header><button aria-controls="h-mobile" data-nt-header-item="open">Open</button></header><aside id="h-mobile" data-nt-header-mobile hidden><button data-nt-header-item="logout" data-nt-header-action="logout">Logout</button></aside><div id="h-backdrop" hidden></div>';

const cases = [
  ['one global plus page heading', header + '<header>Page</header>', { requiredItems: ['logout'] }, []],
  ['document route exclusion', '<header>Page</header>', { expectedCount: 0 }, []],
  ['duplicate legacy', header + '<div class="legacy">Legacy</div>', { legacySelectors: ['.legacy'] }, ['global-header-count']],
  ['duplicate ID', header + '<div id="h-mobile"></div>', {}, ['duplicate-header-id', 'invalid-aria-reference']],
  ['missing drawer', '<header id="h" data-nt-header><button aria-controls="h-mobile"></button></header>', {}, ['missing-drawer-parts', 'invalid-aria-reference']],
  ['guest must not expose logout', header, { forbiddenActions: ['logout'] }, ['forbidden-action-present']],
  ['missing expected link', header, { requiredItems: ['settings'] }, ['required-item-missing']],
  ['overflow', '<header class="legacy" style="width:10px"><span style="display:inline-block;width:100px">Long</span></header>', { legacySelectors: ['.legacy'] }, ['header-overflow']],
  ['drawer root aria reference', header.replace('data-nt-header-mobile hidden', 'data-nt-header-mobile aria-labelledby="missing-title" hidden'), {}, ['invalid-aria-reference']],
];
for (const [name, html, options, expected] of cases) {
  test('audit fixture: ' + name, async ({ page }) => {
    await page.setContent(html);
    const result = await page.evaluate(auditGlobalHeader, options);
    expect(result.problems.sort()).toEqual([...expected].sort());
  });
}
