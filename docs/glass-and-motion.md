# Glass and motion

Opt-in premium surfaces for Neetechs workspaces: a glass sidebar that morphs
between a full panel and an icon rail, a selected item that connects to the
content panel with curved corners, reusable glass material, a sliding
selection indicator, and consistent enter/exit motion. Nothing here changes
an application that does not add the classes below.

Live fixture: `tests/pages/glass.html` (run `npm run build`, then
`node scripts/serve-test-gallery.mjs` and open
`http://127.0.0.1:4173/tests/pages/glass.html`). It toggles light theme, high
contrast, RTL, and reduced motion.

## Enable it in an application

1. Keep importing the full stylesheet (`@neetechs/ui/styles.css`) or add the
   pieces you use: `shell/app-shell.css`, `shell/sidebar.css`,
   `utilities/glass.css`, `components/dock.css`, `components/fab.css`.
2. Add the modifiers to the existing shell markup:
   `nt-app-shell--glass nt-app-shell--connected` on `.nt-app-shell` and
   `nt-sidebar--glass nt-sidebar--cutout` on `.nt-sidebar`.
3. Keep `ntCreateSidebar` as it is; it already owns collapse state, titles,
   groups, and the mobile off-canvas panel.
4. Keep setting `aria-current="page"` on the current item from your router.
   The CSS animates the connection; no JavaScript is involved.

```html
<div class="nt-app-shell nt-app-shell--glass nt-app-shell--connected nt-app-shell--offcanvas" id="shell">
  <aside class="nt-app-shell__sidebar" id="workspace-sidebar" aria-label="Workspace">
    <nav class="nt-sidebar nt-sidebar--glass nt-sidebar--cutout" aria-label="Workspace navigation">
      <div class="nt-sidebar__brand">
        <span class="nt-sidebar__logo" aria-hidden="true">N</span>
        <span class="nt-sidebar__brand-text">Neetechs</span>
      </div>
      <div class="nt-sidebar__search">
        <input class="nt-input nt-input--sm" type="search" aria-label="Search workspace">
      </div>
      <div class="nt-sidebar__nav">
        <div class="nt-sidebar__section">
          <span class="nt-sidebar__section-label">Workspace</span>
          <a class="nt-sidebar__item" href="/overview" aria-current="page">
            <svg class="nt-sidebar__item-icon" aria-hidden="true"></svg>
            <span class="nt-sidebar__item-label">Overview</span>
          </a>
          <a class="nt-sidebar__item" href="/inbox">
            <svg class="nt-sidebar__item-icon" aria-hidden="true"></svg>
            <span class="nt-sidebar__item-label">Inbox</span>
            <span class="nt-badge nt-badge--info nt-sidebar__item-badge">4</span>
          </a>
        </div>
      </div>
    </nav>
  </aside>
  <div class="nt-app-shell__overlay" id="shell-backdrop" hidden></div>
  <div class="nt-app-shell__main">
    <header class="nt-app-shell__header nt-header">
      <button class="nt-icon-button nt-icon-button--ghost nt-app-shell__collapse-toggle" type="button" id="collapse-toggle" aria-label="Collapse sidebar"></button>
      <button class="nt-icon-button nt-icon-button--ghost nt-app-shell__menu-toggle" type="button" id="menu-toggle" aria-label="Open navigation"></button>
    </header>
    <main class="nt-app-shell__content nt-content-frame"></main>
  </div>
</div>
```

```js
import { ntCreateSidebar } from '@neetechs/ui/behaviors';

ntCreateSidebar({
  shell: document.querySelector('#shell'),
  sidebar: document.querySelector('#workspace-sidebar'),
  collapseToggle: document.querySelector('#collapse-toggle'),
  menuToggle: document.querySelector('#menu-toggle'),
  backdrop: document.querySelector('#shell-backdrop'),
  storageKey: 'workspace-sidebar-collapsed',
});
```

Angular and React apps render the same markup from their templates and call
the controller after the view mounts (and `destroy()` on teardown). Every
behavior is SSR-safe to import; the CSS is complete before hydration.

## Glass sidebar

| Class | Effect |
|---|---|
| `.nt-sidebar--glass` | Frosted material, highlight, glass border, glass item pills, and the smooth rail morph. |
| `.nt-sidebar--cutout` | The current item becomes a tab of the adjoining panel, with concave corners above and below. Pair with `--glass`. |
| `.nt-sidebar__search` | Optional search slot between brand and nav. Hidden (and out of tab order) in the rail. |

