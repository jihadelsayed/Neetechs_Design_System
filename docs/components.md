# Component catalog

Every shipped module, its CSS import path, and its optional behavior helper.
All CSS is included by `@neetechs/ui/styles.css`; per-module paths exist for
bundle-size optimization. Behaviors are framework-free DOM functions from
`@neetechs/ui/behaviors` (also re-exported by `@neetechs/ui`).

Detailed guides: [site-chrome.md](./site-chrome.md) · [component-guidelines.md](./component-guidelines.md) ·
[component-architecture.md](./component-architecture.md) · [accessibility.md](./accessibility.md) ·
[layering.md](./layering.md).

## Actions

| Component | Block class | CSS path | Behavior |
|---|---|---|---|
| Button | `.nt-button` | `components/button.css` | `ntCreateAsyncAction` (pending state) |
| Icon button | `.nt-icon-button` | `components/icon-button.css` | — |
| Button group | `.nt-button-group` | `components/button-group.css` | — (app toggles `aria-pressed`) |
| Split button | `.nt-split-button` | `components/split-button.css` | `ntCreateMenu` for the menu |
| Segmented control | `.nt-segmented-control` | `components/segmented-control.css` | — |
| Chip | `.nt-chip` | `components/chip.css` | — |

## Forms

| Component | Block class | CSS path | Behavior |
|---|---|---|---|
| Input / field | `.nt-input`, `.nt-field` | `components/input.css` | `ntConnectField`, `ntCreateFormController`, `ntFocusErrorSummary` |
| Textarea | `.nt-textarea` | `components/textarea.css` | `ntConnectField` |
| Select | `.nt-select` | `components/select.css` | native `<select>` |
| Checkbox | `.nt-checkbox` | `components/checkbox.css` | native |
| Radio | `.nt-radio` | `components/radio.css` | native |
| Switch | `.nt-switch` | `components/switch.css` | native `role="switch"` |
| Form layout | `.nt-form` | `patterns/form-layout.css` | — |

## Layout

