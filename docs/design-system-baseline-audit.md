# Design-system baseline audit

Audit date: 2026-07-13. Scope: the complete tracked repository plus the root `src.zip` archive manifest (which duplicates source content). This is an observation-only baseline. No source, CSS, export, test, workflow, or package change was made.

## 1. Executive summary

`@neetechs/ui` 0.0.2 is a CSS-first ESM package containing 59 CSS UI modules, seven DOM-behavior helpers, and one tested appearance controller. Its declared package surface is broad (89 concrete current import paths when export globs are expanded), but the styling contract is not internally coherent: 27 `--nt-*` names are referenced without a repository-wide declaration, including all six suspected tokens. `src/components/table/table.css` is empty yet published and included by `components.css`.

The only automated tests are 37 Node tests for appearance. The build passes, but it only type-checks TypeScript and copies assets; it does not parse CSS, validate tokens, test a component, exercise RTL, test accessibility, or verify browser rendering. Accent and density are documented and typed but have no CSS selectors or controller implementation. High contrast CSS exists but is outside the persisted appearance API. No `forced-colors`, `prefers-contrast`, container-query, or RTL CSS is present.

The immediate refactor rule is therefore: preserve import paths, CSS class names, data/ARIA hooks, and the appearance/behavior public APIs until a versioned migration has been implemented. Repairing undefined tokens and duplicated overlay/surface patterns is a high-risk compatibility change because consumers may currently supply missing custom properties themselves.

## 2. Repository and package overview

| Item | Current contract / finding |
| --- | --- |
| Package | `@neetechs/ui`, version `0.0.2` in `package.json`; runtime `NEETECHS_UI_VERSION` is **`0.0.1`** in `src/index.ts:2`. |
| Runtime format | ESM only (`"type": "module"`); `main` and `module` are `./dist/index.js`; declarations `./dist/index.d.ts`. TypeScript target is ES2022 with DOM/DOM.Iterable libs (`tsconfig.json`). |
| CSS delivery | Package `style` and all CSS export targets point at **`src`**, not `dist`; `src` is intentionally in `files`. The build also copies CSS to `dist`, creating duplicate package contents. CSS entry files are `@import` chains, not flattened. |
| Published files | `files`: `dist`, `src`, `docs`, `README.md`; `npm pack --dry-run` reports 257 files, 99.4 kB tarball / 1.0 MB unpacked. It includes empty docs and `src/components/table/table.css` (0 B). |
| Side effects / tree shaking | `sideEffects: ["**/*.css"]`; JavaScript modules are not explicitly marked side-effect-free. CSS is side-effectful by intent. Export globs make individual CSS imports tree-shakable only when a consumer/bundler honors package exports and CSS imports. |
| Build/test/release | `build`: `tsc` then `scripts/copy-assets.mjs`; `test`: build then `node --test tests/**/*.test.mjs`; `release`: Semantic Release. No lint, CSS parse/lint, package-size, visual, browser, accessibility, RTL, or localization script. |
| Publishing | `.github/workflows/publish-npm.yml` publishes on every push to `main` and manual dispatch, after `npm ci`, test, build, and `npm pack --dry-run`; `.releaserc.json` uses semantic-release npm/GitHub plugins and `main`. Workflow uses Node 24 and `actions/*@v6`. |
| Compatibility | Code assumes ES2022 and browsers with DOM APIs, `queueMicrotask`, `PointerEvent`, `Event.composedPath`, `classList`, `dataset`, `matchMedia`, and `MediaQueryList` (legacy listener fallback exists only for the latter). Node is not declared in `engines`; appearance supports SSR only when globals are avoided/injected. |
| Repository state observed | Pre-existing user worktree changes: tracked `.zip` deleted and untracked `src.zip` present. This audit did not alter either. |

## 3. Current public import paths

The following are public according to `package.json#exports`; wildcard entries expand to every matching current file. Preserve all temporarily. Concrete count: **89** (12 JavaScript/TypeScript paths and 77 CSS paths).

