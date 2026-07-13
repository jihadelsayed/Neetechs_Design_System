import { readdir, readFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEPRECATED_TOKEN_MAPPINGS = Object.freeze({
  '--nt-accent-bg': '--nt-accent-subtle',
  '--nt-accent-border': '--nt-border-interactive',
  '--nt-bg-elevated': '--nt-bg-surface-raised',
  '--nt-bg-muted': '--nt-bg-surface-muted',
  '--nt-bg-overlay': '--nt-bg-backdrop',
  '--nt-bg-overlay-subtle': '--nt-bg-backdrop',
  '--nt-disabled-bg': '--nt-bg-surface-disabled',
  '--nt-disabled-border': '--nt-border-disabled',
  '--nt-disabled-text': '--nt-text-disabled',
  '--nt-ai-accent': '--nt-ai-fg',
  '--nt-ai-accent-hover': '--nt-ai-action-hover',
  '--nt-ai-bg-raised': '--nt-ai-generated-surface',
  '--nt-ai-glow': '--nt-ai-processing',
  '--nt-line-height-relaxed': '--nt-line-height-body-lg',
  '--nt-line-height-snug': '--nt-line-height-label',
  '--nt-shadow-2xl': '--nt-elevation-overlay',
  '--nt-shadow-card': '--nt-elevation-card',
  '--nt-shadow-card-hover': '--nt-elevation-card-hover',
  '--nt-shadow-dialog': '--nt-elevation-dialog',
  '--nt-shadow-drawer': '--nt-elevation-drawer',
  '--nt-shadow-dropdown': '--nt-elevation-popover',
  '--nt-shadow-toast': '--nt-elevation-toast',
  '--nt-selection-text': '--nt-selection-fg',
  '--nt-text-code-sm': '--nt-text-mono-sm',
  '--nt-z-overlay': '--nt-z-raised',
});

export const SEMANTIC_THEME_TOKEN_GROUPS = Object.freeze({
  surfaces: Object.freeze([
    '--nt-bg-app',
    '--nt-bg-surface',
    '--nt-bg-surface-subtle',
    '--nt-bg-surface-muted',
    '--nt-bg-surface-raised',
    '--nt-bg-surface-overlay',
    '--nt-bg-surface-sunken',
    '--nt-bg-inverse',
    '--nt-bg-surface-disabled',
    '--nt-bg-backdrop',
  ]),
  text: Object.freeze([
    '--nt-text-primary',
    '--nt-text-secondary',
    '--nt-text-muted',
    '--nt-text-subtle',
    '--nt-text-disabled',
    '--nt-text-inverse',
    '--nt-text-link',
    '--nt-text-link-hover',
    '--nt-text-on-accent',
    '--nt-text-on-danger',
  ]),
  borders: Object.freeze([
    '--nt-border-subtle',
    '--nt-border-default',
    '--nt-border-strong',
    '--nt-border-interactive',
    '--nt-border-selected',
    '--nt-border-disabled',
  ]),
  interaction: Object.freeze([
    '--nt-interactive-neutral-bg',
    '--nt-interactive-neutral-hover',
    '--nt-interactive-neutral-pressed',
    '--nt-interactive-neutral-selected',
  ]),
  actions: Object.freeze(
    ['primary', 'secondary', 'neutral', 'danger', 'success', 'warning'].flatMap(
      (role) =>
        ['bg', 'hover', 'pressed', 'border', 'fg'].map(
          (state) => `--nt-action-${role}-${state}`,
        ),
    ),
  ),
  status: Object.freeze(
    ['info', 'success', 'warning', 'danger'].flatMap((role) => [
      `--nt-${role}`,
      `--nt-${role}-bg`,
      `--nt-${role}-border`,
      `--nt-${role}-text`,
    ]),
  ),
  selection: Object.freeze([
    '--nt-selection-bg',
    '--nt-selection-bg-hover',
    '--nt-selection-border',
    '--nt-selection-fg',
    '--nt-selection-indicator',
  ]),
  ai: Object.freeze([
    '--nt-ai-fg',
    '--nt-ai-bg',
    '--nt-ai-bg-subtle',
    '--nt-ai-border',
    '--nt-ai-action',
    '--nt-ai-action-hover',
    '--nt-ai-action-fg',
    '--nt-ai-processing',
    '--nt-ai-generated-surface',
  ]),
  financial: Object.freeze([
    '--nt-financial-positive',
    '--nt-financial-negative',
    '--nt-financial-neutral',
  ]),
  elevation: Object.freeze([
    '--nt-elevation-none',
    '--nt-elevation-inline',
    '--nt-elevation-control',
    '--nt-elevation-card',
    '--nt-elevation-card-hover',
    '--nt-elevation-raised',
    '--nt-elevation-popover',
    '--nt-elevation-dialog',
    '--nt-elevation-drawer',
    '--nt-elevation-toast',
    '--nt-elevation-overlay',
  ]),
});

export const REQUIRED_SEMANTIC_RADIUS_TOKENS = Object.freeze([
  '--nt-radius-control',
  '--nt-radius-button',
  '--nt-radius-input',
  '--nt-radius-item',
  '--nt-radius-card',
  '--nt-radius-panel',
  '--nt-radius-popover',
  '--nt-radius-dialog',
  '--nt-radius-drawer',
  '--nt-radius-toast',
  '--nt-radius-indicator',
  '--nt-radius-pill',
  '--nt-radius-badge',
  '--nt-radius-avatar',
]);

export const SEMANTIC_COLOR_LITERAL_ALLOWLIST = Object.freeze([]);

const THEME_FILES = Object.freeze([
  'src/styles/themes/dark.css',
  'src/styles/themes/light.css',
]);

const COMPONENT_SOURCE_PREFIXES = Object.freeze([
  'src/components/',
  'src/patterns/',
  'src/ai/',
  'src/domain/',
  'src/shell/',
]);

const RAW_SHADOW_TOKEN_PATTERN =
  /^--nt-shadow-(?:none|xs|sm|md|lg|xl|overlay)$/;
const RAW_RADIUS_TOKEN_PATTERN =
  /^--nt-radius-(?:none|xs|sm|md|lg|xl|2xl|3xl|full)$/;

const DEFAULT_IGNORED_DIRECTORIES = new Set([
  '.angular',
  '.git',
  '.next',
  '.nuxt',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
]);

const TOKEN_PATTERN = /^--nt-[A-Za-z0-9-]+$/;
const TOKEN_CHARACTER_PATTERN = /[A-Za-z0-9-]/;

function createLineLookup(source) {
  const starts = [0];

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === '\n') {
      starts.push(index + 1);
    }
  }

  return (offset) => {
    let low = 0;
    let high = starts.length;

    while (low + 1 < high) {
      const middle = Math.floor((low + high) / 2);

      if (starts[middle] <= offset) {
        low = middle;
      } else {
        high = middle;
      }
    }

    return low + 1;
  };
}

