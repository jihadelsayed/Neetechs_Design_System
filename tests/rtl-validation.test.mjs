import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, test } from 'node:test';

import { validateRtlSource } from '../scripts/check-rtl.mjs';

const roots = [];
after(async () => Promise.all(roots.map((root) => rm(root, { recursive: true, force: true }))));

async function fixture(css) {
  const root = await mkdtemp(join(tmpdir(), 'nt-rtl-'));
  roots.push(root);
  const directory = join(root, 'src', 'components', 'fixture');
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'fixture.css'), css);
  return validateRtlSource({ rootDir: root });
}

test('production CSS has only reviewed physical-coordinate exceptions', async () => {
  const result = await validateRtlSource({ rootDir: resolve('.') });
  assert.deepEqual(result.errors, []);
  assert.ok(result.auditedFiles > 80);
  assert.ok(result.intentional.length > 0);
});

test('logical properties pass RTL source validation', async () => {
  const result = await fixture('.fixture { margin-inline-start: 1rem; inset-inline-end: 0; text-align: start; }');
  assert.deepEqual(result.errors, []);
});

test('unexplained physical properties and translateX report exact lines', async () => {
  const result = await fixture('.fixture { margin-left: 1rem; }\n.other { transform: translateX(2rem); }');
  assert.equal(result.errors.length, 2);
  assert.deepEqual(result.errors.map(({ line }) => line), [1, 2]);
  assert.deepEqual(new Set(result.errors.map(({ type }) => type)), new Set(['physical-property', 'translate-x']));
});

test('dangerous broad RTL icon mirroring is rejected', async () => {
  const result = await fixture(':dir(rtl) svg { transform: scaleX(-1); }');
  assert.equal(result.errors.some(({ type }) => type === 'broad-icon-mirroring'), true);
});
