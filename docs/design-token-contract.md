# Design token contract

This document defines the production token contract for `@neetechs/ui`. It preserves the current visual language while giving token declarations a single dependency direction and making broken references release-blocking.

## Token layers

Tokens flow in one direction:

```text
Primitive tokens
  -> semantic tokens
    -> component tokens
      -> compatibility aliases
```

### Primitive tokens

Primitive tokens describe reusable scales and mechanics without component meaning. They live in `src/styles/tokens/` and include color ramps, spacing, radius, typography, elevation, motion, z-index, and breakpoints.

Examples: `--nt-space-4`, `--nt-radius-xl`, `--nt-font-size-body-sm`, `--nt-shadow-lg`, `--nt-duration-fast`.

Primitive tokens must not reference semantic or component tokens. Composite primitives may reference lower-level primitives in the same layer, such as `--nt-text-body-sm` composing font weight, size, line height, and family.

### Semantic tokens

Semantic tokens describe a role in the interface rather than a palette value. Color-theme-dependent semantic tokens are declared for dark and light; high contrast is a separate override layer in `src/styles/themes/high-contrast.css`.

Examples: `--nt-bg-surface`, `--nt-bg-surface-muted`, `--nt-text-primary`, `--nt-border-interactive`, `--nt-accent-subtle`, `--nt-danger-bg-hover`.

Components should use semantic tokens for color and interaction roles. Theme files may reference primitive color tokens or literal theme values, but they must not contain component selectors or component-specific variables.

### Component tokens

Component tokens expose a stable value that is meaningful only within one component family. They are declared on that component's root selector and may reference semantic or primitive tokens.

Current component-input tokens are:

- Calendar: `--nt-calendar-day-slice-used`, `--nt-calendar-event-top`, `--nt-calendar-hour-height`, `--nt-calendar-now-offset`.
- Progress: `--nt-progress-value`, `--nt-progress-ring-circumference`, `--nt-progress-ring-offset`.
- Search: `--nt-search-results-top`, `--nt-search-results-right`, `--nt-search-results-bottom`, `--nt-search-results-left`, `--nt-search-results-width`.
- Toast: `--nt-toast-swipe-x`.
- Tooltip: `--nt-tooltip-x`, `--nt-tooltip-y`.

Every component token has a safe default on the relevant root selector. Consumers may override it on an instance without changing the global token layer.

### Compatibility aliases

All deprecated names live in `src/styles/tokens/compatibility.css`. An alias must point directly to one canonical token, must never be used by internal production CSS, and must not participate in an alias chain or cycle.

Compatibility aliases are retained through the current `0.x` line and are planned for removal in the next major release after consumer migration. Removing an alias requires a release note and migration entry.

## Naming rules

- Use the `--nt-` prefix for every public design token.
- Name semantic tokens by role: `--nt-bg-surface-raised`, not `--nt-gray-box`.
- Name component tokens with the component prefix: `--nt-tooltip-x`, not `--nt-x`.
- Use established families: `--nt-space-*`, `--nt-radius-*`, `--nt-text-*`, `--nt-shadow-*`, `--nt-duration-*`, `--nt-z-*`.
- Do not use vague names such as `special`, `other`, `big`, or `new`.
- Do not reuse one token for unrelated meanings merely because its current value looks suitable.

## Theme override rules

Every color-theme-dependent semantic token must be declared in both resolved color themes:

- `src/styles/themes/dark.css`
- `src/styles/themes/light.css`

The dark `:root` block remains the fallback. Light overrides the same semantic roles. `high-contrast.css` is an accessibility layer over either resolved theme; its legacy `data-nt-theme="high-contrast"` selector remains only for compatibility. Component tokens are not copied into theme files unless their meaning genuinely changes by theme; they should normally inherit semantic tokens instead.

## Semantic color and surface contract

The platform contract contains 93 semantic color roles plus 11 semantic elevation roles. Dark and light expose the same color contract; contrast overrides only roles whose boundary behavior changes. Established `--nt-bg-*`, `--nt-text-*`, and status-family names remain canonical where they already express a clear purpose; duplicate `--nt-surface-*` or `--nt-status-*-*` synonyms are intentionally not introduced.

