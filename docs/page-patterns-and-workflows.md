# Page patterns and workflows

Shared page hierarchy and workflow presentation so Neetechs applications
feel like one platform. The design system owns structure, action placement,
feedback placement, and presentation contracts. Applications own routing,
data loading, authentication and permission decisions, business validation,
backend operations, payments, AI execution, translations, and analytics.

## Page anatomy

```text
Application navigation (shell)
→ Breadcrumb / parent navigation
→ Page header            .nt-page-header
→ Status or service banner (nt-alert / nt-content-state)
→ Page toolbar           .nt-page-toolbar
→ Primary content        .nt-page-body / .nt-page-section
→ Supporting content     .nt-page-aside (via .nt-page-body--with-aside)
→ Footer actions         .nt-page-footer-actions
```

Every region is optional. Structural roles:

| Role | Class | Notes |
| --- | --- | --- |
| Page | `.nt-page` / `.nt-content-frame` | existing wrappers; use `<main>` |
| Page header | `.nt-page-header` | `__main`, `__eyebrow`, `__title`, `__description`, `__meta`, `__actions` |
| Page toolbar | `.nt-page-toolbar` | `__start` (search/filters), `__end` (sort/view), `__applied` |
| Page body | `.nt-page-body` (+ `--with-aside`) | vertical rhythm; aside collapses under content below 64rem |
| Page section | `.nt-page-section` | `__header`, `__title` (one level below the page title), `__description`, `__actions` |
| Footer actions | `.nt-page-footer-actions` (+ `--sticky`) | `__start` separates destructive actions |

