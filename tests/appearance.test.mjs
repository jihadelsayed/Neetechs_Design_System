import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  NT_LEGACY_THEME_CACHE_KEYS,
  NT_THEME_ATTRIBUTE,
  NT_THEME_CACHE_KEY,
  NT_THEME_PREFERENCE_ATTRIBUTE,
  applyThemeToDocument,
  bootstrapNeetechsTheme,
  createThemeController,
  migrateLegacyThemeCache,
  normalizeThemePreference,
  readThemeCache,
  readThemeCookie,
  resolveTheme,
  writeThemeCache,
} from '../dist/appearance/index.js';

/* ------------------------------------------------------------------ */
/* Test doubles                                                        */
/* ------------------------------------------------------------------ */

function createFakeDocument(cookie = '') {
  const attributes = new Map();

  return {
    cookie,
    documentElement: {
      setAttribute(name, value) {
        attributes.set(name, String(value));
      },
      getAttribute(name) {
        return attributes.has(name) ? attributes.get(name) : null;
      },
    },
    attributes,
  };
}

function createFakeMatchMedia(initialDark, { legacy = false } = {}) {
  const changeListeners = new Set();

  const mediaQueryList = {
    matches: initialDark,
    media: '(prefers-color-scheme: dark)',
  };

  if (legacy) {
    mediaQueryList.addListener = (listener) => changeListeners.add(listener);
    mediaQueryList.removeListener = (listener) => changeListeners.delete(listener);
  } else {
    mediaQueryList.addEventListener = (type, listener) => {
      if (type === 'change') {
        changeListeners.add(listener);
      }
    };
    mediaQueryList.removeEventListener = (type, listener) => {
      changeListeners.delete(listener);
    };
  }

  return {
    matchMedia: () => mediaQueryList,
    setSystemDark(dark) {
      mediaQueryList.matches = dark;
      for (const listener of [...changeListeners]) {
        listener({ matches: dark, media: mediaQueryList.media });
      }
    },
    listenerCount: () => changeListeners.size,
  };
}

function createFakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));

  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
    map,
  };
}

function createThrowingStorage() {
  return {
    getItem() {
      throw new Error('storage denied');
    },
    setItem() {
      throw new Error('storage denied');
    },
    removeItem() {
      throw new Error('storage denied');
    },
  };
}

const ssrOptions = { documentRef: null, matchMediaRef: null, storage: null };

/* ------------------------------------------------------------------ */
/* normalizeThemePreference                                            */
/* ------------------------------------------------------------------ */

test('normalizeThemePreference accepts system', () => {
  assert.equal(normalizeThemePreference('system'), 'system');
});

test('normalizeThemePreference accepts light', () => {
  assert.equal(normalizeThemePreference('light'), 'light');
});

test('normalizeThemePreference accepts dark', () => {
  assert.equal(normalizeThemePreference('dark'), 'dark');
});

test('normalizeThemePreference trims and lowercases', () => {
  assert.equal(normalizeThemePreference('  DARK  '), 'dark');
});

test('normalizeThemePreference rejects invalid values', () => {
  assert.equal(normalizeThemePreference('blue'), null);
  assert.equal(normalizeThemePreference(''), null);
  assert.equal(normalizeThemePreference(null), null);
  assert.equal(normalizeThemePreference(undefined), null);
  assert.equal(normalizeThemePreference(42), null);
  assert.equal(normalizeThemePreference({}), null);
});

/* ------------------------------------------------------------------ */
/* resolveTheme                                                        */
/* ------------------------------------------------------------------ */

test('light preference resolves to light', () => {
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('light', false), 'light');
});

test('dark preference resolves to dark', () => {
  assert.equal(resolveTheme('dark', true), 'dark');
  assert.equal(resolveTheme('dark', false), 'dark');
});

test('system resolves from the system media state', () => {
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
});

/* ------------------------------------------------------------------ */
/* applyThemeToDocument                                                */
/* ------------------------------------------------------------------ */

test('root DOM attribute is applied', () => {
  const doc = createFakeDocument();

  applyThemeToDocument(doc, { preference: 'system', resolved: 'dark', source: 'system' });

  assert.equal(doc.documentElement.getAttribute(NT_THEME_ATTRIBUTE), 'dark');
});

test('stored preference attribute is applied', () => {
  const doc = createFakeDocument();

  applyThemeToDocument(doc, { preference: 'system', resolved: 'light', source: 'system' });

  assert.equal(doc.documentElement.getAttribute(NT_THEME_PREFERENCE_ATTRIBUTE), 'system');
});

