import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Synthetic package only: verifies the actual checker with real npm pack/install.
// It is intentionally not a replacement for validating the full built package.
test('package checker retains only the exact validated artifact', { timeout: 180_000 }, () => {
  const scratch = mkdtempSync(join(tmpdir(), 'nt-package-output-test-'));
  try {
    const root = join(scratch, 'package');
    for (const dir of ['scripts', 'dist/behaviors', 'src', 'node_modules']) mkdirSync(join(root, dir), { recursive: true });
    cpSync(fileURLToPath(new URL('../../scripts/check-package.mjs', import.meta.url)), join(root, 'scripts/check-package.mjs'));
    // Reuse the repository's installed dev compiler; do not fetch anything.
    const compilerDir = dirname(createRequire(import.meta.url).resolve('typescript/package.json'));
    symlinkSync(compilerDir, join(root, 'node_modules/typescript'), 'junction');
    const write = (file, contents) => writeFileSync(join(root, file), contents);
    write('package.json', JSON.stringify({
      name: '@neetechs/ui', version: '0.0.0', type: 'module',
      files: ['dist', 'src', 'README.md', 'LICENSE', 'CHANGELOG.md'],
      exports: {
        '.': { types: './dist/index.d.ts', import: './dist/index.js' },
        './behaviors/*': './dist/behaviors/*.js',
        './styles.css': './src/index.css',
        './assets/logo.png': './src/logo.png',
      },
    }));
    write('dist/index.js', [
      "export const NEETECHS_UI_VERSION = '0.0.0';",
      "export const ntRenderHeader = () => '<header data-nt-header></header>';",
      ...['ntMountHeader', 'ntCreateHeaderBrand', 'ntCreateEcosystemNavigation', 'ntCreateHeaderAccount', 'ntCreateHeaderPreference'].map(name => 'export const ' + name + ' = () => ({});'),
    ].join('\n'));
    const declarations = [
      "export interface NtHeaderConfig { id: string; brand: { label: string }; navigation: readonly unknown[]; labels: Record<string, string>; account?: { state: 'loading' | 'guest' | 'authenticated' }; appearance?: object; }",
      "export interface NtHeaderController { update(config: NtHeaderConfig): void; closeMenus(): void; destroy(): void; }",
      "export interface NtHeaderMountOptions { onAction?: (value: {action: string}) => void; onNavigate?: (value: {href: string}) => boolean; }",
      "export function ntRenderHeader(config: NtHeaderConfig): string;",
      "export function ntMountHeader(host: HTMLElement, config: NtHeaderConfig, options?: NtHeaderMountOptions): NtHeaderController;",
      "export function ntCreateHeaderBrand(options: {logoUrl: null}): NtHeaderConfig['brand'];",
      "export function ntCreateEcosystemNavigation(options: {labels: Record<string, string>}): {navigation: readonly unknown[]};",
      "export function ntCreateHeaderAccount(snapshot: {state: 'loading'}, options: {labels: Record<string, string>; destinations: object}): {state: 'loading'};",
      "export function ntCreateHeaderPreference(options: {label: string; selectedId: string; choices: readonly object[]}): object | undefined;",
    ].join('\n');
    write('dist/index.d.ts', declarations);
    for (const name of ['dropdown', 'navigation']) write('dist/behaviors/' + name + '.js', 'export const fixture = true;');
    for (const name of ['README.md', 'LICENSE', 'CHANGELOG.md']) write(name, 'Synthetic checker fixture.');
    write('src/index.css', "@import './header.css';");
    write('src/header.css', '.nt-header { display: flex; }');
    write('src/logo.png', 'Synthetic asset.');
    const run = (...args) => {
      const result = spawnSync(process.execPath, ['scripts/check-package.mjs', ...args], {
        cwd: root, encoding: 'utf8', timeout: 20_000,
        env: { ...process.env, npm_config_offline: 'true', npm_config_update_notifier: 'false' },
      });
      assert.ifError(result.error);
      return result;
    };
    const defaultRun = run();
    assert.equal(defaultRun.status, 0, defaultRun.stderr);
    const output = join(scratch, 'validated');
    const retained = run('--output-dir', output);
    assert.equal(retained.status, 0, retained.stderr);
    const tarball = join(output, 'neetechs-ui-0.0.0.tgz');
    const bytes = readFileSync(tarball);
    const integrity = 'sha512-' + createHash('sha512').update(bytes).digest('base64');
    assert.ok(retained.stdout.includes(integrity));
    const duplicate = run('--output-dir', output);
    assert.notEqual(duplicate.status, 0);
    assert.match(duplicate.stderr, /EEXIST/);
    assert.deepEqual(readFileSync(tarball), bytes);
    const invalid = run('--output-dir');
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /Usage:/);
    write('dist/index.d.ts', 'export {};');
    const badTypes = join(scratch, 'bad-types');
    const typeFailure = run('--output-dir', badTypes);
    assert.notEqual(typeFailure.status, 0);
    assert.match(typeFailure.stderr, /consumer TypeScript check failed/);
    assert.equal(existsSync(badTypes), false);
    write('dist/index.d.ts', declarations);
    rmSync(join(root, 'src/header.css'));
    const failedOutput = join(scratch, 'failed');
    const failed = run('--output-dir', failedOutput);
    assert.notEqual(failed.status, 0);
    assert.match(failed.stderr, /imports missing/);
    assert.equal(existsSync(failedOutput), false);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
