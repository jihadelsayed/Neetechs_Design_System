import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const defaultRoot = resolve(scriptDirectory, '..');

const validOperationStates = new Set(['idle', 'pending', 'success', 'error', 'canceled']);
const validContentStates = new Set([
  'initial',
  'loading',
  'ready',
  'refreshing',
  'empty',
  'partial',
  'stale',
  'error',
  'offline',
  'unauthenticated',
  'forbidden',
  'not-found',
  'maintenance',
  'success',
]);

function addError(errors, type, filePath, message) {
  errors.push({ type, filePath, message });
}

async function walk(rootDir, dir, files = []) {
  for (const name of await readdir(join(rootDir, dir))) {
    const filePath = join(dir, name);
    const fullPath = join(rootDir, filePath);
    const stats = await stat(fullPath);
    if (stats.isDirectory()) {
      if (!['dist', 'node_modules', 'coverage', '.git', 'tmp', 'test-results'].includes(name)) {
        await walk(rootDir, filePath, files);
      }
      continue;
    }
    if (/\.(css|ts|mjs|html|md)$/.test(name)) files.push(filePath);
  }
  return files;
}

export async function validateStateContracts({ rootDir = defaultRoot } = {}) {
  const errors = [];
  const read = async (filePath) => readFile(join(rootDir, filePath), 'utf8');

  const requiredFiles = [
    'docs/states-feedback-and-recovery.md',
    'src/behaviors/state.ts',
    'src/patterns/content-state/content-state.css',
  ];
  for (const filePath of requiredFiles) {
    if (!existsSync(join(rootDir, filePath))) {
      addError(errors, 'missing-state-contract', filePath, 'required Prompt 8 state contract file is missing');
    }
  }

  const behaviorIndex = await read('src/behaviors/index.ts');
  for (const exportPath of ['./state.js', './forms.js', './announcer.js']) {
    if (!behaviorIndex.includes(exportPath)) {
      addError(errors, 'missing-behavior-export', 'src/behaviors/index.ts', `${exportPath} must be exported`);
    }
  }

  const patternIndex = await read('src/patterns/index.css');
  if (!patternIndex.includes('./content-state/content-state.css')) {
    addError(
      errors,
      'missing-content-state-import',
      'src/patterns/index.css',
      'canonical content-state CSS must be part of patterns.css',
    );
  }

  const buttonCss = await read('src/components/button/button.css');
  if (!buttonCss.includes("[data-nt-state='pending']") || !buttonCss.includes("[data-nt-state='error']")) {
    addError(
      errors,
      'missing-async-button-state',
      'src/components/button/button.css',
      'buttons must style canonical async states without requiring disabled/loading classes',
    );
  }

  const announcer = await read('src/behaviors/announcer.ts');
  for (const expected of ['ntCreateToastController', 'pointerenter', 'focusin', 'maxVisible']) {
    if (!announcer.includes(expected)) {
      addError(errors, 'toast-contract', 'src/behaviors/announcer.ts', `toast controller must cover ${expected}`);
    }
  }

  const forms = await read('src/behaviors/forms.ts');
  for (const expected of ['ntCreateFormController', 'checkValidity', 'ntFocusErrorSummary', 'dataset.ntDirty']) {
    if (!forms.includes(expected)) {
      addError(errors, 'form-contract', 'src/behaviors/forms.ts', `form controller must cover ${expected}`);
    }
  }

  const files = await walk(rootDir, 'src');
  for (const filePath of files) {
    const source = await read(filePath);
    for (const match of source.matchAll(/data-nt-state=['"]([^'"]+)['"]/g)) {
      if (!validOperationStates.has(match[1])) {
        addError(errors, 'invalid-operation-state', filePath, `${match[1]} is not a canonical async operation state`);
      }
    }
    for (const match of source.matchAll(/data-nt-content-state=['"]([^'"]+)['"]/g)) {
      if (!validContentStates.has(match[1])) {
        addError(errors, 'invalid-content-state', filePath, `${match[1]} is not a canonical content state`);
      }
    }
    if (/nt-toast--danger[\s\S]{0,120}data-nt-autodismiss=['"]true['"]/.test(source)) {
      addError(
        errors,
        'critical-toast-autodismiss',
        filePath,
        'critical error toasts must not be configured for automatic dismissal',
      );
    }
  }

  const documentation = await read('docs/states-feedback-and-recovery.md').catch(() => '');
  for (const heading of [
    'State Audit',
    'State Dimensions',
    'Feedback Channel Matrix',
    'AI Write-Action Confirmation',
    'Manual QA Checklist',
  ]) {
    if (!documentation.includes(heading)) {
      addError(errors, 'state-docs', 'docs/states-feedback-and-recovery.md', `${heading} section is required`);
    }
  }

  return { errors };
}

function printResult(result, rootDir) {
  if (result.errors.length === 0) {
    console.log('State contract validation passed.');
    return;
  }

  console.error(`State contract validation failed with ${result.errors.length} error(s):`);
  for (const error of result.errors) {
    console.error(`- [${error.type}] ${relative(rootDir, join(rootDir, error.filePath))}: ${error.message}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await validateStateContracts({ rootDir: defaultRoot });
  printResult(result, defaultRoot);
  process.exitCode = result.errors.length === 0 ? 0 : 1;
}