/* ------------------------------------------------------------------ */
/* SSR safety                                                          */
/* ------------------------------------------------------------------ */

test('bootstrap with no document and no window is SSR-safe', () => {
  const state = bootstrapNeetechsTheme(ssrOptions);

  assert.deepEqual(state, { preference: 'system', resolved: 'dark', source: 'default' });
});

test('controller with no document and no window is SSR-safe', () => {
  const controller = createThemeController(ssrOptions);
  const state = controller.initialize();

  assert.deepEqual(state, { preference: 'system', resolved: 'dark', source: 'default' });
  controller.destroy();
});

test('SSR bootstrap resolves an explicit cookie string', () => {
  const state = bootstrapNeetechsTheme({ ...ssrOptions, cookieString: 'nt_theme=light' });

  assert.deepEqual(state, { preference: 'light', resolved: 'light', source: 'cookie' });
});

/* ------------------------------------------------------------------ */
/* readThemeCookie                                                     */
/* ------------------------------------------------------------------ */

test('cookie value is read correctly', () => {
  assert.equal(readThemeCookie('nt_theme=dark'), 'dark');
  assert.equal(readThemeCookie('a=1; nt_theme=light; b=2'), 'light');
  assert.equal(readThemeCookie('nt_theme=%73ystem'), 'system');
});

test('invalid cookie is ignored', () => {
  assert.equal(readThemeCookie('nt_theme=purple'), null);
  assert.equal(readThemeCookie('nt_theme='), null);
  assert.equal(readThemeCookie('nt_theme=%E0%A4%A'), null);
  assert.equal(readThemeCookie('other=dark'), null);
  assert.equal(readThemeCookie(''), null);
  assert.equal(readThemeCookie('not a cookie'), null);
});

test('cookie name must match exactly', () => {
  assert.equal(readThemeCookie('x_nt_theme=dark'), null);
  assert.equal(readThemeCookie('nt_theme_x=dark'), null);
});

/* ------------------------------------------------------------------ */
/* Bootstrap source order                                              */
/* ------------------------------------------------------------------ */

test('cache is used only when no cookie exists', () => {
  const storage = createFakeStorage({ [NT_THEME_CACHE_KEY]: 'dark' });

  const withCookie = bootstrapNeetechsTheme({
    documentRef: createFakeDocument(),
    matchMediaRef: createFakeMatchMedia(true).matchMedia,
    storage,
    cookieString: 'nt_theme=light',
  });
  assert.equal(withCookie.preference, 'light');
  assert.equal(withCookie.source, 'cookie');

  const withoutCookie = bootstrapNeetechsTheme({
    documentRef: createFakeDocument(),
    matchMediaRef: createFakeMatchMedia(true).matchMedia,
    storage,
    cookieString: '',
  });
  assert.equal(withoutCookie.preference, 'dark');
  assert.equal(withoutCookie.source, 'cache');
});

test('system preference is used when no cookie and no cache exist', () => {
  const state = bootstrapNeetechsTheme({
    documentRef: createFakeDocument(),
    matchMediaRef: createFakeMatchMedia(false).matchMedia,
    storage: createFakeStorage(),
    cookieString: '',
  });

  assert.deepEqual(state, { preference: 'system', resolved: 'light', source: 'system' });
});

test('bootstrap applies the theme to the document root', () => {
  const doc = createFakeDocument();

  bootstrapNeetechsTheme({
    documentRef: doc,
    matchMediaRef: createFakeMatchMedia(true).matchMedia,
    storage: createFakeStorage(),
    cookieString: 'nt_theme=system',
  });

  assert.equal(doc.documentElement.getAttribute(NT_THEME_ATTRIBUTE), 'dark');
  assert.equal(doc.documentElement.getAttribute(NT_THEME_PREFERENCE_ATTRIBUTE), 'system');
});

/* ------------------------------------------------------------------ */
/* Backend preference overrides                                        */
/* ------------------------------------------------------------------ */

test('backend preference overrides cookie', () => {
  const doc = createFakeDocument();
  const controller = createThemeController({
    documentRef: doc,
    matchMediaRef: createFakeMatchMedia(false).matchMedia,
    storage: createFakeStorage(),
    cookieString: 'nt_theme=light',
  });

  controller.initialize();
  assert.equal(controller.getState().preference, 'light');

  const state = controller.setPreference('dark', { source: 'backend' });

  assert.equal(state.preference, 'dark');
  assert.equal(state.resolved, 'dark');
  assert.equal(state.source, 'backend');
  assert.equal(doc.documentElement.getAttribute(NT_THEME_ATTRIBUTE), 'dark');
  controller.destroy();
});

