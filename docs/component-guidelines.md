# Component authoring guidelines

## Localization and direction

Components inherit native `lang` and `dir`; do not add a parallel RTL flag. Use logical properties, pass complete translated strings, isolate unknown content with `<bdi>` or `dir="auto"`, and use `.nt-technical-value` for LTR code/URLs/identifiers inside RTL prose. `.nt-button--wrap` is the opt-in multi-line action contract. Only meaningfully directional arrows receive `.nt-icon--directional`; never mirror an icon subtree globally. See [localization-and-rtl.md](./localization-and-rtl.md).

## Accessibility is part of the public contract

Use native HTML first, semantic platform tokens second, and shared behavior only for interaction HTML does not supply. CSS class names do not confer semantics. A `.nt-button` on a `div` is still not a button.

Every interactive component definition must state:

- native element or required role;
- accessible name and description source;
- keyboard keys and activation policy;
- initial focus, exit, and restoration behavior;
- disabled, read-only, selected, invalid, and loading behavior;
- live-region policy;
- minimum target and reduced-motion/forced-colors behavior;
- unit, browser, and manual coverage.

Use the complete contract in [accessibility.md](./accessibility.md).

## Controls

- Buttons and links use native elements. Do not duplicate native Enter/Space handlers.
- Icon-only buttons require a contextual accessible name.
- Primary and icon-only controls target 44×44px; dense contextual controls remain at least 40×40px.
- Preserve the visible label while loading, add `aria-busy`, and prevent duplicate activation. New async behavior uses `data-nt-state="pending"` through `ntCreateAsyncAction()` rather than treating loading as disabled.
- Native disabled is preferred. When `aria-disabled` is required, guard click and keyboard behavior explicitly.

## Composite widgets

Menus, tabs, modal overlays, interactive grids, and calendar grids use the exported framework-neutral helpers. Do not create a competing global Escape listener or focus trap. A semantic table remains a table unless it truly needs two-dimensional interactive navigation. A navigation list is not an application menu.

## Component ownership and composition

Use the layer model and decision table in [component-architecture.md](./component-architecture.md). Modal is a dialog mode, not a second behavior. Drawers use logical placement. Menus, dropdowns, profile menus, and switchers share `ntCreateMenuPopover`; product patterns may add rich content but may not fork keyboard, overlay, or cleanup logic. Cards represent objects/artifacts, while panels organize page structure. Badges are informational; removable or selectable chips are interactive.

Compatibility selectors and exports are migration-only. Add new behavior and styling to the canonical source, never to a deprecated alias. New component proposals must show that their semantics or interaction differ from an existing component—not merely their radius, color, or product name.

## Forms

Visible labels are the default. Stable IDs connect help and errors. Placeholder text, color, icons, and tooltips cannot be the sole instruction. Group related choices with fieldset/legend. Focus a named error-summary region after failed submission and link entries to fields. Use `ntCreateFormController()` for the shared submission lifecycle when a framework does not already provide an equivalent guard.

## States, feedback, and recovery

Use the layered state model in [states-feedback-and-recovery.md](./states-feedback-and-recovery.md). Native attributes own availability and validation where they exist; `data-nt-state` owns async operation; `data-nt-content-state` owns loading/empty/error/offline/permission/maintenance content states. Existing modifier classes remain compatibility styling hooks, but new behavior should not invent product-specific loading, error, or pending vocabularies.

## Styling

Use semantic foreground/background/border/focus tokens. Never remove outlines. Selection must survive forced colors and differ from focus. Long/decorative motion needs a reduced-motion alternative. Avoid clipping focus rings with overflow; use an inset ring only where geometry requires it.

## Tests required for a new interactive component

Add a representative fixture and test accessible name/role/state, Tab order, pattern keys, focus visibility/restoration, disabled activation, forced colors, reduced motion, and axe. Add required semantic contrast pairs to the checker when introducing a reusable role. Manual screen-reader testing remains part of release review.