**Rail morph.** Icons keep one inline-start inset in both states, computed so
they sit centered in the collapsed rail; collapsing never moves an icon.
Labels, badges, and group text fade and slide out quickly when collapsing and
fade in after the width starts to grow when expanding. Section labels and
group triggers keep their height and show a divider in the rail, so items do
not jump vertically. Group triggers and the search slot leave the tab order
(`visibility`) once hidden; item labels stay in the accessibility tree and
the controller adds a `title` to each item.

**Connection.** The tab body (`::before`) and both corners (`::after`) are
painted in the nav gutter, so selecting another item changes no layout: the
old tab slides back toward the panel while the new one slides out of it. The
fill is `--nt-sidebar-cutout-surface` (default `--nt-bg-app`, which is also
what `.nt-app-shell--connected` paints the content panel with). Set it on any
ancestor if the adjoining panel uses a different surface:

```css
.billing-workspace {
  --nt-sidebar-cutout-surface: var(--nt-bg-surface);
}
```

The connection works expanded and collapsed, in LTR and RTL (one gradient
mirrored through `--nt-sidebar-cutout-x`), and keeps the standard focus ring.
High contrast keeps the connection and outlines it; forced colors fall back
to a `Highlight` item. Below the 64rem shell breakpoint the off-canvas panel
uses the regular glass pill, without blur.

## Glass shell

| Class | Effect |
|---|---|
| `.nt-app-shell--glass` | Ambient frame behind the shell, floating glass sidebar, and a solid, rounded content panel. Desktop only. |
| `.nt-app-shell--connected` | Removes the gap so the sidebar and content panel form one frame with a single shadow. Pair with `.nt-sidebar--cutout`. |

Collapse animates `grid-template-columns` over `--nt-duration-layout` with
`--nt-ease-glide`. The frosted layer is a pseudo-element of the sidebar, so
the sidebar does not become the containing block of `position: fixed` menus
in its footer.

## Glass material

Theme roles (defined in the dark, light, and high-contrast themes):
`--nt-glass-bg`, `--nt-glass-bg-strong`, `--nt-glass-border`,
`--nt-glass-highlight`, `--nt-glass-item-bg`, `--nt-glass-item-hover`,
`--nt-glass-ambient-start`, `--nt-glass-ambient-end`, `--nt-glass-backdrop`.
Optical tokens: `--nt-glass-blur`, `--nt-glass-blur-strong`,
`--nt-glass-saturate`.

| Class | Use |
|---|---|
| `.nt-glass` (+ `--strong`, `--floating`, `--interactive`) | Any container: toolbars, inspectors, hero tiles. |
| `.nt-glass-backdrop` | Ambient gradient background that gives glass something to refract. |
| `.nt-card--glass`, `.nt-panel--glass` | Glass variants of the existing card and panel. |
| `.nt-command-palette--glass` | Strong glass palette over the dimmed workspace. |
| `.nt-card--lift` | Softer, slower hover lift for dashboard and showcase tiles. |

```html
<section class="nt-glass-backdrop nt-glass--floating nt-card--padded">
  <article class="nt-card nt-card--glass nt-card--lift nt-card--padded">Summary</article>
  <a class="nt-glass nt-glass--floating nt-glass--interactive nt-card--padded" href="/reports">Reports</a>
</section>
```

Use glass for navigation and floating chrome. Keep forms, tables, data grids,
and dialogs on their solid surfaces. Every glass role turns solid with zero
blur under `data-nt-contrast="high"`, the high-contrast theme,
`prefers-contrast: more`, `prefers-reduced-transparency: reduce`, and forced
colors; browsers without `backdrop-filter` use the strong tint.

## Sliding selection indicator

`ntCreateSelectionIndicator` measures the selected item and writes its
geometry to the container (`--nt-indicator-x/-y/-width/-height`,
`data-nt-indicator="placed|ready"`); the component draws and animates one
indicator in CSS. Until it runs, the static per-item indicator remains.

```html
<div class="nt-tabs nt-tabs--sliding" id="report-tabs">
  <div class="nt-tabs__list" aria-label="Report period">
    <button class="nt-tabs__trigger" type="button" aria-selected="true">Today</button>
    <button class="nt-tabs__trigger" type="button">This week</button>
  </div>
  <div class="nt-tabs__panel">Today</div>
  <div class="nt-tabs__panel" hidden>This week</div>
</div>
```

```js
import { ntCreateSelectionIndicator, ntCreateTabs } from '@neetechs/ui/behaviors';

const root = document.querySelector('#report-tabs');
ntCreateTabs({ root });
ntCreateSelectionIndicator({ container: root.querySelector('.nt-tabs__list') });
```