test('backend preference overrides cache and updates it', () => {
  const storage = createFakeStorage({ [NT_THEME_CACHE_KEY]: 'light' });
  const controller = createThemeController({
    documentRef: createFakeDocument(),
    matchMediaRef: createFakeMatchMedia(false).matchMedia,
    storage,
    cookieString: '',
  });

  controller.initialize();
  assert.equal(controller.getState().source, 'cache');

  controller.setPreference('dark', { source: 'backend', updateCache: true });

  assert.equal(controller.getState().resolved, 'dark');
  assert.equal(storage.map.get(NT_THEME_CACHE_KEY), 'dark');
  controller.destroy();
});

test('setPreference ignores invalid values', () => {
  const controller = createThemeController(ssrOptions);
  const before = controller.initialize();
  const after = controller.setPreference('sepia');

  assert.deepEqual(after, before);
  controller.destroy();
});

/* ------------------------------------------------------------------ */
/* System-theme changes                                                */
/* ------------------------------------------------------------------ */

test('system changes update the resolved theme and keep preference system', () => {
  const doc = createFakeDocument();
  const media = createFakeMatchMedia(false);
  const storage = createFakeStorage();
  const controller = createThemeController({
    documentRef: doc,
    matchMediaRef: media.matchMedia,
    storage,
    cookieString: 'nt_theme=system',
  });

  controller.initialize();
  assert.equal(controller.getState().resolved, 'light');

  media.setSystemDark(true);

  assert.equal(controller.getState().resolved, 'dark');
  assert.equal(controller.getState().preference, 'system');
  assert.equal(doc.documentElement.getAttribute(NT_THEME_ATTRIBUTE), 'dark');
  assert.equal(doc.documentElement.getAttribute(NT_THEME_PREFERENCE_ATTRIBUTE), 'system');
  // The resolved theme must never be written back as the stored preference.
  assert.equal(storage.map.has(NT_THEME_CACHE_KEY), false);
  controller.destroy();
});

test('non-system preference ignores system changes', () => {
  const media = createFakeMatchMedia(false);
  const controller = createThemeController({
    documentRef: createFakeDocument(),
    matchMediaRef: media.matchMedia,
    storage: createFakeStorage(),
    cookieString: 'nt_theme=light',
  });

  controller.initialize();
  media.setSystemDark(true);

  assert.equal(controller.getState().resolved, 'light');
  controller.destroy();
});

test('legacy addListener media queries are supported', () => {
  const media = createFakeMatchMedia(false, { legacy: true });
  const controller = createThemeController({
    documentRef: createFakeDocument(),
    matchMediaRef: media.matchMedia,
    storage: createFakeStorage(),
    cookieString: '',
  });

  controller.initialize();
  media.setSystemDark(true);
  assert.equal(controller.getState().resolved, 'dark');

  controller.destroy();
  assert.equal(media.listenerCount(), 0);
});

test('event listeners are cleaned up on destroy', () => {
  const media = createFakeMatchMedia(false);
  const controller = createThemeController({
    documentRef: createFakeDocument(),
    matchMediaRef: media.matchMedia,
    storage: createFakeStorage(),
    cookieString: '',
  });

  controller.initialize();
  assert.equal(media.listenerCount(), 1);

  controller.destroy();
  assert.equal(media.listenerCount(), 0);
});

test('duplicate initialization does not create duplicate listeners', () => {
  const media = createFakeMatchMedia(false);
  const controller = createThemeController({
    documentRef: createFakeDocument(),
    matchMediaRef: media.matchMedia,
    storage: createFakeStorage(),
    cookieString: '',
  });

  controller.initialize();
  controller.initialize();
  controller.initialize();

  assert.equal(media.listenerCount(), 1);
  controller.destroy();
});

test('strict-mode style init/destroy/init cycle does not leak listeners', () => {
  const media = createFakeMatchMedia(false);
  const controller = createThemeController({
    documentRef: createFakeDocument(),
    matchMediaRef: media.matchMedia,
    storage: createFakeStorage(),
    cookieString: '',
  });

  controller.initialize();
  controller.destroy();
  controller.initialize();

  assert.equal(media.listenerCount(), 1);
  controller.destroy();
  assert.equal(media.listenerCount(), 0);
});

