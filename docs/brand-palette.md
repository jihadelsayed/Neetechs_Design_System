# Neetechs brand palette — softer navy

This document defines the default visual language in `@neetechs/ui`. It is a color-token refresh, not a replacement for the shared appearance controller. Applications consume the library’s semantic `--nt-*` tokens instead of copying these hexadecimal values.

## Default dark theme

| Role | Token | Value |
| --- | --- | --- |
| Page canvas | `--nt-bg-app` | `#202d42` |
| Sidebar | `--nt-bg-sidebar` | `#182337` |
| Card surface | `--nt-bg-surface` | `#34445d` |
| Raised panel / overlay | `--nt-bg-surface-raised` | `#445772` |
| Blue product action | `--nt-accent` | `#528ef5` |
| AI decorative lavender | `--nt-color-ai-lavender` | `#a78bfa` |
| Readable AI text | `--nt-ai-fg` | `#ddd6fe` |
| Primary text | `--nt-text-primary` | `#f8fafc` |
| Secondary text | `--nt-text-secondary` | `#d8e3f0` |

`--nt-color-brand-blue` and `--nt-color-ai-lavender` are primitive palette identifiers. Components should consume their semantic roles instead. Light mode retains its existing airy neutral backgrounds, with an accessible blue primary action.

## Meaning

- Blue: primary buttons, selected navigation, links, focus, and application progress. Never use blue alone to mean an action succeeded.
- Lavender/purple: explicitly AI-related origin, suggestion, or processing states. Use readable `--nt-ai-fg` for text on raised surfaces, rather than the decorative lavender swatch.
- Green: success and completed tasks.
- Yellow/amber: warning, paused, or attention needed.
- Red: errors, destructive actions, and blocked operations.
- Neutral text and surfaces: most content. Avoid decorative glows and a rainbow of per-feature accents.

## Preferences and rollout

The default appearance preference is `{ theme: 'system', accent: 'blue', density: 'comfortable', reduceMotion: 'system', highContrast: 'system' }`. The resolved dark theme uses the new navy surfaces; `system` still honors OS light/dark, and the light theme remains available. High contrast and reduced motion stay independent.

The existing `orange`, `green`, `purple`, and `neutral` accent options remain supported. **Saved backend or cookie preferences outrank new defaults** and are not silently reset. Consumers must update their `@neetechs/ui` dependency to use this palette; apps with hard-coded colors or separate CSS themes will not automatically adopt it.

Use semantic tokens and the shared appearance controller. Validate readability on the raised surface as well as the canvas; the brand blue uses a dark foreground for action-button text.