### Complete role table

| Family | Canonical roles | Component decision |
| --- | --- | --- |
| Surfaces (10) | `--nt-bg-app`, `--nt-bg-surface`, `--nt-bg-surface-subtle`, `--nt-bg-surface-muted`, `--nt-bg-surface-raised`, `--nt-bg-surface-overlay`, `--nt-bg-surface-sunken`, `--nt-bg-inverse`, `--nt-bg-surface-disabled`, `--nt-bg-backdrop` | Choose by structural level, not by whichever gray currently matches. |
| Text (10) | `--nt-text-primary`, `--nt-text-secondary`, `--nt-text-muted`, `--nt-text-subtle`, `--nt-text-disabled`, `--nt-text-inverse`, `--nt-text-link`, `--nt-text-link-hover`, `--nt-text-on-accent`, `--nt-text-on-danger` | Link and on-color roles must not be substituted with palette/accent foregrounds. |
| Borders (6) | `--nt-border-subtle`, `--nt-border-default`, `--nt-border-strong`, `--nt-border-interactive`, `--nt-border-selected`, `--nt-border-disabled` | Selected and disabled boundaries have explicit roles. `interactive` remains the focus/accent boundary hook pending the accessibility pass. |
| Neutral interaction (4) | `--nt-interactive-neutral-bg`, `--nt-interactive-neutral-hover`, `--nt-interactive-neutral-pressed`, `--nt-interactive-neutral-selected` | Use for non-action interactive surfaces such as rows and navigation hover. |
| Actions (31) | `--nt-action-{primary,secondary,neutral,danger,success,warning}-{bg,hover,pressed,border,fg}` plus `--nt-action-primary-subtle` | The action's consequence chooses the family; screen context does not. |
| Status (16) | `--nt-{info,success,warning,danger}`, plus `-bg`, `-border`, and `-text` for each status | The un-suffixed role is the indicator/foreground; every status also owns a background, border, and readable text role. |
| Selection (5) | `--nt-selection-bg`, `--nt-selection-bg-hover`, `--nt-selection-border`, `--nt-selection-fg`, `--nt-selection-indicator` | Current, active, checked, and selected UI uses this family rather than inventing an accent tint. |
| AI (9) | `--nt-ai-fg`, `--nt-ai-bg`, `--nt-ai-bg-subtle`, `--nt-ai-border`, `--nt-ai-action`, `--nt-ai-action-hover`, `--nt-ai-action-fg`, `--nt-ai-processing`, `--nt-ai-generated-surface` | Purple identifies AI origin, processing, or an explicitly AI-powered action. Consequence status still uses status/action roles. |
| Financial (3) | `--nt-financial-positive`, `--nt-financial-negative`, `--nt-financial-neutral` | Use for monetary/accounting meaning, not generic success/failure feedback. |
| Elevation (11) | `--nt-elevation-none`, `--nt-elevation-inline`, `--nt-elevation-control`, `--nt-elevation-card`, `--nt-elevation-card-hover`, `--nt-elevation-raised`, `--nt-elevation-popover`, `--nt-elevation-dialog`, `--nt-elevation-drawer`, `--nt-elevation-toast`, `--nt-elevation-overlay` | Components select a structural level; primitive `--nt-shadow-*` values are forbidden in component CSS. |

The theme-owned component hook `--nt-progress-stripe-color` replaces the former repeated white RGBA literal. It is not a general semantic color role.

### Surface hierarchy

| Level | Surface and elevation | Intended content |
| ---: | --- | --- |
| 0 | `--nt-bg-app`; no elevation | Page/application canvas |
| 1 | `--nt-bg-surface`; no elevation | Base content region |
| 2 | `--nt-bg-surface-raised` or base surface with `--nt-elevation-card` | Card or raised panel; nested cards stay at this level |
| 3 | `--nt-bg-surface-overlay` with `--nt-elevation-popover` | Menu, dropdown, tooltip, switcher, search results |
| 4 | `--nt-bg-surface-overlay` with dialog/drawer/toast elevation | Dialog, modal, drawer, toast |
| 5 | overlay surface with `--nt-elevation-overlay`, above `--nt-bg-backdrop` | Critical overlay requiring the strongest stacking separation |

