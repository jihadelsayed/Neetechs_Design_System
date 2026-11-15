# Contributing to @neetechs/ui

`@neetechs/ui` is a CSS-first, framework-independent design system. The CSS
classes are the product; TypeScript is limited to small, framework-free DOM
behaviors and the appearance controller.

## Setup

```sh
npm ci
npx playwright install chromium   # once, for browser tests
```

## Workflow

1. Read the existing tokens, utilities, and sibling components first.
   `src/components/button/button.css` is the quality bar.
2. Make one focused change.
3. Run the full gate (the same as CI):

   ```sh
   npm test                 # 7 static contracts, build, docs, public API, unit tests
   npx playwright test      # axe, keyboard, RTL, responsive, visual, site chrome
   npm run check:package    # packs, installs into a clean consumer, resolves exports
   ```

4. Commit with [Conventional Commits](https://www.conventionalcommits.org/)
   (`feat:`, `fix:`, `docs:`, `test:`, `ci:`, `chore:`). These drive the next version.
5. Push to `main`. CI re-runs the full gate. **It never publishes on push.**

## Rules

- **Semantic tokens only** in component CSS (`var(--nt-text-primary)`,
  `var(--nt-space-4)`, …). No hex values, `rgb()`, primitive tokens, or `px` for
  spacing, radius, or type. A new semantic token goes into all three theme
  files (`dark.css`, `light.css`, `high-contrast.css`) in the same change.
- **BEM with the `nt-` prefix**: `.nt-block`, `.nt-block__element`,
  `.nt-block--modifier`; sizes `--xs … --xl`. States combine native attributes
  and modifiers (`:disabled`, `[aria-disabled='true']`, `.nt-x--disabled`).
- **Every component** has a `:focus-visible` ring using the focus tokens, a
  `@media (prefers-reduced-motion: reduce)` block, logical properties (RTL), and
  states that never rely on color alone.
- **Layering** uses only the `--nt-z-*` scale ([docs/layering.md](./docs/layering.md)).
- **No framework code** (Angular, React, JSX) and no product logic in
  `src/components/`. Domain modules live in `src/domain/`.
- **Backward compatibility**: never remove a public class, token, export path,
  or JS export without a compatibility alias. `npm run check:api` fails on removals.
  Record intentional additions with `node scripts/check-api.mjs --update`.
- **Docs are tested**: every `nt-` class, named import, and CSS path in README and
  `docs/` code blocks must exist (`npm run check:docs`).
- No placeholders, TODOs, or empty rulesets.

## Releasing (package owner only)

1. Confirm the last CI run on `main` is green.
2. GitHub → Actions → "Publish Neetechs UI to npm" → Run workflow with
   `publish: true`. semantic-release computes the version from commits, updates
   `package.json`, rebuilds via `prepack` (so `NEETECHS_UI_VERSION` matches),
   publishes, tags, and creates the GitHub release.
3. Move the `CHANGELOG.md` "unreleased" heading to the published version and date.