test('subscribe notifies on changes and unsubscribe stops notifications', () => {
  const controller = createThemeController({
    documentRef: createFakeDocument(),
    matchMediaRef: createFakeMatchMedia(false).matchMedia,
    storage: createFakeStorage(),
    cookieString: '',
  });

  const seen = [];
  const unsubscribe = controller.subscribe((state) => seen.push(state.resolved));

  controller.initialize();
  controller.setPreference('dark');
  assert.deepEqual(seen, ['light', 'dark']);

  unsubscribe();
  controller.setPreference('light');
  assert.deepEqual(seen, ['light', 'dark']);
  controller.destroy();
});

/* ------------------------------------------------------------------ */
/* Cache behavior                                                      */
/* ------------------------------------------------------------------ */

test('storage errors do not crash', () => {
  const throwing = createThrowingStorage();

  assert.equal(readThemeCache(throwing), null);
  assert.doesNotThrow(() => writeThemeCache('dark', throwing));

  const controller = createThemeController({
    documentRef: createFakeDocument(),
    matchMediaRef: createFakeMatchMedia(true).matchMedia,
    storage: throwing,
    cookieString: '',
  });

  assert.doesNotThrow(() => controller.initialize());
  assert.doesNotThrow(() => controller.setPreference('light'));
  assert.equal(controller.getState().resolved, 'light');
  controller.destroy();
});

test('invalid cached values are removed', () => {
  const storage = createFakeStorage({ [NT_THEME_CACHE_KEY]: 'banana' });

  assert.equal(readThemeCache(storage), null);
  assert.equal(storage.map.has(NT_THEME_CACHE_KEY), false);
});

test('useCache false skips reading and writing the cache', () => {
  const storage = createFakeStorage({ [NT_THEME_CACHE_KEY]: 'light' });
  const controller = createThemeController({
    documentRef: createFakeDocument(),
    matchMediaRef: createFakeMatchMedia(true).matchMedia,
    storage,
    cookieString: '',
    useCache: false,
  });

  const state = controller.initialize();
  assert.equal(state.source, 'system');

  controller.setPreference('dark');
  assert.equal(storage.map.get(NT_THEME_CACHE_KEY), 'light');
  controller.destroy();
});

/* ------------------------------------------------------------------ */
/* Legacy migration                                                    */
/* ------------------------------------------------------------------ */

test('legacy cache migration adopts a legacy value and deletes legacy keys', () => {
  const storage = createFakeStorage({ themeMode: 'dark', aiTheme: 'light' });

  const migrated = migrateLegacyThemeCache({ storage });

  assert.equal(migrated, 'dark');
  assert.equal(storage.map.get(NT_THEME_CACHE_KEY), 'dark');
  for (const key of NT_LEGACY_THEME_CACHE_KEYS) {
    assert.equal(storage.map.has(key), false);
  }
});

test('legacy cache migration does not overwrite a canonical value', () => {
  const storage = createFakeStorage({
    [NT_THEME_CACHE_KEY]: 'light',
    themeMode: 'dark',
  });

  const migrated = migrateLegacyThemeCache({ storage });

  assert.equal(migrated, 'light');
  assert.equal(storage.map.get(NT_THEME_CACHE_KEY), 'light');
  assert.equal(storage.map.has('themeMode'), false);
});

test('legacy cache migration ignores invalid legacy values', () => {
  const storage = createFakeStorage({ themeMode: 'rainbow' });

  assert.equal(migrateLegacyThemeCache({ storage }), null);
  assert.equal(storage.map.has(NT_THEME_CACHE_KEY), false);
  assert.equal(storage.map.has('themeMode'), false);
});

test('legacy cache migration survives a throwing storage', () => {
  assert.doesNotThrow(() => migrateLegacyThemeCache({ storage: createThrowingStorage() }));
});

/* ------------------------------------------------------------------ */
/* Package hygiene                                                     */
/* ------------------------------------------------------------------ */

test('no API request code exists inside the appearance module', async () => {
  const files = [
    'types.ts',
    'preference.ts',
    'cookie.ts',
    'cache.ts',
    'theme-controller.ts',
    'index.ts',
  ];

  for (const file of files) {
    const source = await readFile(
      fileURLToPath(new URL(`../src/appearance/${file}`, import.meta.url)),
      'utf8',
    );

    assert.equal(/\bfetch\s*\(/.test(source), false, `${file} must not call fetch`);
    assert.equal(source.includes('XMLHttpRequest'), false, `${file} must not use XHR`);
    assert.equal(source.includes('WebSocket'), false, `${file} must not use WebSocket`);
  }
});
