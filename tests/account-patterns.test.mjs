import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (path) => readFile(resolve(rootDir, path), 'utf8');
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const NEW_FILES = [
  ['src/components/choice-card/choice-card.css', 'src/components/index.css', './choice-card/choice-card.css'],
  ['src/components/disclosure/disclosure.css', 'src/components/index.css', './disclosure/disclosure.css'],
  ['src/patterns/profile-header/profile-header.css', 'src/patterns/index.css', './profile-header/profile-header.css'],
  ['src/patterns/resource-card/resource-card.css', 'src/patterns/index.css', './resource-card/resource-card.css'],
  ['src/patterns/editor-workspace/editor-workspace.css', 'src/patterns/index.css', './editor-workspace/editor-workspace.css'],
  ['src/patterns/document-preview/document-preview.css', 'src/patterns/index.css', './document-preview/document-preview.css'],
];

test('MyAccount-derived modules are registered in their bundles', async () => {
  for (const [file, index, importPath] of NEW_FILES) {
    assert.ok((await read(file)).length > 0, `${file} exists`);
    assert.ok((await read(index)).includes(importPath), `${importPath} must be imported by ${index}`);
  }
});

test('interactive modules define focus rings and reduced-motion fallbacks', async () => {
  for (const file of [
    'src/components/choice-card/choice-card.css',
    'src/components/disclosure/disclosure.css',
    'src/patterns/resource-card/resource-card.css',
    'src/patterns/editor-workspace/editor-workspace.css',
    'src/patterns/settings-layout/settings-layout.css',
    'src/shell/navbar/navbar.css',
  ]) {
    const css = stripComments(await read(file));
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, `${file} needs a reduced-motion block`);
    // The resource card is a container, not a control; its buttons carry the ring.
    if (!file.includes('resource-card')) {
      assert.match(css, /focus-visible\)?\s*\{[^}]*outline:/, `${file} needs a visible focus ring`);
    }
  }
});

test('document tokens are defined in every theme', async () => {
  const tokens = ['--nt-document-canvas', '--nt-document-paper', '--nt-document-ink', '--nt-document-ink-muted', '--nt-document-rule'];
  for (const theme of ['dark', 'light', 'high-contrast']) {
    const css = await read(`src/styles/themes/${theme}.css`);
    for (const token of tokens) assert.match(css, new RegExp(`${token}:`), `${token} missing from ${theme}.css`);
  }
});

test('choice cards keep the native input in the accessibility tree', async () => {
  const css = stripComments(await read('src/components/choice-card/choice-card.css'));
  const rule = css.match(/\.nt-choice-card__input \{([^}]*)\}/);
  assert.ok(rule);
  assert.match(rule[1], /clip-path: inset\(50%\)/);
  assert.doesNotMatch(rule[1], /display:\s*none|visibility:\s*hidden/);
  assert.match(css, /:has\(\.nt-choice-card__input:checked\)/);
  assert.match(css, /:has\(\.nt-choice-card__input:focus-visible\)/);
});

test('disclosure styles native details and hides the default marker', async () => {
  const css = stripComments(await read('src/components/disclosure/disclosure.css'));
  assert.match(css, /\.nt-disclosure__summary::-webkit-details-marker/);
  assert.match(css, /\.nt-disclosure\[open\]/);
});

test('settings navigation marks in-page sections and keeps a shape indicator', async () => {
  const css = stripComments(await read('src/patterns/settings-layout/settings-layout.css'));
  assert.match(css, /\[aria-current='location'\]/);
  assert.match(css, /\.nt-settings-layout__nav-item::before/);
});

test('profile header and resource card avoid self-referencing container queries', async () => {
  for (const [file, block] of [
    ['src/patterns/profile-header/profile-header.css', 'nt-profile-header'],
    ['src/patterns/resource-card/resource-card.css', 'nt-resource-card'],
  ]) {
    const css = stripComments(await read(file));
    for (const query of css.matchAll(/@container[^{]*\{([\s\S]*?)\n\}/g)) {
      assert.doesNotMatch(query[1], new RegExp(`\\.${block}\\s*\\{`), `${file}: a container cannot query itself`);
    }
  }
});