`--nt-bg-surface-muted` reduces emphasis. `--nt-bg-surface-sunken` is inset/recessed. `--nt-bg-surface-subtle` is a quiet surface treatment. `--nt-bg-surface-disabled` communicates unavailable interaction. These are not additional elevation levels.

Dark and light map semantic elevation to the existing shadow primitives, preserving the prior shadow values. High contrast maps all semantic elevation roles to `none`; strong semantic borders carry hierarchy. A component must not combine a strong border and strong shadow unless the level table requires both. Hover elevation uses `--nt-elevation-card-hover`; nested cards do not climb the hierarchy.

### Radius roles

The 14 canonical purpose roles are `--nt-radius-control`, `--nt-radius-button`, `--nt-radius-input`, `--nt-radius-item`, `--nt-radius-card`, `--nt-radius-panel`, `--nt-radius-popover`, `--nt-radius-dialog`, `--nt-radius-drawer`, `--nt-radius-toast`, `--nt-radius-indicator`, `--nt-radius-pill`, `--nt-radius-badge`, and `--nt-radius-avatar`.

Components must not select raw radius scales. A control uses the control/button/input role; a list entry uses item; a content surface uses card/panel; a floating menu uses popover; overlays use dialog/drawer/toast; pills and circular geometry use pill/badge/avatar. The current aliases preserve the prior numerical values, so this migration changes intent without broadly tightening the visual design.

### Component usage rules

- Primary product actions use `--nt-action-primary-*`. Secondary outlined/filled controls use secondary. Ghost or low-emphasis controls use neutral. Destructive, success, and warning consequences use their corresponding action family.
- An action uses `--nt-ai-action*` only when the action itself invokes AI. Save, cancel, approve, and delete retain their normal consequence roles even on an AI screen.
- Active navigation, selected cards, checked options, selected rows, and active tabs use selection roles. A product accent may remain a small selection indicator through `--nt-selection-indicator`.
- Forms use control surfaces/borders. Disabled controls use disabled surface/border/text roles. Read-only controls use sunken or muted surfaces and secondary text; their final differentiation is deferred to the accessibility prompt.
- Cards and panels use base/raised surfaces. Status surfaces use status roles only when status is the content's primary meaning. AI-generated artifacts may use `--nt-ai-generated-surface`.
- Table/data-grid hover uses neutral interaction. Selection uses selection roles. Financial cells use financial roles and status cells use status roles.
- Calendar user/category colors and data visualization colors are data, not platform action colors. They require a narrowly documented exception or consumer input instead of a hardcoded component literal.

### Theme responsibilities and primitive restrictions

Each resolved color theme must expose every required role above. Theme files may map roles to primitive ramps or literal theme values. Accent mappings override product-interaction roles only; density maps sizing roles; contrast and motion are independent layers. Components, patterns, AI, domain, and shell CSS may not use `--nt-color-*`, raw hex/RGB/HSL/named colors, raw shadow scales, or raw radius scales. `transparent`, `currentColor`, inherited values, and CSS system keywords are not palette choices.

The production literal-color allowlist is currently empty. Any future exception must be an exact file/value/reason entry in `SEMANTIC_COLOR_LITERAL_ALLOWLIST`; broad path or regex suppression is forbidden.

Correct action and selection usage:

```css
.nt-example__save {
  border-color: var(--nt-action-primary-border);
  background: var(--nt-action-primary-bg);
  color: var(--nt-action-primary-fg);
}

.nt-example__row[aria-selected='true'] {
  border-color: var(--nt-selection-border);
  background: var(--nt-selection-bg);
  color: var(--nt-selection-fg);
}
```

Forbidden component decisions:

