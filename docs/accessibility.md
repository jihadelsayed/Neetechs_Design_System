# Accessibility contract

Localization does not weaken this contract. Set correct `lang`/`dir`, provide complete accessible names in the active language, isolate technical values without changing their spoken label, and test visual keyboard order in RTL. Native Arabic screen-reader QA remains an application responsibility; see [localization-and-rtl.md](./localization-and-rtl.md).

`@neetechs/ui` targets WCAG 2.2 Level AA as its engineering baseline. This is not a certification: applications must still test their content, routing, framework integration, localization, screen-reader experience, and complete user journeys.

The package is CSS-first. CSS classes provide appearance; they cannot repair incorrect HTML. The behavior exports under `@neetechs/ui/behaviors` add only relationships and interactions that require JavaScript. Consumers remain responsible for meaningful labels and product-specific descriptions.

## 1. Baseline requirements

- Normal text is at least 4.5:1; large text and meaningful non-text boundaries are at least 3:1.
- Keyboard focus uses `:focus-visible`, a 2px semantic ring, and a 2px offset. Never remove an outline without a replacement in the same rule.
- Primary and icon-only controls expose a 44×44px target. Dense contextual controls expose at least 40×40px. Inline text links, browser-native controls, tightly packed data points, and controls whose spacing provides an equivalent compound target are documented exceptions.
- Native HTML is preferred. Do not replace a `button`, `a`, `input`, `select`, `textarea`, `table`, `fieldset`, or heading with a generic element plus ARIA.
- Light/dark × orange/blue/green/purple/neutral semantic contrast is enforced by `npm run check:a11y`.
- High contrast and forced colors layer over light or dark. Reduced motion removes decorative travel/lift and preserves state feedback.

## 2. Native HTML and accessible names

Use visible text as the accessible name whenever possible. Icon-only controls require a concise `aria-label` or associated visible label. `title` is supplementary, not the only naming strategy. Images use meaningful `alt`, empty `alt` when decorative, or a nearby text alternative for complex graphics. Decorative SVGs are `aria-hidden="true"`; meaningful SVGs inherit `currentColor` and are named by surrounding content.

Labels describe the control, while `aria-describedby` connects helper, constraint, consequence, and error copy. Placeholder text is never the only label. Do not repeat visible text in `aria-label`; that can override better content.

## 3. Component accessibility inventory

Prompt 7 consolidation note: modal CSS and `ntCreateModal` now delegate to the canonical dialog implementation; the right-drawer path/classes delegate to canonical logical drawer CSS; company/workspace switchers share one visual source and the menu-popover behavior. These compatibility names do not define separate accessibility contracts. The table export is now a styled native-table contract and remains intentionally separate from the interactive data grid. See [component-architecture.md](./component-architecture.md).

Prompt 8 state note: operation state now uses native semantics plus `data-nt-state` where needed; content-region state uses `data-nt-content-state`; legacy `--loading`, `--error`, and `--success` modifiers are styling compatibility hooks. See [states-feedback-and-recovery.md](./states-feedback-and-recovery.md).

The inventory covers all 59 shipped UI/domain CSS modules. “Gallery” means the representative Playwright/axe contract gallery; “manual” identifies an application-level check still required.

