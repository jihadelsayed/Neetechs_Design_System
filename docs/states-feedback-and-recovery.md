# States, feedback, and recovery

This document defines the Prompt 8 state contract for `@neetechs/ui`. It is framework-agnostic: the package provides CSS, DOM behavior helpers, and validation rules. Applications still own data fetching, translations, backend idempotency, routing, permissions, and business policy.

## State Audit

| Area | Current state representation | Conflicts found | Canonical replacement |
| --- | --- | --- | --- |
| Button, icon button, split button, AI action button | `--loading`, `--disabled`, native `disabled`, `aria-disabled`, `aria-busy` | Loading was visually grouped with disabled in several classes, which can imply unavailable instead of in-progress | Native `disabled` only for unavailable; `data-nt-state="pending"` plus `aria-busy="true"` for pending; old classes remain compatible |
| Inputs, textarea, select, checkbox, radio, switch | `--error`, `--disabled`, `--readonly`, native states, `aria-invalid` | Error, invalid, and warning were not separated as validation dimensions; read-only and disabled were visually close | Native `disabled`/`readonly` first; `aria-invalid` for invalid; `data-nt-validation` for neutral/valid/invalid/warning when behavior needs it |
| Tabs, menu, dropdown, switchers, navigation | `aria-selected`, `aria-expanded`, `aria-current`, `--active`, `data-state` | `active` meant current page, selected value, or highlighted command depending on component | ARIA remains authoritative; `selected`, `expanded`, and `current` are separate interaction/navigation meanings |
| Dialog, modal, drawer, toast, command palette | `data-state="open|closed"` | `data-state` is too generic and overlaps operation state | Existing `data-state` remains compatibility; new state helpers use `data-nt-state` for async operation and component controllers keep overlay `data-state` |
| Empty, error, loading patterns | Separate public class families | Shared structure but separate state vocabulary; offline exists only under error; no unauthenticated/forbidden/not-found/maintenance contract | Canonical `.nt-content-state` with `data-nt-content-state`; old pattern classes remain supported |
| Toasts and alerts | Tone classes, `role=status|alert`, `aria-live` | Timeout, dedupe, pause, and critical-error behavior were documented but not owned by a controller | `ntCreateToastController` owns viewport-level timer/dedupe/cleanup; urgency sets live-region semantics |
| AI approval/proposal/tool-call | `pending`, `approved`, `rejected`, `running`, `success`, `error`, tone classes | Proposal, approval, execution, and result could collapse into one loading/success visual | AI write actions use proposal/execution/result terms in copy and `data-nt-state` only for the current operation |
| Domain status | Billing `draft/sent/paid/overdue`, company `active/pending/disabled`, calendar `busy/free/tentative/private` | Domain statuses are not platform operation states | Keep as domain statuses with visible text; do not map every domain word into the global state model |

Duplicate names found: `active`, `pending`, `success`, `error`, `danger`, `disabled`, and `loading` appear in multiple families. The canonical model separates dimensions so a name is interpreted in context. Deprecated state names: none are removed in this prompt. Modifier classes such as `--loading`, `--error`, `--active`, and `--disabled` remain compatibility styling hooks; new behavior should prefer native attributes and `data-nt-*` state attributes.

## State Dimensions

Availability:

```text
enabled | disabled | read-only
```

Interaction:

```text
rest | hover | focus-visible | pressed | selected | expanded | dragging
```

Async operation:

```text
idle | pending | success | error | canceled
```

Validation:

```text
neutral | valid | invalid | warning
```

Content:

```text
initial | loading | ready | refreshing | empty | partial | stale | error | offline | unauthenticated | forbidden | not-found | maintenance | success
```

Valid combinations include `enabled + focus-visible + invalid`, `enabled + selected + pending`, `read-only + valid`, `ready + refreshing`, and `partial + warning`. Invalid combinations include `disabled + pressed`, `read-only + pending`, `pending + success content`, and `loading content + success operation`.

## State Priority

Visual priority is contextual, but the default order is:

```text
disabled -> pending -> error/invalid -> selected/expanded -> pressed -> focus-visible -> hover -> rest
```

Focus remains visible over every state. Disabled controls suppress hover and pressed treatment. Pending controls are not disabled unless the operation also makes the control unavailable. Error and selected states must remain distinguishable by boundary, icon/text, and copy, not hue alone.

