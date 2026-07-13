import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import {
  NT_ACCENT_ATTRIBUTE,
  NT_APPEARANCE_CACHE_KEY,
  NT_APPEARANCE_MEDIA_QUERIES,
  NT_CONTRAST_ATTRIBUTE,
  NT_DENSITY_ATTRIBUTE,
  NT_MOTION_ATTRIBUTE,
  NT_THEME_ATTRIBUTE,
  NT_THEME_CACHE_KEY,
  bootstrapNeetechsAppearance,
  createAppearanceController,
  createAppearanceCookie,
  normalizeAccentPreference,
  normalizeAppearancePreference,
  normalizeDensityPreference,
  readAppearanceCache,
  readAppearanceCookie,
  serializeAppearanceCookieValue,
} from '../dist/appearance/index.js';

const completePreference = (overrides = {}) => ({
  theme: 'system',
  accent: 'orange',
  density: 'comfortable',
  reduceMotion: 'system',
  highContrast: 'system',
  ...overrides,
});

function createFakeDocument(cookie = '') {
  const attributes = new Map();
  return {
    cookie,
    documentElement: {
      setAttribute: (name, value) => attributes.set(name, String(value)),
      getAttribute: (name) => attributes.get(name) ?? null,
    },
  };
}

function createMediaEnvironment(initial = {}) {
  const lists = new Map();

  function get(query) {
    if (!lists.has(query)) {
      const listeners = new Set();
      lists.set(query, {
        media: query,
        matches: initial[query] ?? false,
        addEventListener(type, listener) {
          if (type === 'change') listeners.add(listener);
        },
        removeEventListener(type, listener) {
          if (type === 'change') listeners.delete(listener);
        },
        listeners,
      });
    }
    return lists.get(query);
  }

  return {
    matchMedia: get,
    set(query, matches) {
      const list = get(query);
      list.matches = matches;
      for (const listener of [...list.listeners]) listener({ matches, media: query });
    },
    listenerCount: () =>
      [...lists.values()].reduce((count, list) => count + list.listeners.size, 0),
  };
}

function createStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    map,
  };
}

test('complete appearance validation accepts supported values and rejects partial or invalid values', () => {
  assert.deepEqual(normalizeAppearancePreference(completePreference()), completePreference());
  assert.equal(normalizeAppearancePreference({ theme: 'dark' }), null);
  assert.equal(normalizeAppearancePreference(completePreference({ accent: 'pink' })), null);
  assert.equal(normalizeAccentPreference('purple'), 'purple');
  assert.equal(normalizeAccentPreference('danger'), null);
  assert.equal(normalizeDensityPreference('compact'), 'compact');
  assert.equal(normalizeDensityPreference('tiny'), null);
});

test('bootstrap applies the complete public DOM contract', () => {
  const doc = createFakeDocument();
  const preference = completePreference({
    theme: 'dark',
    accent: 'blue',
    density: 'compact',
    reduceMotion: true,
    highContrast: true,
  });
  const state = bootstrapNeetechsAppearance({
    documentRef: doc,
    matchMediaRef: null,
    storage: null,
    serverPreference: preference,
  });

  assert.equal(state.source, 'backend');
  assert.equal(doc.documentElement.getAttribute(NT_THEME_ATTRIBUTE), 'dark');
  assert.equal(doc.documentElement.getAttribute(NT_ACCENT_ATTRIBUTE), 'blue');
  assert.equal(doc.documentElement.getAttribute(NT_DENSITY_ATTRIBUTE), 'compact');
  assert.equal(doc.documentElement.getAttribute(NT_CONTRAST_ATTRIBUTE), 'high');
  assert.equal(doc.documentElement.getAttribute(NT_MOTION_ATTRIBUTE), 'reduced');
});

