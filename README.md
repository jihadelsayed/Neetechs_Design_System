# @neetechs/ui

Official framework-agnostic Neetechs UI design system.

`@neetechs/ui` is pure CSS + pure TypeScript helpers. It does not depend on Angular, React, Next.js, Bootstrap, Tailwind, or Angular Material.

Use it in:

- Angular
- React
- Next.js
- plain JavaScript
- plain HTML
- future Neetechs apps

## Core rules

- Use `nt-` class prefix.
- Use `--nt-` token prefix.
- Do not hardcode component colors.
- Components must consume design tokens.
- Keep this base package framework-agnostic.
- Build Angular or React wrappers later, outside this package.

## Install

```bash
npm install @neetechs/ui
```

## Import all styles

In TypeScript or JavaScript:

```ts
import '@neetechs/ui/styles.css';
```

In CSS:

```css
@import '@neetechs/ui/styles.css';
```

This imports:

```txt
styles
shell
components
patterns
ai
domain
```

## Import only what you need

```css
@import '@neetechs/ui/base.css';
@import '@neetechs/ui/shell.css';
@import '@neetechs/ui/components.css';
@import '@neetechs/ui/patterns.css';
@import '@neetechs/ui/ai.css';
@import '@neetechs/ui/domain.css';
```

Specific CSS entry points:

```css
@import '@neetechs/ui/components/button.css';
@import '@neetechs/ui/components/input.css';
@import '@neetechs/ui/components/card.css';
@import '@neetechs/ui/components/dropdown.css';
@import '@neetechs/ui/patterns/company-switcher.css';
@import '@neetechs/ui/patterns/profile-menu.css';
@import '@neetechs/ui/ai/ai-prompt-input.css';
@import '@neetechs/ui/domain/calendar.css';
@import '@neetechs/ui/domain/billing.css';
@import '@neetechs/ui/domain/companies.css';
```

## Theme setup

For the shared appearance system (backend preference, `nt_theme` bootstrap
cookie, `system` mode, anti-flash bootstrap), use `@neetechs/ui/appearance`
— see [docs/theming.md](./docs/theming.md).

```ts
import { bootstrapNeetechsTheme } from '@neetechs/ui/appearance';

bootstrapNeetechsTheme(); // before framework rendering
```

Add theme attributes to `html`, `body`, or your app root.

```html
<html data-nt-theme="dark" data-nt-accent="orange" data-nt-density="comfortable">
  ...
</html>
```

Supported themes:

```txt
dark
light
high-contrast
```

Supported accents:

```txt
orange
blue
green
purple
neutral
```

Supported density:

```txt
compact
comfortable
spacious
```

## Recommended app setup

For a full Neetechs app, import the full stylesheet once at the app root:

```ts
import '@neetechs/ui/styles.css';
```

Then set the root attributes:

```html
<body data-nt-theme="dark" data-nt-accent="orange" data-nt-density="comfortable">
  <div class="nt-app-shell">
    ...
  </div>
</body>
```

Do not import random component CSS files all over the app unless you are intentionally optimizing bundle size. For most Neetechs apps, one root import is cleaner.

## Basic button

```html
<button class="nt-button nt-button--primary">
  Save changes
</button>

<button class="nt-button nt-button--secondary">
  Cancel
</button>

<button class="nt-button nt-button--ghost">
  More
</button>
```

## Basic input

```html
<label class="nt-field">
  <span class="nt-field__label">Company name</span>
  <input class="nt-input" placeholder="Neetechs" />
  <span class="nt-field__hint">Used across your workspace.</span>
</label>
```

Invalid input:

```html
<label class="nt-field nt-field--error">
  <span class="nt-field__label">Email</span>
  <input class="nt-input" aria-invalid="true" placeholder="you@example.com" />
  <span class="nt-field__error">Enter a valid email.</span>
</label>
```

## Card