| Component | Block class | CSS path |
|---|---|---|
| Card | `.nt-card` | `components/card.css` |
| Panel | `.nt-panel` | `components/panel.css` |
| Container, stack, cluster, grid, divider | `.nt-container`, `.nt-stack`, `.nt-cluster`, `.nt-grid`, `.nt-divider` | `utilities/layout.css` |
| App shell, sidebar, content frame | `.nt-app-shell`, `.nt-sidebar`, `.nt-content-frame` | `shell/app-shell.css`, `shell/sidebar.css`, `shell/content-frame.css` (behavior: `ntCreateSidebar`, see [Workspace sidebar](./site-chrome.md#workspace-sidebar)) |
| Page, master-detail, settings layout | `.nt-page`, `.nt-master-detail`, `.nt-settings-layout` | `patterns/*.css` |

## Navigation and site chrome

| Component | Block class | CSS path | Behavior |
|---|---|---|---|
| Header | `.nt-header` | `shell/header.css` | — |
| Navbar | `.nt-navbar` | `shell/navbar.css` | `ntCreateNavbar` |
| Account dropdown | `.nt-header__account` + `.nt-profile-menu` | `shell/header.css`, `patterns/profile-menu.css` | `ntCreateAccountMenu` |
| Mobile navigation | `.nt-mobile-nav` | `shell/mobile-nav.css` | `ntCreateMobileNav` |
| Footer | `.nt-footer` | `shell/footer.css` | — |
| Menu / dropdown | `.nt-menu`, `.nt-dropdown` | `components/menu.css`, `components/dropdown.css` | `ntCreateMenu`, `ntCreateDropdown` |
| Tabs | `.nt-tabs` | `components/tabs.css` | `ntCreateTabs` |
| Breadcrumb | `.nt-breadcrumb` | `components/breadcrumb.css` | — |
| Pagination | `.nt-pagination` | `components/pagination.css` | — |
| Company / workspace switcher | `.nt-company-switcher` | `patterns/company-switcher.css` | `ntCreateMenu` |
| Command palette, search bar | `.nt-command-palette`, `.nt-search-bar` | `patterns/*.css` | `ntCreateDialog` |

## Data display

| Component | Block class | CSS path | Notes |
|---|---|---|---|
| Stat (KPI) card | `.nt-stat`, `.nt-stat-grid` | `components/stat.css` | Tones `--success/--warning/--danger/--info/--accent`, `--tinted`, `--emphasis`, `--wide`, `--sm/--lg`, `--interactive`, selected (`aria-pressed`/`aria-current`), loading (`aria-busy`) without layout shift |
| Description list | `.nt-description-list` | `components/description-list.css` | `--2`, `--3`, `--inline` (totals), `--boxed` (breakdowns), `--compact`, `__item--emphasis`, `__item--full`, `__details--numeric` |
| Record list | `.nt-record-list`, `.nt-record` | `patterns/record-list.css` | Recent items, queues, health checks; `--divided`, `--compact`, tones, selected bar, container-query stacking |

### Stat card

```html
<div class="nt-stat-grid">
  <article class="nt-stat nt-stat--success">
    <span class="nt-stat__accent" aria-hidden="true"></span>
    <p class="nt-stat__label">Customer payments</p>
    <div class="nt-stat__row">
      <strong class="nt-stat__value">48 200<span class="nt-stat__unit">SEK</span></strong>
      <span class="nt-stat__delta nt-stat__delta--positive">▲ 12%</span>
    </div>
    <p class="nt-stat__hint">Received since 1 November</p>
  </article>
</div>
```

- The grid shows at most `--nt-stat-grid-columns` (default 4; `--2`, `--3`
  modifiers) and never narrower than `--nt-stat-grid-min` (13rem); it
  collapses intrinsically, so it behaves the same in a page, drawer, or pane.
- A delta always contains a sign or arrow; the tone is secondary.
- Set `aria-busy="true"` while loading: the value slot becomes a pulse block
  at the same line height, so the real figure appears without a shift.
- Use links or buttons (`a.nt-stat`, `button.nt-stat`) for drill-down; they
  get hover lift, a pressed state, a focus ring, and a selected ring.

### Description list

```html
<dl class="nt-description-list nt-description-list--inline">
  <div class="nt-description-list__item">
    <dt class="nt-description-list__term">Subtotal</dt>
    <dd class="nt-description-list__details nt-description-list__details--numeric">3 440 SEK</dd>
  </div>
  <div class="nt-description-list__item nt-description-list__item--emphasis">
    <dt class="nt-description-list__term">Amount due</dt>
    <dd class="nt-description-list__details">4 300 SEK</dd>
  </div>
</dl>
```

### Record list

```html
<ul class="nt-record-list">
  <li>
    <a class="nt-record nt-record--warning" href="/invoices/142">
      <span class="nt-record__leading"><span class="nt-record__indicator" aria-hidden="true"></span></span>
      <span class="nt-record__main">
        <span class="nt-record__title">INV-2026-0142</span>
        <span class="nt-record__meta">Northwind Traders · 2 Nov</span>
      </span>
      <span class="nt-record__trailing">
        <span class="nt-record__value">4 300 SEK</span>
        <span class="nt-record__caption">Overdue</span>
      </span>
    </a>
  </li>
</ul>
```

The indicator dot is decorative; the status is always in text (caption or
badge). Below a 28rem container the trailing value moves under the title.

## Feedback

| Component | Block class | CSS path | Behavior |
|---|---|---|---|
| Alert | `.nt-alert` | `components/alert.css` | — |
| Toast | `.nt-toast` | `components/toast.css` | `ntCreateToastController`, `ntConfigureToastSemantics` |
| Notification center | `.nt-notification-center` | `patterns/notification-center.css` | — |
| Badge | `.nt-badge` | `components/badge.css` | — |
| Progress, skeleton | `.nt-progress`, `.nt-skeleton` | `components/progress.css`, `components/skeleton.css` | — |
| Loading / empty / error / content state | `.nt-loading-state`, `.nt-empty-state`, `.nt-error-state`, `.nt-content-state` | `patterns/*.css` | `ntApplyState` |
| Live announcements | — | — | `ntCreateAnnouncer` |

## Overlays

| Component | Block class | CSS path | Behavior |
|---|---|---|---|
| Dialog / modal | `.nt-dialog` (`.nt-modal` compatibility) | `components/dialog.css` | `ntCreateDialog`, `ntCreateModal` |
| Drawer | `.nt-drawer` | `components/drawer.css` | `ntCreateDrawer` |
| Popover | `.nt-popover` | `components/popover.css` | `ntCreatePopover` |
| Tooltip | `.nt-tooltip` | `components/tooltip.css` | CSS (`:hover`/`:focus-visible`) |

## Data

| Component | Block class | CSS path | Behavior |
|---|---|---|---|
| Table (read-only) | `.nt-table` | `components/table.css` | — |
| Data grid (interactive) | `.nt-data-grid` | `components/data-grid.css` | `ntCreateDataGrid` |
| Avatar | `.nt-avatar` | `components/avatar.css` | — |

## AI and domain modules

AI surfaces (`ai/*.css`: action button, approval card, conversation panel,
prompt input, proposal card, suggestion card, tool call) and domain modules
(`domain/calendar/*.css` with `ntCreateCalendarGrid`, `domain/billing.css`,
`domain/companies.css`) are documented in the README sections of the same name.

## Utilities

`ntCreateFocusTrap`, `ntCreateOverlay`, `ntLockScroll`, `ntCreateRovingFocus`,
`ntResolveDirection`, `ntGetInlineArrowKeys`, `ntWatchViewport`,
`ntViewportQuery`, and id/ARIA helpers (`ntEnsureId`, `ntSetAriaControls`, …)
are the building blocks the controllers above share.
