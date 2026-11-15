import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createAppearanceController,
  ntAppearanceBootstrapScript,
  ntApplyInlineAppearance,
  serializeAppearanceCookieValue,
} from '../dist/appearance/index.js';

const ATTRIBUTES = [
  'data-nt-theme',
  'data-nt-theme-preference',
  'data-nt-accent',
  'data-nt-density',
  'data-nt-contrast',
  'data-nt-motion',
];

function fakeDocument(cookie = '') {
  const attributes = new Map();
  return {
    cookie,
    documentElement: {
      setAttribute: (name, value) => attributes.set(name, value),
      getAttribute: (name) => attributes.get(name) ?? null,
    },
    snapshot: () => Object.fromEntries(ATTRIBUTES.map((name) => [name, attributes.get(name) ?? null])),
  };
}

function fakeStorage(entries = {}) {
  const map = new Map(Object.entries(entries));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    entries: () => Object.fromEntries(map),
  };
}

function fakeMatchMedia(active) {
  return (query) => ({
    matches: active.includes(query),
    addEventListener() {},
    removeEventListener() {},
  });
}

const cookies = [
  '',
  'nt_theme=light',
  'nt_theme=DARK',
  `nt_theme=${encodeURIComponent(serializeAppearanceCookieValue({ theme: 'system', accent: 'purple', density: 'compact', reduceMotion: true, highContrast: false }))}`,
  'other=1; nt_theme=v1|light|green|spacious|s|1',
  'nt_theme=v1|light|pink|compact|s|s',
  'nt_theme=garbage; nt_theme=dark',
];
const caches = [
  {},
  { nt_appearance_preference: JSON.stringify({ theme: 'light', accent: 'orange', density: 'spacious' }) },
  { nt_appearance_preference: '{bad json', nt_theme_preference: 'light' },
  { nt_appearance_preference: JSON.stringify({ theme: 'dark', accent: 'neutral', density: 'compact', reduceMotion: false, highContrast: true }) },
  { nt_theme_preference: 'nope' },
];
const media = [
  [],
  ['(prefers-color-scheme: dark)'],
  ['(prefers-reduced-motion: reduce)', '(prefers-contrast: more)'],
  ['(forced-colors: active)', '(prefers-color-scheme: dark)'],
];

test('inline pre-paint bootstrap resolves exactly like AppearanceController.initialize()', () => {
  let cases = 0;
  for (const cookie of cookies) {
    for (const cache of caches) {
      for (const active of media) {
        const inlineDoc = fakeDocument(cookie);
        ntApplyInlineAppearance(inlineDoc, { localStorage: fakeStorage(cache), matchMedia: fakeMatchMedia(active) });

        const controllerDoc = fakeDocument(cookie);
        const controller = createAppearanceController({
          documentRef: controllerDoc,
          cookieString: cookie,
          storage: fakeStorage(cache),
          matchMediaRef: fakeMatchMedia(active),
        });
        controller.initialize();
        controller.destroy();

        assert.deepEqual(
          inlineDoc.snapshot(),
          controllerDoc.snapshot(),
          `cookie=${cookie} cache=${JSON.stringify(cache)} media=${active.join(',')}`,
        );
        cases += 1;
      }
    }
  }
  assert.equal(cases, cookies.length * caches.length * media.length);
});

test('inline bootstrap never writes or deletes storage', () => {
  const storage = fakeStorage({ nt_appearance_preference: '{bad json', nt_theme_preference: 'nope' });
  const before = storage.entries();
  ntApplyInlineAppearance(fakeDocument(), { localStorage: storage, matchMedia: fakeMatchMedia([]) });
  assert.deepEqual(storage.entries(), before);
});

test('inline bootstrap survives hostile environments', () => {
  const doc = fakeDocument();
  Object.defineProperty(doc, 'cookie', { get() { throw new Error('blocked'); } });
  const win = {};
  Object.defineProperty(win, 'localStorage', { get() { throw new Error('denied'); } });
  win.matchMedia = () => { throw new Error('no media'); };
  ntApplyInlineAppearance(doc, win);
  assert.equal(doc.snapshot()['data-nt-theme'], 'dark');
  assert.equal(doc.snapshot()['data-nt-accent'], 'blue');

  const lightFallback = fakeDocument();
  ntApplyInlineAppearance(lightFallback, {}, 'light');
  assert.equal(lightFallback.snapshot()['data-nt-theme'], 'light');
});

test('serialized bootstrap script is self-contained and executes standalone', () => {
  const script = ntAppearanceBootstrapScript({ fallbackResolved: 'light' });
  assert.match(script, /^try\{/);
  assert.ok(script.length < 5120, `inline script should stay small (${script.length} chars)`);
  const doc = fakeDocument('nt_theme=v1|dark|green|compact|0|0');
  // eslint-disable-next-line no-new-func
  new Function('document', 'window', script)(doc, { localStorage: fakeStorage(), matchMedia: fakeMatchMedia([]) });
  assert.deepEqual(doc.snapshot(), {
    'data-nt-theme': 'dark',
    'data-nt-theme-preference': 'dark',
    'data-nt-accent': 'green',
    'data-nt-density': 'compact',
    'data-nt-contrast': 'normal',
    'data-nt-motion': 'full',
  });

  const fallbackDoc = fakeDocument();
  new Function('document', 'window', script)(fallbackDoc, {});
  assert.equal(fallbackDoc.snapshot()['data-nt-theme'], 'light');
});

test('updatePreference changes one dimension without resetting saved accent or density', () => {
  const storage = fakeStorage();
  const doc = fakeDocument();
  const controller = createAppearanceController({
    documentRef: doc,
    cookieString: '',
    storage,
    matchMediaRef: fakeMatchMedia([]),
  });
  controller.initialize();
  controller.setPreference({ theme: 'dark', accent: 'purple', density: 'compact', reduceMotion: 'system', highContrast: true });

  const next = controller.updatePreference({ theme: 'light' });
  assert.deepEqual(next.preference, {
    theme: 'light', accent: 'purple', density: 'compact', reduceMotion: 'system', highContrast: true,
  });
  assert.equal(doc.snapshot()['data-nt-theme'], 'light');
  assert.equal(doc.snapshot()['data-nt-accent'], 'purple');
  assert.equal(JSON.parse(storage.getItem('nt_appearance_preference')).accent, 'purple');

  const unchanged = controller.updatePreference({ accent: 'pink' });
  assert.equal(unchanged.preference.accent, 'purple', 'invalid partial values are rejected');
  controller.destroy();
});