function skipComment(source, start) {
  const end = source.indexOf('*/', start + 2);
  return end === -1 ? source.length : end + 2;
}

function skipString(source, start) {
  const quote = source[start];
  let index = start + 1;

  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }

    if (source[index] === quote) {
      return index + 1;
    }

    index += 1;
  }

  return source.length;
}

function isIdentifierCharacter(character) {
  return character !== undefined && /[A-Za-z0-9_-]/.test(character);
}

function findMatchingParenthesis(source, openingIndex) {
  let depth = 1;
  let index = openingIndex + 1;

  while (index < source.length) {
    if (source.startsWith('/*', index)) {
      index = skipComment(source, index);
      continue;
    }

    if (source[index] === '"' || source[index] === "'") {
      index = skipString(source, index);
      continue;
    }

    if (source[index] === '(') {
      depth += 1;
    } else if (source[index] === ')') {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }

    index += 1;
  }

  return -1;
}

function findTopLevelComma(source, start, end) {
  let parenthesisDepth = 0;
  let bracketDepth = 0;
  let index = start;

  while (index < end) {
    if (source.startsWith('/*', index)) {
      index = skipComment(source, index);
      continue;
    }

    if (source[index] === '"' || source[index] === "'") {
      index = skipString(source, index);
      continue;
    }

    if (source[index] === '(') {
      parenthesisDepth += 1;
    } else if (source[index] === ')') {
      parenthesisDepth -= 1;
    } else if (source[index] === '[') {
      bracketDepth += 1;
    } else if (source[index] === ']') {
      bracketDepth -= 1;
    } else if (
      source[index] === ',' &&
      parenthesisDepth === 0 &&
      bracketDepth === 0
    ) {
      return index;
    }

    index += 1;
  }

  return -1;
}

