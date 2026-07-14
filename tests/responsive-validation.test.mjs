import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ALLOWED_MEDIA_WIDTHS_REM,
  RESPONSIVE_ALLOWLIST,
  validateResponsiveSource,
} from '../scripts/check-responsive.mjs';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));

async function read(path) {
  return readFile(resolve(rootDir, path), 'utf8');
}

test('production CSS passes responsive source validation', async () => {
  const result = await validateResponsiveSource({ rootDir });
  assert.deepEqual(result.errors, []);
  assert.ok(result.auditedFiles > 80);
});

test('every responsive allowlist entry documents a reason', () => {
  for (const [file, type, reason] of RESPONSIVE_ALLOWLIST) {
    assert.match(file, /^src\//, `${file} must be a source path`);
    assert.ok(type.length > 0);
    assert.ok(reason.length > 20, `${file} needs a real explanation`);
  }
});

test('the media-query scale matches the documented breakpoint tokens', async () => {
  const tokens = await read('src/styles/tokens/breakpoints.css');
  for (const width of ALLOWED_MEDIA_WIDTHS_REM) {
    assert.match(
      tokens,
      new RegExp(`${width}rem`),
      `${width}rem must appear in src/styles/tokens/breakpoints.css`,
    );
  }
});

test('container-query foundations exist and key regions are query containers', async () => {
  const responsive = await read('src/styles/responsive.css');
  assert.match(responsive, /\.nt-region\s*\{[^}]*container-type:\s*inline-size/);
  assert.match(responsive, /\.nt-region--named\s*\{[^}]*container-name:\s*nt-region/);

  const appShell = await read('src/shell/app-shell/app-shell.css');
  assert.match(appShell, /\.nt-app-shell__content\s*\{[^}]*container-type:\s*inline-size/);

  const dialog = await read('src/components/dialog/dialog.css');
  assert.match(dialog, /container-type:\s*inline-size/);

  const drawer = await read('src/components/drawer/drawer.css');
  assert.match(drawer, /container-type:\s*inline-size/);
});

test('full-height shell surfaces carry dynamic viewport fallbacks', async () => {
  for (const file of [
    'src/shell/app-shell/app-shell.css',
    'src/shell/mobile-nav/mobile-nav.css',
    'src/styles/base.css',
    'src/styles/reset.css',
  ]) {
    const source = await read(file);
    if (/100vh/.test(source)) {
      assert.match(source, /100dvh/, `${file} uses 100vh without a dvh companion`);
    }
  }
});

test('tables and data grids expose narrow-container strategies', async () => {
  const table = await read('src/components/table/table.css');
  assert.match(table, /@container \(max-width: 40rem\)/);
  assert.match(table, /\.nt-table__cell--tertiary/);
  assert.match(table, /\.nt-table__details/);

  const grid = await read('src/components/data-grid/data-grid.css');
  assert.match(grid, /\.nt-data-grid--constrained/);
  assert.match(grid, /\.nt-data-grid__record-list/);
  assert.match(grid, /container-type:\s*inline-size/);
});

test('the calendar ships a phone-capable agenda list and intrinsic day timeline', async () => {
  const index = await read('src/domain/calendar/index.css');
  assert.match(index, /agenda-list\/agenda-list\.css/);

  const agenda = await read('src/domain/calendar/agenda-list/agenda-list.css');
  assert.match(agenda, /\.nt-calendar-agenda\b/);
  assert.match(agenda, /min-height: var\(--nt-target-size-primary\)/);
  assert.doesNotMatch(agenda, /(?:^|[;{}])\s*min-width\s*:\s*(?:3[0-9]|[4-9][0-9])(?:\.\d+)?rem/m);

  const timeline = await read('src/domain/calendar/day-timeline/day-timeline.css');
  assert.doesNotMatch(timeline, /(?:^|[;{}])\s*min-width\s*:\s*(?:3[0-9]|[4-9][0-9])(?:\.\d+)?rem/m);
});

test('hover reveal and coarse-pointer contracts are defined', async () => {
  const responsive = await read('src/styles/responsive.css');
  assert.match(responsive, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(responsive, /@media \(pointer: coarse\)/);
  assert.match(responsive, /safe-area-inset-bottom/);
});

test('the viewport behavior helper mirrors the CSS scale', async () => {
  const helper = await read('src/behaviors/viewport.ts');
  for (const [name, rem] of [['xs', 30], ['sm', 40], ['md', 48], ['lg', 64], ['xl', 80]]) {
    assert.match(helper, new RegExp(`${name}: ${rem},`), `NT_VIEWPORTS.${name} must be ${rem}`);
  }
});
