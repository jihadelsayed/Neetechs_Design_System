import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (path) => readFile(resolve(rootDir, path), 'utf8');
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const NEW_FILES = [
  ['src/components/stat/stat.css', 'src/components/index.css', './stat/stat.css'],
  ['src/components/description-list/description-list.css', 'src/components/index.css', './description-list/description-list.css'],
  ['src/patterns/record-list/record-list.css', 'src/patterns/index.css', './record-list/record-list.css'],
];

test('workspace component and pattern files are registered in their bundles', async () => {
  for (const [file, index, importPath] of NEW_FILES) {
    assert.ok((await read(file)).length > 0, `${file} exists`);
    assert.ok((await read(index)).includes(importPath), `${importPath} must be imported by ${index}`);
  }
});

test('interactive workspace styles define focus-visible rings and reduced-motion fallbacks', async () => {
  for (const file of [
    'src/components/stat/stat.css',
    'src/patterns/record-list/record-list.css',
    'src/shell/sidebar/sidebar.css',
    'src/shell/app-shell/app-shell.css',
  ]) {
    const css = stripComments(await read(file));
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, `${file} needs a reduced-motion block`);
    if (!file.includes('app-shell')) {
      assert.match(css, /:focus-visible\s*\{[^}]*outline:/, `${file} needs a visible focus ring`);
    }
  }
});

test('selected and active states carry a non-color cue', async () => {
  const stat = stripComments(await read('src/components/stat/stat.css'));
  assert.match(stat, /\.nt-stat--selected[\s\S]*?box-shadow: 0 0 0 1px var\(--nt-selection-border\)/);
  const record = stripComments(await read('src/patterns/record-list/record-list.css'));
  assert.match(record, /\.nt-record--selected::before/);
  const sidebar = stripComments(await read('src/shell/sidebar/sidebar.css'));
  assert.match(sidebar, /\.nt-sidebar__item\[aria-current='page'\]::before/);
  const card = stripComments(await read('src/components/card/card.css'));
  assert.match(card, /\.nt-card--selected/);
});

test('collapsed rail keeps item labels in the accessibility tree', async () => {
  const sidebar = stripComments(await read('src/shell/sidebar/sidebar.css'));
  const rule = sidebar.match(/\.nt-sidebar--collapsed\) \.nt-sidebar__item-label \{([^}]*)\}/);
  assert.ok(rule, 'collapsed item label rule exists');
  assert.match(rule[1], /clip-path: inset\(50%\)/);
  assert.doesNotMatch(rule[1], /display:\s*none/);
});

test('pending buttons hide the label with opacity so the accessible name survives', async () => {
  const button = stripComments(await read('src/components/button/button.css'));
  const rule = button.match(/\[data-nt-state='pending'\]:has\(> \.nt-button__spinner\) > \.nt-button__content \{([^}]*)\}/);
  assert.ok(rule);
  assert.match(rule[1], /opacity: 0/);
  assert.doesNotMatch(rule[1], /visibility|display/);
});

test('ntCreateSidebar is exported and importing it is SSR-safe', async () => {
  const behaviors = await import(pathToFileURL(resolve(rootDir, 'dist/behaviors/index.js')).href);
  const root = await import(pathToFileURL(resolve(rootDir, 'dist/index.js')).href);
  const direct = await import(pathToFileURL(resolve(rootDir, 'dist/behaviors/sidebar.js')).href);
  assert.equal(typeof behaviors.ntCreateSidebar, 'function');
  assert.equal(root.ntCreateSidebar, behaviors.ntCreateSidebar);
  assert.equal(direct.ntCreateSidebar, behaviors.ntCreateSidebar);
});

test('sidebar controller syncs rail state and tolerates storage failures', async () => {
  const { ntCreateSidebar } = await import(pathToFileURL(resolve(rootDir, 'dist/behaviors/sidebar.js')).href);

  class FakeClassList {
    constructor() { this.set = new Set(); }
    contains(name) { return this.set.has(name); }
    toggle(name, force) { if (force) this.set.add(name); else this.set.delete(name); }
  }
  class FakeElement {
    constructor(doc) {
      this.ownerDocument = doc;
      this.attributes = new Map();
      this.dataset = {};
      this.classList = new FakeClassList();
      this.listeners = new Map();
    }
    getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    removeAttribute(name) { this.attributes.delete(name); }
    hasAttribute(name) { return this.attributes.has(name); }
    addEventListener(type, listener) { this.listeners.set(type, listener); }
    removeEventListener(type) { this.listeners.delete(type); }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    contains() { return false; }
    click() { this.listeners.get('click')?.({ target: null }); }
  }

  const doc = { defaultView: null, getElementById: () => null };
  const sidebar = new FakeElement(doc);
  const shell = new FakeElement(doc);
  const collapseToggle = new FakeElement(doc);
  const originalStorage = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('storage blocked'); },
  });
  try {
    const changes = [];
    const controller = ntCreateSidebar({
      sidebar,
      shell,
      collapseToggle,
      storageKey: 'nt-sidebar',
      onCollapsedChange: (value) => changes.push(value),
    });
    assert.equal(controller.collapsed, false);
    assert.equal(controller.isOffcanvas, false);
    assert.equal(collapseToggle.getAttribute('aria-expanded'), 'true');
    assert.ok(collapseToggle.getAttribute('aria-controls'));

    collapseToggle.click();
    assert.equal(controller.collapsed, true);
    assert.ok(shell.classList.contains('nt-app-shell--collapsed'));
    assert.equal(collapseToggle.getAttribute('aria-expanded'), 'false');
    assert.deepEqual(changes, [true]);

    controller.open();
    assert.equal(controller.isOpen, false, 'off-canvas never opens without a matching media query');
    controller.destroy();
    assert.equal(collapseToggle.listeners.has('click'), false);
  } finally {
    if (originalStorage === undefined) delete globalThis.localStorage;
    else Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage });
  }
});