| Group | Public paths |
| --- | --- |
| JS/types | `@neetechs/ui`; `@neetechs/ui/appearance`; `@neetechs/ui/behaviors`; `@neetechs/ui/behaviors/{dialog,drawer,dropdown,focus-trap,ids,index,keyboard,overlay}`; `@neetechs/ui/types` |
| global CSS | `@neetechs/ui/styles`, `@neetechs/ui/styles.css`, `@neetechs/ui/base.css`, `@neetechs/ui/tokens.css`, `@neetechs/ui/reset.css`, `@neetechs/ui/themes/{dark,light,high-contrast}.css`, `@neetechs/ui/utilities/{layout,text,visibility}.css`, `@neetechs/ui/animations/motion.css` |
| shell CSS | `@neetechs/ui/shell.css`, `@neetechs/ui/shell/{app-shell,content-frame,header,mobile-nav,right-drawer,sidebar}.css` |
| component CSS | `@neetechs/ui/components.css`, plus `@neetechs/ui/components/{alert,avatar,badge,breadcrumb,button,card,checkbox,chip,data-grid,dialog,drawer,dropdown,icon-button,input,menu,modal,pagination,panel,progress,radio,segmented-control,select,skeleton,split-button,switch,table,tabs,textarea,toast,tooltip}.css` |
| pattern CSS | `@neetechs/ui/patterns.css`, plus `@neetechs/ui/patterns/{command-palette,company-switcher,empty-state,error-state,loading-state,notification-center,profile-menu,search-bar,workspace-switcher}.css` |
| AI CSS | `@neetechs/ui/ai.css`, plus `@neetechs/ui/ai/{ai-action-button,ai-approval-card,ai-conversation-panel,ai-prompt-input,ai-proposal-card,ai-suggestion-card,ai-tool-call}.css` |
| domain CSS | `@neetechs/ui/domain.css`, `@neetechs/ui/domain/{calendar,billing,companies}.css`, plus `@neetechs/ui/domain/calendar/{day-slice,day-timeline,event-card,month-grid,week-grid}.css` |

`README.md:568` and `:584` additionally tell consumers to load `node_modules/@neetechs/ui/src/index.css` directly. `src` is published, but that path is not an export and is unsafe with export-enforcing resolvers; treat it as documented-but-risky, not a stable recommended import.

## 4. Component inventory

All listed CSS modules are in their category index and therefore in `styles.css`; a module-specific export exists at the matching path in section 3. “Docs” means substantive component documentation, not merely an export list. No CSS module has a component-specific test. Variants and states below are CSS modifiers/attribute selectors—not behavior guarantees.