| Component and source | Semantic/name contract | Keyboard and focus | State/feedback contract | Target, modes, coverage and residual risk |
|---|---|---|---|---|
| Alert — `src/components/alert/alert.css` | Static notice: section/region; urgent dynamic error: `role=alert`; routine update: `role=status`; heading names region | Actions are native controls; no container tab stop | Severity is text/icon plus color; recovery action is named | Actions 40/44; forced-color border; gallery. Urgency choice remains manual |
| Avatar — `src/components/avatar/avatar.css` | Decorative avatar has empty alt/hidden initials; informative image has person/org name | Not focusable unless a native link/button wrapper | Presence/status needs text alternative | CurrentColor boundary; manual image-alt review |
| Badge — `src/components/badge/badge.css` | Text span; status role only for a dynamic update | Not focusable unless interactive variant is a button | Status wording must not rely on hue | Forced-color boundary; semantic contrast; manual copy review |
| Breadcrumb — `src/components/breadcrumb/breadcrumb.css` | `nav aria-label="Breadcrumb"`, ordered list, current item `aria-current=page` | Native links; visible focus | Current page is not a dead unlabeled link | Inline-link target exception; structure manual |
| Button — `src/components/button/button.css` | Native `button`; visible text is name; busy keeps original name and uses `aria-busy` | Native Enter/Space; no redundant handlers | Native `disabled`; `aria-disabled` requires activation guard; loading prevents repeat | Primary 44; focus/contrast/motion/forced colors tested |
| Card — `src/components/card/card.css` | Article/section only with a heading; clickable card uses one real link/button, not nested controls | Only actual actions focus | Selected cards use `aria-selected` only in a selection widget | Reduced lift; selected outline in forced colors; structure manual |
| Checkbox — `src/components/checkbox/checkbox.css` | Native checkbox inside label; groups use fieldset/legend | Native Space | `checked`, `indeterminate`, `disabled`, required/error on input | 40px row; system-color forced mode; gallery/axe |
| Chip — `src/components/chip/chip.css` | Static tag is text; removable/choice chip uses native button and named remove action | Native activation; composite owner manages arrows | `aria-pressed`/`aria-selected`; disabled guard | 40px interactive target; composite behavior app-owned |
| Data grid — `src/components/data-grid/data-grid.css`, `src/behaviors/data-grid.ts` | Prefer semantic table. Opt-in `role=grid` only for 2-D interaction; headers name columns; help describes keys | Roving arrows, Home/End, Ctrl+Home/End, activation callback | `aria-sort`, `aria-selected`, disabled; polite sort live region | Visible focus/selection; browser tested. Editing/resize policy app-specific |
| Dialog — `src/components/dialog/dialog.css`, `src/behaviors/dialog.ts` | Dialog role/modal state/title and optional description references | Intentional initial focus, Tab trap, Escape if dismissible, restore invoker | Background inert, scroll locked, hidden closed, nested-stack aware | Boundary/focus forced colors; nested browser test; SR manual |
| Drawer — `src/components/drawer/drawer.css`, `src/behaviors/drawer.ts` | Explicit modal dialog or nonmodal region/navigation | Modal traps/restores; nonmodal follows page order; top overlay owns Escape | Modal background inert; role/modal match declared modality | Reduced travel/forced boundary; nested browser test |
| Dropdown — `src/components/dropdown/dropdown.css`, `src/behaviors/dropdown.ts` | Trigger button with popup/expanded/controls; content is menu or listbox, not both | Arrow open/navigation, Home/End, typeahead, activation, Escape returns trigger; no Tab trap | Disabled items skipped/blocked; closed content hidden | Items 40px; browser tested. Listbox value sync consumer-owned |
| Icon button — `src/components/icon-button/icon-button.css` | Native button with required accessible name | Native activation; visible focus | Disabled/loading as button | 44px default, 40px compact; browser measured |
| Input — `src/components/input/input.css`, `src/behaviors/forms.ts` | Visible label; stable help/error IDs | Native editing and focus | required, invalid, disabled, readonly, busy distinct | 40px minimum; contrast/focus/axe |
| Menu — `src/components/menu/menu.css`, dropdown behavior | Menu only for application commands; navigation remains nav/links | Up/Down, Home/End, typeahead, activation, Escape; no Tab trap | Disabled items skipped/blocked; checked command roles where needed | 40px; browser tested through dropdown |
| Modal compatibility - `@neetechs/ui/components/modal.css`, `ntCreateModal` | Deprecated aliases to canonical dialog CSS/behavior; identical naming requirement | Same canonical trap/restore contract | Adapter forces `modal: true`; no second focus manager | Architecture-tested; migrate to dialog before 1.0 |
| Pagination — `src/components/pagination/pagination.css` | Labelled nav; native links/buttons; current page `aria-current=page` | Native activation/sequence | Disabled previous/next native or non-link text | 40×40; forced selected outline; structure manual |
| Panel — `src/components/panel/panel.css` | Section/aside only when landmark/heading is useful | Actions only | Loading may set `aria-busy` on panel | Semantic boundary; structure manual |
| Progress — `src/components/progress/progress.css` | Native progress or named progressbar with value/min/max; indeterminate has status text | Not focusable | Announce milestones, not every frame | Motion reduced without losing state; cadence manual |
| Radio — `src/components/radio/radio.css` | Native radios in fieldset/legend | Native arrows/Space | checked/disabled/required/error on input | 40px row; forced colors; gallery/axe |
| Segmented control — `src/components/segmented-control/segmented-control.css` | Radio group for exclusive value or toolbar of buttons for commands; label group | Native radios or documented roving behavior | checked/pressed/disabled explicit | Focus/selected distinct; role choice manual |
| Select — `src/components/select/select.css` | Native label + select unless complete combobox implemented | Native browser behavior | disabled/required/invalid; native select has no readonly | 40px; contrast/focus/axe |
| Skeleton — `src/components/skeleton/skeleton.css` | Decorative skeleton hidden; containing region busy with readable status | Not focusable | Real content replaces skeleton; no repeated announcements | Animation suppressed; gallery loading pattern |
| Split button — `src/components/split-button/split-button.css` | Two named native buttons: action and disclosure | Native action; disclosure follows menu contract | Disabled/loading coherent across both | 40/44 by action; composition manual |
| Switch — `src/components/switch/switch.css` | Prefer native checkbox; custom switch requires checked state and label | Native Space | checked/disabled; no mixed state | 40px row; forced colors; gallery/axe |
| Table — `src/components/table/table.css` | Native table/caption/scope headers; no grid role for display-only data | Standard AT table navigation | Sort buttons inside headers and announce state | Overflow response deferred; markup manual |
| Tabs — `src/components/tabs/tabs.css`, `src/behaviors/tabs.ts` | tablist/tab/tabpanel with generated controls/labelledby IDs | Orientation arrows, Home/End, one tab stop; automatic/manual declared | selected/disabled/hidden panel synchronized | 40px; focus/forced selection; browser tested |
| Textarea — `src/components/textarea/textarea.css` | Visible label and descriptions | Native editing | readonly readable/focusable; disabled/invalid distinct | 40px; contrast/focus/axe |
| Toast — `src/components/toast/toast.css`, `src/behaviors/announcer.ts` | Routine status; urgent error alert; named close | No automatic focus; close keyboard accessible; timed toast pauses hover/focus | Critical content persists; status wording explicit | Gallery semantics; `ntCreateToastController` covers timers, dedupe, stack limit, pause, and cleanup |
| Tooltip — `src/components/tooltip/tooltip.css` | Tooltip role/stable describedby; never sole essential content | Opens focus/hover; Escape dismissal when behavior exists; no interactive children | Hidden tooltip not exposed | Reduced motion/forced text; lifecycle consumer-owned |
| AI action button — `src/ai/ai-action-button/ai-action-button.css` | Named native button; name states action, not only “AI” | Native activation | Busy preserves name, blocks repeat, exposes status | 44px; independent AI contrast; reduced motion |
| AI approval card — `src/ai/ai-approval-card/ai-approval-card.css` | Heading names card; description states intent, target, consequence, reversibility | Native reject/approve; safe action first | Pending/status polite; confirmation/success/failure explicit | Gallery/axe/actions; product copy/workflow manual |
| AI conversation panel — `src/ai/ai-conversation-panel/ai-conversation-panel.css` | Named region/log; messages identify speaker; streaming status separate | Normal document/controls order | New content polite/batched; do not reread transcript | Streaming behavior app-owned |
| AI prompt input — `src/ai/ai-prompt-input/ai-prompt-input.css` | Labelled textarea/input; named send/attachment | Native editing; multiline Enter preserved unless policy declared | Busy/error/counter associated without chatter | Controls 40/44; policy manual |
| AI proposal card — `src/ai/ai-proposal-card/ai-proposal-card.css` | Heading + proposal description; buttons name consequences | Native actions | Approval not inferred from purple; explicit status | Focus/contrast; workflow manual |
| AI suggestion card — `src/ai/ai-suggestion-card/ai-suggestion-card.css` | List/article with descriptive suggestion action | Native action; owning widget handles arrows if selection composite | Accepted/rejected text plus status | Focus/selection/contrast; list behavior manual |
| AI tool call — `src/ai/ai-tool-call/ai-tool-call.css` | Human-readable operation/target/status; raw JSON optional detail | Disclosure button for collapsed detail | Running/success/failure at meaningful transitions | Status contrast; descriptions manual |
| Billing — `src/domain/billing/index.css` | Semantic tables/lists/forms; amounts include currency/sign in text | Native actions/table navigation | Financial sign never color-only; errors use form contract | Financial tokens; localization audit deferred |
| Companies — `src/domain/companies/index.css` | Named company list/region; logos follow avatar rules; actions are native | Native list actions; switcher menu uses shared behavior | Active company, role, permission, and availability use text/ARIA plus visual state | Focus/target/forced colors; product permissions and names manual |
| Calendar day slice — `src/domain/calendar/day-slice/day-slice.css` | Named time-grid; events named with title/time | Application declares arrows or normal Tab, not both | Current/selected time text/ARIA, not color only | Focus/forced/reduced; core grid browser tested |
| Calendar timeline — `src/domain/calendar/day-timeline/day-timeline.css` | Time labels/events expose start/end | Event keyboard path documented by app | Current time/category needs non-color text | Drag/resize keyboard alternative app-specific |
| Calendar event card — `src/domain/calendar/event-card/event-card.css` | Native link/button with event name/time/category | Native activation; menu uses shared behavior | selected/current/cancelled text/ARIA plus visual | 44 primary; compact context exception; copy manual |
| Calendar month grid — `src/domain/calendar/month-grid/month-grid.css`, calendar behavior | Grid rows/cells; full date spoken label; today current date | ±1/±7 arrows, Home/End, one tab stop | selection state; range polite live region | 44px behavior hook; browser tested |
| Calendar week grid — `src/domain/calendar/week-grid/week-grid.css`, calendar behavior | Named grid/time-grid and full event names | Declared grid or event Tab model | current/selected not color-only | Focus/forced; complex navigation manual |
| Command palette — `src/patterns/command-palette/command-palette.css` | Modal dialog with labelled combobox/listbox | Input arrows/Home/End/Enter/Escape; modal trap/restore | Loading/empty readable; active descendant when input retains focus | Complete combobox controller is a known limitation |
| Company switcher — `src/patterns/company-switcher/company-switcher.css` | Disclosure + menu/listbox chosen by command vs value | Shared dropdown keyboard | Selected company/unavailable explicit | 40px/shared browser behavior; content manual |
| Content state — `src/patterns/content-state/content-state.css` | Heading/description/native recovery; urgency chosen by context | Native action; no automatic focus unless recovering from failed submission | `data-nt-content-state` differentiates loading, empty, error, offline, permission, not-found, maintenance, success | Target/focus/contrast/RTL; manual content |
| Empty state — `src/patterns/empty-state/empty-state.css` | Legacy pattern over content-state guidance; heading/description/native recovery; no alert | Native action | Static absence is not urgent | Compatible; prefer `.nt-content-state` for new work |
| Error state — `src/patterns/error-state/error-state.css` | Legacy pattern over content-state guidance; heading/recovery/action; alert only dynamically urgent | Native action | Reason/recovery not icon/color only | Compatible; prefer `.nt-content-state` for new work |
| Loading state — `src/patterns/loading-state/loading-state.css` | Legacy pattern over content-state guidance; named status; affected region busy; skeleton hidden | Do not move/strand focus | Announce start/end or milestones only | Compatible; prefer `.nt-content-state` for new work |
| Notification center — `src/patterns/notification-center/notification-center.css` | Named region/list; item heading/time/read state | Native actions; optional menu shared | Unread text/ARIA plus color; updates polite | Focus/forced color; update behavior manual |
| Profile menu — `src/patterns/profile-menu/profile-menu.css` | Trigger + command menu | Shared dropdown menu | Disabled/current account explicit | Shared browser menu; names manual |
| Search bar — `src/patterns/search-bar/search-bar.css` | Search landmark/form, labelled input, named clear/submit | Native editing/submission; Escape clear only if declared | Loading/results count polite; clear updates value | Focus/targets; results combobox not provided |
| Workspace switcher - `@neetechs/ui/patterns/workspace-switcher.css` | Disclosure + menu/listbox chosen by purpose; shared entity-switcher CSS | Shared menu-popover behavior | Selected workspace explicit | Shared browser behavior; rich content semantics remain consumer-owned |
| App shell — `src/shell/app-shell/app-shell.css` | Header/nav/main/aside landmarks, one main, app supplies skip link | Logical DOM order; no positive tabindex | Busy main does not indefinitely inert nav | Global focus/motion; landmarks manual |
| Content frame — `src/shell/content-frame/content-frame.css` | Main/section with heading hierarchy | Normal order | Loading/error use pattern contracts | Noninteractive; heading audit manual |
| Header — `src/shell/header/header.css` | Header landmark; labelled nav | Native controls and skip target | Expanded menus reflect state | Focus/target/forced; composition manual |
| Mobile nav — `src/shell/mobile-nav/mobile-nav.css` | Labelled nav; current link; overlay version uses drawer contract | Native links; modal traps/restores | open/closed and isolation explicit | 40px/reduced motion; responsive redesign deferred |
| Right-drawer compatibility - `@neetechs/ui/shell/right-drawer.css` | Deprecated classes/path map to canonical logical drawer; declare modal/nonmodal role | Shared drawer contract | Same modality/state rules | Migrate to inline-end drawer; nested overlay test covers canonical behavior |
| Sidebar — `src/shell/sidebar/sidebar.css` | Labelled nav/aside; current link | Native links/disclosures | Collapsed items remain named | 40px/focus/forced; responsive deferred |

