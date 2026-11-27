/**
 * Package release gate.
 *
 * 1. Packs the package exactly as npm would publish it.
 * 2. Rejects local/development artifacts and secrets-shaped files.
 * 3. Installs the tarball into a clean throwaway consumer project.
 * 4. Resolves every public export from the consumer and imports the JS entries.
 * 5. Verifies every CSS export exists and that its @import graph resolves.
 * 6. Enforces a package-size budget.
 *
 * Assumes `npm run build` already ran (dist/ must be current).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (args, cwd) => execFileSync(npm, args, {
  cwd,
  encoding: 'utf8',
  shell: process.platform === 'win32',
  stdio: ['ignore', 'pipe', 'pipe'],
});

const MAX_PACKED_BYTES = 400 * 1024;
const FORBIDDEN = [
  /(^|\/)\.env/i,
  /\.(tgz|zip|log|pem|key)$/i,
  /(^|\/)node_modules\//,
  /(^|\/)test-results\//,
  /(^|\/)playwright-report\//,
  /(^|\/)tests\//,
  /(^|\/)CLAUDE(\.local)?\.md$/i,
  /(^|\/)\.npmrc$/,
];

const failures = [];
const fail = (message) => failures.push(message);

if (!existsSync(join(root, 'dist', 'index.js'))) {
  console.error('dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

const scratch = mkdtempSync(join(tmpdir(), 'nt-ui-pack-'));

try {
  const [packed] = JSON.parse(run(['pack', '--json', '--pack-destination', scratch], root));
  const files = packed.files.map((file) => file.path.replaceAll('\\', '/'));

  for (const file of files) {
    if (FORBIDDEN.some((pattern) => pattern.test(file))) {
      fail(`forbidden file in tarball: ${file}`);
    }
  }

  if (packed.size > MAX_PACKED_BYTES) {
    fail(`packed size ${packed.size} B exceeds budget ${MAX_PACKED_BYTES} B`);
  }

  for (const required of ['package.json', 'README.md', 'LICENSE', 'CHANGELOG.md', 'dist/index.js', 'dist/index.d.ts']) {
    if (!files.includes(required)) {
      fail(`required file missing from tarball: ${required}`);
    }
  }

  // Clean consumer project.
  const consumer = join(scratch, 'consumer');
  mkdirSync(consumer);
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({
    name: 'nt-ui-consumer-check',
    private: true,
    type: 'module',
  }));
  run(['install', '--no-audit', '--no-fund', '--ignore-scripts', join(scratch, packed.filename)], consumer);

  const installed = join(consumer, 'node_modules', '@neetechs', 'ui');
  const exportMap = pkg.exports;
  let jsEntries = 0;
  let cssEntries = 0;
  let assetEntries = 0;

  const resolveTarget = (target) => (typeof target === 'string' ? target : target.import);

  const checkCssGraph = (file, seen = new Set()) => {
    if (seen.has(file)) return;
    seen.add(file);
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/@import\s+['"]([^'"]+)['"]/g)) {
      const next = resolve(dirname(file), match[1]);
      if (!existsSync(next)) {
        fail(`${file.slice(installed.length + 1)} imports missing ${match[1]}`);
        continue;
      }
      checkCssGraph(next, seen);
    }
  };

  for (const [subpath, target] of Object.entries(exportMap)) {
    const relativeTarget = resolveTarget(target);

    if (subpath.includes('*')) {
      // Wildcard: verify at least one concrete file matches the pattern.
      const pattern = new RegExp(`^${relativeTarget.slice(2).split('*')
        .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]+')}$`);
      const matching = files.filter((file) => pattern.test(file));
      if (matching.length === 0) {
        fail(`wildcard export ${subpath} matches no packed file`);
      }
      continue;
    }

    const absolute = join(installed, relativeTarget);
    if (!existsSync(absolute)) {
      fail(`export ${subpath} → ${relativeTarget} does not exist in the installed package`);
      continue;
    }

    if (relativeTarget.endsWith('.css')) {
      cssEntries += 1;
      checkCssGraph(absolute);
      continue;
    }

    if (!/\.(?:mjs|cjs|js)$/.test(relativeTarget)) {
      assetEntries += 1;
      continue;
    }

    jsEntries += 1;
    if (typeof target === 'object' && target.types && !existsSync(join(installed, target.types))) {
      fail(`export ${subpath} types → ${target.types} missing`);
    }
  }

  // Import every JS entry through the consumer's own resolver (true package resolution).
  const probe = join(consumer, 'probe.mjs');
  const specifiers = Object.entries(exportMap)
    .filter(([subpath, target]) => !subpath.includes('*') && /\.(?:mjs|cjs|js)$/.test(resolveTarget(target)))
    .map(([subpath]) => (subpath === '.' ? pkg.name : `${pkg.name}/${subpath.slice(2)}`));
  const assetSpecifiers = Object.entries(exportMap)
    .filter(([subpath, target]) => !subpath.includes('*') && !/\.(?:mjs|cjs|js|css)$/.test(resolveTarget(target)))
    .map(([subpath]) => subpath === '.' ? pkg.name : `${pkg.name}/${subpath.slice(2)}`);
  writeFileSync(probe, [
    "import { existsSync } from 'node:fs';",
    "import { fileURLToPath } from 'node:url';",
    ...specifiers.map((specifier, index) => `import * as m${index} from '${specifier}';`),
    `const modules = [${specifiers.map((_, index) => `m${index}`).join(', ')}];`,
    // `./types` is type-only at runtime; every other entry must export values.
    `for (const [i, m] of modules.entries()) { if (Object.keys(m).length === 0 && ${JSON.stringify(specifiers)}[i] !== '${pkg.name}/types') throw new Error('empty module ' + i); }`,
    `if (m0.NEETECHS_UI_VERSION !== ${JSON.stringify(pkg.version)}) throw new Error('NEETECHS_UI_VERSION ' + m0.NEETECHS_UI_VERSION + ' != package.json ${pkg.version}');`,
    `for (const specifier of ${JSON.stringify(assetSpecifiers)}) { if (!existsSync(fileURLToPath(import.meta.resolve(specifier)))) throw new Error('missing asset ' + specifier); }`,
    "for (const name of ['ntRenderHeader','ntMountHeader','ntCreateHeaderBrand','ntCreateEcosystemNavigation','ntCreateHeaderAccount','ntCreateHeaderPreference']) { if (typeof m0[name] !== 'function') throw new Error('missing header API ' + name); }",
    "const header = m0.ntRenderHeader({id:'package-smoke-header',brand:m0.ntCreateHeaderBrand({logoUrl:null}),navigation:[],labels:{primaryNavigation:'Primary',mobileNavigation:'Mobile',openNavigation:'Open',closeNavigation:'Close',account:'Account',accountLoading:'Loading'}});",
    "if (!header.includes('data-nt-header')) throw new Error('header SSR smoke failed');",
    "console.log('ok');",
  ].join('\n'));
  try {
    execFileSync(process.execPath, [probe], { cwd: consumer, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    const lines = (error.stderr || error.message).trim().split('\n');
    fail(`consumer import failed: ${lines.find((line) => /Error/.test(line)) ?? lines.join(' ')}`);
  }

  // Wildcard spot checks resolved by the consumer (Node conditions only apply to JS).
  for (const specifier of [`${pkg.name}/behaviors/dropdown`, `${pkg.name}/behaviors/navigation`]) {
    try {
      execFileSync(process.execPath, ['--input-type=module', '-e', `await import('${specifier}')`], {
        cwd: consumer, stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      fail(`consumer could not import ${specifier}: ${(error.stderr?.toString() || '').trim().split('\n').pop()}`);
    }
  }

  if (failures.length > 0) {
    console.error('Package validation failed:');
    for (const message of failures) console.error(`  - ${message}`);
    process.exitCode = 1;
  } else {
    console.log('Package validation passed.');
    console.log(`  Tarball: ${packed.filename} (${(packed.size / 1024).toFixed(1)} kB packed, ${packed.entryCount} files)`);
    console.log(`  Exports verified: ${jsEntries} JS, ${cssEntries} CSS, ${assetEntries} assets (+ wildcard patterns)`);
    console.log('  Clean consumer install and import: ok');
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
