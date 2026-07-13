import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ACCENTS = ['orange', 'blue', 'green', 'purple', 'neutral'];
const THEMES = ['light', 'dark'];

const REQUIRED_PAIRS = [
  ['primary action', '--nt-action-primary-fg', '--nt-action-primary-bg', 4.5, '--nt-bg-surface'],
  ['primary action hover', '--nt-action-primary-fg', '--nt-action-primary-hover', 4.5, '--nt-bg-surface'],
  ['primary action pressed', '--nt-action-primary-fg', '--nt-action-primary-pressed', 4.5, '--nt-bg-surface'],
  ['link', '--nt-text-link', '--nt-bg-app', 4.5, '--nt-bg-app'],
  ['muted text', '--nt-text-muted', '--nt-bg-surface', 4.5, '--nt-bg-surface'],
  ['error text', '--nt-danger-text', '--nt-danger-bg', 4.5, '--nt-bg-surface'],
  ['selected content', '--nt-selection-fg', '--nt-selection-bg', 4.5, '--nt-bg-surface'],
  ['AI action', '--nt-ai-action-fg', '--nt-ai-action', 4.5, '--nt-bg-surface'],
  ['focus indicator', '--nt-focus-ring-color', '--nt-bg-surface', 3, '--nt-bg-surface'],
  ['control boundary', '--nt-control-border', '--nt-control-bg', 3, '--nt-bg-surface'],
  ['information status', '--nt-info-text', '--nt-info-bg', 4.5, '--nt-bg-surface'],
  ['success status', '--nt-success-text', '--nt-success-bg', 4.5, '--nt-bg-surface'],
  ['warning status', '--nt-warning-text', '--nt-warning-bg', 4.5, '--nt-bg-surface'],
  ['danger status', '--nt-danger-text', '--nt-danger-bg', 4.5, '--nt-bg-surface'],
];

async function walkCss(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkCss(path)));
    else if (extname(entry.name) === '.css') files.push(path);
  }
  return files;
}

function declarations(css) {
  const map = new Map();
  for (const match of css.matchAll(/(--nt-[\w-]+)\s*:\s*([^;{}]+);/g)) {
    map.set(match[1], match[2].trim());
  }
  return map;
}

function selectorBlock(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`))?.[1] ?? '';
}

function resolveValue(token, values, seen = new Set()) {
  if (seen.has(token)) throw new Error(`Circular value while resolving ${token}`);
  seen.add(token);
  const raw = values.get(token);
  if (!raw) throw new Error(`Missing value for ${token}`);
  const match = raw.match(/^var\((--nt-[\w-]+)\)$/);
  return match ? resolveValue(match[1], values, seen) : raw;
}

function parseColor(value) {
  const hex = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (hex) {
    const source = hex[1].length === 3
      ? [...hex[1]].map((part) => part + part).join('')
      : hex[1];
    return {
      r: Number.parseInt(source.slice(0, 2), 16),
      g: Number.parseInt(source.slice(2, 4), 16),
      b: Number.parseInt(source.slice(4, 6), 16),
      a: 1,
    };
  }

  const rgb = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (rgb) {
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: rgb[4] === undefined ? 1 : +rgb[4] };
  }

  throw new Error(`Unsupported color value: ${value}`);
}

function composite(foreground, background) {
  const alpha = foreground.a + background.a * (1 - foreground.a);
  return {
    r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
    g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
    b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
    a: alpha,
  };
}

function luminance(color) {
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

function contrast(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function measurePair(values, foregroundToken, backgroundToken, canvasToken) {
  const canvas = parseColor(resolveValue(canvasToken, values));
  const background = composite(parseColor(resolveValue(backgroundToken, values)), canvas);
  const foreground = composite(parseColor(resolveValue(foregroundToken, values)), background);
  return contrast(foreground, background);
}

function lineAt(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

async function validateSource(rootDir) {
  const errors = [];
  for (const file of await walkCss(join(rootDir, 'src'))) {
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(/outline\s*:\s*(?:none|0(?:\s+\w+)?)\s*;/gi)) {
      errors.push({
        type: 'unsafe-outline-removal',
        file: relative(rootDir, file).replaceAll('\\', '/'),
        line: lineAt(source, match.index),
        detail: match[0],
      });
    }
  }
  return errors;
}

export async function validateAccessibility({ rootDir = repositoryRoot } = {}) {
  const [primitiveCss, lightCss, darkCss, accentCss, contrastCss, motionCss] = await Promise.all([
    readFile(join(rootDir, 'src/styles/tokens/color.css'), 'utf8'),
    readFile(join(rootDir, 'src/styles/themes/light.css'), 'utf8'),
    readFile(join(rootDir, 'src/styles/themes/dark.css'), 'utf8'),
    readFile(join(rootDir, 'src/styles/appearance/accent.css'), 'utf8'),
    readFile(join(rootDir, 'src/styles/themes/high-contrast.css'), 'utf8'),
    readFile(join(rootDir, 'src/styles/appearance/motion.css'), 'utf8'),
  ]);

  const primitiveValues = declarations(primitiveCss);
  const results = [];
  const errors = await validateSource(rootDir);

  for (const theme of THEMES) {
    const themeCss = theme === 'light' ? lightCss : darkCss;
    for (const accent of ACCENTS) {
      const values = new Map([...primitiveValues, ...declarations(themeCss)]);
      if (accent !== 'orange') {
        const selector = `[data-nt-theme='${theme}'][data-nt-accent='${accent}']`;
        for (const entry of declarations(selectorBlock(accentCss, selector))) values.set(...entry);
      }
      for (const entry of declarations(selectorBlock(accentCss, '[data-nt-accent]'))) values.set(...entry);

      for (const [name, foreground, background, minimum, canvas] of REQUIRED_PAIRS) {
        try {
          const ratio = measurePair(values, foreground, background, canvas);
          const result = { theme, accent, name, foreground, background, minimum, ratio };
          results.push(result);
          if (ratio + 0.0001 < minimum) {
            errors.push({
              type: 'contrast',
              file: 'semantic appearance contract',
              line: 0,
              detail: `${theme}/${accent} ${name}: ${ratio.toFixed(2)}:1 < ${minimum}:1 (${foreground} on ${background})`,
            });
          }
        } catch (error) {
          errors.push({
            type: 'contrast-resolution',
            file: 'semantic appearance contract',
            line: 0,
            detail: `${theme}/${accent} ${name}: ${error.message}`,
          });
        }
      }
    }
  }

  if (!/@media\s*\(forced-colors:\s*active\)/.test(contrastCss)) {
    errors.push({ type: 'forced-colors', file: 'src/styles/themes/high-contrast.css', line: 0, detail: 'missing forced-colors layer' });
  }
  if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(motionCss)) {
    errors.push({ type: 'reduced-motion', file: 'src/styles/appearance/motion.css', line: 0, detail: 'missing reduced-motion layer' });
  }

  return { errors, results };
}

function printResult(result) {
  if (result.errors.length === 0) {
    console.log('Accessibility validation passed.');
    console.log(`  Contrast measurements: ${result.results.length}`);
    console.log('  Unsafe outline removals: 0');
    return;
  }

  console.error(`Accessibility validation failed with ${result.errors.length} error(s).`);
  for (const error of result.errors) {
    const location = error.line ? `${error.file}:${error.line}` : error.file;
    console.error(`  [${error.type}] ${location} — ${error.detail}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await validateAccessibility();
  printResult(result);
  if (result.errors.length > 0) process.exitCode = 1;
}
