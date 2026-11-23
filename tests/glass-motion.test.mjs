import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (path) => readFile(resolve(rootDir, path), 'utf8');
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const GLASS_ROLES = [
  '--nt-glass-bg',
  '--nt-glass-bg-strong',
  '--nt-glass-border',
  '--nt-glass-highlight',
  '--nt-glass-item-bg',
  '--nt-glass-item-hover',
  '--nt-glass-ambient-start',
  '--nt-glass-ambient-end',
  '--nt-glass-backdrop',
];

function block(css, selectorPattern) {
  const match = css.match(new RegExp(`${selectorPattern}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`));
  return match?.[1] ?? '';
}

test('every glass role is defined in the dark, light, and high-contrast themes', async () => {
  for (const theme of ['dark', 'light', 'high-contrast']) {
    const css = await read(`src/styles/themes/${theme}.css`);
    for (const role of GLASS_ROLES) {
      assert.match(css, new RegExp(`${role}\\s*:`), `${role} missing from ${theme}.css`);
    }
  }
});

test('contrast and transparency preferences turn glass solid with no blur', async () => {
  const css = stripComments(await read('src/styles/themes/high-contrast.css'));
  const layers = [
    ['high-contrast theme', block(css, "\\[data-nt-theme='high-contrast'\\]")],
    ['data-nt-contrast=high', block(css, "\\[data-nt-contrast='high'\\]")],
    ['prefers-contrast: more', block(css, "@media \\(prefers-contrast: more\\)\\s*\\{\\s*:root:not\\(\\[data-nt-contrast='normal'\\]\\)")],
    ['prefers-reduced-transparency', block(css, '@media \\(prefers-reduced-transparency: reduce\\)\\s*\\{\\s*:root,\\s*\\[data-nt-theme\\]')],
  ];
  for (const [name, body] of layers) {
    assert.ok(body.length > 0, `${name} layer exists`);
    assert.match(body, /--nt-glass-blur:\s*0rem/, `${name} removes blur`);
    assert.match(body, /--nt-glass-highlight:\s*transparent/, `${name} removes highlights`);
    assert.doesNotMatch(body.match(/--nt-glass-bg:\s*([^;]+);/)?.[1] ?? 'rgba', /rgba|transparent/, `${name} uses a solid glass background`);
  }
  assert.match(css, /@media \(forced-colors: active\)[\s\S]*--nt-glass-bg:\s*Canvas/);
});

test('motion tokens include layout timing and are collapsed by both reduced-motion paths', async () => {
  const tokens = await read('src/styles/tokens/motion.css');
  for (const token of ['--nt-duration-layout', '--nt-ease-glide', '--nt-ease-spring', '--nt-motion-stagger', '--nt-transition-selection']) {
    assert.match(tokens, new RegExp(`${token}\\s*:`), `${token} declared`);
  }
  const appearance = await read('src/styles/appearance/motion.css');
  const reduced = block(appearance, "\\[data-nt-motion='reduced'\\]");
  const media = block(appearance, ":root:not\\(\\[data-nt-motion='full'\\]\\)");
  for (const body of [reduced, media]) {
    assert.match(body, /--nt-duration-layout:\s*0\.01ms/);
    assert.match(body, /--nt-motion-stagger:\s*0ms/);
  }
});

test('sidebar cutout follows the adjoining surface and is direction-neutral', async () => {
  const css = stripComments(await read('src/shell/sidebar/sidebar.css'));
  const cutout = css.slice(css.indexOf('.nt-sidebar--glass.nt-sidebar--cutout'));
  assert.match(cutout, /var\(--nt-sidebar-cutout-surface, var\(--nt-bg-app\)\)/);
  assert.doesNotMatch(cutout, /circle at (?:top|bottom) (?:left|right)/, 'corner gradients must not use physical keywords');
  assert.match(css, /\.nt-sidebar--glass:dir\(rtl\)\s*\{[^}]*--nt-sidebar-cutout-x:\s*100%/);
  // The glass material lives on ::before so the sidebar is not a containing
  // block for position: fixed descendants.
  const glassBlock = block(css, '\\n\\.nt-sidebar--glass');
  assert.doesNotMatch(glassBlock, /backdrop-filter/);
  assert.match(css, /\.nt-sidebar--glass::before\s*\{[^}]*backdrop-filter/);
});

test('glass shell layouts stay desktop-only so mobile off-canvas is unchanged', async () => {
  const css = stripComments(await read('src/shell/app-shell/app-shell.css'));
  const desktop = css.indexOf('@media not all and (max-width: 64rem)');
  assert.ok(desktop >= 0);
  for (const selector of ['.nt-app-shell--glass {', '.nt-app-shell--glass.nt-app-shell--connected {']) {
    const index = css.indexOf(selector);
    assert.ok(index > desktop, `${selector} is inside the desktop media query`);
  }
});