```html
<section class="nt-card">
  <header class="nt-card__header">
    <div class="nt-card__header-main">
      <p class="nt-card__eyebrow">Workspace</p>
      <h2 class="nt-card__title">Company Center</h2>
      <p class="nt-card__subtitle">
        Manage companies, branding, team, and billing.
      </p>
    </div>

    <div class="nt-card__actions">
      <button class="nt-button nt-button--secondary">Settings</button>
    </div>
  </header>

  <div class="nt-card__body">
    <p>Put your content here.</p>
  </div>

  <footer class="nt-card__footer">
    <span class="nt-card__meta">Updated today</span>
    <button class="nt-button nt-button--primary">Open</button>
  </footer>
</section>
```

## App shell

```html
<div class="nt-app-shell">
  <aside class="nt-sidebar">
    ...
  </aside>

  <div class="nt-shell-main">
    <header class="nt-header">
      ...
    </header>

    <main class="nt-content-frame">
      ...
    </main>
  </div>
</div>
```

## Company switcher

```html
<div class="nt-company-switcher">
  <header class="nt-company-switcher__header">
    <div class="nt-company-switcher__header-main">
      <span class="nt-company-switcher__eyebrow">Active company</span>
      <h2 class="nt-company-switcher__title">Switch company</h2>
      <p class="nt-company-switcher__description">
        Choose the company you want to manage.
      </p>
    </div>
  </header>

  <div class="nt-company-switcher__body">
    <button class="nt-company-switcher__item nt-company-switcher__item--active">
      <span class="nt-company-switcher__logo">SD</span>

      <span class="nt-company-switcher__item-main">
        <span class="nt-company-switcher__name">Sydfix</span>
        <span class="nt-company-switcher__meta">
          <span class="nt-company-switcher__country">SE</span>
          <span class="nt-company-switcher__role">owner</span>
          <span class="nt-company-switcher__currency">SEK</span>
        </span>
      </span>

      <span class="nt-company-switcher__check">✓</span>
    </button>
  </div>

  <footer class="nt-company-switcher__footer">
    <a class="nt-company-switcher__footer-action" href="/companies/create">
      Create company
    </a>
  </footer>
</div>
```

## Profile menu

```html
<div class="nt-profile-menu">
  <header class="nt-profile-menu__header">
    <span class="nt-avatar">SJ</span>

    <div class="nt-profile-menu__identity">
      <span class="nt-profile-menu__name">Sayed Jihad ElSayed</span>
      <span class="nt-profile-menu__email">jelsayed@uab.edu</span>
    </div>
  </header>

  <div class="nt-profile-menu__body">
    <a class="nt-profile-menu__item" href="/profile">
      <span class="nt-profile-menu__item-icon">👤</span>
      <span class="nt-profile-menu__item-main">
        <span class="nt-profile-menu__item-title">Profile</span>
      </span>
    </a>

    <a class="nt-profile-menu__item" href="/settings">
      <span class="nt-profile-menu__item-icon">⚙</span>
      <span class="nt-profile-menu__item-main">
        <span class="nt-profile-menu__item-title">Settings</span>
      </span>
    </a>
  </div>
</div>
```

## AI prompt input

```html
<form class="nt-ai-prompt-input">
  <div class="nt-ai-prompt-input__header">
    <div class="nt-ai-prompt-input__title">
      <span class="nt-ai-prompt-input__title-icon">✦</span>
      Ask AI
    </div>

    <div class="nt-ai-prompt-input__meta">GPT</div>
  </div>

  <div class="nt-ai-prompt-input__body">
    <textarea
      class="nt-ai-prompt-input__textarea"
      placeholder="Ask AI to plan your day..."
    ></textarea>
  </div>

  <footer class="nt-ai-prompt-input__footer">
    <div class="nt-ai-prompt-input__tools">
      <button class="nt-ai-prompt-input__tool" type="button">Calendar</button>
      <button class="nt-ai-prompt-input__tool" type="button">Company</button>
    </div>

    <div class="nt-ai-prompt-input__actions">
      <button class="nt-ai-prompt-input__submit" type="submit">
        Generate
      </button>
    </div>
  </footer>
</form>
```