## 4. Keyboard interaction table

| Pattern | Required keys |
|---|---|
| Button | Enter and Space through native behavior |
| Link | Enter through native behavior |
| Menu | Up/Down, Home/End, typeahead, Enter/Space, Escape; Tab exits rather than traps |
| Tabs | Left/Right or Up/Down by orientation, Home/End; activation mode declared |
| Modal dialog | Tab and Shift+Tab stay inside; Escape closes only when dismissal is allowed and only the top overlay |
| Grid | Arrows; Home/End row bounds; Ctrl+Home/End grid bounds; consumer activation |
| Calendar | Left/Right one day, Up/Down one week, Home/End week bounds |
| Native form controls | Browser-native behavior; no duplicate activation handlers |

## 5. Focus management and overlays

`ntCreateDialog` and modal `ntCreateDrawer` set role/name/description relationships, unhide before focus, isolate background branches with `inert`, lock scroll with reference counting, trap focus, and restore the connected invoker after inert state is removed. Overlay and focus stacks ensure Escape and Tab affect only the top nested overlay. `destroy()` removes listeners and locks.

Initial focus should be the least destructive useful control, a heading/container for long content, or the first invalid field. Destructive confirmation is not the default. Nonmodal drawers use `modal: false` and `role: 'region'` or `'navigation'`; they do not trap or inert. Portaled overlays must keep the active modal/backdrop outside inert branches.

