import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  DEPRECATED_TOKEN_MAPPINGS,
  REQUIRED_SEMANTIC_RADIUS_TOKENS,
  SEMANTIC_COLOR_LITERAL_ALLOWLIST,
  SEMANTIC_THEME_TOKEN_GROUPS,
  validateDesignTokens,
} from '../scripts/check-design-tokens.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const themeFiles = [
  'src/styles/themes/dark.css',
  'src/styles/themes/light.css',
];
const projectResult = validateDesignTokens({
  rootDir: repositoryRoot,
  enforceSemanticArchitecture: true,
});

function declarationTokens(result, filePath) {
  return new Set(
    result.declarations
      .filter((declaration) => declaration.filePath === filePath)
      .map((declaration) => declaration.token),
  );
}

test('the production semantic architecture passes enforcement', async () => {
  const result = await projectResult;

  assert.deepEqual(result.errors, []);
  assert.equal(SEMANTIC_COLOR_LITERAL_ALLOWLIST.length, 0);
});

test('light and dark resolved themes expose the same required roles', async () => {
  const result = await projectResult;
  const required = Object.values(SEMANTIC_THEME_TOKEN_GROUPS).flat();
  const sets = themeFiles.map((filePath) => declarationTokens(result, filePath));

  for (const tokenSet of sets) {
    for (const token of required) {
      assert.ok(tokenSet.has(token), `${token} is required in every theme`);
    }
  }

  assert.deepEqual([...sets[0]].sort(), [...sets[1]].sort());
});

test('status, AI, financial, and elevation role families are complete', () => {
  assert.equal(SEMANTIC_THEME_TOKEN_GROUPS.status.length, 16);
  assert.equal(SEMANTIC_THEME_TOKEN_GROUPS.ai.length, 9);
  assert.equal(SEMANTIC_THEME_TOKEN_GROUPS.financial.length, 3);
  assert.equal(SEMANTIC_THEME_TOKEN_GROUPS.elevation.length, 11);

  for (const status of ['info', 'success', 'warning', 'danger']) {
    assert.ok(SEMANTIC_THEME_TOKEN_GROUPS.status.includes(`--nt-${status}`));
    assert.ok(SEMANTIC_THEME_TOKEN_GROUPS.status.includes(`--nt-${status}-bg`));
    assert.ok(SEMANTIC_THEME_TOKEN_GROUPS.status.includes(`--nt-${status}-border`));
    assert.ok(SEMANTIC_THEME_TOKEN_GROUPS.status.includes(`--nt-${status}-text`));
  }
});

test('high contrast uses boundaries instead of semantic elevation shadows', async () => {
  const result = await projectResult;
  const declarations = result.declarations.filter(
    ({ filePath }) => filePath === 'src/styles/themes/high-contrast.css',
  );

  for (const token of SEMANTIC_THEME_TOKEN_GROUPS.elevation) {
    const declaration = declarations.find((candidate) => candidate.token === token);
    assert.equal(declaration?.value, 'none');
  }
});

test('semantic radius roles are declared', async () => {
  const result = await projectResult;

  for (const token of REQUIRED_SEMANTIC_RADIUS_TOKENS) {
    assert.ok(result.definedTokens.has(token), `${token} must be declared`);
  }
});

test('compatibility aliases resolve directly to their canonical targets', async () => {
  const result = await projectResult;
  const declarations = result.declarations.filter(
    ({ filePath }) => filePath === 'src/styles/tokens/compatibility.css',
  );

  for (const [legacy, canonical] of Object.entries(DEPRECATED_TOKEN_MAPPINGS)) {
    const declaration = declarations.find(({ token }) => token === legacy);
    assert.equal(declaration?.value, `var(${canonical})`);
  }
});

test('the main stylesheet includes the compatibility layer', async () => {
  const source = await readFile(
    join(repositoryRoot, 'src/styles/index.css'),
    'utf8',
  );

  assert.match(source, /@import '\.\/tokens\/compatibility\.css';/);
});

test('semantic enforcement rejects primitive colors, literals, raw shadows, and raw radii', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'nt-semantic-tokens-'));

  try {
    const files = {
      'src/styles/tokens/base.css': `:root {
        --nt-color-red-500: red;
        --nt-shadow-sm: 0 1px 2px black;
        --nt-radius-md: 0.5rem;
      }`,
      'src/components/example.css': `.example {
        color: var(--nt-color-red-500);
        background: #fff;
        box-shadow: var(--nt-shadow-sm);
        border-radius: var(--nt-radius-md);
      }`,
    };

    for (const [filePath, contents] of Object.entries(files)) {
      const absolutePath = join(rootDir, filePath);
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, contents, 'utf8');
    }

    const result = await validateDesignTokens({
      rootDir,
      deprecatedTokenMappings: {},
      requireCompatibilityAliases: false,
      enforceSemanticArchitecture: true,
    });
    const errorTypes = new Set(result.errors.map(({ type }) => type));

    assert.ok(errorTypes.has('prohibited-primitive-token'));
    assert.ok(errorTypes.has('hardcoded-color'));
    assert.ok(errorTypes.has('prohibited-raw-shadow'));
    assert.ok(errorTypes.has('prohibited-raw-radius'));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('a literal exception must match an exact file and value', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'nt-semantic-allowlist-'));

  try {
    const filePath = 'src/components/color-swatch.css';
    const absolutePath = join(rootDir, filePath);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, '.swatch { background: #12ab34; }', 'utf8');

    const result = await validateDesignTokens({
      rootDir,
      deprecatedTokenMappings: {},
      requireCompatibilityAliases: false,
      enforceSemanticArchitecture: true,
      semanticColorLiteralAllowlist: [
        {
          filePath,
          value: '#12ab34',
          reason: 'fixture-only user-selected swatch',
        },
      ],
    });

    assert.equal(
      result.errors.filter(({ type }) => type === 'hardcoded-color').length,
      0,
    );
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});
