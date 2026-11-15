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
| Link button | `.nt-button--link` | `components/button.css` | Inline text action ("Add headline", "View all") with button semantics |

## Forms

| Component | Block class | CSS path | Behavior |
|---|---|---|---|
| Input / field | `.nt-input`, `.nt-field` | `components/input.css` | `ntConnectField`, `ntCreateFormController`, `ntFocusErrorSummary` |
| Textarea | `.nt-textarea` | `components/textarea.css` | `ntConnectField` |
| Select | `.nt-select` | `components/select.css` | native `<select>` |
| Checkbox | `.nt-checkbox` | `components/checkbox.css` | native |
| Radio | `.nt-radio` | `components/radio.css` | native |
| Switch | `.nt-switch` | `components/switch.css` | native `role="switch"` |
| Choice card | `.nt-choice-card`, `.nt-choice-group` | `components/choice-card.css` | native radio or checkbox (arrow keys, Space) |
| Form layout | `.nt-form` | `patterns/form-layout.css` | — |

## Layout

| Component | Block class | CSS path |
|---|---|---|
| Card | `.nt-card` | `components/card.css` |
| Panel | `.nt-panel` | `components/panel.css` |
| Disclosure | `.nt-disclosure`, `.nt-disclosure-group` | `components/disclosure.css` |
| Profile header | `.nt-profile-header` | `patterns/profile-header.css` |
| Resource card | `.nt-resource-card`, `.nt-resource-card-grid` | `patterns/resource-card.css` |
| Editor workspace | `.nt-editor-workspace`, `.nt-editor-pane`, `.nt-editor-status` | `patterns/editor-workspace.css` |
| Document preview | `.nt-document-preview` | `patterns/document-preview.css` |
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

## Account and workspace patterns

### Profile header

```html
<header class="nt-profile-header nt-profile-header--surface">
  <div class="nt-profile-header__identity">
    <button class="nt-avatar nt-avatar--2xl nt-avatar--rounded nt-avatar--editable" type="button" aria-label="Change profile photo">
      <img class="nt-avatar__image" src="/me.jpg" alt="">
      <span class="nt-avatar__overlay" aria-hidden="true">Change</span>
    </button>
    <div class="nt-profile-header__main">
      <div class="nt-profile-header__name-row">
        <h1 class="nt-profile-header__name">Jamie Svensson</h1>
        <span class="nt-profile-header__handle">@jamie</span>
      </div>
      <p class="nt-profile-header__headline">Full-stack developer</p>
      <ul class="nt-profile-header__details">
        <li>Stockholm</li>
        <li><button class="nt-button nt-button--link" type="button">Add website</button></li>
      </ul>
      <div class="nt-profile-header__completion">
        <div class="nt-progress nt-progress--sm nt-progress--reveal" style="--nt-progress-value: 72%">…</div>
      </div>
    </div>
  </div>
  <div class="nt-profile-header__side">
    <div class="nt-profile-header__actions">…</div>
    <div class="nt-profile-header__aside">…</div>
  </div>
</header>
```

- Missing information is an inline `.nt-button--link` action in place of the
  value ("Add headline", "Add location"), never an empty row.
- `.nt-avatar--editable` shows a "Change" overlay on hover and keyboard focus
  (a permanent strip on touch devices); give the control an `aria-label`.
- `.nt-progress--reveal` fills the completion bar from zero on first render.
- The side column wraps under the identity when both no longer fit, and the
  avatar moves above the text below a 30rem container.
- A next-step card in `__aside` is an ordinary card:
  `.nt-card.nt-card--muted.nt-card--padded` with `__eyebrow`, `__title`,
  and `__subtitle`.

### Resource card

For AI provider connections, connected accounts, integrations, uploaded
documents, API keys, and devices: identity tile (`__media`, or
`__media--document` for files), title with inline badges, end-aligned
`__status` badge (always with text), a facts row
(`.nt-description-list--boxed.nt-description-list--compact`), and
`__actions` (`__actions-end` pushes a destructive action to the end).
`--current` (or `aria-current="true"`) marks the one in use with a selection
ring; `--unavailable`, `--warning`, `--danger`, `--success`, `--compact`.

### Choice card

```html
<fieldset class="nt-choice-group">
  <legend>CV template</legend>
  <label class="nt-choice-card">
    <input class="nt-choice-card__input" type="radio" name="template" value="professional" checked>
    <span class="nt-choice-card__indicator" aria-hidden="true"></span>
    <span class="nt-choice-card__body">
      <span class="nt-choice-card__title">Professional</span>
      <span class="nt-choice-card__description">One column, ATS friendly</span>
    </span>
  </label>
</fieldset>
```

The input stays native (arrow keys in radio groups, Space for checkboxes);
the card shows checked, focus, hover, pressed, and disabled states through
`:has()`, with a selection ring and an indicator dot or tick.

### Disclosure

```html
<details class="nt-disclosure nt-disclosure--surface">
  <summary class="nt-disclosure__summary">
    <span class="nt-disclosure__title">Archived CVs</span>
    <span class="nt-disclosure__meta">2</span>
    <svg class="nt-disclosure__chevron" aria-hidden="true"></svg>
  </summary>
  <div class="nt-disclosure__content">…</div>
</details>
```

Native `<details>`; the height animates where `::details-content` is
supported and opens instantly elsewhere.

### Editor workspace and document preview

```html
<div class="nt-editor-workspace nt-editor-workspace--sticky-preview">
  <div class="nt-editor-workspace__panes">
    <section class="nt-editor-pane" aria-labelledby="source-title">
      <div class="nt-editor-pane__header"><h2 class="nt-editor-pane__title" id="source-title">Markdown</h2></div>
      <textarea class="nt-editor-pane__source" aria-labelledby="source-title"></textarea>
      <div class="nt-editor-pane__footer">
        <span class="nt-editor-status" data-state="saved" role="status">Saved</span>
      </div>
    </section>
    <section class="nt-editor-pane nt-editor-pane--preview" aria-label="Preview">
      <div class="nt-editor-pane__body">
        <div class="nt-document-preview nt-document-preview--flush">
          <div class="nt-document-preview__viewport" tabindex="0" role="region" aria-label="Preview">
            <article class="nt-document-preview__page">…</article>
          </div>
        </div>
      </div>
    </section>
  </div>
</div>
```

- Panes sit side by side above a 64rem workspace width and stack below it;
  `--balanced` splits evenly; `--sticky-preview` keeps the preview in view.
- `.nt-editor-status` states: `saving` (pulsing dot), `saved` (one pop),
  `unsaved`, `error`; always with a word.
- The page keeps true paper size (`--letter`, `--fluid`, `--margin-narrow`,
  `--margin-wide`) so lines wrap as in the export; narrow screens scroll the
  canvas. Paper and ink use `--nt-document-*` tokens that stay paper-colored
  in every theme. Printing keeps only the page; set the matching
  `@page { size; margin }` in the application.

### Settings and section navigation

`.nt-settings-layout` navigation now has an animated current-item bar,
`aria-current="true"`/`"location"` for in-page section links,
`__nav-status` dots (`--complete`, `--attention`, `--error`; add the
meaning as text), `__nav-count`, grouped navigation (`__nav-group`,
`__nav-title`), a card surface (`__nav--surface`), and a sticky nav
(`.nt-settings-layout--sticky-nav`, static on narrow layouts).

### Smaller additions

`.nt-avatar--2xl` (6rem), `.nt-badge--info`, `.nt-card--edge` (accent edge
that strengthens on hover and focus-within), `.nt-stat--split` with
`__body`/`__aside` (balances with supporting facts).

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