## 6. Forms, validation, and error summaries

```html
<label id="email-label" for="email">Email <span aria-hidden="true">*</span></label>
<input id="email" required aria-describedby="email-help email-error" aria-invalid="true">
<p id="email-help">Use your work address.</p>
<p id="email-error">Enter a valid email address.</p>
```

`ntConnectField()` establishes stable IDs and relationships but cannot invent labels or recovery copy. Native `required`, `disabled`, and `readonly` remain authoritative where supported. Read-only fields remain readable/selectable and may stay focusable; disabled controls do not activate and ordinarily leave the Tab sequence.

An error summary is a named region with heading and links to invalid fields. Reveal it, then call `ntFocusErrorSummary()`. Avoid combining focus movement with assertive announcement unless interruption is required. Password reveal controls name the action and state; clear buttons name the field; counters announce thresholds, not every keystroke.

## 7. Feedback, loading, and live regions

- Routine success/update: `role=status`, `aria-live=polite`.
- Immediate actionable failure: `role=alert`; not for static empty states.
- Long operation: `aria-busy=true` on the affected region plus concise status text; batch progress.
- Toasts never take focus automatically. Timed toasts pause while hovered/focused; critical content persists elsewhere.
- Skeleton geometry is hidden from AT; a readable sibling communicates loading.

