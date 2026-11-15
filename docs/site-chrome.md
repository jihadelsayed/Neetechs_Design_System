# Site chrome: header, navbar, account dropdown, mobile navigation, footer

Reusable, framework-independent page chrome for Neetechs websites and apps.
Everything is configured by markup: logos, navigation items, account actions,
footer columns, social links, and legal links are plain HTML the application
renders. The package never hardcodes routes, URLs, authentication, or API calls.

A complete working example lives in the repository at
`tests/pages/site-chrome.html` (serve with `node scripts/serve-test-gallery.mjs`
and open `/tests/pages/site-chrome.html`). It is the fixture for
`tests/browser/site-chrome.spec.mjs`, so the example cannot drift from
tested behavior.

| Piece | CSS | Behavior (`@neetechs/ui/behaviors`) |
|---|---|---|
| Header | `@neetechs/ui/shell/header.css` (`.nt-header`) | — |
| Navbar | `@neetechs/ui/shell/navbar.css` (`.nt-navbar`) | `ntCreateNavbar` |
| Account dropdown | `.nt-header__account` + `@neetechs/ui/patterns/profile-menu.css` | `ntCreateAccountMenu` |
| Mobile navigation | `@neetechs/ui/shell/mobile-nav.css` (`.nt-mobile-nav--drawer`) | `ntCreateMobileNav` |
| Footer | `@neetechs/ui/shell/footer.css` (`.nt-footer`) | — (pure CSS) |

All of it is included in `@neetechs/ui/styles.css` and `@neetechs/ui/shell.css`.

## Header

```html
<header class="nt-header nt-header--sticky">
  <div class="nt-header__left">
    <button class="nt-header__mobile-trigger nt-header__action" type="button" aria-label="Open site menu">
      <svg aria-hidden="true" focusable="false">…</svg>
    </button>
    <a class="nt-header__brand" href="/">
      <img class="nt-header__logo" src="/logo.svg" alt="">
      <span class="nt-header__brand-name">Neetechs</span>
    </a>
  </div>
  <div class="nt-header__nav">
    <nav class="nt-navbar" aria-label="Primary">…</nav>
  </div>
  <div class="nt-header__right">
    <div class="nt-dropdown">…account dropdown…</div>
  </div>
</header>
```

- `.nt-header--sticky` pins the header to the top of the scroll container.
  Inside `.nt-app-shell`, keep using `.nt-app-shell__header`, which already sticks.
- `.nt-header__brand` is a link; give the logo `alt=""` when the brand name is
  visible text, or a meaningful `alt` when the name is omitted.
- `.nt-header__mobile-trigger` appears below 64rem, where `.nt-navbar` hides.
- Existing app-shell header elements (`__title`, `__subtitle`, `__breadcrumb`,
  `__search`, `__action`) are unchanged and can be combined with the new slots.

## Navbar

```html
<nav class="nt-navbar" aria-label="Primary">
  <ul class="nt-navbar__list">
    <li class="nt-navbar__item">
      <a class="nt-navbar__link" href="/" aria-current="page">Home</a>
    </li>
    <li class="nt-navbar__item">
      <button class="nt-navbar__trigger" type="button" aria-expanded="false" aria-controls="nav-products">
        Products<span class="nt-navbar__chevron" aria-hidden="true"></span>
      </button>
      <div class="nt-navbar__panel" id="nav-products" hidden>
        <ul class="nt-navbar__panel-list">
          <li>
            <a class="nt-navbar__panel-link" href="/billing">
              Billing<span class="nt-navbar__panel-description">Invoices and payments.</span>
            </a>
          </li>
        </ul>
      </div>
    </li>
  </ul>
</nav>
```

```ts
import { ntCreateNavbar } from '@neetechs/ui/behaviors';

const navbar = ntCreateNavbar({ root: document.querySelector('.nt-navbar')! });
// After re-rendering items: navbar.refresh(); on teardown: navbar.destroy();
```

