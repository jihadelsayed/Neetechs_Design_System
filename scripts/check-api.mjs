/**
 * Public API compatibility gate.
 *
 * Extracts the public surface of a package directory:
 *   - package.json export subpaths
 *   - every `.nt-*` class selector in shipped CSS
 *   - every `--nt-*` custom property declared in shipped CSS
 *   - every runtime export name of each JS export entry
 * and compares it with the committed baseline (api/public-api.json).
 * Anything in the baseline that disappears fails the check; additions are
 * reported and accepted. `--update` rewrites the baseline (only after an
 * intentional, documented breaking change or to record additions).
 *
 *   node scripts/check-api.mjs                 # check repo against baseline
 *   node scripts/check-api.mjs --update        # record current surface
 *   node scripts/check-api.mjs --compare <dir> # check repo is a superset of an extracted package (e.g. 0.0.4)
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const baselinePath = join(root, 'api', 'public-api.json');

async function walk(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path, extension)));
    else if (extname(entry.name) === extension) files.push(path);
  }
  return files;
}

export async function extractSurface(packageDir) {
  const pkg = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'));
  const classes = new Set();
  const tokens = new Set();
  const cssFiles = [];
  for (const file of await walk(join(packageDir, 'src'), '.css')) {
    cssFiles.push(file.slice(packageDir.length + 1).split(sep).join('/'));
    const css = (await readFile(file, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const match of css.matchAll(/\.(nt-[a-z0-9_-]+)/gi)) classes.add(match[1]);
    for (const match of css.matchAll(/(--nt-[a-z0-9-]+)\s*:/gi)) tokens.add(match[1]);
  }

  const js = {};
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    if (subpath.includes('*')) continue;
    const file = typeof target === 'string' ? target : target.import;
    if (!file.endsWith('.js')) continue;
    const module = await import(pathToFileURL(join(packageDir, file)).href);
    js[subpath] = Object.keys(module).sort();
  }

  return {
    exports: Object.keys(pkg.exports).sort(),
    cssFiles: cssFiles.sort(),
    classes: [...classes].sort(),
    tokens: [...tokens].sort(),
    js,
  };
}

function diff(previous, current) {
  const missing = [];
  const added = [];
  for (const key of ['exports', 'cssFiles', 'classes', 'tokens']) {
    const now = new Set(current[key]);
    const before = new Set(previous[key] ?? []);
    for (const item of previous[key] ?? []) if (!now.has(item)) missing.push(`${key}: ${item}`);
    for (const item of current[key]) if (!before.has(item)) added.push(`${key}: ${item}`);
  }
  for (const [entry, names] of Object.entries(previous.js)) {
    const now = new Set(current.js[entry] ?? []);
    for (const name of names) if (!now.has(name)) missing.push(`js ${entry}: ${name}`);
  }
  for (const [entry, names] of Object.entries(current.js)) {
    const before = new Set(previous.js[entry] ?? []);
    for (const name of names) if (!before.has(name)) added.push(`js ${entry}: ${name}`);
  }
  return { missing, added };
}

const args = process.argv.slice(2);
const current = await extractSurface(root);

if (args[0] === '--update') {
  await mkdir(join(root, 'api'), { recursive: true });
  await writeFile(baselinePath, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`Public API baseline written: ${current.exports.length} exports, ${current.classes.length} classes, ${current.tokens.length} tokens, ${Object.values(current.js).flat().length} JS bindings.`);
  process.exit(0);
}

const previous = args[0] === '--compare'
  ? await extractSurface(resolve(args[1]))
  : JSON.parse(await readFile(baselinePath, 'utf8'));
const { missing, added } = diff(previous, current);

if (missing.length > 0) {
  console.error(`Public API check failed: ${missing.length} public name(s) removed.`);
  for (const item of missing) console.error(`  - ${item}`);
  console.error('Restore them, add a compatibility alias, or document the breaking change and run with --update.');
  process.exitCode = 1;
} else {
  console.log('Public API check passed: no public export, class, token, or JS binding was removed.');
  console.log(`  Surface: ${current.exports.length} exports, ${current.cssFiles.length} CSS files, ${current.classes.length} classes, ${current.tokens.length} tokens, ${Object.values(current.js).flat().length} JS bindings.`);
  if (added.length > 0) {
    console.log(`  Additions not yet in baseline: ${added.length} (run --update to record).`);
  }
}
