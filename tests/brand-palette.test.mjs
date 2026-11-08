import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { NT_DEFAULT_APPEARANCE_PREFERENCE } from '../dist/appearance/index.js';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const hexLuminance = (hex) => {
  const channels = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};
const contrastRatio = (a, b) => {
  const luminances = [hexLuminance(a), hexLuminance(b)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
};

test('defaults to blue without overriding a persisted user appearance', () => {
  assert.equal(NT_DEFAULT_APPEARANCE_PREFERENCE.accent, 'blue');
  assert.equal(NT_DEFAULT_APPEARANCE_PREFERENCE.theme, 'system');
});

test('soft navy semantic palette remains centralized in the dark theme', async () => {
  const dark = await read('src/styles/themes/dark.css');
  const colors = await read('src/styles/tokens/color.css');
  for (const [role, value] of Object.entries({
    '--nt-bg-app': '#202d42',
    '--nt-bg-sidebar': '#182337',
    '--nt-bg-surface': '#34445d',
    '--nt-bg-surface-raised': '#445772',
  })) {
    assert.ok(dark.includes(`${role}: ${value};`), `${role} should use ${value}`);
  }
  assert.match(dark, /--nt-accent:\\s*var\\(--nt-color-brand-blue\\)/);
  assert.match(colors, /--nt-color-brand-blue:\\s*#528ef5/);
  assert.match(colors, /--nt-color-ai-lavender:\\s*#a78bfa/);
});

test('legacy orange remains selectable in light and dark themes', async () => {
  const accent = await read('src/styles/appearance/accent.css');
  assert.match(accent, /\\[data-nt-theme='light'\\]\\[data-nt-accent='orange'\\]/);
  assert.match(accent, /\\[data-nt-theme='dark'\\]\\[data-nt-accent='orange'\\]/);
  assert.match(accent, /\\[data-nt-theme='dark'\\]\\[data-nt-accent='blue'\\]/);
});

test('default dark brand colors meet key contrast targets', () => {
  assert.ok(contrastRatio('#f8fafc', '#445772') >= 4.5, 'raised text must be readable');
  assert.ok(contrastRatio('#d8e3f0', '#445772') >= 4.5, 'secondary text must be readable');
  assert.ok(contrastRatio('#101c31', '#528ef5') >= 4.5, 'button text must be readable');
  assert.ok(contrastRatio('#ddd6fe', '#445772') >= 4.5, 'AI text must be readable on raised panels');
});