function scanVarFunctions(source, baseOffset = 0, lineAt = createLineLookup(source)) {
  const calls = [];
  const malformed = [];
  let index = 0;

  while (index < source.length) {
    if (source.startsWith('/*', index)) {
      index = skipComment(source, index);
      continue;
    }

    if (source[index] === '"' || source[index] === "'") {
      index = skipString(source, index);
      continue;
    }

    const isVar = source.startsWith('var', index);
    const hasValidStart = !isIdentifierCharacter(source[index - 1]);
    const hasValidEnd = !isIdentifierCharacter(source[index + 3]);

    if (!isVar || !hasValidStart || !hasValidEnd) {
      index += 1;
      continue;
    }

    let openingIndex = index + 3;

    while (/\s/.test(source[openingIndex] ?? '')) {
      openingIndex += 1;
    }

    if (source[openingIndex] !== '(') {
      index += 3;
      continue;
    }

    const closingIndex = findMatchingParenthesis(source, openingIndex);
    const absoluteOffset = baseOffset + index;

    if (closingIndex === -1) {
      malformed.push({
        offset: absoluteOffset,
        line: lineAt(absoluteOffset),
        reason: 'unterminated var() expression',
      });
      index = openingIndex + 1;
      continue;
    }

    const commaIndex = findTopLevelComma(
      source,
      openingIndex + 1,
      closingIndex,
    );
    const tokenEnd = commaIndex === -1 ? closingIndex : commaIndex;
    const token = source.slice(openingIndex + 1, tokenEnd).trim();

    if (TOKEN_PATTERN.test(token)) {
      calls.push({
        token,
        offset: absoluteOffset,
        line: lineAt(absoluteOffset),
        hasFallback: commaIndex !== -1,
      });
    } else {
      malformed.push({
        offset: absoluteOffset,
        line: lineAt(absoluteOffset),
        reason: `invalid var() token ${JSON.stringify(token)}`,
      });
    }

    // Continue through the expression so nested var() fallbacks are recorded.
    index = openingIndex + 1;
  }

  return { calls, malformed };
}