```css
.nt-example {
  color: var(--nt-color-purple-500);
  background: #ffffff;
  border-radius: var(--nt-radius-xl);
  box-shadow: var(--nt-shadow-lg);
}
```

## Legacy-to-canonical mapping

| Deprecated or broken token | Canonical token | Reason | Compatibility strategy |
| --- | --- | --- | --- |
| `--nt-bg-muted` | `--nt-bg-surface-muted` | Existing semantic surface role is exact. | Deprecated direct alias; internal usages replaced. |
| `--nt-bg-elevated` | `--nt-bg-surface-raised` | Existing raised-surface role is exact. | Deprecated direct alias; internal usages replaced. |
| `--nt-bg-overlay`, `--nt-bg-overlay-subtle` | `--nt-bg-backdrop` | Both names described a scrim/backdrop rather than an elevated content surface. | Deprecated direct aliases; internal usages replaced. |
| `--nt-accent-bg` | `--nt-accent-subtle` | Existing subtle accent background is the intended selected/soft surface. | Deprecated direct alias; internal usages replaced. |
| `--nt-accent-border` | `--nt-border-interactive` | Existing interactive accent border is the intended role. | Deprecated direct alias; internal usages replaced. |
| `--nt-line-height-relaxed` | `--nt-line-height-body-lg` | The only usage requested the existing relaxed body line height (`1.6`). | Deprecated direct alias; internal usage replaced. |
| `--nt-line-height-snug` | `--nt-line-height-label` | The only usage is caption/tooltip text and matches the existing `1.25` label line height. | Deprecated direct alias; internal usage replaced. |
| `--nt-text-code-sm` | `--nt-text-mono-sm` | Existing small monospace composite is exact. | Deprecated direct alias; internal usages replaced. |
| `--nt-shadow-2xl` | Context-specific: `--nt-elevation-dialog` for dialogs; `--nt-elevation-overlay` for command palette | One appearance name hid two semantic roles. Both roles preserve the intended overlay shadow outside high contrast. | Alias points to `--nt-elevation-overlay`; internal usages are context-specific. |
| `--nt-shadow-card`, `--nt-shadow-card-hover` | `--nt-elevation-card`, `--nt-elevation-card-hover` | Elevation names describe structural purpose and can vary by theme. | Deprecated direct aliases; internal usages replaced. |
| `--nt-shadow-dropdown` | `--nt-elevation-popover` | Dropdown is one popover consumer, not the platform role name. | Deprecated direct alias; internal usages replaced. |
| `--nt-shadow-dialog`, `--nt-shadow-drawer`, `--nt-shadow-toast` | Matching `--nt-elevation-*` roles | The established public names remain usable while themes own semantic elevation. | Deprecated direct aliases; internal usages replaced. |
| `--nt-z-overlay` | `--nt-z-raised` | The loading overlay is local to its containing component, not a global modal layer. | Deprecated direct alias; internal usage replaced. |
| `--nt-disabled-bg` | `--nt-bg-surface-disabled` | Disabled background is a surface role. | Deprecated direct alias; internal usages replaced. |
| `--nt-disabled-border` | `--nt-border-disabled` | Disabled boundary belongs to the border family. | Deprecated direct alias; internal usages replaced. |
| `--nt-disabled-text` | `--nt-text-disabled` | One shared disabled foreground prevents control-specific drift. | Deprecated direct alias; internal usages replaced. |
| `--nt-selection-text` | `--nt-selection-fg` | `fg` aligns selection with the status/action foreground convention. | Deprecated direct alias; internal usages replaced. |
| `--nt-ai-accent` | `--nt-ai-fg` | AI identity foreground is distinct from the product accent. | Deprecated direct alias; internal usages replaced. |
| `--nt-ai-accent-hover` | `--nt-ai-action-hover` | The value is the AI action hover role. | Deprecated direct alias; internal usages replaced. |
| `--nt-ai-bg-raised` | `--nt-ai-generated-surface` | The raised purple treatment identifies generated AI content. | Deprecated direct alias; internal usages replaced. |
| `--nt-ai-glow` | `--nt-ai-processing` | Glow is presentation; processing is the semantic purpose. | Deprecated direct alias; internal usages replaced. |

