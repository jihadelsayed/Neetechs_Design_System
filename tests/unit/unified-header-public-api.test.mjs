import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as ui from '../../dist/index.js';

test('unified header public package exports are callable', () => {
  for (const name of ['ntRenderHeader','ntMountHeader','ntCreateHeaderBrand','ntCreateHeaderAccount','ntCreateHeaderPreference','ntCreateEcosystemNavigation','ntRenderHeaderIcon']) {
    assert.equal(typeof ui[name], 'function', name);
  }
  assert.equal(ui.NT_HEADER_BRAND_NAME, 'Neetechs');
  assert.equal(typeof ui.NT_HEADER_LOGO_URL, 'string');
  assert.equal(typeof ui.NT_ECOSYSTEM_LINKS.tools, 'string');
});