function scanDeclarations(source, lineAt) {
  const declarations = [];
  const blockStack = [];
  let nextBlockId = 0;
  let index = 0;

  while (index < source.length) {
    if (source.startsWith('/*', index)) {
      index = skipComment(source, index);
      continue;
    }

    if (source[index] === '"' || source[index] === "'") {
      index = skipString(source, index);
      continue;
    }

    if (source[index] === '{') {
      nextBlockId += 1;
      blockStack.push(nextBlockId);
      index += 1;
      continue;
    }

    if (source[index] === '}') {
      blockStack.pop();
      index += 1;
      continue;
    }

    if (
      !source.startsWith('--nt-', index) ||
      TOKEN_CHARACTER_PATTERN.test(source[index - 1] ?? '')
    ) {
      index += 1;
      continue;
    }

    let nameEnd = index + 5;

    while (TOKEN_CHARACTER_PATTERN.test(source[nameEnd] ?? '')) {
      nameEnd += 1;
    }

    const token = source.slice(index, nameEnd);
    let colonIndex = nameEnd;

    while (/\s/.test(source[colonIndex] ?? '')) {
      colonIndex += 1;
    }

    if (source[colonIndex] !== ':' || blockStack.length === 0) {
      index = nameEnd;
      continue;
    }

    const valueStart = colonIndex + 1;
    let valueEnd = valueStart;
    let parenthesisDepth = 0;
    let bracketDepth = 0;

    while (valueEnd < source.length) {
      if (source.startsWith('/*', valueEnd)) {
        valueEnd = skipComment(source, valueEnd);
        continue;
      }

      if (source[valueEnd] === '"' || source[valueEnd] === "'") {
        valueEnd = skipString(source, valueEnd);
        continue;
      }

      if (source[valueEnd] === '(') {
        parenthesisDepth += 1;
      } else if (source[valueEnd] === ')') {
        parenthesisDepth -= 1;
      } else if (source[valueEnd] === '[') {
        bracketDepth += 1;
      } else if (source[valueEnd] === ']') {
        bracketDepth -= 1;
      } else if (
        parenthesisDepth === 0 &&
        bracketDepth === 0 &&
        (source[valueEnd] === ';' || source[valueEnd] === '}')
      ) {
        break;
      }

      valueEnd += 1;
    }

    const value = source.slice(valueStart, valueEnd).trim();
    const { calls: references, malformed } = scanVarFunctions(
      source.slice(valueStart, valueEnd),
      valueStart,
      lineAt,
    );

    declarations.push({
      token,
      value,
      offset: index,
      line: lineAt(index),
      blockId: blockStack.at(-1),
      valueStart,
      valueEnd,
      references,
      malformed,
    });

    index = valueEnd;
  }

  return declarations;
}

export function analyzeCssText(source, { filePath = '<inline>' } = {}) {
  const lineAt = createLineLookup(source);
  const declarations = scanDeclarations(source, lineAt);
  const { calls: usages, malformed } = scanVarFunctions(source, 0, lineAt);

  for (const usage of usages) {
    usage.declaration = declarations.find(
      (declaration) =>
        usage.offset >= declaration.valueStart &&
        usage.offset < declaration.valueEnd,
    );
  }

  return { filePath, source, declarations, usages, malformed };
}

async function collectCssFiles(directory, ignoredDirectories, files = []) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const absolutePath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      await collectCssFiles(absolutePath, ignoredDirectories, files);
    } else if (entry.isFile() && extname(entry.name) === '.css') {
      files.push(absolutePath);
    }
  }

  return files;
}

function normalizePath(path) {
  return path.replaceAll('\\', '/');
}