test('system dimensions respond independently after initialization', () => {
  const media = createMediaEnvironment();
  const controller = createAppearanceController({
    documentRef: createFakeDocument(),
    matchMediaRef: media.matchMedia,
    storage: null,
    cookieString: '',
  });
  controller.initialize();

  media.set(NT_APPEARANCE_MEDIA_QUERIES.dark, true);
  media.set(NT_APPEARANCE_MEDIA_QUERIES.reducedMotion, true);
  media.set(NT_APPEARANCE_MEDIA_QUERIES.highContrast, true);

  assert.equal(controller.getResolvedAppearance().resolved.theme, 'dark');
  assert.equal(controller.getResolvedAppearance().resolved.motion, 'reduced');
  assert.equal(controller.getResolvedAppearance().resolved.contrast, 'high');
  controller.destroy();
});

test('explicit theme and manual accessibility preferences ignore matching system changes', () => {
  const media = createMediaEnvironment();
  const controller = createAppearanceController({
    documentRef: createFakeDocument(),
    matchMediaRef: media.matchMedia,
    storage: null,
  });
  controller.initialize();
  controller.setPreference(
    completePreference({ theme: 'light', reduceMotion: false, highContrast: false }),
  );
  media.set(NT_APPEARANCE_MEDIA_QUERIES.dark, true);
  media.set(NT_APPEARANCE_MEDIA_QUERIES.reducedMotion, true);
  media.set(NT_APPEARANCE_MEDIA_QUERIES.highContrast, true);

  assert.equal(controller.getResolvedAppearance().resolved.theme, 'light');
  assert.equal(controller.getResolvedAppearance().resolved.motion, 'full');
  assert.equal(controller.getResolvedAppearance().resolved.contrast, 'normal');
  controller.destroy();
});

test('forced colors always activates the contrast layer', () => {
  const media = createMediaEnvironment();
  const controller = createAppearanceController({ matchMediaRef: media.matchMedia, documentRef: null, storage: null });
  controller.initialize();
  controller.setPreference(completePreference({ highContrast: false }));
  media.set(NT_APPEARANCE_MEDIA_QUERIES.forcedColors, true);
  assert.equal(controller.getResolvedAppearance().resolved.contrast, 'high');
  assert.equal(controller.getResolvedAppearance().resolved.forcedColors, true);
  controller.destroy();
});

test('initialization is idempotent and destroy removes every system listener', () => {
  const media = createMediaEnvironment();
  const controller = createAppearanceController({ matchMediaRef: media.matchMedia, documentRef: null, storage: null });
  controller.initialize();
  controller.initialize();
  assert.equal(media.listenerCount(), 4);
  controller.destroy();
  assert.equal(media.listenerCount(), 0);
});

test('versioned cookie round-trips every bootstrap dimension and keeps legacy theme support', () => {
  const preference = completePreference({ accent: 'green', density: 'spacious', reduceMotion: true });
  const value = serializeAppearanceCookieValue(preference);
  assert.deepEqual(readAppearanceCookie(`nt_theme=${encodeURIComponent(value)}`), preference);
  assert.equal(readAppearanceCookie('nt_theme=light').theme, 'light');
  assert.equal(readAppearanceCookie('nt_theme=v1%7Cdark%7Cbad'), null);
});

test('cookie serialization supports cross-subdomain configuration without hardcoding it', () => {
  const cookie = createAppearanceCookie(completePreference(), {
    domain: '.neetechs.com',
    path: '/',
    sameSite: 'Lax',
    secure: true,
    maxAge: 3600,
  });
  assert.match(cookie, /Domain=\.neetechs\.com/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /Max-Age=3600/);
  assert.doesNotMatch(createAppearanceCookie(completePreference()), /Domain=/);
});

