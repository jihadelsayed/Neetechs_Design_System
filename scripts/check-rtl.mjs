import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

const PHYSICAL_PROPERTIES = new Set([
  'left', 'right', 'margin-left', 'margin-right', 'padding-left', 'padding-right',
  'border-left', 'border-right', 'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-left-radius', 'border-bottom-right-radius', 'float', 'clear',
]);

/** Reviewed coordinate or backward-compatibility exceptions. Keep entries file- and rule-specific. */
export const RTL_ALLOWLIST = [
  ['src/components/drawer/drawer.css', ['physical-property', 'translate-x'], 'Legacy --left/--right sides remain physical; --inline-start/--inline-end are the direction-aware API.'],
  ['src/components/dropdown/dropdown.css', ['physical-origin'], 'CSS has no logical transform-origin keyword; paired :dir(rtl) rules resolve start/end.'],
  ['src/components/progress/progress.css', ['physical-origin', 'physical-background'], 'Origin has an RTL counterpart; stripe coordinates are decorative.'],
  ['src/components/select/select.css', ['physical-background'], 'Native select chevrons have explicit mirrored RTL gradients.'],
  ['src/components/split-button/split-button.css', ['physical-origin'], 'Popover origin has an explicit RTL counterpart.'],
  ['src/components/switch/switch.css', ['translate-x'], 'Thumb travel has size-specific positive and negative RTL counterparts.'],
  ['src/components/toast/toast.css', ['physical-property', 'physical-origin', 'translate-x'], 'Named left/right placements remain physical; default placement, progress, and swipe exit are direction-aware.'],
  ['src/components/tooltip/tooltip.css', ['physical-property', 'physical-origin', 'translate-x'], 'Tooltip side placement and arrow geometry are coordinate-based; align=start/end uses logical insets.'],
  ['src/patterns/search-bar/search-bar.css', ['physical-property'], 'Detached results accept public physical viewport coordinates.'],
  ['src/styles/responsive.css', ['physical-property'], 'Safe-area insets are physically anchored device cutouts; both inline sides are padded symmetrically.'],
  ['src/ai/ai-action-button/ai-action-button.css', ['translate-x'], 'Decorative shine traverses both physical directions and carries no meaning.'],
  ['src/components/skeleton/skeleton.css', ['translate-x'], 'Decorative shimmer traverses both physical directions and carries no meaning.'],
  ['src/styles/animations/motion.css', ['translate-x'], 'Public slide-in-left/right animations intentionally describe physical motion.'],
];

async function walkCss(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkCss(path)));
    else if (extname(entry.name) === '.css') files.push(path);
  }
  return files;
}

function lineAt(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function allowed(file, type) {
  return RTL_ALLOWLIST.find(([candidate, types]) => candidate === file && types.includes(type));
}

function declarationFindings(source, file) {
  const findings = [];
  for (const match of source.matchAll(/([\w-]+)\s*:\s*([^;{}]+);/g)) {
    const property = match[1].toLowerCase();
    const value = match[2].trim();
    let type = null;
    if (PHYSICAL_PROPERTIES.has(property)) type = 'physical-property';
    else if (property === 'transform-origin' && /\b(?:left|right)\b/i.test(value)) type = 'physical-origin';
    else if (/^background(?:-position)?$/.test(property) && /\b(?:left|right)\b/i.test(value)) type = 'physical-background';
    else if (property === 'transform' && /translateX\((?!0(?:[a-z%]*)?\))/i.test(value)) type = 'translate-x';
    if (!type) continue;
    findings.push({ file, line: lineAt(source, match.index), type, detail: `${property}: ${value}` });
  }
  return findings;
}

function broadIconMirroring(source, file) {
  const findings = [];
  for (const block of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = block[1].trim();
    if (!/(?:\[dir=['"]?rtl|:dir\(rtl\))/i.test(selector)) continue;
    if (!/(?:^|[\s,>+~])(?:svg|\*)(?:[\s,:.#\[]|$)/i.test(selector)) continue;
    if (!/(?:scaleX\(\s*-1\s*\)|scale\s*:\s*-1\s+1)/i.test(block[2])) continue;
    findings.push({
      file,
      line: lineAt(source, block.index),
      type: 'broad-icon-mirroring',
      detail: selector,
    });
  }
  return findings;
}

export async function validateRtlSource({ rootDir = repositoryRoot } = {}) {
  const errors = [];
  const intentional = [];
  const files = await walkCss(join(rootDir, 'src'));
  for (const absolute of files) {
    const file = relative(rootDir, absolute).replaceAll('\\', '/');
    const source = await readFile(absolute, 'utf8');
    const findings = [...declarationFindings(source, file), ...broadIconMirroring(source, file)];
    for (const finding of findings) {
      const exception = allowed(file, finding.type);
      if (exception) intentional.push({ ...finding, reason: exception[2] });
      else errors.push(finding);
    }
  }
  return { auditedFiles: files.length, errors, intentional };
}

async function main() {
  const result = await validateRtlSource();
  if (result.errors.length) {
    console.error(`RTL source validation failed with ${result.errors.length} unexplained issue(s):`);
    for (const error of result.errors) {
      console.error(`  ${error.file}:${error.line} [${error.type}] ${error.detail}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log('RTL source validation passed.');
  console.log(`  CSS files audited: ${result.auditedFiles}`);
  console.log(`  Reviewed physical/coordinate exceptions: ${result.intentional.length}`);
  console.log('  Broad icon mirroring problems: 0');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