Two previously missing names are now canonical rather than aliases:

- `--nt-text-label-xs` composes the existing medium weight, micro font size, label line height, and sans family.
- `--nt-danger-bg-hover` is a reusable danger-hover semantic and is defined in every theme using the existing danger color treatment.

The 15 component-input names listed above are also canonical and now have local defaults. They retain their existing names so consumer overrides remain compatible.

## Correct component usage

Use the narrowest existing semantic role:

```css
.nt-example {
  padding: var(--nt-space-4);
  border: 1px solid var(--nt-border-subtle);
  border-radius: var(--nt-radius-card);
  background: var(--nt-bg-surface);
  color: var(--nt-text-primary);
  box-shadow: var(--nt-elevation-card);
}
```

Declare a real component input on the component root before consuming it:

```css
.nt-example-progress {
  --nt-example-progress-value: 0%;
}

.nt-example-progress__bar {
  width: var(--nt-example-progress-value);
}
```

## Forbidden usage

Do not reach through the semantic layer from component CSS:

```css
/* Forbidden in a component. */
.nt-example {
  color: var(--nt-color-orange-500);
  background: #0b1120;
}
```

Do not use deprecated aliases internally:

```css
/* Forbidden. Use --nt-bg-surface-muted. */
background: var(--nt-bg-muted);
```

Do not declare a token only in one theme, create circular aliases, self-reference, or hide an unknown token behind a fallback. A fallback does not make an undeclared `--nt-*` reference valid.

## Adding a token

1. Search existing primitive, semantic, and component tokens for the same role.
2. Decide the narrowest correct layer.
3. Give the token a purpose-based name.
4. For a color-theme semantic, add a value to dark and light in the same change; add contrast overrides only when its boundary behavior changes.
5. For a component input, declare a safe default on its root selector.
6. Use the canonical name in production CSS.
7. Run `npm run check:tokens` and the full test pipeline.
8. Document consumer-facing tokens or migrations here.

Do not add a token solely to silence validation, create a generic alias for unrelated contexts, or place a deprecated alias outside the compatibility file.

## Validation

Run:

```bash
npm run check:tokens
```

`scripts/check-design-tokens.mjs` scans production CSS under `src` and excludes generated/dependency directories. It fails for undefined references (including nested fallbacks), undeclared alias targets, circular/self aliases, invalid or empty declarations, accidental duplicate declarations in one block, deprecated internal usage, and invalid/missing compatibility aliases. Errors include file paths, line numbers, and token names.

The release workflow validates tokens before building, testing, packaging, or publishing.

## Known remaining migration work

- Current source has 473 declared token names, 318 referenced names, zero undefined names, zero circular/self aliases, and no accidental duplicate declaration in one block. Dark and light expose the same required 104-role semantic contract; high contrast is validated as a layer.
- There are 165 defined-but-unused names, including the 25 compatibility aliases. They are retained because published custom properties may be consumed outside this repository.
- No production token exists only in generated `dist`; a normal build mirrors corrected source. Documentation-only `--nt-example-*` names in this guide are explicitly illustrative and are excluded from validation.
- Raw literal dimensions and timing values remain for later scale/visual-consistency work. Production component CSS now contains zero hardcoded hex/RGB/HSL/named colors; the three progress-stripe RGBA calls moved behind `--nt-progress-stripe-color`.
- The primitive token set contains defined-but-unused values. They remain public customization surface until consumer usage is assessed.
- Accent, density, contrast, forced-colors, and reduced-motion layers are implemented in the global appearance architecture. Final per-component contrast and focus remediation remains deferred to Prompt 5.
- RTL, responsive behavior, and visual regression still require later prompts and browser verification.
- AI actions now use the AI action family, selected/current states use selection roles, and high-contrast semantic elevation resolves to `none`. Those intentional semantic corrections require screenshot review in a real browser.
- Compatibility aliases require downstream consumer telemetry before next-major removal.