Use `ntCreateAnnouncer()` for application messages and destroy it at teardown. `ntConfigureToastSemantics()` selects polite or assertive semantics intentionally. Use `ntCreateToastController()` when the package-owned DOM controls toast timers, dedupe, stack limits, pause-on-hover/focus, and cleanup.

## 8. Disabled, read-only, selected, and loading

Disabled means unavailable/noninteractive; prefer native disabled. `aria-disabled=true` does not block events, so behavior must guard activation. Read-only means readable but not editable and must not look identical to disabled. Selected uses the owning pattern's selected/checked/pressed/current state and a boundary that survives forced colors. Focus remains distinct. Loading/pending is not disabled: it preserves the name, exposes busy, prevents repeat activation, and keeps focus stable. `ntCreateAsyncAction()` implements that contract for action controls.

## 9. Contrast and focus tokens

Components consume `--nt-focus-ring-width`, `--nt-focus-ring-offset`, `--nt-focus-ring-color`, `--nt-focus-ring-danger`, and `--nt-focus-ring-inverse`. Target roles are `--nt-target-size-primary`, `--nt-target-size-default`, and `--nt-target-size-compact`.

`scripts/check-accessibility.mjs` resolves 14 semantic pairs across light/dark and five accents (140 measurements). It enforces 4.5:1 text, 3:1 focus/control boundaries, rejects unsafe outline removal, and requires forced-colors/reduced-motion layers. It tests semantic contracts instead of brittle full CSS snapshots.