function isComponentSource(filePath) {
  return COMPONENT_SOURCE_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function maskCommentsAndStrings(source) {
  const characters = [...source];
  let index = 0;

  function mask(start, end) {
    for (let cursor = start; cursor < end; cursor += 1) {
      if (characters[cursor] !== '\n' && characters[cursor] !== '\r') {
        characters[cursor] = ' ';
      }
    }
  }

  while (index < source.length) {
    if (source.startsWith('/*', index)) {
      const end = skipComment(source, index);
      mask(index, end);
      index = end;
      continue;
    }

    if (source[index] === '"' || source[index] === "'") {
      const end = skipString(source, index);
      mask(index, end);
      index = end;
      continue;
    }

    index += 1;
  }

  return characters.join('');
}

function scanHardcodedColors(source) {
  const masked = maskCommentsAndStrings(source);
  const lineAt = createLineLookup(masked);
  const pattern =
    /#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\([^)]*\)|\b(?:black|white|red|blue|green|yellow|orange|purple|gray|grey)\b/gi;
  const matches = [];

  for (const match of masked.matchAll(pattern)) {
    const preceding = masked.slice(0, match.index);
    const boundary = Math.max(
      preceding.lastIndexOf(';'),
      preceding.lastIndexOf('{'),
      preceding.lastIndexOf('}'),
    );

    if (!preceding.slice(boundary + 1).includes(':')) {
      continue;
    }

    matches.push({
      value: match[0],
      line: lineAt(match.index),
    });
  }

  return matches;
}

function findCircularAliases(declarations, definedTokens) {
  const graph = new Map();

  for (const declaration of declarations) {
    if (!graph.has(declaration.token)) {
      graph.set(declaration.token, new Set());
    }

    for (const reference of declaration.references) {
      if (definedTokens.has(reference.token)) {
        graph.get(declaration.token).add(reference.token);
      }
    }
  }

  const state = new Map();
  const stack = [];
  const cycles = [];
  const seenCycles = new Set();

  function visit(token) {
    state.set(token, 1);
    stack.push(token);

    for (const target of graph.get(token) ?? []) {
      if (target === token) {
        continue;
      }

      if (!state.has(target)) {
        visit(target);
      } else if (state.get(target) === 1) {
        const start = stack.indexOf(target);
        const cycle = [...stack.slice(start), target];
        const members = cycle.slice(0, -1);
        const canonicalKey = [...members].sort().join('|');

        if (!seenCycles.has(canonicalKey)) {
          seenCycles.add(canonicalKey);
          cycles.push(cycle);
        }
      }
    }

    stack.pop();
    state.set(token, 2);
  }

  for (const token of graph.keys()) {
    if (!state.has(token)) {
      visit(token);
    }
  }

  return cycles;
}

export async function validateDesignTokens({
  rootDir = process.cwd(),
  sourceDirectory = 'src',
  compatibilityFile = 'src/styles/tokens/compatibility.css',
  deprecatedTokenMappings = DEPRECATED_TOKEN_MAPPINGS,
  ignoredDirectories = DEFAULT_IGNORED_DIRECTORIES,
  requireCompatibilityAliases = true,
  enforceSemanticArchitecture = false,
  semanticColorLiteralAllowlist = SEMANTIC_COLOR_LITERAL_ALLOWLIST,
} = {}) {
  const absoluteRoot = resolve(rootDir);
  const absoluteSource = resolve(absoluteRoot, sourceDirectory);
  const absoluteCompatibility = resolve(absoluteRoot, compatibilityFile);
  const files = await collectCssFiles(absoluteSource, ignoredDirectories);
  const analyses = [];

  for (const absolutePath of files.sort()) {
    const source = await readFile(absolutePath, 'utf8');
    const filePath = normalizePath(relative(absoluteRoot, absolutePath));
    analyses.push({
      absolutePath,
      ...analyzeCssText(source, { filePath }),
    });
  }

  const declarations = analyses.flatMap((analysis) =>
    analysis.declarations.map((declaration) => ({
      ...declaration,
      filePath: analysis.filePath,
      absolutePath: analysis.absolutePath,
    })),
  );
  const usages = analyses.flatMap((analysis) =>
    analysis.usages.map((usage) => ({
      ...usage,
      filePath: analysis.filePath,
      absolutePath: analysis.absolutePath,
    })),
  );
  const definedTokens = new Set(declarations.map(({ token }) => token));
  const usedTokens = new Set(usages.map(({ token }) => token));
  const errors = [];

  for (const analysis of analyses) {
    for (const malformed of analysis.malformed) {
      errors.push({
        type: 'invalid-var',
        filePath: analysis.filePath,
        line: malformed.line,
        token: 'var()',
        message: malformed.reason,
      });
    }
  }

  for (const declaration of declarations) {
    if (declaration.value.length === 0) {
      errors.push({
        type: 'invalid-declaration',
        filePath: declaration.filePath,
        line: declaration.line,
        token: declaration.token,
        message: 'empty custom-property value',
      });
    }

    if (declaration.references.some(({ token }) => token === declaration.token)) {
      errors.push({
        type: 'self-reference',
        filePath: declaration.filePath,
        line: declaration.line,
        token: declaration.token,
        message: 'token references itself',
      });
    }

    const expectedTarget = deprecatedTokenMappings[declaration.token];
    const isCompatibilityFile = declaration.absolutePath === absoluteCompatibility;

    if (expectedTarget && !isCompatibilityFile) {
      errors.push({
        type: 'deprecated-declaration',
        filePath: declaration.filePath,
        line: declaration.line,
        token: declaration.token,
        message: `deprecated token may only be declared in ${normalizePath(compatibilityFile)}`,
      });
    }

    if (expectedTarget && isCompatibilityFile) {
      const aliasMatch = declaration.value.match(
        /^var\(\s*(--nt-[A-Za-z0-9-]+)\s*\)$/,
      );
      const actualTarget = aliasMatch?.[1];

      if (actualTarget !== expectedTarget) {
        errors.push({
          type: 'invalid-compatibility-alias',
          filePath: declaration.filePath,
          line: declaration.line,
          token: declaration.token,
          message: `expected a direct alias to ${expectedTarget}`,
        });
      }
    }

    for (const reference of declaration.references) {
      if (!definedTokens.has(reference.token)) {
        errors.push({
          type: 'undeclared-alias-target',
          filePath: declaration.filePath,
          line: reference.line,
          token: reference.token,
          message: `${declaration.token} points to an undeclared token`,
        });
      }
    }
  }

  for (const analysis of analyses) {
    const duplicates = new Map();

    for (const declaration of analysis.declarations) {
      const key = `${declaration.blockId}:${declaration.token}`;

      if (!duplicates.has(key)) {
        duplicates.set(key, []);
      }

      duplicates.get(key).push(declaration);
    }

    for (const duplicateDeclarations of duplicates.values()) {
      if (duplicateDeclarations.length <= 1) {
        continue;
      }

      const [, ...repeated] = duplicateDeclarations;

      for (const declaration of repeated) {
        errors.push({
          type: 'duplicate-declaration',
          filePath: analysis.filePath,
          line: declaration.line,
          token: declaration.token,
          message: 'token is declared more than once in the same CSS block',
        });
      }
    }
  }

  for (const usage of usages) {
    if (!definedTokens.has(usage.token) && !usage.declaration) {
      errors.push({
        type: 'undefined-token',
        filePath: usage.filePath,
        line: usage.line,
        token: usage.token,
        message: 'token is referenced but never declared in production CSS',
      });
    }

    if (deprecatedTokenMappings[usage.token]) {
      errors.push({
        type: 'deprecated-internal-usage',
        filePath: usage.filePath,
        line: usage.line,
        token: usage.token,
        message: `use ${deprecatedTokenMappings[usage.token]} internally`,
      });
    }
  }

  for (const cycle of findCircularAliases(declarations, definedTokens)) {
    const declaration = declarations.find(({ token }) => token === cycle[0]);
    errors.push({
      type: 'circular-alias',
      filePath: declaration?.filePath ?? '<unknown>',
      line: declaration?.line ?? 1,
      token: cycle[0],
      message: cycle.join(' -> '),
    });
  }

  if (requireCompatibilityAliases) {
    const compatibilityDeclarations = declarations.filter(
      ({ absolutePath }) => absolutePath === absoluteCompatibility,
    );

    for (const token of Object.keys(deprecatedTokenMappings)) {
      if (!compatibilityDeclarations.some((declaration) => declaration.token === token)) {
        errors.push({
          type: 'missing-compatibility-alias',
          filePath: normalizePath(compatibilityFile),
          line: 1,
          token,
          message: `missing compatibility alias to ${deprecatedTokenMappings[token]}`,
        });
      }
    }
  }

  if (enforceSemanticArchitecture) {
    const allowlistedLiterals = new Set(
      semanticColorLiteralAllowlist.map(
        ({ filePath, value }) => `${normalizePath(filePath)}:${value.toLowerCase()}`,
      ),
    );

    for (const usage of usages.filter(({ filePath }) => isComponentSource(filePath))) {
      if (usage.token.startsWith('--nt-color-')) {
        errors.push({
          type: 'prohibited-primitive-token',
          filePath: usage.filePath,
          line: usage.line,
          token: usage.token,
          message: 'component CSS must use a semantic color role',
        });
      }

      if (RAW_SHADOW_TOKEN_PATTERN.test(usage.token)) {
        errors.push({
          type: 'prohibited-raw-shadow',
          filePath: usage.filePath,
          line: usage.line,
          token: usage.token,
          message: 'component CSS must use a semantic elevation role',
        });
      }

      if (RAW_RADIUS_TOKEN_PATTERN.test(usage.token)) {
        errors.push({
          type: 'prohibited-raw-radius',
          filePath: usage.filePath,
          line: usage.line,
          token: usage.token,
          message: 'component CSS must use a semantic radius role',
        });
      }
    }

    for (const analysis of analyses.filter(({ filePath }) =>
      isComponentSource(filePath),
    )) {
      for (const literal of scanHardcodedColors(analysis.source)) {
        const allowlistKey = `${analysis.filePath}:${literal.value.toLowerCase()}`;

        if (allowlistedLiterals.has(allowlistKey)) {
          continue;
        }

        errors.push({
          type: 'hardcoded-color',
          filePath: analysis.filePath,
          line: literal.line,
          token: literal.value,
          message: 'component CSS must use a semantic color token',
        });
      }
    }

    const requiredThemeTokens = Object.values(SEMANTIC_THEME_TOKEN_GROUPS).flat();
    const themeTokenSets = new Map();

    for (const themeFile of THEME_FILES) {
      const themeAnalysis = analyses.find(({ filePath }) => filePath === themeFile);

      if (!themeAnalysis) {
        errors.push({
          type: 'missing-theme-file',
          filePath: themeFile,
          line: 1,
          token: 'theme',
          message: 'required supported theme file is missing',
        });
        continue;
      }

      const tokenSet = new Set(
        themeAnalysis.declarations.map(({ token }) => token),
      );
      themeTokenSets.set(themeFile, tokenSet);

      for (const token of requiredThemeTokens) {
        if (!tokenSet.has(token)) {
          errors.push({
            type: 'missing-theme-token',
            filePath: themeFile,
            line: 1,
            token,
            message: 'required semantic role is missing from this theme',
          });
        }
      }
    }

    const allThemeTokens = new Set(
      [...themeTokenSets.values()].flatMap((tokenSet) => [...tokenSet]),
    );

    for (const [themeFile, tokenSet] of themeTokenSets) {
      for (const token of allThemeTokens) {
        if (!tokenSet.has(token)) {
          errors.push({
            type: 'theme-token-parity',
            filePath: themeFile,
            line: 1,
            token,
            message: 'supported themes must expose the same token names',
          });
        }
      }
    }

    for (const token of REQUIRED_SEMANTIC_RADIUS_TOKENS) {
      if (!definedTokens.has(token)) {
        errors.push({
          type: 'missing-radius-role',
          filePath: 'src/styles/tokens/radius.css',
          line: 1,
          token,
          message: 'required semantic radius role is missing',
        });
      }
    }
  }

  return {
    files: analyses.map(({ filePath }) => filePath),
    declarations,
    usages,
    definedTokens,
    usedTokens,
    errors,
  };
}

export function formatValidationResult(result) {
  if (result.errors.length === 0) {
    return [
      'Design token validation passed.',
      `  CSS files: ${result.files.length}`,
      `  Declarations: ${result.declarations.length} (${result.definedTokens.size} unique)`,
      `  References: ${result.usages.length} (${result.usedTokens.size} unique)`,
      '  Undefined tokens: 0',
      '  Circular aliases: 0',
      '  Deprecated internal usages: 0',
    ].join('\n');
  }

  const groups = new Map();

  for (const error of result.errors) {
    if (!groups.has(error.type)) {
      groups.set(error.type, []);
    }

    groups.get(error.type).push(error);
  }

  const lines = [`Design token validation failed with ${result.errors.length} error(s).`];

  for (const [type, errors] of [...groups.entries()].sort()) {
    lines.push('', `${type} (${errors.length})`);

    for (const error of errors) {
      lines.push(
        `  ${error.filePath}:${error.line} ${error.token} - ${error.message}`,
      );
    }
  }

  return lines.join('\n');
}

async function runCli() {
  try {
    const result = await validateDesignTokens({
      enforceSemanticArchitecture: true,
    });
    console.log(formatValidationResult(result));

    if (result.errors.length > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Design token validation could not run.');
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  }
}

const entryPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';

if (entryPath === import.meta.url) {
  await runCli();
}
