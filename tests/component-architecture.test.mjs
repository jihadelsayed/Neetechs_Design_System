import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { validateComponentArchitecture } from '../scripts/check-component-architecture.mjs';

test('compatibility paths resolve to canonical component implementations', async () => {
  const result = await validateComponentArchitecture();
  assert.deepEqual(result.errors, []);
  assert.equal(result.compatibilityExports, 3);
  assert.equal(result.retiredImplementations, 3);
});

test('canonical runtime exports retain dialog, modal, drawer, and menu adapters', async () => {
  const api = await import('../dist/index.js');

  assert.equal(api.NEETECHS_UI_VERSION, '0.0.2');
  assert.equal(typeof api.ntCreateDialog, 'function');
  assert.equal(typeof api.ntCreateModal, 'function');
  assert.equal(typeof api.ntCreateDrawer, 'function');
  assert.equal(typeof api.ntCreateMenuPopover, 'function');
  assert.equal(typeof api.ntCreateMenu, 'function');
  assert.equal(api.createDialog, api.ntCreateDialog);
  assert.equal(api.createDrawer, api.ntCreateDrawer);
});

test('package metadata stays framework-agnostic and versioned from one source', async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  const sourceIndex = await readFile('src/index.ts', 'utf8');

  assert.deepEqual(packageJson.dependencies ?? {}, {});
  assert.match(sourceIndex, new RegExp(`NEETECHS_UI_VERSION = '${packageJson.version}'`));
});

test('table and data-grid retain distinct semantic contracts', async () => {
  const tableCss = await readFile('src/components/table/table.css', 'utf8');
  const gridBehavior = await readFile('src/behaviors/data-grid.ts', 'utf8');

  assert.match(tableCss, /Native, read-only table styling/);
  assert.doesNotMatch(tableCss, /role=['"]grid['"]/);
  assert.match(gridBehavior, /root\.setAttribute\('role', 'grid'\)/);
  assert.match(gridBehavior, /root\.addEventListener\('keydown'/);
});

test('badge and chip remain distinct informational and interactive contracts', async () => {
  const badgeCss = await readFile('src/components/badge/badge.css', 'utf8');
  const chipCss = await readFile('src/components/chip/chip.css', 'utf8');

  assert.match(badgeCss, /\.nt-badge/);
  assert.doesNotMatch(badgeCss, /__remove/);
  assert.match(chipCss, /\.nt-chip__remove/);
  assert.match(chipCss, /aria-selected/);
});
