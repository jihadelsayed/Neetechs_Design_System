# CLAUDE.local.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## My Role
Sole developer and owner. I have deep knowledge of all architectural decisions, token conventions, and component patterns. No need to explain the basics — go straight to the work.

## Project: @neetechs/ui
CSS-first, framework-agnostic design system for the Neetechs platform (Angular SSR + future React). The CSS classes ARE the product. No framework code ever enters this repo.

## Build Commands
- `npm run build` — tsc + `scripts/copy-assets.mjs` (copies CSS/md to dist/)
- `npm run pack:local` — build + pack to .tgz for local testing
- `npm run clean` — removes dist/

No test runner, no linter, no dev server — the workflow is edit CSS → build → consume.

---

## Non-Negotiable Laws

### 1. CSS Is the Product
Output is `.css` + optional pure-TS behavior helpers with zero framework imports. No React, no Angular, no JSX, no `.component.ts`.

### 2. Token Discipline — Semantic Tokens Only
- **Allowed:** `var(--nt-accent)`, `var(--nt-text-primary)`, `var(--nt-control-bg)` …
- **Forbidden:** `var(--nt-color-orange-500)`, `#f7931a`, hardcoded hex, `rgb()`, `px` for spacing/radius/typography
- Spacing → `--nt-space-*` | Radius → `--nt-radius-*` | Type → `--nt-text-*`
- If a needed semantic token doesn't exist: **STOP and propose adding it to all three themes first. Never reach past the semantic layer.**

### 3. Theme Contract
Every semantic token a component references **must** be defined in all three theme files: `src/styles/themes/dark.css`, `light.css`, `high-contrast.css`. Add to all three in the same patch, or flag the gap explicitly.

### 4. Naming — Strict BEM with `nt-` Prefix
`.nt-card` | `.nt-card__header` | `.nt-card--raised`
Sizes: `--xs/--sm/--md/--lg/--xl`
States: use modifiers AND native attributes together — `:disabled`, `[aria-disabled='true']`, `.nt-x--disabled`

### 5. Accessibility — Mandatory on Every Component
- `:focus-visible` ring: `outline: 2px solid var(--nt-focus-ring); outline-offset: 2px`
- `@media (prefers-reduced-motion: reduce)` block disabling all animation/transition
- Sufficient contrast across all 3 themes; high-contrast must be genuinely high
- Interactive states never rely on color alone

### 6. Reuse Before Create
Read existing tokens, `src/styles/utilities/*`, and sibling components before writing. `src/components/button/button.css` is the **quality bar** — match its structure and discipline exactly.

### 7. Scope — One Component (or One Fix) Per Run
Never touch unrelated files. Never scaffold empty files. Never refactor what wasn't asked. Produce a complete, production-ready file, then STOP.

### 8. No Placeholders
Every line ships. No `/* TODO */`, no empty rulesets, no "fill this later". If it can't be completed correctly, say so and stop.

---

## Required Component CSS File Structure

```
1. Base block (.nt-x)            — layout, type, color, border, transition
2. :focus-visible
3. Disabled / loading states
4. Sizes (--sm --md --lg …)
5. Variants (--primary --secondary --ghost --danger --ai …)
6. Internal elements (.nt-x__icon, .nt-x__content …)
7. @media (prefers-reduced-motion: reduce)
```

Typography: use `font: var(--nt-text-label-md)` **only** if the token is a complete valid CSS font shorthand; otherwise use discrete `font-size`/`line-height`/`font-weight`.

---

## Output Format (every component task)

1. **GOAL** — one sentence: what this run delivers
2. **TOKEN CHECK** — list every semantic token used; flag any missing from a theme
3. **FILE** — complete file contents, paste-ready, exact path as a header
4. **THEME PATCH** — if new tokens added, the additions for all 3 theme files
5. **VERIFY** — 3–6 bullets: a11y ring? reduced-motion? no primitives? BEM correct? all sizes/variants? matches button.css bar?
6. **STOP** — no further files, no commentary, no "next I could…"

---

## Forbidden Actions
- Hardcoded colors or primitive tokens in component CSS
- `px` for spacing/radius/typography
- Framework code of any kind
- Touching files outside the single task
- Empty/stub files or `/* TODO */` placeholders
- Adding a semantic token to only one theme
- Inventing new naming conventions
- Runtime `@import` chains as the shipping mechanism (build inlines to flat CSS)
- Putting product/domain logic (calendar, billing, companies) in `src/components/`
- Continuing past one component/fix per run

---

## Per-Run Task Block
When asking me to build a component, provide this block:

```
TARGET FILE: src/components/<name>/<name>.css
COMPONENT:   <name>
SIZES:       <which apply, or "none">
VARIANTS:    <list>
STATES:      <default/hover/active/disabled/loading/selected…>
REFERENCE:   match the quality and structure of src/components/button/button.css
NOTES:       <anything specific>
```