## AI proposal card

```html
<section class="nt-ai-proposal-card">
  <header class="nt-ai-proposal-card__header">
    <span class="nt-ai-proposal-card__icon">✦</span>

    <div class="nt-ai-proposal-card__header-main">
      <span class="nt-ai-proposal-card__eyebrow">AI proposal</span>
      <h2 class="nt-ai-proposal-card__title">Schedule focus block</h2>
      <p class="nt-ai-proposal-card__description">
        AI found a free slot based on your calendar.
      </p>
    </div>

    <span class="nt-ai-proposal-card__confidence nt-ai-proposal-card__confidence--high">
      High confidence
    </span>
  </header>

  <div class="nt-ai-proposal-card__body">
    <div class="nt-ai-proposal-card__summary">
      <h3 class="nt-ai-proposal-card__summary-title">Summary</h3>
      <p class="nt-ai-proposal-card__summary-text">
        Create a 90-minute deep work session tomorrow morning.
      </p>
    </div>
  </div>

  <footer class="nt-ai-proposal-card__footer">
    <span class="nt-ai-proposal-card__footer-text">
      Review before applying.
    </span>

    <div class="nt-ai-proposal-card__actions">
      <button class="nt-button nt-button--secondary">Reject</button>
      <button class="nt-button nt-button--primary">Apply</button>
    </div>
  </footer>
</section>
```

## Calendar month grid

```html
<section class="nt-calendar-month-grid">
  <header class="nt-calendar-month-grid__header">
    <div class="nt-calendar-month-grid__header-main">
      <span class="nt-calendar-month-grid__eyebrow">Calendar</span>
      <h2 class="nt-calendar-month-grid__title">June 2026</h2>
    </div>

    <div class="nt-calendar-month-grid__actions">
      <button class="nt-button nt-button--secondary">Today</button>
      <button class="nt-button nt-button--primary">New event</button>
    </div>
  </header>

  <div class="nt-calendar-month-grid__body">
    <div class="nt-calendar-month-grid__weekdays">
      <div class="nt-calendar-month-grid__weekday">Mon</div>
      <div class="nt-calendar-month-grid__weekday">Tue</div>
      <div class="nt-calendar-month-grid__weekday">Wed</div>
      <div class="nt-calendar-month-grid__weekday">Thu</div>
      <div class="nt-calendar-month-grid__weekday">Fri</div>
      <div class="nt-calendar-month-grid__weekday">Sat</div>
      <div class="nt-calendar-month-grid__weekday">Sun</div>
    </div>

    <div class="nt-calendar-month-grid__days">
      <button class="nt-calendar-month-grid__day nt-calendar-month-grid__day--interactive">
        <span class="nt-calendar-month-grid__day-header">
          <span class="nt-calendar-month-grid__day-number">1</span>
        </span>

        <span class="nt-calendar-month-grid__events">
          <span class="nt-calendar-month-grid__event nt-calendar-month-grid__event--busy">
            <span class="nt-calendar-month-grid__event-dot"></span>
            <span class="nt-calendar-month-grid__event-title">Team sync</span>
          </span>
        </span>
      </button>
    </div>
  </div>
</section>
```

## Billing document

```html
<section class="nt-billing-document">
  <header class="nt-billing-document__header">
    <div class="nt-billing-document__header-main">
      <span class="nt-billing-document__eyebrow">Invoice</span>
      <h2 class="nt-billing-document__title">INV-1001</h2>
      <p class="nt-billing-document__description">Issued to Sydfix customer.</p>
    </div>

    <span class="nt-billing-status nt-billing-status--paid">
      <span class="nt-billing-status__dot"></span>
      Paid
    </span>
  </header>

  <div class="nt-billing-document__body">
    <div class="nt-billing-amount-list">
      <div class="nt-billing-amount-row">
        <span class="nt-billing-amount-row__label">Subtotal</span>
        <span class="nt-billing-amount-row__value">1,000 SEK</span>
      </div>

      <div class="nt-billing-amount-row nt-billing-amount-row--total">
        <span class="nt-billing-amount-row__label">Total</span>
        <span class="nt-billing-amount-row__value">1,250 SEK</span>
      </div>
    </div>
  </div>
</section>
```