| Category / item | File and root class(es) | Variants, sizes, states, responsive/a11y baseline | Docs / completeness / overlap |
| --- | --- | --- | --- |
| Primitives: alert, avatar, badge, breadcrumb | `src/components/{alert,avatar,badge,breadcrumb}/*.css`; `.nt-alert`, `.nt-avatar`, `.nt-badge`, `.nt-breadcrumb` | Alert tones/layouts; avatar xs–xl/shapes; badge sm–lg/tones; breadcrumb compact/mobile/truncate. Most have `:focus-visible` where interactive and reduced-motion; breadcrumb has 640px rule. | No dedicated docs/tests. Complete-looking CSS only. |
| Primitives: button, icon-button, split-button | corresponding component files; `.nt-button`, `.nt-icon-button`, `.nt-split-button` | Button/icon primary/secondary/ghost/danger/AI, sm–lg, disabled/loading; split primary/ghost/danger, sm/lg, open menu. Native/ARIA disabled styling; focus rings; reduced-motion. | README documents button; no behavior initializer for split button. |
| Form controls | `input`, `textarea`, `select`, `checkbox`, `radio`, `switch` files; `.nt-field`, `.nt-input`, `.nt-textarea`, `.nt-select`, `.nt-checkbox`, `.nt-radio`, `.nt-switch` | sm–lg; error/readonly/disabled as applicable. Native `:disabled`, `aria-disabled`, `aria-invalid`; checkbox/radio/switch have visually-hidden inputs. No generated `id`, label, described-by, required, or live-error behavior. | README documents input only; no tests. |
| Surface/data primitives | `card`, `panel`, `table`, `data-grid`, `progress`, `skeleton` files | Card/panel surface/tone/density modifiers; data grid striped/sticky; progress sizes/tones/ring/indeterminate; skeleton shapes/sizes. `table.css` is **0 bytes**. 640px adaptations for card/panel/data-grid/skeleton; grid remains CSS-only. | README documents card; table is publicly exported but empty. Card/panel overlap; table/data-grid overlap. |
| Selection/navigation primitives | `chip`, `tabs`, `segmented-control`, `pagination`, `menu`, `dropdown` files | Chips tones/sizes/selected; tabs boxed/pills/vertical/scrollable; segmented accent/ghost/vertical; pagination simple/mobile; menus layouts; dropdown sm/lg. Use `aria-selected`, `aria-current`, `aria-disabled`, `aria-expanded`, `data-state`; only dropdown has supplied behavior. | No dedicated docs/tests. Menu/dropdown overlap. |
| Overlay primitives | `dialog`, `modal`, `drawer`, `toast`, `tooltip` files | Dialog/modal sm–xl/fullscreen and tone modifiers; drawer four sides/sm–xl/fullscreen; toast placements/states; tooltip side/align/tone. CSS uses `[data-state]`; dialog/drawer have helpers, modal/tooltip/toast do not. 640px overlay rules except tooltip. | README documents dialog/drawer behavior. Dialog/modal and drawer/right-drawer overlap. |
| Shell | `src/shell/{app-shell,sidebar,header,content-frame,right-drawer,mobile-nav}/*.css` | App shell collapse; content widths; right drawer narrow/wide; header/app shell use 40/48/64rem breakpoints. Sidebar/mobile nav use `aria-current`. No behavior. | README documents app-shell structure only. |
| Patterns | `src/patterns/{command-palette,company-switcher,workspace-switcher,profile-menu,notification-center,search-bar,empty-state,error-state,loading-state}/*.css` | Switchers/profile menu compact/wide and ARIA selected/current; command palette compact/wide; search bar sizes/states; state patterns density/tone/layout. All mostly 640px CSS; many duplicate menu/list/overlay affordances. | README gives company/profile examples only; no behavior/test. |
| AI | `src/ai/{ai-action-button,ai-approval-card,ai-conversation-panel,ai-prompt-input,ai-proposal-card,ai-suggestion-card,ai-tool-call}/*.css` | Dedicated AI color treatment; action button sizes/tones/loading; cards compact/status/tone; prompt compact/large/loading/error; tool-call running/open. All but approval/proposal have reduced-motion blocks; most 640px rules. | README gives prompt/proposal markup only; no behavior/test. |
| Calendar domain | `src/domain/calendar/{day-slice,day-timeline,event-card,month-grid,week-grid}/*.css` | Compact/flat/ghost; event tone modifiers; 480/760px layout rules for grids/slice and 640px for timeline/event card. CSS custom placement variables (`--nt-calendar-*`) are consumer inputs. | README documents month-grid only; no tests/behavior or date/locale logic. |
| Billing / companies domain | `src/domain/{billing,companies}/index.css` | Billing status/metric/row modifiers; company card/profile/member/info structures. 640px layout rules (billing has no reduced-motion block). | README documents billing markup; no tests/behavior. |
| Appearance module | `src/appearance/*.ts`; `@neetechs/ui/appearance` | System/light/dark preference resolution, cookie/cache/SSR support, listener cleanup. No accent/density/reduced-motion API. | Fully documented in `docs/theming.md`, with 37 tests; high contrast must be manually assigned. |
| Behavior module | `src/behaviors/{dialog,drawer,dropdown,focus-trap,overlay,keyboard,ids}.ts`; `@neetechs/ui/behaviors` and direct behavior paths | Controllers expose `open`, `close`, `toggle`, `destroy`; dropdown has roving focus. Dialog/drawer apply role, modal ARIA, IDs, focus trap, Escape/outside/scroll behavior. | README documents three factory examples; no direct behavior tests. |