Rules: semantic landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`); one
`<h1>` identifies the page; breadcrumbs never replace the title; banners sit
between header and content without breaking rhythm permanently; responsive
behavior follows [responsive-and-adaptive-design.md](./responsive-and-adaptive-design.md).

## Action hierarchy

| Level | Style | Examples |
| --- | --- | --- |
| Primary | `.nt-button--primary`, exactly one per action group | Create invoice, Save changes, Approve change |
| Secondary | `--secondary` | Save draft, Export invoices, Duplicate invoice |
| Tertiary | `--ghost` | Copy link, View history |
| Destructive | `--danger`, separated in a start slot or danger section | Delete company, Void invoice, Revoke access |
| Overflow | menu ("More actions") | low-frequency actions |

Rules: never several equally styled primary buttons; never danger styling
for ordinary cancellation; never the only primary action inside overflow;
destructive actions never sit adjacent to the primary action
(`.nt-page-footer-actions__start`, `.nt-form__actions-start`,
`.nt-settings-section--danger`); color is never the only differentiator.
DOM order is the keyboard and screen-reader order; in RTL the same DOM
order renders mirrored — semantic priority is never re-sorted for RTL.

## List page

Compose: `.nt-page-header` (identity + primary create action) →
`.nt-page-toolbar` (search, filters, sort, applied-filter row) → count →
table/grid/record list → `.nt-pagination`.

- Bulk actions appear only after selection (toolbar swap with an accessible
  announcement), the create action stays visible.
- Data representation (table, data grid, record list) follows the data's
  meaning — see the responsive doc's table/data-grid strategies.
- States: loading (skeleton), refreshing, first-use empty, no search
  results, no filtered results, partial, error, offline, permission-limited
  — all via `.nt-content-state` categories with the copy rules in
  [content-and-terminology.md](./content-and-terminology.md). Empty states
  are not rendered as fake table rows.

## Detail page

Compose: `.nt-page-header` with `__meta` (status badge + text, reference,
key figures) → tabs or `.nt-page-section`s → related records/activity →
`.nt-page-footer-actions` (destructive in `__start`).

- Record identity wraps rather than truncating; status never relies on badge
  color alone (always text).
- Edit (primary) and destructive actions never compete visually.
- Unsaved editing state and navigation guards follow
  [states-feedback-and-recovery.md](./states-feedback-and-recovery.md).

## Create and edit page

Use `.nt-form` (rows, sections, actions) inside a page with a clear task
title ("Create invoice", "Edit INV-1042").

- Error summary: `role="alert"` alert before the form, fields keep
  `aria-invalid` + `.nt-field__error`; failed submission preserves data
  (`ntCreateFormController`).
- Save labels name the result ("Create invoice", "Save changes"), draft is
  a distinct secondary action, abandon/discard is separated.
- Long forms use sections, not one giant card; actions stay reachable
  (`.nt-page-footer-actions--sticky` when justified).

## Settings page

Use `.nt-settings-layout` (side navigation ↔ scrollable row on narrow) with
`.nt-settings-section`s.

- Group by user intent, not backend model.
- Permanent account settings live in MyAccount; tools link to them with
  `.nt-settings-section__managed-note` instead of recreating them.
- Immediate-apply settings say so in the section description; save-required
  sections have their own explicit save; the two are never mixed silently.
- Developer API keys (Developer & Integrations) stay separate from AI
  provider connections (MyAccount → AI & Automation → AI Connections).
- Dangerous settings sit in `.nt-settings-section--danger` with a
  consequence sentence and a confirmation flow.

## Dashboard

Compose `.nt-page-header` (context/date range in `__meta`) →
`.nt-grid--fit` of cards ordered by decision importance: attention-required
first, key metrics, recent activity, quick actions.

- Metrics need label + value + context + change meaning (text, not color
  alone); charts need accessible summaries.
- Widgets declare `--nt-grid-min-item`; not every widget gets equal weight.
- Conversational Neenee pages are conversations, never dashboards.

## Master-detail

`.nt-master-detail` — side-by-side on wide regions; below a 48rem container
or viewport it becomes single-pane driven by `data-nt-pane="list|detail"`
with a visible `.nt-master-detail__back` control. Only one pane exists for
assistive technology in single-pane mode. Empty selection renders
`.nt-master-detail__empty`, never a blank region. Unsaved detail changes
follow the recovery contract before pane switches.

## Search results

Query echo ("No invoices match “June hosting”"), result count, applied
filters, sort, pagination. Distinguish no-results-for-query from
no-data-at-all; mixed-direction queries render inside bidi-isolated spans;
highlighting is never the only match indicator. Table semantics only for
tabular results.

## Approval queue

Compose a list page of `.nt-ai-approval-card`s (or equivalent financial /
access cards): pending count in the page header, each card carrying origin,
target, proposed change (diff blocks), risk/consequence text
(`__footer-text`), and explicit Approve / Reject / Revise actions labeled
with their object ("Approve change", "Reject proposal"). Approval is not
execution success — execution states follow the Prompt 8 AI contract. Bulk
approval only for homogeneous, clearly scoped actions.

## Authentication and recovery

Presentation only — the package implements no authentication. Use focused
single-column layouts (never dense operational shells) with
`.nt-content-state` for: sign-in, session expired ("Your session ended" +
what happened to unsaved work + "Sign in again"), password reset request and
completion, email verification, MFA challenge, locked account, access
denied, service unavailable, and return-to-task. Never reveal account
existence where policy forbids it; name identity providers explicitly;
explain external redirects; never expose raw server internals.

## Onboarding

Welcome → required setup → optional setup → completion, using the workflow
pattern. Required and optional steps are visibly distinct
(`.nt-step-indicator__optional`); progress describes tasks, not screen
counts; completed steps are not repeated; skip/resume-later are explicit
actions; permanent settings are asked once (MyAccount), not per tool.

## Multi-step workflows

`.nt-workflow` + `.nt-step-indicator` (ol/li, `aria-current="step"`,
completed state in text, markers aria-hidden) + `.nt-workflow__progress`
("Step 2 of 3") + `.nt-workflow__review` with `__consequence` before
submission + `.nt-workflow__footer` (back / save-and-exit in `__footer-start`,
the continuing action at the end).

A wizard is justified only when the task has meaningful stages, later input
depends on earlier choices, one screen would be unmanageable, or review
before submission is valuable. Back navigation must not silently lose data;
validation happens at the owning step; browser-back behavior is application
routing.

## Upload and import

The queue distinguishes, in visible text: selected locally → uploading →
uploaded → processing → ready → rejected / failed / canceled. Restrictions
(size, type) are visible before selection; errors name the affected file;
retry never duplicates successful uploads; partial success itemizes;
technical detail is expandable; long/bidi filenames wrap or truncate with
the full name available. Transport, scanning, and persistence are backend
responsibilities — "Uploaded" never claims "Ready".

## Billing and payment presentation

Amount, currency, tax, due date, and counterparty are always explicit;
financial values use the financial tokens and tabular numerals. Draft,
issued, overdue, paid, voided, and failed states pair badge + text. "Save
draft", "Issue invoice", and "Record payment" are distinct actions;
finalization confirmations state the consequence ("Issuing assigns invoice
number … and cannot be edited afterwards"). Locked accounting periods
explain the recovery path (reversal, credit note) — deletion and accounting
reversal are never presented as equivalent. Payment failure never implies
the invoice disappeared.

## AI-provider connection

Workflow (provider selection → credential entry → optional endpoint →
connection test → save) uses the multi-step pattern; credentials live under
MyAccount → AI & Automation → AI Connections, separate from developer API
keys. Saved secrets are never redisplayed (masked, replace-only).
"Connection succeeded" only after backend confirmation; capability badges
(chat, vision, image generation, transcription, audio) state what actually
works — connected ≠ every capability available. Custom endpoints get
stronger explanation and validation. Disconnect confirmations list affected
default models and automations. The package stores no credentials.

## AI write-action workflow

Request → understanding → proposed action (human-readable preview, target
system and objects, field-level diff where practical, risk level) →
confirmation per resolved MyAccount policy → executing → result → recovery.
Raw endpoints are never the main explanation; success is claimed only after
backend confirmation; "no access" is never claimed when a platform tool
exists; tool-call details collapse under the human-readable summary.

## Responsive, accessibility, localization, states

Every pattern follows the previously established contracts:
[responsive-and-adaptive-design.md](./responsive-and-adaptive-design.md),
[accessibility.md](./accessibility.md),
[localization-and-rtl.md](./localization-and-rtl.md),
[states-feedback-and-recovery.md](./states-feedback-and-recovery.md).
Patterns accept complete localized strings in content slots — never
concatenated fragments.

## Testing

```bash
npm run check:content   # generic labels / unhelpful copy in owned fixtures
npm test                # tests/page-patterns.test.mjs, tests/content-contracts.test.mjs
npm run test:browser    # responsive + pattern behavior on tests/pages/patterns.html
```

## Manual review checklist

- [ ] One `<h1>`; heading levels descend without gaps.
- [ ] One primary action per action group; destructive separated.
- [ ] Empty/error/permission states use the correct category and copy.
- [ ] Works at 375px, at 200% zoom, in RTL, and with long Swedish strings.
- [ ] Filters/search state stays discoverable after applying.
- [ ] Confirmations name action, target, scope, consequence, reversibility.

## Known limitations

- Fixtures demonstrate structure with English copy; applications supply
  translations.
- Approval-queue, onboarding, upload, billing, and AI-connection patterns
  are composition + copy contracts over existing components; there is no
  single "wizard component" executing navigation.
- Real-app validation is deferred to Prompts 13–16.
