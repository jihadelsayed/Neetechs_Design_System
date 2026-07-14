import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));

async function read(path) {
  return readFile(resolve(rootDir, path), 'utf8');
}

const PATTERN_FILES = [
  'src/patterns/page/page.css',
  'src/patterns/form-layout/form-layout.css',
  'src/patterns/settings-layout/settings-layout.css',
  'src/patterns/master-detail/master-detail.css',
  'src/patterns/workflow/workflow.css',
];

test('page-pattern CSS files exist and are registered in the patterns bundle', async () => {
  const index = await read('src/patterns/index.css');
  for (const file of PATTERN_FILES) {
    const source = await read(file);
    assert.ok(source.length > 0);
    const importPath = file.replace('src/patterns/', './');
    assert.ok(index.includes(importPath), `${importPath} must be imported by src/patterns/index.css`);
  }
});

test('pattern layouts are container-aware and avoid fixed heights', async () => {
  for (const file of PATTERN_FILES) {
    const source = await read(file);
    // No fixed element heights that would clip translated text. Markers and
    // icons may size themselves via square tokens; text containers may not.
    assert.doesNotMatch(
      source,
      /(?:^|[;{}])\s*height\s*:\s*\d+(?:\.\d+)?(?:px|rem)/m,
      `${file} must not fix element heights (except intrinsic square markers via tokens)`,
    );
  }

  for (const file of [
    'src/patterns/form-layout/form-layout.css',
    'src/patterns/settings-layout/settings-layout.css',
    'src/patterns/master-detail/master-detail.css',
    'src/patterns/workflow/workflow.css',
  ]) {
    assert.match(await read(file), /@container/, `${file} must adapt to container width`);
  }
});

test('the page fixture demonstrates the required page anatomy', async () => {
  const fixture = await read('tests/pages/patterns.html');

  assert.equal([...fixture.matchAll(/<h1[\s>]/g)].length, 1, 'exactly one h1');
  assert.match(fixture, /class="nt-page-header"/);
  assert.match(fixture, /class="nt-page-toolbar"/);
  assert.match(fixture, /class="nt-page-footer-actions"/);
  assert.match(fixture, /nt-settings-section--danger/);
  assert.match(fixture, /data-nt-pane="detail"/);
  assert.match(fixture, /aria-current="step"/);
  assert.match(fixture, /dir="rtl" lang="ar"/);
  assert.match(fixture, /lang="sv"/);
  assert.match(fixture, /data-nt-content-state="unauthenticated"/);
});

test('every page action group in the fixture has at most one primary action', async () => {
  const fixture = await read('tests/pages/patterns.html');
  const groups = fixture.split(/class="[^"]*(?:__actions|footer-actions)[^"]*"/).slice(1);
  for (const [index, group] of groups.entries()) {
    const scope = group.slice(0, group.indexOf('</header>') === -1 ? 2000 : group.indexOf('</header>'));
    const primaries = [...scope.matchAll(/nt-button--primary/g)].length;
    assert.ok(primaries <= 1, `action group ${index + 1} renders ${primaries} primary actions`);
  }
});

test('destructive actions are separated from safe actions in fixtures', async () => {
  const fixture = await read('tests/pages/patterns.html');
  // Every danger button in the fixture lives in a start slot or a fenced
  // danger section, never adjacent to the primary action.
  for (const match of fixture.matchAll(/\n([^\n]*nt-button--danger[^\n]*)/g)) {
    const before = fixture.slice(Math.max(0, match.index - 600), match.index);
    assert.ok(
      /nt-page-footer-actions__start|nt-form__actions-start|nt-settings-section--danger/.test(before),
      `destructive action lacks separation: ${match[1].trim().slice(0, 80)}`,
    );
  }
});

test('workflow and approval fixtures state consequence before the action', async () => {
  const fixture = await read('tests/pages/patterns.html');
  assert.match(fixture, /nt-workflow__consequence/);
  assert.match(fixture, /nt-ai-approval-card__footer-text/);
  assert.match(fixture, /nt-workflow__progress/);
});