The component count is **59 CSS UI modules** (30 core, 6 shell, 9 patterns, 7 AI, 7 domain); table is counted because it is publicly exported despite being empty. `src/styles/*` supplies tokens/base/utilities/animation primitives rather than UI components.

## 5. Public CSS and DOM contract

### Classification

| Classification | Contract |
| --- | --- |
| Clearly public | Every `.nt-*` selector in shipped CSS (all are directly consumer-authored markup), all exported CSS paths, `data-nt-theme`, `data-nt-theme-preference`, appearance constants/functions, behavior factory APIs, and documented `aria-*` state selectors. |
| Probably public | Component BEM elements/modifiers, `[data-state]`, `[data-side]`, `[data-align]`, `data-disabled`, placement variables (`--nt-tooltip-x/y`, `--nt-toast-swipe-x`, `--nt-calendar-*`, `--nt-search-results-*`, `--nt-progress-*`), and style tokens. They are shipped, externally usable, and have no private namespace. |
| Internal implementation detail | Generated IDs such as `nt-dialog-1`, the module-global incremental ID counter, overlay scroll-lock implementation, and direct `body.style.overflow/paddingRight` manipulation. Keep behavior, not exact IDs/implementation. |
| Undocumented but externally usable | All component-specific CSS exports via glob, all behavior subpaths, `data-state`, `data-side`, `data-align`, `data-disabled`, and the custom placement/progress/calendar variables. |
| Documented but not implemented | `data-nt-accent` values (`orange|blue|green|purple|neutral`) and `data-nt-density` (`compact|comfortable|spacious`): only README/type declarations exist; no CSS selector or controller logic. README's direct `src/index.css` usage is not an export. |

Behavior helper DOM mutations are a freeze item: dialog/drawer set `role="dialog"`, `aria-modal="true"`, `aria-expanded`, `aria-controls`, optional `aria-labelledby`, `hidden`, `data-state=open|closed`, and drawer `data-side`; dropdown sets `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`, content `hidden`, `data-state`, `data-side`, and `data-align`. The dropdown default item selector is `[role="menuitem"],[role="option"],.nt-dropdown__item,.nt-menu__item` (`src/behaviors/dropdown.ts:36-41`).

Storage/cookie contracts: `NT_THEME_COOKIE_NAME = "nt_theme"` (`cookie.ts:10`); cache key `nt_theme_preference` and legacy keys `themeMode`, `selectedTheme`, `aiTheme`, `billingTheme` (`cache.ts:9-21`). The package reads but never writes the cookie; it reads/writes the cache and migration deletes legacy keys.

## 6. Token declaration and usage findings

Static comparison covered every CSS declaration matching `--nt-*:` and every `var(--nt-*)` use. A reference can deliberately be a consumer-set positional value, but all names below are undeclared by package CSS and resolve invalid without a consumer value/fallback.

