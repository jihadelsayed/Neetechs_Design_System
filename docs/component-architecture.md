# Component architecture and consolidation contract

This document defines the Prompt 7 ownership model. It preserves public package paths and class names while preventing deprecated implementations from becoming independent again.

## Layer model

```text
Tokens
-> visual primitives
-> accessible behavioral primitives
-> public components
-> product patterns
-> domain compositions
```

- Tokens own appearance decisions. Components do not fork theme, accent, density, focus, motion, or direction logic.
- Behavioral primitives in `src/behaviors` own focus, overlay, keyboard, ID, and announcement mechanics.
- Components define one semantic interaction concept. Patterns compose components for a product purpose. Domain modules add business meaning without reimplementing component mechanics.
- Compatibility selectors and exports delegate to a canonical source. They are not extension points for new features.

## Consolidation decision table

| Old family | Outcome | Canonical architecture | Compatibility and future plan |
| --- | --- | --- | --- |
| Dialog / modal | A: one canonical component | `src/components/dialog/dialog.css`; `ntCreateDialog` with `modal: true/false` | `@neetechs/ui/components/modal.css`, `.nt-modal*`, `NtModal*`, `ntCreateModal`, and `createModal` remain deprecated aliases. Earliest removal: 1.0 after a documented 0.x migration window. |
| Drawer / right drawer | C: canonical variant | `src/components/drawer/drawer.css`; `ntCreateDrawer`; logical `placement` | `@neetechs/ui/shell/right-drawer.css` and `.nt-right-drawer*` map to the canonical drawer source. Migrate markup to `.nt-drawer.nt-drawer--inline-end`; physical `side` is deprecated in favor of `placement`. Earliest removal: 1.0. |
| Card / panel | B: shared platform primitives, distinct components | Card is an entity/artifact surface; panel is a structural page region. Both consume the same surface, radius, elevation, spacing, density, and state tokens. | Both imports and class families stay supported. Do not add selection semantics to panel merely to match card. |
| Menu / dropdown / profile menu | B: shared behavior, distinct patterns | `ntCreateMenuPopover` owns overlay, roving focus, typeahead, Escape, outside click, focus return, and cleanup. `ntCreateMenu` fixes menu semantics; `ntCreateDropdown` delegates for compatibility. Profile menu remains a product pattern. | CSS classes/imports remain. New behavior belongs in the canonical controller, never a pattern-specific listener stack. |
| Company / workspace switcher | B: one visual foundation, distinct product patterns | `src/patterns/company-switcher/company-switcher.css` styles both public class families; both use the canonical menu/listbox controller according to purpose. | `@neetechs/ui/patterns/workspace-switcher.css` resolves to the canonical source. Both class families remain supported; no planned removal before 1.0 and consumer usage review. |
| Table / data grid | D: keep separate | `table.css` styles native read-only tables. `data-grid.css` plus `ntCreateDataGrid` is opt-in two-dimensional interaction. | The formerly empty table export is now implemented. Neither API is deprecated. Do not add `role=grid` to ordinary tables. |
| Badge / chip / tag / status | D with shared tokens | Badge is informational metadata/status. Chip may be interactive/removable/selected. “Pill” is a shape modifier, not a component. No standalone tag or status-indicator export exists. | Badge and chip remain. New aliases that differ only by radius are forbidden. Status must include text/icon meaning, not color alone. |
| Tabs / segmented control / navigation | D: keep separate | Tabs switch panels; segmented control chooses a value or command; sidebar/mobile nav perform navigation. | Visual selection tokens are shared, but semantics and keyboard contracts remain separate. |
| Empty / error / loading states | D pending Prompt 8 | Different urgency, announcement, and recovery contracts | Visual repetition is recorded, but feedback/state architecture is intentionally deferred to Prompt 8. |

No application source was available in this repository. External-usage evidence is therefore limited to public exports, README examples, docs, tests, and the previously published package shape. Lack of an in-repo reference is not proof that a public API is unused.

## Canonical overlays

`ntCreateDialog` is the only dialog implementation. Modal dialogs trap focus, make background branches inert, lock scroll by default, and restore the invoker. Nonmodal dialogs retain dialog semantics but do not trap focus or apply `aria-modal`. `ntCreateModal` is a thin modal-mode adapter.

`ntCreateDrawer` shares the overlay and focus foundations while adding placement and modal/nonmodal region semantics. New code uses `placement: 'inline-start' | 'inline-end'`; `side` and physical left/right classes are compatibility inputs. Only implemented placements are accepted by the `NtDrawerSide` type.

Nested overlays continue to use the shared stack in `src/behaviors/overlay.ts`; component code must not register another document-wide Escape or outside-click implementation.

## Menu and switcher rules