test('overlay exit animations keep display alive for the exit duration', async () => {
  const files = {
    'src/components/dialog/dialog.css': ".nt-dialog, .nt-modal)[data-state='closed']",
    'src/components/drawer/drawer.css': ".nt-drawer, .nt-drawer-backdrop)[data-state='closed']",
    'src/components/dropdown/dropdown.css': ".nt-dropdown__content[data-state='closed']",
    'src/components/tooltip/tooltip.css': ".nt-tooltip__content[data-state='closed']",
    'src/components/popover/popover.css': '.nt-popover__content[hidden]',
    'src/components/fab/fab.css': ".nt-fab__actions[data-state='closed'] {",
    'src/patterns/command-palette/command-palette.css': ".nt-command-palette-backdrop)[data-state='closed']",
  };
  for (const [file, selector] of Object.entries(files)) {
    const css = stripComments(await read(file));
    const start = css.lastIndexOf(selector);
    assert.ok(start >= 0, `${file} has ${selector}`);
    const body = css.slice(start, css.indexOf('}', start));
    assert.match(body, /transition:\s*display var\(--nt-duration-fast\) allow-discrete/, `${file} keeps display during exit`);
    assert.match(body, /pointer-events:\s*none/, `${file} ignores pointer input while closing`);
  }
});

test('new glass and motion files are registered, exported, and honor reduced motion', async () => {
  const components = await read('src/components/index.css');
  assert.ok(components.includes("./dock/dock.css"));
  assert.ok(components.includes("./fab/fab.css"));
  assert.ok((await read('src/styles/index.css')).includes("./utilities/glass.css"));
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.exports['./utilities/glass.css'], './src/styles/utilities/glass.css');

  for (const file of ['src/components/dock/dock.css', 'src/components/fab/fab.css', 'src/styles/utilities/glass.css']) {
    const css = await read(file);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, `${file} has a reduced-motion block`);
    assert.match(css, /@media \(forced-colors: active\)/, `${file} has a forced-colors fallback`);
    assert.doesNotMatch(stripComments(css), /#[\da-f]{3,8}\b|rgba?\(/i, `${file} uses semantic tokens only`);
  }
});

test('ntCreateSelectionIndicator is exported and importing it is SSR-safe', async () => {
  const behaviors = await import(pathToFileURL(resolve(rootDir, 'dist/behaviors/index.js')).href);
  const root = await import(pathToFileURL(resolve(rootDir, 'dist/index.js')).href);
  assert.equal(typeof behaviors.ntCreateSelectionIndicator, 'function');
  assert.equal(root.ntCreateSelectionIndicator, behaviors.ntCreateSelectionIndicator);
});

test('selection indicator measures in inline-start space and cleans up', async () => {
  const { ntCreateSelectionIndicator } = await import(pathToFileURL(resolve(rootDir, 'dist/behaviors/selection-indicator.js')).href);

  function makeContainer(direction) {
    const properties = new Map();
    const attributes = new Map();
    const listeners = new Map();
    const container = {
      clientWidth: 300,
      style: {
        setProperty: (name, value) => properties.set(name, value),
        removeProperty: (name) => properties.delete(name),
      },
      setAttribute: (name, value) => attributes.set(name, String(value)),
      getAttribute: (name) => (attributes.has(name) ? attributes.get(name) : null),
      removeAttribute: (name) => attributes.delete(name),
      addEventListener: (type, listener) => listeners.set(type, listener),
      removeEventListener: (type) => listeners.delete(type),
      children: [],
      contains: () => false,
    };
    const item = {
      offsetLeft: 100,
      offsetTop: 4,
      offsetWidth: 80,
      offsetHeight: 32,
      offsetParent: container,
      getClientRects: () => [{}],
    };
    container.querySelectorAll = () => [item];
    container.ownerDocument = {
      documentElement: container,
      defaultView: {
        getComputedStyle: () => ({ direction }),
        requestAnimationFrame: (callback) => { callback(); return 1; },
        cancelAnimationFrame: () => undefined,
      },
    };
    return { container, properties, attributes };
  }

  const ltr = makeContainer('ltr');
  const controller = ntCreateSelectionIndicator({ container: ltr.container });
  assert.equal(ltr.properties.get('--nt-indicator-x'), '100px');
  assert.equal(ltr.properties.get('--nt-indicator-width'), '80px');
  assert.equal(ltr.attributes.get('data-nt-indicator'), 'ready');
  controller.destroy();
  assert.equal(ltr.properties.size, 0);
  assert.equal(ltr.attributes.has('data-nt-indicator'), false);

  const rtl = makeContainer('rtl');
  const rtlController = ntCreateSelectionIndicator({ container: rtl.container });
  // Right edge of the item (180px) measured from the right edge (300px).
  assert.equal(rtl.properties.get('--nt-indicator-x'), '-120px');
  rtlController.destroy();
});