| Finding | Tokens / evidence |
| --- | --- |
| Referenced but undefined (27) | `--nt-accent-bg`, `--nt-accent-border`, `--nt-bg-elevated`, `--nt-bg-muted`, `--nt-bg-overlay-subtle`, `--nt-danger-bg-hover`, `--nt-line-height-relaxed`, `--nt-line-height-snug`, `--nt-shadow-2xl`, `--nt-text-code-sm`, `--nt-text-label-xs`, `--nt-z-overlay`; and consumer-input names `--nt-calendar-day-slice-used`, `--nt-calendar-event-top`, `--nt-calendar-hour-height`, `--nt-calendar-now-offset`, `--nt-progress-ring-{circumference,offset,value}`, `--nt-search-results-{top,right,bottom,left,width}`, `--nt-toast-swipe-x`, `--nt-tooltip-{x,y}`. The last group should be formally documented as inputs or supplied with fallbacks. |
| Suspected tokens | All are missing: `--nt-bg-muted`, `--nt-bg-elevated`, `--nt-accent-bg`, `--nt-accent-border`, `--nt-text-label-xs`, `--nt-shadow-2xl`. High-impact references include AI modules, card/panel-like components, calendar, switchers, dialog, command palette, and tooltip. |
| Defined but unused | Primitive color scale is almost wholly unused directly; unused semantic examples include `--nt-bg-shell`, `--nt-bg-inverse`, `--nt-border-muted`, `--nt-control-bg-active`, `--nt-accent-muted`, AI bubble tokens, status tokens, many breakpoint/container tokens, motion aliases, radius aliases, and z-index aliases. These are candidates for validation before removal, not safe deletion yet because consumers may read them. |
| Duplicate/conflicting declarations | The expected 84 semantic theme declarations repeat in dark/light/high-contrast with different values. No accidental same-file duplicate was identified in token files; however themes contain raw color values and theme semantics are incomplete because referenced semantic names are absent from all three. |
| Legacy/incompatible naming | Both semantic surface names (`--nt-bg-surface-muted`) and legacy-like aliases (`--nt-bg-muted`, `--nt-bg-elevated`) are used, but only the former are defined. Typography is mixed between composite `--nt-text-*` and missing `--nt-text-label-xs` / `--nt-text-code-sm`; line-height aliases are missing. |
| Primitive bypass / hardcoding | Theme files intentionally use primitive vars and raw hex/RGBA. Component CSS uses many raw layout/radius/typography/timing values (`1px`, `3px`, `0.5rem`, fixed `640px`, `1.15s`, etc.) and `progress.css` uses hardcoded `rgba(255,255,255,.18)` stripes. This bypasses the stated semantic-only rule for non-color dimensions. |
| Fallbacks | Most semantic `var()` calls have no fallback. Components therefore fail properties when an undefined token is not supplied by the application. Placement variables are the only common intentional exceptions with local fallbacks (for example tooltip x/y). |

Token source files: primitive color/spacing/radius/type/elevation/motion/z-index/breakpoint declarations are in `src/styles/tokens/*.css`; 84 theme semantic declarations are in each of `src/styles/themes/{dark,light,high-contrast}.css`. No automated token validation exists.

### Prompt 2 repair status (2026-07-13)

The findings above remain the historical baseline. Prompt 2 repaired all 27 undefined names: internal CSS now uses canonical tokens, 10 deprecated names are retained only in `src/styles/tokens/compatibility.css`, 17 intended canonical/component-input tokens now have declarations, and `scripts/check-design-tokens.mjs` enforces zero undefined references, valid alias graphs, and no deprecated internal usage. See `docs/design-token-contract.md` for the current contract and mapping.

### Prompt 3 semantic architecture status (2026-07-13)

The historical visual-consistency findings above are now partially repaired. Dark, light, and high-contrast themes expose the same 104-role semantic color/elevation contract; 57 production CSS files use the new action, selection, AI, financial, surface, elevation, or radius roles. Component-layer counts are now zero for primitive palette references, hardcoded colors, raw shadow-scale references, and raw radius-scale references. Twenty-five legacy names remain as one-hop compatibility aliases. Semantic enforcement and focused tests are part of `npm run check:tokens` / `npm test`; runtime contrast and screenshot approval remain unresolved.

## 7. Theme and appearance findings

> Prompt 4 remediation (2026-07-13): the historical findings in this section remain the frozen baseline, but the package now implements typed theme/accent/density/motion/contrast preferences, full root attributes, versioned cookie/cache bootstrap, backend application, system listeners and cleanup, forced-colors/prefers-contrast layers, and SSR injection. High contrast is now layered over light/dark; the old `data-nt-theme='high-contrast'` stylesheet selector is compatibility-only. Focused appearance coverage increased the suite from 59 to 72 tests before final verification. Browser screenshot and component-level contrast review remain unresolved.

