import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

/**
 * The only width bounds production media queries may use, in rem.
 * This is the scale documented in src/styles/tokens/breakpoints.css and
 * mirrored by NT_VIEWPORTS in src/behaviors/viewport.ts. Device-brand and
 * px-based breakpoints are rejected.
 */
export const ALLOWED_MEDIA_WIDTHS_REM = Object.freeze([30, 40, 48, 64, 80, 96]);

/**
 * Reviewed exceptions. Keep entries file- and rule-specific and explain why
 * the pattern is intentional.
 * Shape: [file, type, reason]
 */
export const RESPONSIVE_ALLOWLIST = [
  ['src/components/data-grid/data-grid.css', 'large-min-width', 'Desktop grid mode keeps a 48rem table inside its own scroller; constrained and record modes are the narrow contracts.'],
  ['src/domain/calendar/month-grid/month-grid.css', 'large-min-width', 'Month grid stays a scrolled desktop grid at narrow widths; the agenda list is the documented phone view.'],
  ['src/domain/calendar/week-grid/week-grid.css', 'large-min-width', 'Week grid stays a scrolled desktop grid at narrow widths; the agenda list and day timeline are the documented phone views.'],
  ['src/domain/calendar/day-slice/day-slice.css', 'large-min-width', 'Day slice column widths are shared with the week grid desktop geometry.'],
  ['src/domain/billing/index.css', 'large-min-width', 'Line-item tables keep column comparison inside a labeled horizontal scroll container; totals and status render outside it.'],
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
  return RESPONSIVE_ALLOWLIST.find(([candidate, candidateType]) => candidate === file && candidateType === type);
}

/** Media queries must use widths from the documented rem scale. */
function mediaBreakpointFindings(source, file) {
  const findings = [];
  for (const match of source.matchAll(/@media[^{]*\((?:min|max)-width\s*:\s*([\d.]+)(px|rem|em)\)/gi)) {
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    const rem = unit === 'px' ? value / 16 : value;
    if (unit === 'px') {
      findings.push({
        file,
        line: lineAt(source, match.index),
        type: 'px-media-breakpoint',
        detail: `${match[0]} — use the documented rem scale (${ALLOWED_MEDIA_WIDTHS_REM.join(', ')}rem)`,
      });
      continue;
    }
    if (!ALLOWED_MEDIA_WIDTHS_REM.includes(rem)) {
      findings.push({
        file,
        line: lineAt(source, match.index),
        type: 'undocumented-media-breakpoint',
        detail: `${match[0]} — allowed widths: ${ALLOWED_MEDIA_WIDTHS_REM.join(', ')}rem`,
      });
    }
  }
  return findings;
}

/**
 * Plain 100vh sizing needs a dvh companion in the same block so mobile
 * browser chrome cannot hide fixed actions.
 */
function viewportHeightFindings(source, file) {
  const findings = [];
  for (const block of source.matchAll(/\{([^{}]*)\}/g)) {
    const body = block[1];
    for (const declaration of body.matchAll(/((?:min-|max-)?height)\s*:\s*100vh\s*(?:;|$)/gi)) {
      const property = declaration[1].toLowerCase();
      const fallbackPattern = new RegExp(`${property}\\s*:\\s*100dvh`, 'i');
      if (!fallbackPattern.test(body)) {
        findings.push({
          file,
          line: lineAt(source, block.index + declaration.index),
          type: 'vh-without-dvh-fallback',
          detail: `${declaration[0].trim()} needs a following ${property}: 100dvh; fallback`,
        });
      }
    }
  }
  return findings;
}

/**
 * A component demanding 30rem+ of intrinsic width cannot live in narrow
 * containers; that requires a reviewed reason (usually a scrolled desktop
 * grid with a documented mobile alternative).
 */
function largeMinWidthFindings(source, file) {
  const findings = [];
  // Declarations only — condition lists in @media/@container are preceded by "(".
  for (const match of source.matchAll(/(?:^|[;{}])\s*min-width\s*:\s*([\d.]+)rem/gi)) {
    if (Number(match[1]) < 30) continue;
    findings.push({
      file,
      line: lineAt(source, match.index),
      type: 'large-min-width',
      detail: `${match[0]} — components must work in narrow containers or document an alternative view`,
    });
  }
  return findings;
}

export async function validateResponsiveSource({ rootDir = repositoryRoot } = {}) {
  const errors = [];
  const intentional = [];
  const files = await walkCss(join(rootDir, 'src'));
  for (const absolute of files) {
    const file = relative(rootDir, absolute).replaceAll('\\', '/');
    const source = await readFile(absolute, 'utf8');
    const findings = [
      ...mediaBreakpointFindings(source, file),
      ...viewportHeightFindings(source, file),
      ...largeMinWidthFindings(source, file),
    ];
    for (const finding of findings) {
      const exception = allowed(file, finding.type);
      if (exception) intentional.push({ ...finding, reason: exception[2] });
      else errors.push(finding);
    }
  }
  return { auditedFiles: files.length, errors, intentional };
}

async function main() {
  const result = await validateResponsiveSource();
  if (result.errors.length) {
    console.error(`Responsive source validation failed with ${result.errors.length} issue(s):`);
    for (const error of result.errors) {
      console.error(`  ${error.file}:${error.line} [${error.type}] ${error.detail}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log('Responsive source validation passed.');
  console.log(`  CSS files audited: ${result.auditedFiles}`);
  console.log(`  Reviewed exceptions: ${result.intentional.length}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