## Native Attributes Versus Data Attributes

Use native semantics first:

- Native `disabled` for unavailable native controls.
- Native `readonly` for readable non-editable inputs and textareas.
- `aria-selected` for selectable items.
- `aria-expanded` for disclosures.
- `aria-current` for current navigation.
- `aria-invalid` for invalid fields.
- `aria-busy` for busy controls or regions.
- `aria-disabled` only when native disabled is unavailable or inappropriate, with explicit activation guards.

Use `data-nt-state` for async operation state and `data-nt-content-state` for content state. Existing `data-state` remains for overlays and compatibility. Do not mirror a state into native, ARIA, class, and data attributes unless each representation serves a distinct purpose.

## Async Action Lifecycle

Canonical lifecycle:

```text
idle -> pending -> success | error | canceled -> idle
```

`ntCreateAsyncAction()` prevents duplicate activation while pending, keeps focus on the control, preserves the visible/accessibility name, sets `aria-busy`, sets `data-nt-state`, supports real cancellation through `AbortController`, resets success by default, and cleans up listeners and timers on destroy. It does not call APIs, retry requests, or invent cancellation after a request can no longer stop.

Pending buttons use `data-nt-state="pending"` and must retain their original label. A spinner may be added as a decorative child, but it must not replace the accessible name.

## Loading and Progress

Use immediate control loading for save, delete, send, submit, refresh, AI approval, and upload initiation. Use section loading when one region waits for data. Use page loading only when the experience cannot render meaningfully. Use refreshing when useful stale content remains visible. Use determinate progress only when real completion is known; otherwise use indeterminate status text.

Skeletons are decorative unless they communicate a useful status. Mark skeleton geometry `aria-hidden="true"` and put `aria-busy="true"` plus readable text on the affected region. Reduced motion removes shimmer/spin; progress must still be understandable.

## Content-State Architecture

Use `.nt-content-state` plus `data-nt-content-state` for new loading, empty, error, offline, unauthenticated, forbidden, not-found, maintenance, partial, stale, and success states. Presentation modes are `--inline`, `--section`, `--page`, `--compact`, and `--left`. The pattern supports icon/spinner, heading, description, actions, metadata, and optional details.

Existing `.nt-empty-state`, `.nt-error-state`, and `.nt-loading-state` remain public compatibility patterns. New product work should prefer `.nt-content-state`.

Empty states explain what is empty, whether that is expected, and the next useful action. Error states explain what failed, whether data was preserved, whether retry is available, and what to do next. Offline distinguishes device offline, backend unreachable, cached content, and queued changes. Unauthenticated means sign in is required; forbidden means the signed-in user lacks permission. Maintenance explains affected service, safety of existing work, and whether retrying helps.

## Forms and Validation

Field states are `pristine`, `dirty`, `untouched`, `touched`, `validating`, `valid`, `invalid`, `warning`, `disabled`, and `read-only`. Not every state needs a visual style.

Validation appears after interaction or submission attempt, except when preventing harmful or impossible input. Server errors appear after submission and are cleared or updated when relevant values change. Do not use green success styling for every valid field. Warnings do not block submission unless the business rule says they do.

`ntConnectField()` owns stable label/help/error references. `ntCreateFormController()` owns submission state:

```text
editing -> submitting -> success | failure
```

It prevents duplicate submission, preserves entered data after failure, focuses the error summary when validation fails, distinguishes native validation from system failure through callbacks, sets busy state, and cleans up listeners.

## Feedback Channel Matrix

| Channel | Use | Do not use for |
| --- | --- | --- |
| Field error | One field needs correction | Page-wide failures |
| Helper text | Stable constraints or guidance | Dynamic critical errors |
| Form summary | Submitted form has errors | Every keystroke |
| Inline status | One object or section changed | Global service outage |
| Alert | Contextual attention or urgent dynamic failure | Static decorative empty states |
| Page banner | Page-wide or service-wide status | Brief successful save |
| Toast | Brief noncritical result after an action | Field validation, blocking permission denial, irreversible confirmation, long error copy |
| Progress | Long running visible operation | Unknown state without text |
| Badge | Compact metadata/status | Interactive selection token |
| Dialog | User must decide before continuing | Action succeeded messages |
| Content state | Whole region/page cannot show normal content | Field-level issues |