| Feature | Implemented baseline | Gap / status |
| --- | --- | --- |
| Dark/light/system | CSS selectors in themes; controller resolves `system` via `(prefers-color-scheme: dark)` and writes root attributes. | Works in tested fake DOM/media environment. No browser integration test. |
| High contrast | `data-nt-theme='high-contrast'` CSS has its own 84 declarations. | Controller types reject `high-contrast`; cookie/cache/backend preference cannot carry it. No `forced-colors` or `prefers-contrast` bridge. |
| Accent / density | README and `NtAccentName`/`NtDensityName` types advertise values. | **Nonfunctional:** no `[data-nt-accent]` or `[data-nt-density]` CSS anywhere, no controller state, persistence, listener, or tests. |
| Reduced motion | Base stylesheet and many component files have `prefers-reduced-motion: reduce` rules. | Uneven: AI approval/proposal, billing, empty/error patterns and several others lack module-local reduced-motion rules; no test validates computed animation. |
| Persistence / migration | Cookie → cache → system → fallback, cache failure guards, explicit SSR cookie, legacy-cache migration, system listener and `destroy()` cleanup. | Backend persistence is deliberately external. Cookie attributes/domain are documentation only; package cannot set/verify them. |
| SSR / hydration | Globals are avoided at import, options inject document/media/storage/cookie, SSR fallback is dark. | Server must call API with the request cookie and render matching root attribute; no framework/hydration test proves integration. |

`docs/theming.md` accurately documents the controller’s stored values and source ordering. README contradicts it by presenting high-contrast alongside “supported themes” in the general setup while the controller can only persist dark/light/system.

## 8. Accessibility baseline

Implemented evidence: most interactive CSS modules use `:focus-visible` with a focus token; form styles recognize native disabled and `aria-invalid`; dialog/drawer create focus traps, restore focus by default, close on Escape/outside by default, lock scroll, set dialog roles/labels when title is passed; dropdown provides keyboard activation, up/down/home/end roving focus, Escape and outside closing. `src/behaviors/focus-trap.ts` excludes disabled/`aria-disabled` elements.

Limits: CSS alone supplies no roles, labels, required indicators, error `aria-describedby` association, read-only semantics, live regions, toast announcements, loading announcements, dialog title requirement, or target-size validation. Modal, tooltip, toast, menu, tabs, segmented control, command palette, search bar, notification center, switchers, data grid, and calendar have no dedicated behavior/controller. `aria-*` attributes are frequently styling selectors and are consumer obligations. No contrast calculations, accessibility tests, screen-reader tests, or browser keyboard tests exist; do **not** claim WCAG compliance.

## 9. Responsive behavior baseline

The responsive implementation is viewport-only: dominant breakpoint `max-width: 640px`, calendar `480px/760px`, shell `40rem/48rem/64rem`. Breakpoint tokens are declared but CSS media queries mostly hardcode values. There are zero `@container` queries. Shell/header/content frame have explicit narrow rules; dialogs, drawers, modal, data grid, card/panel, most patterns and AI cards have 640px rules. Calendar grids switch/reduce at 480/760px.

Risk areas needing runtime verification: tables/data grids retain wide tabular DOM and rely on overflow/sticky styles rather than an alternate compact representation; calendar timeline/week layouts use absolute placement variables; switchers/menus/search results use fixed min/max widths; mobile nav is CSS only; no test covers long text, narrow containers, touch targets, or overflow. A breakpoint rule is not proof of usable adaptation.

## 10. RTL and localization baseline

No `[dir]`, `:dir()`, or `direction` selector was found. There are many physical direction properties: tooltip side/arrow placement, split-button borders/menu origin, toast positions/origins, tabs vertical borders, select chevrons, timeline grid borders/offsets, progress transform origin, and calendar placement use `left`/`right`. Some properties use logical `text-align: start`, but the system is not RTL-safe.

There is no locale, date, number, currency, financial, Swedish-expansion, Arabic, bidi, or mixed-direction formatting API. Billing/calendar markup only displays consumer-provided strings; it supplies no `Intl` behavior. Long text is handled selectively by truncation/overflow CSS, not a localization contract.