## TypeScript helpers

```ts
import {
  ntCreateDialog,
  ntCreateDrawer,
  ntCreateDropdown,
} from '@neetechs/ui/behaviors';
```

Dropdown example:

```ts
import { ntCreateDropdown } from '@neetechs/ui/behaviors';

const trigger = document.querySelector<HTMLElement>('#profile-trigger');
const content = document.querySelector<HTMLElement>('#profile-menu');

if (trigger && content) {
  ntCreateDropdown({
    trigger,
    content,
  });
}
```

Dialog example:

```ts
import { ntCreateDialog } from '@neetechs/ui/behaviors';

const trigger = document.querySelector<HTMLElement>('#open-dialog');
const dialog = document.querySelector<HTMLElement>('#dialog');
const backdrop = document.querySelector<HTMLElement>('#dialog-backdrop');
const title = document.querySelector<HTMLElement>('#dialog-title');

if (dialog) {
  ntCreateDialog({
    trigger,
    dialog,
    backdrop,
    title,
  });
}
```

Drawer example:

```ts
import { ntCreateDrawer } from '@neetechs/ui/behaviors';

const trigger = document.querySelector<HTMLElement>('#open-drawer');
const drawer = document.querySelector<HTMLElement>('#drawer');
const backdrop = document.querySelector<HTMLElement>('#drawer-backdrop');

if (drawer) {
  ntCreateDrawer({
    trigger,
    drawer,
    backdrop,
    side: 'right',
  });
}
```

## Package exports

Main TypeScript export:

```ts
import { NEETECHS_UI_PACKAGE, NEETECHS_UI_VERSION } from '@neetechs/ui';
```

Behavior helpers:

```ts
import { ntCreateDropdown } from '@neetechs/ui/behaviors';
```

CSS exports:

```txt
@neetechs/ui/styles.css
@neetechs/ui/base.css
@neetechs/ui/tokens.css
@neetechs/ui/reset.css
@neetechs/ui/shell.css
@neetechs/ui/components.css
@neetechs/ui/patterns.css
@neetechs/ui/ai.css
@neetechs/ui/domain.css
@neetechs/ui/domain/calendar.css
@neetechs/ui/domain/billing.css
@neetechs/ui/domain/companies.css
```

## Framework usage

### Angular

In `styles.scss`:

```scss
@import '@neetechs/ui/styles.css';
```

Or in `angular.json` styles:

```json
[
  "node_modules/@neetechs/ui/src/index.css",
  "src/styles.scss"
]
```

### React / Next.js

In your root layout or app entry:

```ts
import '@neetechs/ui/styles.css';
```

### Plain HTML

```html
<link rel="stylesheet" href="/node_modules/@neetechs/ui/src/index.css" />
```

For production, serve the built CSS from your bundler output instead of directly referencing `node_modules`.

## Current package structure

```txt
packages/ui
  src
    styles
      tokens
      themes
      utilities
      animations
    shell
    components
    patterns
    ai
    domain
      calendar
      billing
      companies
    behaviors
    types
  docs
```

## What belongs here

Good:

```txt
CSS tokens
themes
base/reset styles
utility CSS
component CSS classes
shell CSS
AI UI CSS
domain UI CSS
pure TypeScript DOM helpers
```

Bad:

```txt
Angular components
React components
business API calls
Tailwind config
Bootstrap overrides
Angular Material wrappers
app-specific routing
backend logic
```

## Wrapper packages later

These should be separate packages:

```txt
@neetechs/ui-angular
@neetechs/ui-react
```

Do not put wrappers inside `@neetechs/ui`.