## Toast Rules

`ntCreateToastController()` is scoped to a viewport. It supports info, success, warning, error, and progress tones, dedupes by id, limits the visible stack, pauses auto-dismiss on hover/focus, keeps critical errors until dismissed, wires accessible close actions, and cleans up timers/listeners. Error toasts are assertive; routine toasts are polite. Critical actionable failures must also remain recoverable outside a disappearing toast.

## Alert and Banner Rules

Static information should not use assertive announcements. Use `role="status"` for routine dynamic updates and `role="alert"` for immediate actionable failures. Banners support actions and explicit dismissal. Dismissing a critical banner must not remove the only recovery path.

## Confirmations

No confirmation is needed for minor reversible actions with clear undo. Standard confirmation is used for meaningful consequences. Strong destructive confirmation is used for permanent deletion, revoked access, finalized financial records, multi-user impact, or costly reversal.

Confirmations state exact action, target, scope, consequence, reversibility, secondary effects, safe cancellation, and a specific primary label such as `Delete invoice` or `Revoke access`. For destructive confirmations, default focus usually favors the safe action.

## AI Write-Action Confirmation

AI write actions must distinguish:

```text
proposed | awaiting-confirmation | approved | executing | succeeded | partially-succeeded | failed | canceled | expired
```

Before execution, show what AI intends to do, target system/record, exact affected fields, scope, reversibility, permission used, optional preview/diff, confirm action, and cancel/revise action. Do not claim success until backend confirmation. Partial success must identify what succeeded and failed. Raw API JSON may be expandable detail, never the only explanation.

## Unsaved Changes

Contracts distinguish unsaved local changes, saved draft, saving in progress, save failed, and recovered draft. The design system provides banners, confirmation-dialog layout, and recovery action structure. Applications own router guards. Do not warn when nothing meaningful changed, and do not use a destructive red dialog for ordinary unsaved changes.

## Retry, Cancel, Undo, and Rollback

Retry is shown only when safe to attempt again. Idempotency is an application responsibility. Cancel is shown only while an operation is actually cancellable. Undo is for succeeded reversible operations and must remain available long enough to understand the affected object. Rollback restores optimistic UI when the backend rejects a change and explains what happened while preserving input where possible.

## Accessibility Requirements

State must not depend only on color. Busy controls keep their name. Live-region announcements are intentional and not repeated on every rerender. Error summaries receive focus only when useful. Toasts do not take focus automatically. Focus remains visible in forced colors and reduced motion.

## Localization Requirements

Applications pass complete translated labels, errors, confirmations, and announcements. Do not concatenate fragments. Content states and dialogs must tolerate long Swedish copy and Arabic RTL content. Technical details use bidi isolation and `.nt-technical-value`.

## Testing Commands

```bash
npm run check:tokens
npm run check:a11y
npm run check:rtl
npm run check:architecture
npm run check:states
npm test
npm run test:browser
npm run build
npm pack --dry-run
```

## Manual QA Checklist

- Form validation failure and server failure preserve entered data.
- Successful save returns from pending and communicates completion.
- Delete confirmation uses specific labels and safe initial focus.
- Failed delete shows retry only when retry is safe.
- Upload progress has a label and failure recovery.
- Empty search result differs from permission-limited absence.
- Offline cached content differs from backend unreachable.
- Permission denied, maintenance, and not-found use distinct content states.
- Toast stack dedupes, pauses, and does not hide critical recovery.
- Unsaved-change confirmation does not appear for unchanged forms.
- AI proposal, execution success, and partial failure are distinct.
- Verify light, dark, high contrast, LTR, RTL, compact, comfortable, narrow viewport, 200 percent text, and reduced motion.

## Known Limitations

The design system cannot implement router-specific unsaved-change guards, backend retries, permission decisions, request idempotency, upload transport, or permanent AI confirmation policy. Native screen-reader testing remains required. Responsive behavior for every state surface follows [responsive-and-adaptive-design.md](./responsive-and-adaptive-design.md); empty-state categories, confirmation structure, and message copy follow [content-and-terminology.md](./content-and-terminology.md) and the page-level placements in [page-patterns-and-workflows.md](./page-patterns-and-workflows.md).
