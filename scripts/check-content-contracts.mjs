import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

/**
 * UX content contracts for repository-owned fixtures and examples
 * (docs/content-and-terminology.md). This checks only HTML the design system
 * owns; consuming applications and their translations are out of scope.
 *
 * A line containing "nt-content-allow" (attribute or comment) is an
 * intentional, reviewed exception — e.g. a fixture demonstrating bad copy.
 */

/** Generic control labels that hide the action's result. */
export const DISCOURAGED_CONTROL_LABELS = Object.freeze([
  'OK',
  'Okay',
  'Yes',
  'No',
  'Submit',
  'Proceed',
  'Confirm',
  'Execute',
  'Click here',
]);

/** Phrases that state a failure without explaining or aiding recovery. */
export const DISCOURAGED_PHRASES = Object.freeze([
  'Something went wrong',
  'Invalid input',
  'Are you sure?',
  'Oops',
  'Uh-oh',
  'An error occurred',
]);

const SCANNED_DIRECTORIES = ['tests'];

async function walkHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkHtml(path)));
    else if (extname(entry.name) === '.html') files.push(path);
  }
  return files;
}

function textFindings(source, file) {
  const findings = [];
  const lines = source.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (line.includes('nt-content-allow')) return;

    // Control labels: text content of buttons, links, and summaries.
    for (const match of line.matchAll(/<(button|a|summary)\b[^>]*>\s*([^<]*?)\s*</gi)) {
      const text = match[2].trim();
      if (!text) continue;
      const generic = DISCOURAGED_CONTROL_LABELS.find(
        (label) => text.toLowerCase() === label.toLowerCase(),
      );
      if (generic) {
        findings.push({
          file,
          line: index + 1,
          type: 'generic-control-label',
          detail: `<${match[1].toLowerCase()}> labeled "${text}" — name the result (e.g. "Create invoice", "Delete company")`,
        });
      }
    }

    for (const phrase of DISCOURAGED_PHRASES) {
      if (line.toLowerCase().includes(phrase.toLowerCase())) {
        findings.push({
          file,
          line: index + 1,
          type: 'unhelpful-copy',
          detail: `"${phrase}" — state what failed, where, and how to recover`,
        });
      }
    }
  });

  return findings;
}

export async function validateContentContracts({ rootDir = repositoryRoot } = {}) {
  const errors = [];
  let auditedFiles = 0;
  for (const directory of SCANNED_DIRECTORIES) {
    for (const absolute of await walkHtml(join(rootDir, directory))) {
      const file = relative(rootDir, absolute).replaceAll('\\', '/');
      const source = await readFile(absolute, 'utf8');
      auditedFiles += 1;
      errors.push(...textFindings(source, file));
    }
  }
  return { auditedFiles, errors };
}

async function main() {
  const result = await validateContentContracts();
  if (result.errors.length) {
    console.error(`UX content validation failed with ${result.errors.length} issue(s):`);
    for (const error of result.errors) {
      console.error(`  ${error.file}:${error.line} [${error.type}] ${error.detail}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log('UX content validation passed.');
  console.log(`  HTML fixtures audited: ${result.auditedFiles}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