- Application commands use menu/menuitem semantics through `ntCreateMenu`.
- Value selection uses `ntCreateMenuPopover({ pattern: 'listbox' })` and application-owned value synchronization.
- Navigation links remain a labelled `nav`, not a menu.
- Rich switchers may contain search, previews, account metadata, and create actions. They retain pattern markup but use the shared overlay/list navigation mechanics.
- Company and workspace styles share one source. Workspace status dots are the only pattern-specific visual extension in that source.

## Surface rules

A card is a bounded content object that can represent an entity/artifact and may be selected or interactive. A panel is a structural region that groups page content and usually is neither selected nor independently elevated. Domain and AI cards keep their business-specific public classes but must consume platform card/surface tokens and must not reimplement overlay or focus behavior.

## Data display rules

Use `.nt-table` with native `table`, `caption`, `thead`, `th[scope]`, `tbody`, and `td` for read-only data. Sort controls are real buttons inside headers. Horizontal overflow is a presentation response, not permission to change the role.

Use data grid only when the product requires row/cell selection, two-dimensional keyboard navigation, editing, resize, reorder, or comparable grid interaction. The grid controller does not turn arbitrary markup into a fully editable spreadsheet; applications own editing and virtualization policies.

## Compatibility matrix

| Public contract | Status | Canonical replacement |
| --- | --- | --- |
| `@neetechs/ui/components/modal.css` | Deprecated, resolvable | `@neetechs/ui/components/dialog.css` |
| `.nt-modal*` | Deprecated, styled by dialog CSS | `.nt-dialog*` |
| `NtModalOptions`, `NtModalController`, `ntCreateModal`, `createModal` | Deprecated adapters | `NtDialogOptions`, `NtDialogController`, `ntCreateDialog` |
| `@neetechs/ui/shell/right-drawer.css` | Deprecated, resolvable | `@neetechs/ui/components/drawer.css` |
| `.nt-right-drawer*` | Deprecated compatibility selectors | `.nt-drawer*` with `.nt-drawer--inline-end` |
| Drawer `side` option and physical sides | Deprecated input, still translated | `placement: 'inline-start' | 'inline-end'` |
| `@neetechs/ui/patterns/workspace-switcher.css` | Supported compatibility path to shared source | May remain; use `patterns.css` for aggregate import |
| `.nt-workspace-switcher*` | Supported pattern API | No class migration required |
| `ntCreateDropdown` | Supported compatibility name over canonical controller | `ntCreateMenu` for command menus or `ntCreateMenuPopover` for explicit menu/listbox use |
| `createDialog`, `createDrawer` | Supported unprefixed import compatibility | Neetechs-prefixed `ntCreateDialog`, `ntCreateDrawer` remain repository convention |
| `@neetechs/ui/components/table.css` | Supported and now functional | No replacement; use data grid only for genuine grid interaction |

No public export was removed. The three retired source files are intentionally absent; exact package-export entries route their former public paths to canonical files.

## Deprecation policy for 0.x

The package is `0.x`, so SemVer permits breaking minor releases, but Neetechs applications still require a controlled window.

1. Deprecate only duplicated, misleading, unsafe, accidental, or superseded contracts.
2. Keep a working adapter for at least one documented 0.x minor migration window unless the API was never functional or is unsafe to execute.
3. Mark TypeScript APIs with `@deprecated`; document CSS/path deprecations here and in `migration.md`.
4. Adapters validate/translate old input and call canonical code. They do not acquire features independently and emit no production console noise.
5. Tests must prove old imports resolve and old selectors are emitted from canonical CSS.
6. Removal requires release notes, a replacement example, consumer search where repositories are available, and a planned version. Current duplicate compatibility APIs target no earlier than 1.0.
7. Accidental unpublished internals may be removed immediately only with package-content evidence. Empty public exports are implemented or explicitly mapped; they are not silently deleted.

## Architecture enforcement

`npm run check:architecture` verifies exact compatibility export routing, absence of the three retired copied CSS files, legacy selectors in canonical CSS, thin runtime adapters, and the nonempty table contract. It deliberately does not count ordinary repeated declarations as bugs; identical declarations can express legitimate independent semantics.

Run:

```bash
npm run check:architecture
npm test
npm run test:browser
npm run build
npm pack --dry-run
```

Packed-tarball consumer verification must resolve the canonical and deprecated runtime/CSS imports. Browser and manual testing remain required for focus, placement, themes, density, forced colors, reduced motion, and visual compatibility.

## Known remaining duplication

- Card/panel and product/domain cards repeat structural header/body/footer CSS. Their semantics differ, and deeper visual extraction is deferred until actual composition markup can be tested.
- Menu, dropdown, profile menu, and command palette retain pattern-specific CSS because popup geometry and rich content differ; behavioral listeners are canonical.
- Empty/error/loading patterns remain separate pending Prompt 8’s state and feedback architecture.
- Calendar/data-grid physical layout mathematics and mobile adaptations remain deferred to Prompt 9.