Pattern: WAI-ARIA *disclosure navigation*, not `role="menu"`. Links remain
links, so browser and router navigation behave normally.

| Input | Result |
|---|---|
| Click / Enter / Space on a trigger | Toggles its panel; opening one closes any other |
| ArrowDown on a trigger | Opens the panel and focuses its first link |
| ArrowUp / ArrowDown / Home / End in a panel | Moves between the panel's links (wraps) |
| ArrowLeft / ArrowRight on the top level | Moves between top-level entries; swapped under `dir="rtl"` |
| Escape | Closes the panel and returns focus to its trigger |
| Pointer down outside the navbar | Closes the panel |
| Focus leaves the navbar (Tab) | Closes the panel |
| Activating a panel link | Closes the panel (`closeOnNavigate`, default `true`) |

Modifiers: `.nt-navbar--compact` (smaller rows), `.nt-navbar__panel--end`
(align the panel to the item's inline end), `.nt-navbar__panel--wide`
(multi-column panel). Current page: `aria-current="page"` (draws an indicator
bar, so state never depends on color alone). Disabled entries: `aria-disabled="true"`.

Current-page links show an accent underline that grows from the center; on
hover other links preview the underline in a neutral tone. The underline is
a shape cue, so the current page never relies on color alone.

## Account dropdown

```html
<div class="nt-dropdown">
  <button class="nt-header__account" type="button" aria-expanded="false" aria-controls="account-panel" aria-label="Account: Sara Ali">
    <span class="nt-avatar nt-avatar--sm" aria-hidden="true"><img class="nt-avatar__image" src="/avatar.jpg" alt=""></span>
    <span class="nt-header__account-name">Sara Ali</span>
    <span class="nt-header__account-chevron" aria-hidden="true"></span>
  </button>
  <div class="nt-dropdown__content nt-profile-menu" id="account-panel" data-align="end" hidden>
    <div class="nt-profile-menu__header">
      <div class="nt-profile-menu__identity">
        <span class="nt-profile-menu__name">Sara Ali</span>
        <span class="nt-profile-menu__email">sara@example.com</span>
      </div>
    </div>
    <div class="nt-profile-menu__section">
      <a class="nt-profile-menu__item" href="/settings">Account settings</a>
      <button class="nt-profile-menu__item nt-profile-menu__item--danger" type="button">Sign out</button>
    </div>
  </div>
</div>
```

```ts
import { ntCreateAccountMenu } from '@neetechs/ui/behaviors';

const account = ntCreateAccountMenu({
  trigger: document.querySelector<HTMLElement>('.nt-header__account')!,
  panel: document.querySelector<HTMLElement>('#account-panel')!,
});
```

The account dropdown is a disclosure (button + panel), because the panel holds
identity text as well as actions, which `role="menu"` cannot contain. Escape
closes and restores focus, outside clicks and focus leaving close it, and
Arrow Up/Down/Home/End move between its actions. The application owns what
"Sign out" does. The account name hides below 40rem, leaving the avatar.

## Mobile navigation

```html
<div class="nt-mobile-nav__overlay" id="site-menu-backdrop" hidden></div>
<aside class="nt-mobile-nav nt-mobile-nav--drawer" id="site-menu" aria-labelledby="site-menu-title" hidden>
  <div class="nt-mobile-nav__header">
    <span class="nt-mobile-nav__title" id="site-menu-title">Neetechs</span>
    <button class="nt-mobile-nav__close" type="button" aria-label="Close site menu">…</button>
  </div>
  <nav class="nt-mobile-nav__body" aria-label="Site">
    <div class="nt-mobile-nav__section">
      <a class="nt-mobile-nav__item" href="/" aria-current="page"><span class="nt-mobile-nav__item-label">Home</span></a>
    </div>
  </nav>
</aside>
```

```ts
import { ntCreateMobileNav } from '@neetechs/ui/behaviors';

const mobileNav = ntCreateMobileNav({
  trigger: document.querySelector<HTMLElement>('.nt-header__mobile-trigger')!,
  nav: document.querySelector<HTMLElement>('#site-menu')!,
  backdrop: document.querySelector<HTMLElement>('#site-menu-backdrop'),
});
```

Built on `ntCreateDrawer` (modal): `role="dialog"`, `aria-modal`, focus trap,
background `inert`, scroll lock, Escape, backdrop click, close button, and
focus restoration to the menu button. It also closes after a link is activated
and when the viewport grows past the mobile breakpoint, so no stale modal state
remains. The drawer enters from the inline-start edge (right edge in RTL) and
respects safe-area insets and reduced motion.

## Footer

```html
<footer class="nt-footer">
  <div class="nt-footer__inner">
    <div class="nt-footer__brand">
      <a class="nt-footer__brand-link" href="/">
        <img class="nt-footer__logo" src="/logo.svg" alt="">
        <span class="nt-footer__brand-name">Neetechs</span>
      </a>
      <p class="nt-footer__tagline">Business software for teams.</p>
      <ul class="nt-footer__social" aria-label="Social media">
        <li><a class="nt-footer__social-link" href="https://www.linkedin.com/company/example" aria-label="Neetechs on LinkedIn"><svg class="nt-footer__social-icon" aria-hidden="true" focusable="false">…</svg></a></li>
      </ul>
    </div>
    <nav class="nt-footer__nav" aria-label="Footer">
      <div class="nt-footer__column">
        <h2 class="nt-footer__heading" id="footer-products">Products</h2>
        <ul class="nt-footer__list" aria-labelledby="footer-products">
          <li><a class="nt-footer__link" href="/billing">Billing</a></li>
        </ul>
      </div>
    </nav>
  </div>
  <div class="nt-footer__bottom">
    <p class="nt-footer__copyright">© 2026 Neetechs</p>
    <ul class="nt-footer__legal" aria-label="Legal">
      <li><a class="nt-footer__link" href="/privacy">Privacy policy</a></li>
    </ul>
  </div>
</footer>
```

The footer is a query container: columns pair up from about 21rem, the brand
column moves beside the link columns from 48rem of footer width, and the bottom bar
becomes a single row. Variants: `.nt-footer--compact` (bottom bar only) and
`.nt-footer--raised` (surface background). Choose heading levels that fit the
page outline; the class carries the styling.

## Workspace sidebar

Application workspaces (Billing, Companies, MyAccount) use `.nt-app-shell`
with `.nt-sidebar`. `ntCreateSidebar` adds the interactions; routing stays
with the application.

```html
<div class="nt-app-shell nt-app-shell--inset nt-app-shell--offcanvas" id="shell">
  <aside class="nt-app-shell__sidebar" id="workspace-sidebar" aria-label="Workspace">
    <nav class="nt-sidebar nt-sidebar--floating" aria-label="Billing navigation">
      <div class="nt-sidebar__nav">
        <div class="nt-sidebar__group">
          <button class="nt-sidebar__group-trigger" type="button" aria-expanded="true">
            <span class="nt-sidebar__group-label">Sales</span>
            <svg class="nt-sidebar__group-chevron" aria-hidden="true"></svg>
          </button>
          <div class="nt-sidebar__group-items">
            <div class="nt-sidebar__group-inner">
              <a class="nt-sidebar__item" href="/invoices" aria-current="page">
                <svg class="nt-sidebar__item-icon" aria-hidden="true"></svg>
                <span class="nt-sidebar__item-label">Invoices</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div class="nt-sidebar__footer">
        <button class="nt-button nt-button--ghost nt-button--sm" type="button" data-nt-sidebar-close>Close menu</button>
      </div>
    </nav>
  </aside>
  <div class="nt-app-shell__overlay" hidden></div>
  <div class="nt-app-shell__main">
    <header class="nt-app-shell__header">
      <button class="nt-icon-button nt-icon-button--ghost nt-app-shell__menu-toggle" type="button" aria-label="Open navigation"></button>
      <button class="nt-icon-button nt-icon-button--ghost nt-app-shell__collapse-toggle" type="button" aria-label="Collapse sidebar"></button>
    </header>
    <main class="nt-app-shell__content">…</main>
  </div>
</div>
```

```ts
import { ntCreateSidebar } from '@neetechs/ui/behaviors';

const sidebar = ntCreateSidebar({
  shell: document.querySelector('#shell'),
  sidebar: document.querySelector('#workspace-sidebar'),
  collapseToggle: document.querySelector('.nt-app-shell__collapse-toggle'),
  menuToggle: document.querySelector('.nt-app-shell__menu-toggle'),
  backdrop: document.querySelector('.nt-app-shell__overlay'),
  storageKey: 'billing.sidebar.collapsed',
});
// After the app re-renders navigation or changes the current route:
sidebar.refresh();
```

| Feature | Contract |
|---|---|
| Active item | `aria-current="page"` (or `--active`): selection fill plus an inline-start indicator bar that grows in (a shape cue, not color only) |
| Collapsible groups | Disclosure buttons (`aria-expanded` + `aria-controls`); height animates through grid rows; closed items leave the tab order; a group containing the current page opens on init and on `refresh()` |
| Icon rail | `setCollapsed(true)` or the collapse toggle sets `.nt-app-shell--collapsed` (standalone: `.nt-sidebar--collapsed`); the grid column animates; labels are visually hidden but keep accessible names; icon-only items get a `title`; groups show all items separated by dividers |
| Persistence | Optional `storageKey` in `localStorage`; storage failures are ignored |
| Off-canvas (`.nt-app-shell--offcanvas`) | Below 64rem the same sidebar slides in from the inline-start edge as a modal panel: focus trap, Escape, backdrop and outside click, scroll lock, inert background, focus returns to the menu toggle, closes on navigation and when the viewport grows to desktop. A desktop rail preference never applies inside the panel |
| Inset layout (`.nt-app-shell--inset` + `.nt-sidebar--floating`) | Sidebar and content float as separate rounded panels on the app background |
| Toggles | `.nt-app-shell__collapse-toggle` shows only while docked; `.nt-app-shell__menu-toggle` and `[data-nt-sidebar-close]` only below the shell breakpoint |
| SSR | Server markup renders the expanded desktop sidebar; the controller reads storage and media queries only in the browser |

Without `.nt-app-shell--offcanvas` the sidebar keeps its existing behavior
(hidden below 64rem; use the mobile navigation drawer).

## Responsive, touch, RTL, themes

- Desktop (≥ 64rem): navbar + account dropdown. Tablet/phone: menu button +
  mobile drawer; the account trigger collapses to the avatar below 40rem.
- Coarse pointers get 44px (`--nt-target-size-primary`) targets for header
  actions, the account button, drawer rows and close button, navbar panel links,
  and footer links. Fine pointers keep at least 24px (WCAG 2.2 AA).
- Only logical properties are used; the drawer, panels, and indicator bars
  mirror under `dir="rtl"`.
- Colors come from semantic tokens only, so dark, light, high contrast, and all
  accents work without extra CSS. Forced-colors mode keeps current/expanded
  states visible with a system-color outline.

## Layering

See [layering.md](./layering.md). Header dropdowns render inside the header's
stacking context at `--nt-z-header`, so positioned or hovered page cards can
never cover them, while drawers, modals, and toasts still stack above.

## Framework integration

The controllers are plain DOM functions. In Angular, create them in
`afterNextRender` / `ngAfterViewInit` and call `destroy()` in `ngOnDestroy`;
let `routerLink` render the `href`s. In React, create them in `useEffect` and
return `destroy`. Call `navbar.refresh()` when navigation items re-render.
