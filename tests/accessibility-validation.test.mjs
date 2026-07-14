import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, test } from 'node:test';

import {
  validateAccessibility,
  validateAccessibilityExamples,
  validateAccessibilitySource,
} from '../scripts/check-accessibility.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoots = [];

after(async () => {
  await Promise.all(temporaryRoots.map((root) => rm(root, { force: true, recursive: true })));
});

test('the production accessibility source and semantic contrast contract passes', async () => {
  const result = await validateAccessibility({ rootDir: repositoryRoot });
  assert.deepEqual(result.errors, []);
  assert.equal(result.results.length, 140);
  assert.ok(result.results.every(({ ratio, minimum }) => ratio >= minimum));
});

test('required contrast coverage spans themes, accents, statuses, focus, and AI', async () => {
  const { results } = await validateAccessibility({ rootDir: repositoryRoot });
  assert.deepEqual(new Set(results.map(({ theme }) => theme)), new Set(['light', 'dark']));
  assert.deepEqual(
    new Set(results.map(({ accent }) => accent)),
    new Set(['orange', 'blue', 'green', 'purple', 'neutral']),
  );
  for (const name of ['primary action', 'focus indicator', 'danger status', 'AI action']) {
    assert.equal(results.filter((result) => result.name === name).length, 10);
  }
});

test('source enforcement reports unsafe outline removal with its file and line', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nt-a11y-'));
  temporaryRoots.push(root);
  await mkdir(join(root, 'src', 'components', 'fixture'), { recursive: true });
  await writeFile(
    join(root, 'src', 'components', 'fixture', 'fixture.css'),
    '.fixture { color: currentColor; }\n.fixture:focus { outline: none; }\n',
  );
  const errors = await validateAccessibilitySource(root);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].type, 'unsafe-outline-removal');
  assert.equal(errors[0].file, 'src/components/fixture/fixture.css');
  assert.equal(errors[0].line, 2);
});

test('example enforcement detects duplicate IDs, broken ARIA references, images, and generic controls', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nt-a11y-example-'));
  temporaryRoots.push(root);
  await mkdir(join(root, 'tests', 'accessibility'), { recursive: true });
  await writeFile(
    join(root, 'tests', 'accessibility', 'invalid.html'),
    '<div id="same"></div>\n<div id="same" role="button" tabindex="0"></div>\n' +
      '<button aria-describedby="missing"><svg></svg></button>\n<img src="fixture.png">\n',
  );
  const errors = await validateAccessibilityExamples(root);
  assert.deepEqual(
    new Set(errors.map(({ type }) => type)),
    new Set([
      'duplicate-example-id',
      'undefined-aria-reference',
      'image-without-alt-strategy',
      'nonsemantic-interactive-example',
      'unnamed-icon-button-example',
    ]),
  );
});
