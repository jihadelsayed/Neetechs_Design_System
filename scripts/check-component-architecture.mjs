import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const defaultRoot = resolve(scriptDirectory, '..');

const compatibilityExports = {
  './components/modal.css': './src/components/dialog/dialog.css',
  './patterns/workspace-switcher.css': './src/patterns/company-switcher/company-switcher.css',
  './shell/right-drawer.css': './src/components/drawer/drawer.css',
};

const retiredImplementations = [
  'src/components/modal/modal.css',
  'src/patterns/workspace-switcher/workspace-switcher.css',
  'src/shell/right-drawer/right-drawer.css',
];

function addError(errors, type, filePath, message) {
  errors.push({ type, filePath, message });
}

export async function validateComponentArchitecture({ rootDir = defaultRoot } = {}) {
  const errors = [];
  const read = async (filePath) => readFile(join(rootDir, filePath), 'utf8');
  const packageJson = JSON.parse(await read('package.json'));

  for (const [publicPath, canonicalTarget] of Object.entries(compatibilityExports)) {
    if (packageJson.exports?.[publicPath] !== canonicalTarget) {
      addError(
        errors,
        'compatibility-export',
        'package.json',
        `${publicPath} must resolve to canonical target ${canonicalTarget}`,
      );
    }
  }

  for (const filePath of retiredImplementations) {
    if (existsSync(join(rootDir, filePath))) {
      addError(
        errors,
        'duplicate-implementation',
        filePath,
        'retired compatibility implementation must not contain independent CSS',
      );
    }
  }

  const dialogCss = await read('src/components/dialog/dialog.css');
  for (const selector of ['.nt-dialog', '.nt-modal', '.nt-dialog__body', '.nt-modal__body']) {
    if (!dialogCss.includes(selector)) {
      addError(errors, 'missing-css-alias', 'src/components/dialog/dialog.css', selector);
    }
  }

  const drawerCss = await read('src/components/drawer/drawer.css');
  for (const selector of ['.nt-drawer--inline-end', '.nt-right-drawer', '.nt-right-drawer__body']) {
    if (!drawerCss.includes(selector)) {
      addError(errors, 'missing-css-alias', 'src/components/drawer/drawer.css', selector);
    }
  }

  const switcherCss = await read('src/patterns/company-switcher/company-switcher.css');
  for (const selector of [
    '.nt-company-switcher',
    '.nt-workspace-switcher',
    '.nt-company-switcher__item',
    '.nt-workspace-switcher__item',
  ]) {
    if (!switcherCss.includes(selector)) {
      addError(errors, 'missing-css-alias', 'src/patterns/company-switcher/company-switcher.css', selector);
    }
  }

  const dialogBehavior = await read('src/behaviors/dialog.ts');
  if (!/function ntCreateModal[\s\S]*?return ntCreateDialog\(/.test(dialogBehavior)) {
    addError(
      errors,
      'independent-adapter-logic',
      'src/behaviors/dialog.ts',
      'ntCreateModal must remain a thin ntCreateDialog adapter',
    );
  }

  const dropdownBehavior = await read('src/behaviors/dropdown.ts');
  if (!/function ntCreateDropdown[\s\S]*?return ntCreateMenuPopover\(/.test(dropdownBehavior)) {
    addError(
      errors,
      'independent-adapter-logic',
      'src/behaviors/dropdown.ts',
      'ntCreateDropdown must delegate to ntCreateMenuPopover',
    );
  }

  const tableCss = await read('src/components/table/table.css');
  if (!tableCss.includes('.nt-table') || tableCss.trim().length < 100) {
    addError(
      errors,
      'empty-public-export',
      'src/components/table/table.css',
      'the public semantic table stylesheet must provide a real native-table contract',
    );
  }

  return {
    errors,
    compatibilityExports: Object.keys(compatibilityExports).length,
    retiredImplementations: retiredImplementations.length,
  };
}

function printResult(result, rootDir) {
  if (result.errors.length === 0) {
    console.log(
      `Component architecture valid: ${result.compatibilityExports} compatibility exports resolve to canonical implementations; ${result.retiredImplementations} copied implementations remain retired.`,
    );
    return;
  }

  console.error(`Component architecture failed with ${result.errors.length} error(s):`);
  for (const error of result.errors) {
    const displayPath = relative(rootDir, join(rootDir, error.filePath)) || error.filePath;
    console.error(`- [${error.type}] ${displayPath}: ${error.message}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await validateComponentArchitecture({ rootDir: defaultRoot });
  printResult(result, defaultRoot);
  process.exitCode = result.errors.length === 0 ? 0 : 1;
}
