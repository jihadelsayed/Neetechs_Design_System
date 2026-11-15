/**
 * Documentation accuracy gate.
 *
 * Every fenced code block in README.md and docs/*.md must reference real
 * package APIs:
 *  - each `nt-*` class used in a class="" attribute is defined in src CSS;
 *  - each named import from '@neetechs/ui[/subpath]' is exported by the built
 *    module that subpath resolves to;
 *  - each CSS import path ('@neetechs/ui/....css') resolves through exports.
 *
 * Blocks fenced as ```txt / ```text, or containing the marker
 * `nt-docs-check: ignore`, are skipped (for intentionally invalid examples).
 * Requires `npm run build` (dist/) for import checks.
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));

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

// Known classes: every `.nt-…` selector token in shipped CSS.
const definedClasses = new Set();
for (const file of await walk(join(root, 'src'), '.css')) {
  const css = (await readFile(file, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of css.matchAll(/\.(nt-[a-z0-9_-]+)/gi)) definedClasses.add(match[1]);
}

function resolveExport(subpath) {
  const key = subpath === '' ? '.' : `./${subpath}`;
  const exact = pkg.exports[key];
  if (exact) return typeof exact === 'string' ? exact : exact.import;
  for (const [pattern, target] of Object.entries(pkg.exports)) {
    if (!pattern.includes('*')) continue;
    const [prefix, suffix] = pattern.split('*');
    if (key.startsWith(prefix) && key.endsWith(suffix)) {
      const star = key.slice(prefix.length, key.length - suffix.length);
      const resolved = (typeof target === 'string' ? target : target.import).replaceAll('*', star);
      return resolved;
    }
  }
  return null;
}

const moduleCache = new Map();
async function exportsOf(subpath) {
  if (!moduleCache.has(subpath)) {
    const target = resolveExport(subpath);
    if (!target || target.endsWith('.css')) {
      moduleCache.set(subpath, null);
    } else {
      const module = await import(pathToFileURL(join(root, target)).href);
      moduleCache.set(subpath, new Set(Object.keys(module)));
    }
  }
  return moduleCache.get(subpath);
}

const typeOnly = new Set();
for (const file of await walk(join(root, 'dist'), '.ts')) {
  if (!file.endsWith('.d.ts')) continue;
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/export (?:declare )?(?:interface|type) ([A-Za-z0-9_]+)/g)) typeOnly.add(match[1]);
  for (const match of source.matchAll(/export type \{([^}]+)\}/g)) {
    for (const name of match[1].split(',')) typeOnly.add(name.trim().split(/\s+as\s+/).pop());
  }
}

const docs = [join(root, 'README.md'), ...(await walk(join(root, 'docs'), '.md'))];
const problems = [];
let blocks = 0;

for (const file of docs) {
  const source = await readFile(file, 'utf8');
  const name = relative(root, file);
  for (const match of source.matchAll(/```([a-z]*)\r?\n([\s\S]*?)```/g)) {
    const [, language, code] = match;
    if (language === 'txt' || language === 'text' || code.includes('nt-docs-check: ignore')) continue;
    blocks += 1;
    const line = source.slice(0, match.index).split('\n').length;

    for (const classMatch of code.matchAll(/class(?:Name)?="([^"]*)"/g)) {
      for (const token of classMatch[1].split(/\s+/)) {
        if (token.startsWith('nt-') && !definedClasses.has(token)) {
          problems.push(`${name}:${line} undefined class "${token}"`);
        }
      }
    }

    for (const importMatch of code.matchAll(/import\s+(type\s+)?\{([^}]+)\}\s+from\s+'(@neetechs\/ui(?:\/[^']*)?)'/g)) {
      const [, typeImport, names, specifier] = importMatch;
      const subpath = specifier === pkg.name ? '' : specifier.slice(pkg.name.length + 1);
      const available = await exportsOf(subpath);
      if (available === null) {
        problems.push(`${name}:${line} import from unresolvable module "${specifier}"`);
        continue;
      }
      for (const raw of names.split(',')) {
        const cleaned = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0];
        if (!cleaned) continue;
        const isType = Boolean(typeImport) || raw.trim().startsWith('type ');
        if (available.has(cleaned) || (isType && typeOnly.has(cleaned)) || typeOnly.has(cleaned)) continue;
        problems.push(`${name}:${line} "${cleaned}" is not exported by "${specifier}"`);
      }
    }

    for (const cssMatch of code.matchAll(/['"](@neetechs\/ui\/[^'"]+\.css)['"]/g)) {
      const target = resolveExport(cssMatch[1].slice(pkg.name.length + 1));
      if (!target || !existsSync(join(root, target))) {
        problems.push(`${name}:${line} CSS import "${cssMatch[1]}" does not resolve`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`Documentation validation failed with ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exitCode = 1;
} else {
  console.log('Documentation validation passed.');
  console.log(`  Documents: ${docs.length}`);
  console.log(`  Code blocks checked: ${blocks}`);
}