Supported: `.nt-tabs--sliding` (underline, `--boxed`, `--pills`,
`--vertical`) and `.nt-segmented-control--sliding` (default, `--accent`,
`--ghost`, `--sm`). The helper re-measures on selection attributes, radio
`change`, resize, font load, and `dir` changes; call `update()` after
re-rendering items and `destroy()` on teardown.

## Dock

`.nt-dock` is a compact glass bar of icon destinations or quick actions.
Labels are the accessible names and show as tooltips on hover and keyboard
focus; `.nt-dock--labels` shows them permanently.

```html
<nav class="nt-dock nt-dock--floating" aria-label="Quick navigation">
  <a class="nt-dock__item" href="/home" aria-current="page">
    <svg class="nt-dock__icon" aria-hidden="true"></svg>
    <span class="nt-dock__label">Home</span>
  </a>
  <span class="nt-dock__separator" aria-hidden="true"></span>
  <button class="nt-dock__item" type="button">
    <svg class="nt-dock__icon" aria-hidden="true"></svg>
    <span class="nt-dock__label">Search</span>
    <span class="nt-badge nt-badge--info nt-dock__badge">2</span>
  </button>
</nav>
```

Modifiers: `--floating` (fixed, bottom center, safe-area aware), `--vertical`,
`--labels`, `--sm`, `--lg`. The current item has a surface and a dot (a
non-color cue). Magnification only runs on precise pointers.

## Floating action menu

`.nt-fab` is one primary trigger that fans out related actions. It reuses the
menu behavior, so it gets menu roles, arrow keys, Escape, outside click, and
focus return without new JavaScript.

```html
<div class="nt-fab nt-fab--floating">
  <button class="nt-fab__trigger" type="button" id="create-trigger" aria-label="Create">
    <svg class="nt-fab__trigger-icon" aria-hidden="true"></svg>
  </button>
  <div class="nt-fab__actions" id="create-actions" hidden>
    <button class="nt-fab__action" type="button">
      <span class="nt-fab__action-label">New invoice</span>
      <span class="nt-fab__action-icon"><svg aria-hidden="true"></svg></span>
    </button>
  </div>
</div>
```

```js
import { ntCreateMenuPopover } from '@neetechs/ui/behaviors';

ntCreateMenuPopover({
  trigger: document.querySelector('#create-trigger'),
  content: document.querySelector('#create-actions'),
  itemSelector: '.nt-fab__action',
});
```

Modifiers: `--floating`, `--secondary`, `--extended` (trigger with a visible
text label), `--sm`, `--lg`. Actions enter one after another
(`--nt-motion-stagger`), nearest first.

## Motion system

| Token | Value | Use |
|---|---|---|
| `--nt-duration-layout` | 320ms | Rail-to-panel, drawers, other surfaces that change size or slide in. |
| `--nt-ease-glide` | `cubic-bezier(0.32, 0.72, 0, 1)` | Soft deceleration for layout and sliding indicators. |
| `--nt-ease-spring` | `cubic-bezier(0.34, 1.3, 0.64, 1)` | Small overshoot for entrances and pops (toasts, dock, FAB); never for layout. |
| `--nt-motion-stagger` | 24ms | Delay between sibling entrances. |
| `--nt-transition-selection` | — | Selection that moves between siblings. |

Overlays now share one rhythm: entrances use `--nt-ease-enter`, exits use
`--nt-ease-exit`, drawers slide in over `--nt-duration-layout` with
`--nt-ease-glide`, and toasts enter with `--nt-ease-spring`. Dialogs,
drawers, dropdowns, tooltips, popovers, the command palette, and the FAB keep
`display` for the exit duration (`transition-behavior: allow-discrete`) so
their closing keyframes actually play; browsers without support close
instantly as before.

`data-nt-motion="reduced"` and `prefers-reduced-motion: reduce` collapse every
duration above (including `--nt-duration-layout` and `--nt-motion-stagger`),
and each component also disables its own transitions under the media query.

## Limitations

- Rail tooltips are the native `title` attribute set by `ntCreateSidebar`;
  a styled rail tooltip would need overflow-escaping positioning.
- The glass shell animates `grid-template-columns`, which re-lays out the
  content column during the 320ms collapse. Very heavy pages may prefer
  `data-nt-motion="reduced"`.
- The sliding indicator measures with `offsetLeft`. In a horizontally
  scrolling RTL tab list (`.nt-tabs--scrollable` with `dir="rtl"`) browsers
  report offsets from the scroll origin, so the indicator can be misplaced;
  leave `--sliding` off for those lists.