## 11. Duplicate and overlapping components

| Likely group | Evidence / freeze classification |
| --- | --- |
| dialog vs modal | Both ship full backdrop, header/body/footer, size, state, focus styling and 640px rules (`dialog.css`, `modal.css`). Only dialog has `ntCreateDialog`; do not merge/remove before consumers are mapped. |
| drawer vs right-drawer | Drawer is a behavioral four-side overlay; shell right drawer is CSS-only right-side layout. Both expose right-side panels; preserve both pending semantic decision. |
| card vs panel | Both are configurable bordered surfaces with header/body/footer, compact/spacious, flat/ghost/raised/elevated, interactive and tone modifiers. Strong duplication. |
| company-switcher vs workspace-switcher | Near-parallel selectable list/popover structures, compact/wide modifiers, active/current/selected/disabled hooks, headers/search/items/footer. Strong duplication. |
| menu/dropdown/profile-menu/switchers | Menu and dropdown share item/list/selection patterns; profile/company/workspace are domain-shaped menus. Dropdown is the only generic behavior controller. Do not collapse without preserving markup/class contracts. |
| table vs data-grid | `table.css` is empty, while data-grid provides all apparent table styles, sticky/selection/sorting hooks. Table is a broken/empty public export and should be classified as non-preservable implementation surface after a deprecation plan. |
| state patterns | Empty/error/loading states repeat card-like layouts, fixed icons/sizes and 640px rules. Candidate consolidation, but public markup differs. |

At least **seven** likely duplicate/overlap groups exist (the six requested groups plus state-pattern duplication).

## 12. Visual consistency problems

Visual language is not verifiably consistent. Core, AI, domain and patterns independently restate border widths, focus shadow spreads, fixed sizing, media queries, surface treatments and transitions. Key examples: dialog/command palette use missing `--nt-shadow-2xl`; tooltip uses missing elevated/muted surfaces; AI/calendar/switcher modules use missing accent/background aliases; progress hardcodes white stripe color; shell uses rem breakpoints whereas most modules use 640px. Card/panel/state patterns duplicate elevation and nesting logic. AI has a separate purple token family but lack of a defined accent-background semantic means its treatment can fail. Billing and some state modules lack the reduced-motion coverage common in core.

No visual-regression or screenshot test exists, so this is static evidence, not a visual approval.

## 13. Testing and CI coverage

`tests/appearance.test.mjs` is the sole test file. Its 37 tests validate preference normalization/resolution, root attributes, SSR fake DOM behavior, cookie parsing, source order, cache failure/invalid values/migration, media listener lifecycle, subscriptions, and absence of network API calls in appearance source. It does not run in a browser and does not test CSS.

The CI workflow runs install/test/build/package dry-run then semantic release. There are no unit/integration tests for behavior helpers; no CSS lint/type check beyond TS; no token validator; no a11y, browser, RTL/localization, visual/screenshot, package-size, or package-content assertion (the dry-run is informational only).

## 14. Documented features that do not work

1. README’s `data-nt-accent` and `data-nt-density` setup has no implementation.
2. The exported `table.css` and its inclusion in `components.css` yield no table CSS (zero-byte file).
3. README direct paths to `node_modules/@neetechs/ui/src/index.css` bypass `exports` and are unsuitable for export-enforcing tooling.
4. The public runtime version (`0.0.1`) disagrees with package version (`0.0.2`).
5. Documentation describes generic theme setup including high contrast, but stored appearance values and controller resolution do not support high contrast.
6. `docs/accessibility.md`, `docs/component-guidelines.md`, and `docs/migration.md` are published zero-byte files.

## 15. Potential breaking-change risks

