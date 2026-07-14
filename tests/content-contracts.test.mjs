import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  DISCOURAGED_CONTROL_LABELS,
  DISCOURAGED_PHRASES,
  validateContentContracts,
} from '../scripts/check-content-contracts.mjs';

test('repository-owned fixtures pass the UX content contract', async () => {
  const result = await validateContentContracts();
  assert.deepEqual(result.errors, []);
  assert.ok(result.auditedFiles >= 2, 'expected the gallery and page fixtures to be audited');
});

test('generic labels and unhelpful copy are detected with file and line', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nt-content-'));
  try {
    await mkdir(join(root, 'tests'), { recursive: true });
    await writeFile(
      join(root, 'tests', 'bad.html'),
      [
        '<main>',
        '  <button type="button">Submit</button>',
        '  <p>Something went wrong.</p>',
        '  <button type="button">OK</button> <!-- nt-content-allow: demonstrates discouraged copy -->',
        '</main>',
      ].join('\n'),
      'utf8',
    );

    const result = await validateContentContracts({ rootDir: root });
    const types = result.errors.map(({ type }) => type).sort();
    assert.deepEqual(types, ['generic-control-label', 'unhelpful-copy']);
    assert.equal(result.errors.find(({ type }) => type === 'generic-control-label').line, 2);
    assert.equal(result.errors.find(({ type }) => type === 'unhelpful-copy').line, 3);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('the discouraged vocabularies stay focused and documented', () => {
  assert.ok(DISCOURAGED_CONTROL_LABELS.includes('Submit'));
  assert.ok(DISCOURAGED_CONTROL_LABELS.includes('Click here'));
  assert.ok(DISCOURAGED_PHRASES.includes('Something went wrong'));
  assert.ok(DISCOURAGED_PHRASES.includes('Are you sure?'));
  // Deliberately narrow lists: broad grammar policing creates noise.
  assert.ok(DISCOURAGED_CONTROL_LABELS.length <= 12);
  assert.ok(DISCOURAGED_PHRASES.length <= 10);
});