test('appearance cache migrates a valid theme-only cache and backend application updates both keys', () => {
  const storage = createStorage({ [NT_THEME_CACHE_KEY]: 'light' });
  assert.equal(readAppearanceCache(storage).theme, 'light');
  const controller = createAppearanceController({ documentRef: null, matchMediaRef: null, storage });
  controller.initialize();
  controller.applyResolvedPreference(completePreference({ theme: 'dark', accent: 'purple' }));
  assert.equal(JSON.parse(storage.map.get(NT_APPEARANCE_CACHE_KEY)).accent, 'purple');
  assert.equal(storage.map.get(NT_THEME_CACHE_KEY), 'dark');
  controller.destroy();
});

test('SSR initialization and malformed persistence are safe', () => {
  const storage = createStorage({ [NT_APPEARANCE_CACHE_KEY]: '{broken' });
  const state = bootstrapNeetechsAppearance({
    documentRef: null,
    matchMediaRef: null,
    storage,
    cookieString: 'nt_theme=%E0%A4%A',
  });
  assert.equal(state.resolved.theme, 'dark');
  assert.equal(state.resolved.accent, 'orange');
  assert.equal(storage.map.has(NT_APPEARANCE_CACHE_KEY), false);
});

test('every accent has distinct semantic action and selection mappings while AI and status remain independent', async () => {
  const [light, dark, accent] = await Promise.all([
    readFile('src/styles/themes/light.css', 'utf8'),
    readFile('src/styles/themes/dark.css', 'utf8'),
    readFile('src/styles/appearance/accent.css', 'utf8'),
  ]);
  const accentValues = new Set([
    light.match(/--nt-accent:\s*([^;]+);/)[1].trim(),
    ...[...accent.matchAll(/--nt-accent:\s*([^;]+);/g)].map((match) => match[1].trim()),
  ]);
  assert.ok(accentValues.size >= 5);
  assert.notEqual(
    light.match(/--nt-bg-app:\s*([^;]+);/)[1].trim(),
    dark.match(/--nt-bg-app:\s*([^;]+);/)[1].trim(),
  );
  for (const theme of ['light', 'dark']) {
    for (const name of ['blue', 'green', 'purple', 'neutral']) {
      assert.match(accent, new RegExp(`\\[data-nt-theme='${theme}'\\]\\[data-nt-accent='${name}'\\]`));
    }
  }
  assert.match(accent, /--nt-action-primary-bg:\s*var\(--nt-accent\)/);
  assert.match(accent, /--nt-selection-indicator:\s*var\(--nt-accent\)/);
  assert.doesNotMatch(accent, /--nt-(?:status|ai|financial)-/);
});

test('density roles produce measurable control, card and navigation differences', async () => {
  const css = await readFile('src/styles/appearance/density.css', 'utf8');
  const block = (name) => css.match(new RegExp(`\\[data-nt-density='${name}'\\] \\{([\\s\\S]*?)\\}`))[1];
  const value = (content, token) => content.match(new RegExp(`--${token}:\\s*([^;]+);`))[1].trim();
  const compact = block('compact');
  const spacious = block('spacious');
  assert.equal(value(compact, 'nt-density-control-height-md'), '2.25rem');
  assert.equal(value(spacious, 'nt-density-control-height-md'), '2.75rem');
  assert.notEqual(value(compact, 'nt-density-card-padding'), value(spacious, 'nt-density-card-padding'));
  assert.equal(value(compact, 'nt-density-navigation-item-height'), '2.25rem');
  assert.equal(value(spacious, 'nt-density-navigation-item-height'), '2.75rem');
});

test('contrast, forced-color and reduced-motion architecture is present', async () => {
  const [contrast, motion] = await Promise.all([
    readFile('src/styles/themes/high-contrast.css', 'utf8'),
    readFile('src/styles/appearance/motion.css', 'utf8'),
  ]);
  assert.match(contrast, /\[data-nt-contrast='high'\]/);
  assert.match(contrast, /@media \(prefers-contrast: more\)/);
  assert.match(contrast, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(contrast, /forced-color-adjust:\s*none/);
  assert.match(motion, /\[data-nt-motion='reduced'\]/);
  assert.match(motion, /@media \(prefers-reduced-motion: reduce\)/);
});
