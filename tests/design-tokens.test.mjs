import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

import { validateDesignTokens } from '../scripts/check-design-tokens.mjs';

async function validateFixture(files, options = {}) {
  const rootDir = await mkdtemp(join(tmpdir(), 'nt-design-tokens-'));

  try {
    for (const [filePath, contents] of Object.entries(files)) {
      const absolutePath = join(rootDir, filePath);
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, contents, 'utf8');
    }

    return await validateDesignTokens({
      rootDir,
      sourceDirectory: 'src',
      deprecatedTokenMappings: {},
      requireCompatibilityAliases: false,
      ...options,
    });
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
}

function errorsOfType(result, type) {
  return result.errors.filter((error) => error.type === type);
}

test('accepts a valid declared token', async () => {
  const result = await validateFixture({
    'src/valid.css': ':root { --nt-color: red; } .example { color: var(--nt-color); }',
  });

  assert.deepEqual(result.errors, []);
});

test('reports an undefined token with its file and line', async () => {
  const result = await validateFixture({
    'src/undefined.css': '.example {\n  color: var(--nt-missing);\n}',
  });
  const [error] = errorsOfType(result, 'undefined-token');

  assert.equal(error.token, '--nt-missing');
  assert.equal(error.filePath, 'src/undefined.css');
  assert.equal(error.line, 2);
});

test('still validates the referenced token when var() has a fallback', async () => {
  const result = await validateFixture({
    'src/fallback.css': '.example { color: var(--nt-missing, red); }',
  });

  assert.equal(errorsOfType(result, 'undefined-token').length, 1);
});

test('parses every token in a nested var() fallback', async () => {
  const result = await validateFixture({
    'src/nested.css': `
      :root {
        --nt-primary: red;
        --nt-secondary: blue;
      }
      .example { color: var(--nt-primary, var(--nt-secondary, black)); }
    `,
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.usages.filter(({ token }) => token === '--nt-primary').length, 1);
  assert.equal(result.usages.filter(({ token }) => token === '--nt-secondary').length, 1);
});

test('reports a circular alias chain', async () => {
  const result = await validateFixture({
    'src/circular.css': `
      :root {
        --nt-a: var(--nt-b);
        --nt-b: var(--nt-c);
        --nt-c: var(--nt-a);
      }
    `,
  });

  assert.equal(errorsOfType(result, 'circular-alias').length, 1);
});

test('reports a self-referencing token', async () => {
  const result = await validateFixture({
    'src/self.css': ':root { --nt-self: var(--nt-self, red); }',
  });

  assert.equal(errorsOfType(result, 'self-reference').length, 1);
});

test('reports deprecated tokens used by internal component CSS', async () => {
  const deprecatedTokenMappings = { '--nt-old': '--nt-new' };
  const result = await validateFixture(
    {
      'src/styles/tokens/base.css': ':root { --nt-new: red; }',
      'src/styles/tokens/compatibility.css': ':root { --nt-old: var(--nt-new); }',
      'src/components/example.css': '.example { color: var(--nt-old); }',
    },
    {
      deprecatedTokenMappings,
      requireCompatibilityAliases: true,
    },
  );

  assert.equal(errorsOfType(result, 'deprecated-internal-usage').length, 1);
});

test('allows a direct compatibility alias to its canonical token', async () => {
  const deprecatedTokenMappings = { '--nt-old': '--nt-new' };
  const result = await validateFixture(
    {
      'src/styles/tokens/base.css': ':root { --nt-new: red; }',
      'src/styles/tokens/compatibility.css': ':root { --nt-old: var(--nt-new); }',
      'src/components/example.css': '.example { color: var(--nt-new); }',
    },
    {
      deprecatedTokenMappings,
      requireCompatibilityAliases: true,
    },
  );

  assert.deepEqual(result.errors, []);
});

test('ignores generated and dependency directories under the source root', async () => {
  const result = await validateFixture({
    'src/valid.css': ':root { --nt-valid: red; } .ok { color: var(--nt-valid); }',
    'src/dist/generated.css': '.bad { color: var(--nt-generated-missing); }',
    'src/node_modules/dependency.css': '.bad { color: var(--nt-dependency-missing); }',
  });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.files, ['src/valid.css']);
});

test('allows the same semantic token in distinct theme scopes', async () => {
  const result = await validateFixture({
    'src/themes.css': `
      :root { --nt-surface: black; }
      [data-nt-theme='light'] { --nt-surface: white; }
      [data-nt-theme='high-contrast'] { --nt-surface: Canvas; }
      .example { color: var(--nt-surface); }
    `,
  });

  assert.deepEqual(result.errors, []);
});

test('reports empty token declarations', async () => {
  const result = await validateFixture({
    'src/empty.css': ':root { --nt-empty: ; }',
  });

  assert.equal(errorsOfType(result, 'invalid-declaration').length, 1);
});

test('reports duplicate declarations in one CSS block', async () => {
  const result = await validateFixture({
    'src/duplicate.css': ':root { --nt-value: red; --nt-value: blue; }',
  });

  assert.equal(errorsOfType(result, 'duplicate-declaration').length, 1);
});

test('reports aliases that point to undeclared tokens', async () => {
  const result = await validateFixture({
    'src/alias.css': ':root { --nt-alias: var(--nt-missing); }',
  });

  const [error] = errorsOfType(result, 'undeclared-alias-target');
  assert.equal(error.token, '--nt-missing');
});