- Changing/renaming any `@neetechs/ui/*` export, including glob-derived component CSS, breaks direct imports.
- Renaming `.nt-*` BEM classes/modifiers or `[data-state|side|align]` values breaks consumer HTML and CSS overrides.
- Defining currently undefined tokens changes currently-invalid declarations and may override consumer-provided values; use an alias/deprecation layer first.
- Changing cookie/cache names or source ordering changes anti-flash/SSR behavior across applications.
- Altering dialog/drawer/dropdown defaults, ARIA mutations, focus restoration, `hidden`, scroll locking or event behavior breaks integrations.
- Replacing physical placement or responsive behavior may alter absolute-positioned calendars/tooltips/toasts.
- Removing duplicate modules, even table, requires an export deprecation because all are public/published.

## 16. Safe-to-change internal implementation details

Subject to behavior-preserving tests: TypeScript private closure layout; generated numeric ID format; focus/overlay listener bookkeeping; build asset-copy implementation; comments; duplicate `dist` CSS copies; internal theme raw-value organization; CSS declaration ordering that does not affect cascade; and unpublished archive/root artifact handling. The zero-byte table implementation itself is not a useful contract, but its import path must remain temporarily (for example via a compatibility file).

## 17. Public API freeze for the upcoming refactor

Preserve temporarily: all 89 paths in section 3; all `.nt-*` selectors and current modifiers; `data-nt-theme`, `data-nt-theme-preference`, `data-state`, `data-side`, `data-align`, `data-disabled`; CSS custom properties used as consumer inputs; appearance exports/options/types; `nt_theme`, `nt_theme_preference`, and four legacy cache keys; and all behavior factory/controller methods and DOM effects.

Classify for eventual non-preservation/deprecation: the empty table implementation (retain import shim first); direct `src/index.css` documentation path; undocumented generated IDs; the advertised but nonfunctional accent/density contract unless implemented deliberately; missing-token aliases only after consumers receive defined semantic replacements; and duplicate components only after a compatibility alias/migration window.

## 18. Recommended migration order

1. Add automated contract snapshots for exports, selectors, tokens and package contents—without changing production CSS.
2. Decide and publish the compatibility policy for table, direct-source imports, duplicate overlay/surface modules and accent/density.
3. Create a token manifest; define every missing semantic token across all themes or introduce explicit compatibility aliases, then add token validation.
4. Make appearance API/CSS coherent (high contrast, accents, density, forced colors/contrast) with SSR/browser tests.
5. Add behavior, accessibility and browser tests before altering interactive components.
6. Repair responsive/RTL/localization foundations using logical properties and component runtime fixtures.
7. Consolidate duplicate implementations behind preserved public classes/exports, then deprecate in a major-version migration.
8. Add visual regression and package-content gates before release.

## 19. Commands executed and results

| Command | Result |
| --- | --- |
| repository instruction reads; tracked-file/source/doc/workflow searches; static token/selector/media/RTL scans | Completed read-only. No nested instruction file beyond `CLAUDE.local.md`; root `CLAUDE.md`, `AGENTS.md`, and `CONTRIBUTING.md` absent. |
| `npm ci` | Passed: 303 packages added, 447 audited, 0 vulnerabilities. |
| `npm test` | Initial sandbox attempt failed `spawn EPERM`; rerun outside sandbox passed: build plus **37/37** appearance tests. |
| `npm run build` | Passed (`tsc` plus asset copy). |
| `npm pack --dry-run` | Initial sandbox attempt failed cache `EPERM`; rerun outside sandbox passed: 257 files, 99.4 kB package, 1.0 MB unpacked. |

## 20. Uncertainties and items requiring runtime verification

- No real browser, assistive technology, visual, touch, narrow-width, forced-colors, RTL, Arabic, Swedish, or long-content execution was performed; static CSS cannot establish usability or contrast.
- Consumer applications may rely on undocumented selectors, missing custom properties, direct `src` paths, and duplicate components; repository-only audit cannot enumerate them.
- CSS `@import` resolution and tree-shaking behavior vary by consumer bundler and must be tested from a packed tarball in representative Angular/React/plain-CSS fixtures.
- Theme cookie domain/security attributes are backend-owned and cannot be verified here.
- The root archive/worktree `.zip` → `src.zip` state appears pre-existing and was not opened beyond manifest listing; confirm whether it belongs in the repository before changing artifact policy.