## 10. High contrast and forced colors

Manual high contrast strengthens boundaries and disables shadow-only elevation. In forced colors, controls retain system boundaries, links use `LinkText`, selection/current state gains a `Highlight` outline, and icons inherit `currentColor`. `forced-color-adjust: none` is not used. Custom checkbox/radio/switch visuals preserve the native input and system state.

## 11. Reduced motion

The central layer and component rules remove decorative lift, scale, spinner, long drawer/dialog travel, and smooth scrolling under system or manual reduced motion. Short color/state changes may remain. Loading retains text/busy feedback when animation stops.

## 12. Data-grid guidance

Use a semantic table for read-only data. Use `ntCreateDataGrid()` only for spreadsheet-like 2-D navigation. It supplies roving focus, bounds navigation, selection callbacks, and sort announcements; applications define editing, selection model, virtualization, resize increments, and undo. Resize handles are named focusable controls with arrow increments and final announcements.

## 13. Calendar guidance

`ntCreateCalendarGrid()` supplies one-tab-stop date navigation and range announcements. Dates/events need full spoken labels including date and time. Today is `aria-current=date`; selection is `aria-selected`; they are visually distinct. Category/availability/conflict needs non-color alternatives. Drag/drop and resize need host keyboard alternatives.

## 14. AI approval guidance

Approval states what Neenee will do, which record/system changes, reversibility, confirmation requirement, and pending/success/failure result. Actions name consequences, such as “Approve and create event”. Safe/reject/review precedes destructive approval absent a documented reason. Purple identifies AI origin; status semantics describe consequences.

## 15. Correct and incorrect patterns

Correct:

```html
<button class="nt-icon-button" aria-label="Close invoice details">…</button>
<button aria-expanded="false" aria-controls="account-menu">Account menu</button>
```

Incorrect:

```html
<div class="nt-button" onclick="save()">Save</div>
<button class="nt-icon-button" title="Close">…</button>
<input placeholder="Email">
```

Do not add conflicting ARIA, positive tabindex, native-activation duplicates, alert roles on every error-looking block, or raw tool JSON as the only AI description.

## 16. Testing commands

```bash
npm run check:tokens
npm run check:a11y
npm test
npm run test:browser
npm run build
npm pack --dry-run
```

Browser tests use Chromium, Playwright and `@axe-core/playwright`. Automation does not replace keyboard, zoom/reflow, forced-colors, speech input, switch control, or screen-reader tests.

## 17. Manual test checklist

- Traverse journeys with Tab/Shift+Tab and pattern keys; verify focus/order.
- Test modal nesting, containment, Escape ownership, restoration and isolation.
- Test NVDA + Firefox/Chrome and VoiceOver + Safari for name/role/value/description/live timing.
- Test 200% zoom and 400% reflow, text spacing, long Swedish labels, Arabic/mixed direction (RTL fixes deferred).
- Test Windows High Contrast/forced colors; verify selection, error, icons and focus without background hue.
- Test reduced motion, grid/calendar operations, form recovery, offline/error/loading and AI consequences.
- Verify every image/icon, dynamic ID reference and composed application example.

## 18. Known limitations

- Formal screen-reader interoperability and mobile gestures require manual application testing.
- No complete combobox/command-palette controller is shipped; use a conforming implementation or native select.
- Data-grid editing/resizing/virtualization remain application-specific; shared behavior covers navigation/selection/sort.
- Calendar drag/resize/collision/time-grid navigation require host keyboard alternatives.
- Tooltip lifecycle remains consumer-owned; toast timeout pause has a shared controller.
- Responsive reflow and product copy are later stages; state recovery still requires application-owned backend/router behavior.
- Axe and semantic checks cover representative contracts, not every consumer content/color/image combination.
