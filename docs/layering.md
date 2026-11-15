# Layering strategy (z-index)

Stacking is a fixed, named scale in `src/styles/tokens/z-index.css`. Components
use only these tokens. Never fix a stacking bug with an arbitrary large
number: find the stacking context that traps the element instead.

| Layer | Token | Value | Used by |
|---|---|---|---|
| Normal content | `--nt-z-base` | 0 | Page content, cards |
| Raised in-flow | `--nt-z-raised` | 10 | Loading-state overlays over their own region |
| Sticky content | `--nt-z-sticky` | 100 | Sticky table/data-grid headers, panel and page toolbars, calendar headers |
| Header | `--nt-z-header` | 200 | `.nt-header`, `.nt-app-shell__header` |
| Sidebar | `--nt-z-sidebar` | 300 | `.nt-app-shell__sidebar` |
| Dropdowns | `--nt-z-dropdown` | 400 | `.nt-dropdown__content`, `.nt-navbar__panel`, split-button menus, search results |
| Popovers | `--nt-z-popover` | 500 | `.nt-popover__content` (non-modal rich panels) |
| Tooltips | `--nt-z-tooltip` | 600 | `.nt-tooltip` |
| Drawers | `--nt-z-drawer` | 700 | `.nt-drawer`, `.nt-mobile-nav--drawer` (backdrop at `drawer − 1`) |
| Modals | `--nt-z-modal` | 800 | `.nt-dialog` / `.nt-modal` and backdrops, `.nt-command-palette` |
| Notifications | `--nt-z-toast` | 900 | `.nt-toast` region |
| Command palette | `--nt-z-command-palette` | 1000 | Reserved for an always-on-top global palette; the current command palette is modal-level |

`--nt-z-max` exists only for third-party integrations that must sit above
everything; product UI must not use it. `--nt-z-overlay` is a deprecated
alias of `--nt-z-raised`.

## Rules

1. **A dropdown's z-index only competes inside its stacking context.** A panel
   with `--nt-z-dropdown` inside the header is effectively at the header's
   level relative to the rest of the page. That is intended: header menus beat
   page content (`--nt-z-header` > base/sticky), while drawers, modals, and
   toasts still beat header menus.
2. **The header always creates its own layer.** `.nt-header` uses
   `backdrop-filter`, which creates a stacking context. The package positions it
   at `--nt-z-header` (zero-specificity `:where()`, so app-shell sticky
   positioning still wins). Without this, a later `position: relative` card or a
   hovered card with `transform` would paint over the header's dropdowns.
3. **Do not add `transform`, `filter`, `opacity < 1`, `contain: paint`, or
   `overflow: hidden` to an ancestor of a dropdown** unless you accept that the
   dropdown is clipped or trapped by it. Cards may use these, because nothing
   should overflow out of a card.
4. **Overlays that must escape their container go to the document root.**
   Dialogs, drawers, toasts, and the command palette are rendered as direct
   children of `body` (or a top-level portal) so no ancestor can trap them.
5. **Backdrops sit one step below their surface** (`calc(var(--nt-z-drawer) - 1)`),
   never at a separate magic number.

## Verification

`tests/browser/site-chrome.spec.mjs` asserts, in a real browser, that open
navbar and account panels are the topmost element at their center point even
over positioned and hovered cards, that they stay inside the viewport, and the
computed z-index of header (200), panel (400), and cards (`auto`).
